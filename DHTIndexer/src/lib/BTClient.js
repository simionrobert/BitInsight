'use strict';

var EventEmitter = require('events')
var MetadataFetcher = require('./MetadataFetcher');
var PeerDiscovery = require('./PeerDiscovery');


class BTClient extends EventEmitter{
    constructor(opts) {
        super();
        if (!(this instanceof BTClient))
            return new BTClient(opts);


        this._peerDiscovery = new PeerDiscovery(opts.DEFAULT_PEER_DISCOVERY_OPTIONS);

        DEFAULT_METADATA_FETCHER_OPTIONS = {
            peerDiscovery: this._peerDiscovery
        }
        this._metadataFetcher = new MetadataFetcher(DEFAULT_METADATA_FETCHER_OPTIONS);

        this._dataReady = false
        this.name = "";
        this.files = [];
        this.listIP = [];
        this.cache = [];
        this.serviceStartedFlag = false;
  

        this._peerDiscovery.on('peer', function (peer, infoHash, from) {
            this.listIP.push(peer);
        }.bind(this));

        this._peerDiscovery.on('discoveryEnded', function (infoHash) {
            if (this._dataReady == true) {
                this._infoDone(this.name, this.files)
               
                return;
            }
               
            this._dataReady = true
        }.bind(this));

        this._metadataFetcher.on('metadata', function (infohash,name, files, remoteAddress) {
            if (this._dataReady == true)
            {
                this._infoDone(name, files)

                return;
            }
               
            this.name = name;
            this.files = files;

            this._dataReady = true
        }.bind(this));
    }

    addToCache(infohash) {
        this.cache.push(infohash)

        if (this.serviceStartedFlag == false) {
            this.startService();
        }
    }

    startService() {

        // get from cache and discover
        if (this.cache.length != 0) {
            this.serviceStartedFlag = true;

            this.infohash = this.cache.shift();

        }
    }

    _infoDone(name, files, listIP) {
        var torrent = {
            infohash: this.infohash,
            name: name,
            files: files,
            listIP: this.listIP
        }

        this.emit('torrent', torrent);

        if (this.cache.length != 0) {
            this.startService();
        } else {
            this.serviceStartedFlag = false;
        }
    }
}

module.exports = BTClient;