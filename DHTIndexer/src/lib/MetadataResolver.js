'use strict';

var EventEmitter = require('events')
var PeerDiscovery = require('./PeerDiscovery');

const Protocol = require('bittorrent-protocol');
const ut_metadata = require('ut_metadata');
const bencode = require('bencode');
const net = require('net');
const utils = require('./utils');


// TODO: Metadata timeout & socket creation optimisation

class MetadataResolver extends EventEmitter {
    constructor(opts, peerDiscovery) {
        super();
        if (!(this instanceof MetadataResolver))
            return new MetadataResolver(peerDiscovery);

        this.peerDiscovery = peerDiscovery;
        this.selfID = utils.generateRandomID();

        this.socketList = [];
        this.currentInfohash = null;

        this.timeout = opts.timeout;
        this.socketTimeout = opts.socketTimeout;
        this.remainingSec = 0;

        this.on('download', this._downloadMetadata)

        this._onDHTPeer = function (peer, infohash, from) {
            if (this.currentInfohash == infohash.toString('hex')) {

                // TODO: Implement Batch download
                this.emit('download', peer, infohash);
            }

        }.bind(this);
    }

    // Only function to be called
    getMetadata(infohash) {
        this.currentInfohash = infohash;
        this._setMetadataTimeout();

        this.peerDiscovery.on('peer', this._onDHTPeer);
        this.peerDiscovery.lookup(infohash);
    }

    _setMetadataTimeout() {
        this.remainingSec = setTimeout(function () {

            this.socketList.forEach(function (socket) {
                socket.destroy();
            })
            this.socketList = []
            this.peerDiscovery.removeListener('peer', this._onDHTPeer);

            this.emit('timeout', this.currentInfohash);
        }.bind(this), this.timeout)
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
                    if (this.socketList.length != 0) {
                        //maybe sokcet destroy is not cooreect based on event loop
                        clearTimeout(this.remainingSec);

                        this.peerDiscovery.removeListener('peer', this._onDHTPeer);

                        this.socketList.forEach(function (socket) {
                            socket.destroy()
                        })
                        this.socketList = []

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