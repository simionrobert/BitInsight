'use strict';

var EventEmitter = require('events')
const parseTorrent = require('parse-torrent')
const Protocol = require('bittorrent-protocol');
const ut_metadata = require('ut_metadata');

const net = require('net');
var PeerDiscovery = require('./PeerDiscovery');
const utils = require('../utils');


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
        this.tracker = opts.tracker;
        this.torcacheURL = opts.torcacheURL;


        this._onDHTPeer = function (peer, infohash, from) {
            if (this.currentInfohash == infohash.toString('hex') && this.semaphore != 0) {
                this._downloadMetadataFromDHTPeer(peer, infohash)
            }
        }
    }

    start(infohash, peerDiscovery) {
        this.currentInfohash = infohash;
        this.peerDiscovery = peerDiscovery;
        this.semaphore = 1

        this._setMetadataTimeout(this.timeout);

        //conccurently set each other
        if (this.tracker == true) {
            this._downloadMetadataFromTracker(infohash)//try through torcache first(its faster)
        }
        this._downloadMetadataFromDHT(infohash); //try through DHT 
    }


    _unregister() {
        clearTimeout(this.remainingSec);
        this.semaphore = 0;
        this.peerDiscovery.removeListener('peer', this._onDHTPeer);

        this.socketList.forEach(function (socket) {
            socket.destroy();
        })
        delete this.socketList
        this.socketList = []
    }

    _setMetadataTimeout(timeout) {
        this.remainingSec = setTimeout(function () {
            this._unregister()
            this.emit('timeout', this.currentInfohash);
        }.bind(this), timeout)
    }

    _downloadMetadataFromDHT(infohash) {
        this.peerDiscovery.on('peer', this._onDHTPeer.bind(this));
        this.peerDiscovery.lookup(infohash);
    }

    _downloadMetadataFromTracker(infohash) {
        parseTorrent.remote(this.torcacheURL + infohash + ".torrent", function (err, parsedTorrent) {
            if (err || typeof parsedTorrent === "undefined") {

            } else {
                if (this.semaphore!=0 && parsedTorrent.infoHash == this.currentInfohash) {
                    this._unregister();
                    var torrent = utils.parseMetadataTracker(parsedTorrent)
                    this.emit('metadata', torrent);
                }
            }
        }.bind(this))
    }

    _downloadMetadataFromDHTPeer(peer, infohash) {
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