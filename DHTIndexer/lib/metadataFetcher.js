'use strict';

var EventEmitter = require('events')
var PeerDiscovery = require('./PeerDiscovery');

const Protocol = require('bittorrent-protocol');
const ut_metadata = require('ut_metadata');
const bencode = require('bencode');
const net = require('net');
const utils = require('./utils');

class MetadataFetcher extends EventEmitter {
    constructor(opts) {
        super();
        if (!(this instanceof MetadataFetcher))
            return new MetadataFetcher(opts);

        this.selfID = utils.generateRandomID();
        this.files = [];
        this.torrentName = null;
        this.metadataGot = false;

        if (opts.peerDiscovery != undefined)
            this.peerDiscovery = opts.peerDiscovery;
        else if (opts.DEFAULT_PEER_DISCOVERY_OPTIONS === undefined) 
            this.peerDiscovery = new PeerDiscovery({ port: 6881, dht: false });
        else 
            this.peerDiscovery = new PeerDiscovery(opts.DEFAULT_PEER_DISCOVERY_OPTIONS);


        this._onDHTPeer = function (peer, infoHash, from) {
            this.emit('peer', peer, infoHash, from);
            this._getMetadata(peer, infoHash);
        }.bind(this);

        this.peerDiscovery.on('peer', this._onDHTPeer);
    }

    getMetadata(infohash) {
        this.peerDiscovery.lookup(infohash);
    }

    _getMetadata(peer, infoHash) {
        const socket = new net.Socket();
        socket.on('error', err => { socket.destroy(); });
        socket.setTimeout(5000);

        this._onPeerConnected = function () {
            const wire = new Protocol();

            socket.pipe(wire).pipe(socket);
            wire.use(ut_metadata());

            wire.handshake(infoHash, this.selfID, { dht: true });
            wire.on('handshake', function (infoHash, peerId) {
                wire.ut_metadata.fetch();
            });

            var _onMetadataArrived = function (rawMetadata) {
                if (!this.metadataGot) {
                    this.metadataGot = true;
                    this._metadataGot(rawMetadata);

                    this.emit('metadata', this.torrentName, this.files, socket.remoteAddress);

                    this.peerDiscovery.destroy();
                }
            }.bind(this);


            wire.ut_metadata.on('metadata', _onMetadataArrived );
        }.bind(this);

        socket.connect(peer.port, peer.host, this._onPeerConnected);
    }

    _metadataGot(rawMetadata) {
        var metadata = bencode.decode(rawMetadata).info;

        this.torrentName = metadata.name.toString('utf-8');
        if (metadata.hasOwnProperty('files')) {

            // multiple files
            var l = metadata.files.length;
            for (var i = 0; i < l; i++) {
                this.files.push(
                    {
                        name: metadata.files[i].path.toString('utf-8'),
                        length: metadata.files[i].length
                    });
            }
        } else {

            // single file
            this.files.push(
                {
                    name: metadata.name.toString('utf-8'),
                    length: metadata.length
                });
        }
    }
}

module.exports = MetadataFetcher;