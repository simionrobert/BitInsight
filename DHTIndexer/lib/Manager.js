'use strict';

var EventEmitter = require('events')
var MetadataFetcher = require('./MetadataFetcher');
var PeerDiscovery = require('./PeerDiscovery');

class Manager extends EventEmitter {
    constructor(opts) {
        super();
        if (!(this instanceof Manager))
            return new Manager(opts);


        this._dataReady = false
        this.name = "";
        this.files = [];
        this.listIP = [];

        var DEFAULT_PEER_DISCOVERY_OPTIONS = {
            port: 6881,
            intervalMs: 15 * 60 * 1000,
            dht: false
        }

        this._peerDiscovery = new PeerDiscovery(DEFAULT_PEER_DISCOVERY_OPTIONS);


        var DEFAULT_METADATA_FETCHER_OPTIONS = {
            peerDiscovery: this._peerDiscovery
        }
        this._metadataFetcher = new MetadataFetcher(DEFAULT_METADATA_FETCHER_OPTIONS);


        this._peerDiscovery.on('discoveryEnded', function (infoHash) {
            if (this._dataReady == true) {
                this.emit('dataReady', this._infohash, this.name, this.files, this.listIP);
                return;
            }
               
            this._dataReady = true
        }.bind(this));

        this._peerDiscovery.on('peer', function (peer, infoHash, from) {
            this.listIP.push(peer);
        }.bind(this));

        this._metadataFetcher.on('metadata', function (name, files, remoteAddress) {
            if (this._dataReady == true)
            {
                this.emit('dataReady', this._infohash, name, files, this.listIP);
                return;
            }
               
            this.name = name;
            this.files = files;

            this._dataReady = true
        }.bind(this));
    }

    getInfo(infohash) {
        this._infohash = infohash;
        this._peerDiscovery.lookup(infohash)
    }

}

module.exports = Manager;