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
        this.timeout = opts.timeout;

        this.on('download', this._downloadMetadata)

        this._onDHTPeer = function (peer, infohash, from) {
            this.emit('download',peer, infohash);
        }.bind(this);
    }

    getMetadata(infohash) {

        //timeout metadata nou found
        this.timeout = setTimeout(function () {
            this.peerDiscovery.removeListener('peer', this._onDHTPeer);
            this.metadataGot = true;
            this.emit('timeout', infohash);
        }.bind(this), 7000)


        this.files = [];
        this.torrentName = null;
        this.metadataGot = false;

        this.peerDiscovery.on('peer', this._onDHTPeer);
        this.peerDiscovery.lookup(infohash);
    }

    _downloadMetadata(peer, infohash) {
        const socket = new net.Socket();

        socket.setTimeout(5000);

        this._onPeerConnected = function () {
            if (!this.metadataGot) {
                const wire = new Protocol();

                socket.pipe(wire).pipe(socket);
                wire.use(ut_metadata());

                wire.handshake(infohash, this.selfID, { dht: true });
                wire.on('handshake', function (infohash, peerId) {
                    wire.ut_metadata.fetch();
                });

                var _onMetadataArrived = function (rawMetadata) {
                    if (!this.metadataGot) {
                        this.metadataGot = true;
                        clearTimeout(this.timeout);

                        this._parseMetadata(rawMetadata);

                        this.emit('metadata', infohash, this.torrentName, this.files, socket.remoteAddress)

                        this.peerDiscovery.removeListener('peer', this._onDHTPeer)
                        wire.ut_metadata.removeListener('metadata', _onMetadataArrived)

                        socket.destroy();
                    }
                }.bind(this);


                wire.ut_metadata.on('metadata', _onMetadataArrived);
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