'use strict';

var EventEmitter = require('events')
var PeerDiscovery = require('./PeerDiscovery');

const Protocol = require('bittorrent-protocol');
const ut_metadata = require('ut_metadata');
const bencode = require('bencode');
const net = require('net');
const utils = require('./utils');


// TODO: Metadata timeout & socket creation optimisation

class MetadataFetcher extends EventEmitter {
    constructor(opts, peerDiscovery) {
        super();
        if (!(this instanceof MetadataFetcher))
            return new MetadataFetcher(peerDiscovery);

        this.peerDiscovery = peerDiscovery;
        this.selfID = utils.generateRandomID();
        this.socketList = [];

        this.timeout = opts.timeout;
        this.socketTimeout = opts.socketTimeout;
        this.remainingSec = 0;

        this.on('download', this._downloadMetadata)

        this._onDHTPeer = function (peer, infohash, from) {
            if (this.infohash == infohash.toString('hex'))
                this.emit('download', peer, infohash);
        }.bind(this);
    }

    // Only function to be called
    getMetadata(infohash) {
        this.infohash = infohash;

        this.torrentName = null;
        this.files = [];
        this.metadataGot = false;
        this.peerDiscovery.on('peer', this._onDHTPeer);

        this.remainingSec = setTimeout(function () {
            this.peerDiscovery.removeListener('peer', this._onDHTPeer);
            this.metadataGot = true; //not really, but makes the thing that i want

            this.emit('timeout', this.infohash);
        }.bind(this), this.timeout)


        // start process
        this.peerDiscovery.lookup(infohash); 
    }

    //seems ok. Too many sockets opened
    _downloadMetadata(peer, infohash) {
        const socket = new net.Socket();
        this.socketList.push(socket);

        socket.setTimeout(this.socketTimeout);

        this._onPeerConnected = function () {
            if (!this.metadataGot) {
                const wire = new Protocol();

                socket.pipe(wire).pipe(socket);
                wire.use(ut_metadata());

                wire.handshake(infohash, this.selfID, { dht: true });

                wire.on('handshake', function (infohash, peerId) {
                    wire.ut_metadata.fetch();
                });

                wire.ut_metadata.on('metadata', function (rawMetadata) {
                    if (!this.metadataGot) {
                        clearTimeout(this.remainingSec);
                        this.metadataGot = true;

                        this.peerDiscovery.removeListener('peer', this._onDHTPeer)

                        this._parseMetadata(rawMetadata);
                        this.emit('metadata', infohash, this.torrentName, this.files, socket.remoteAddress)

                        this.socketList.forEach(function (socket) {
                            socket.destroy();
                        })
                        this.socketList = []
                    }
                }.bind(this));
            }
        }.bind(this);

        socket.on('error', err => { socket.destroy(); });

        socket.on('timeout', err => { socket.destroy(); });

        socket.connect(peer.port, peer.host, this._onPeerConnected);
    }

    _parseMetadata(rawMetadata) {
        var metadata = bencode.decode(rawMetadata).info;

        this.torrentName = metadata.name.toString('utf-8');
        if (metadata.hasOwnProperty('files')) {

            // multiple files
            var l = metadata.files.length;
            for (var i = 0; i < l; i++) {
                this.files.push(
                    {
                        name: metadata.files[i].path.toString('utf-8'),
                        size: metadata.files[i].length
                    });
            }
        } else {

            // single file
            this.files.push(
                {
                    name: metadata.name.toString('utf-8'),
                    size: metadata.length
                });
        }
    }
}

module.exports = MetadataFetcher;