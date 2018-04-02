'use strict';

var EventEmitter = require('events')
var PeerDiscovery = require('./PeerDiscovery');

const Protocol = require('bittorrent-protocol');
const ut_metadata = require('ut_metadata');
const bencode = require('bencode');
const net = require('net');
const utils = require('./utils');


class MetadataResolver extends EventEmitter {
    constructor(opts) {
        super();
        if (!(this instanceof MetadataResolver))
            return new MetadataResolver(opts);

        this.selfID = utils.generateRandomID();

        this.socketList = [];
        this.currentInfohash = null;

        this.timeout = opts.timeout;
        this.socketTimeout = opts.socketTimeout;
        this.remainingSec = 0;

        this.on('download', this._downloadMetadata)

        this._onDHTPeer = function (peer, infohash, from) {
            if (this.currentInfohash == infohash.toString('hex')) {

                this.emit('download', peer, infohash);
            }

        }.bind(this);
    }

    // Only function to be called
    register(infohash, peerDiscovery) {
        this.currentInfohash = infohash;
        this.semaphore = 1
        this.peerDiscovery = peerDiscovery;
        this.peerDiscovery.on('peer', this._onDHTPeer);

        this._setMetadataTimeout();
    }

    _setMetadataTimeout() {
        this.remainingSec = setTimeout(function () {
            this._unregister()
            this.emit('timeout', this.currentInfohash);
        }.bind(this), this.timeout)
    }

    _unregister() {
        this.peerDiscovery.removeListener('peer', this._onDHTPeer);

        // use nextTick to emit the event once a handler is assigned


        this.socketList.forEach(function (socket) {
            process.nextTick(function() {
                socket.destroy();
            });
        })
        this.socketList = []
    }

    //seems ok. Too many sockets opened
    _downloadMetadata(peer, infohash) {
        if (this.currentInfohash == infohash.toString('hex')) {

            const socket = new net.Socket();
            this.socketList.push(socket);

            socket.setTimeout(this.socketTimeout);

            this._onPeerConnected = function () {
                const wire = new Protocol();

                socket.pipe(wire).pipe(socket);
                wire.use(ut_metadata());

                wire.handshake(infohash, this.selfID, { dht: true });

                wire.on('handshake', function (infohash, peerId) {
                    wire.ut_metadata.fetch();
                });

                wire.ut_metadata.once('metadata', function (rawMetadata) {
                    if (this.semaphore != 0) {
                        process.nextTick(function () {
                            this.semaphore = 0;
                        }.bind(this));

                        clearTimeout(this.remainingSec);

                        this._unregister()

                        var torrent = this._parseMetadata(rawMetadata);
                        this.emit('metadata', torrent)
                    }
                }.bind(this));
            }.bind(this);

            socket.on('error', err => { socket.destroy(); });
            socket.on('timeout', err => { socket.destroy(); });

            socket.connect(peer.port, peer.host, this._onPeerConnected);
        }
    }

    _parseMetadata(rawMetadata) {
        var metadata = bencode.decode(rawMetadata).info;

        var torrentName = metadata.name.toString('utf-8');
        var files = [];

        if (metadata.hasOwnProperty('files')) {

            // multiple files
            var l = metadata.files.length;
            for (var i = 0; i < l; i++) {
                files.push(
                    {
                        name: metadata.files[i].path.toString('utf-8'),
                        size: metadata.files[i].length
                    });
            }
        } else {

            // single file
            files.push(
                {
                    name: metadata.name.toString('utf-8'),
                    size: metadata.length
                });
        }

        return {
            infohash: this.currentInfohash,
            name: torrentName,
            files: files
        }
    }
}

module.exports = MetadataResolver;