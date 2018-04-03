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

        this.timeout = opts.timeout;
        this.socketTimeout = opts.socketTimeout;

        this.selfID = utils.generateRandomIDSync();
        this.socketList = [];
        this.currentInfohash = null;
        this.remainingSec = 0;

        this._onDHTPeer = function (peer, infohash, from) {
            if (this.currentInfohash == infohash.toString('hex') && this.semaphore != 0) {
                this._downloadMetadata(peer, infohash)
            }
        }
    }

    register(infohash, peerDiscovery) {
        this.currentInfohash = infohash;
        this.semaphore = 1
        this.peerDiscovery = peerDiscovery;

        this.peerDiscovery.on('peer', this._onDHTPeer.bind(this));
        this._setMetadataTimeout(this.timeout);
    }

    _unregister() {
        this.semaphore = 0;
        this.peerDiscovery.removeListener('peer', this._onDHTPeer);

        this.socketList.forEach(function (socket) {
            socket.destroy();
        })
        this.socketList = []
    }

    _setMetadataTimeout(timeout) {
        this.remainingSec = setTimeout(function () {
            this._unregister()

            this.emit('timeout', this.currentInfohash);
        }.bind(this), timeout)
    }


    _downloadMetadata(peer, infohash) {
        var socket = new net.Socket();

        socket.on('error', err => { socket.destroy(); });
        socket.on('timeout', err => { socket.destroy(); });

        socket.setTimeout(this.socketTimeout);
        this.socketList.push(socket);

        this._onPeerConnected = function () {
            if (this.semaphore != 0) {
                const wire = new Protocol();

                socket.pipe(wire).pipe(socket);
                wire.use(ut_metadata());

                wire.on('handshake', function (infohash, peerId) {
                    if (this.semaphore != 0)
                        wire.ut_metadata.fetch();
                });

                wire.ut_metadata.on('metadata', function (rawMetadata) {
                    if (this.semaphore != 0) {
                        this._unregister();

                        clearTimeout(this.remainingSec);

                        var torrent = this._parseMetadata(rawMetadata);
                        this.emit('metadata', torrent)
                    }
                }.bind(this));


                wire.handshake(infohash, this.selfID, { dht: true });
            }
        }.bind(this);

        socket.connect(peer.port, peer.host, this._onPeerConnected);
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