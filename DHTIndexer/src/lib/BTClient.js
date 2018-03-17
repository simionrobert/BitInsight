'use strict';

var EventEmitter = require('events')
var MetadataFetcher = require('./MetadataFetcher');
var PeerDiscovery = require('./PeerDiscovery');

// TODO: Insert to db IPs distinct to metadata
class BTClient extends EventEmitter{
    constructor(opts) {
        super();
        if (!(this instanceof BTClient))
            return new BTClient(opts);

        this.cache = [];
        this.serviceStartedFlag = false;

        this._dataReady = false
        this.listIP = [];
        this.name = "";
        this.files = [];


        this._peerDiscovery = new PeerDiscovery(opts.DEFAULT_PEER_DISCOVERY_OPTIONS);
        this._metadataFetcher = new MetadataFetcher(opts.DEFAULT_METADATA_FETCHER_OPTIONS, this._peerDiscovery);

        this._peerDiscovery.on('peer', function (peer, infohash, from) {
            this.listIP.push(peer);
        }.bind(this));

        this._peerDiscovery.on('discoveryEnded', function (infohash) {
            if (this._dataReady == true) {
                this._infoDone(infohash,this.name, this.files)
                return;
            }
               
            this._dataReady = true
        }.bind(this));


        this._metadataFetcher.on('metadata', function ( infohash, name, files, remoteAddress) {
            if (this._dataReady == true)
            {
                this._infoDone(infohash,name, files)

                return;
            }
               
            this.name = name;
            this.files = files;

            this._dataReady = true
        }.bind(this));

        // TODO: To be implemented at metadata
        this._metadataFetcher.on('timeout', function () {
            console.log("Metadata timeout")
            this.startService();
        }.bind(this));

        this.on('startService', this.startService.bind(this))
    }

    addToCache(infohash) {
        this.cache.push(infohash)

        if (this.serviceStartedFlag == false) {
            this.emit('startService')
        }
    }

    startService() {

        // get from cache and discover
        if (this.cache.length != 0) {
            this.serviceStartedFlag = true;
            this.listIP = [];
            this.name = "";
            this.files = [];
            this._dataReady = false;

            this._metadataFetcher.getMetadata(this.cache.shift())

        } else {
            this.serviceStartedFlag = false;
        }
    }

    _infoDone(infohash, name, files, listIP) {
        var torrent = {
            infohash: infohash,
            name: name,
            files: files,
            listIP: this.listIP
        }

        this.emit('torrent', torrent);
        this.startService();
    }
}

module.exports = BTClient;