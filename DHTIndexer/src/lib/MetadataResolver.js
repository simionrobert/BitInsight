'use strict';

var EventEmitter = require('events')
var PeerDiscovery = require('./PeerDiscovery');

const parseTorrent = require('parse-torrent')
const Protocol = require('bittorrent-protocol');
const ut_metadata = require('ut_metadata');

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
        this.torcacheURL = opts.torcacheURL;

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

    downloadMetadataFromTracker(infohash) {
        parseTorrent.remote(this.torcacheURL + infohash + ".torrent", function (err, parsedTorrent) {
            if (err || typeof parsedTorrent === "undefined") {
                this.emit("timeout Tracker")
            } else {
                if (this.semaphore != 0) {
                    this._unregister();
                    var torrent = utils.parseMetadataTracker(parsedTorrent)
                    this.emit('metadata', torrent);
                }
            }
        }.bind(this))
    }


    _unregister() {
        clearTimeout(this.remainingSec);
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

                        var torrent = utils.parseMetadataDHT(rawMetadata, this.currentInfohash);
                        this.emit('metadata', torrent)
                    }
                }.bind(this));


                wire.handshake(infohash, this.selfID, { dht: true });
            }
        }.bind(this);

        socket.connect(peer.port, peer.host, this._onPeerConnected);
    }

}

module.exports = MetadataResolver;