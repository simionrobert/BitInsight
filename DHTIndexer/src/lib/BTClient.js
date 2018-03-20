'use strict';

var EventEmitter = require('events')
var MetadataFetcher = require('./MetadataFetcher');
var PeerDiscovery = require('./PeerDiscovery');
const fs = require('fs');

//  this.semaphore = false changes everytime
// TODO: Insert to db IPs distinct to metadata
class BTClient extends EventEmitter{
    constructor(opts) {
        super();
        if (!(this instanceof BTClient))
            return new BTClient(opts);

        this._peerDiscovery = new PeerDiscovery(opts.DEFAULT_PEER_DISCOVERY_OPTIONS);
        this._metadataFetcher = new MetadataFetcher(opts.DEFAULT_METADATA_FETCHER_OPTIONS, this._peerDiscovery);

        this.cache = [];
        this.listIP = [];

        this.serviceStartedFlag = false;
        this.semaphore = false
        this.idInfohashResolved = 0 //parseInt(fs.readFileSync('id.txt'), 10);


        this._peerDiscovery.on('peer', function (peer, infohash, from) {
            this.listIP.push(peer);
        }.bind(this));

        this._peerDiscovery.on('discoveryEnded', function (infohash) {
            console.log("Discovery ended")
            var torrent = {
                infohash: infohash,
                listIP: this.listIP
            }
            this.emit('torrentIP', torrent);

            this.nextInfohash();
        }.bind(this));

        this._metadataFetcher.on('metadata', function (infohash, name, files, remoteAddress) {
            console.log("Metadata Retrieved")
            var torrent = {
                infohash: infohash,
                name: name,
                files: files
            }
            this.emit('torrentMetadata', torrent);

            this.nextInfohash();
        }.bind(this));

        // TODO: To be implemented at metadata
        this._metadataFetcher.on('timeout', function () {
            console.log("Metadata Timeout")

            this.nextInfohash();
        }.bind(this));

        this.on('startService', this.startService)
    }

    nextInfohash() {
        if (this.semaphore == true) {
            this.semaphore = false

            console.log("Retrieving Done")
            fs.writeFileSync('id.txt', (this.idInfohashResolved++));

            this.startService()
        }

        this.semaphore = true
    }

    getID() {
        return this.idInfohashResolved
    }

    addToCache(infohash) {
        if (Array.isArray(infohash))
            this.cache = this.cache.concat(infohash)
        else
            this.cache.push(infohash)

        if (this.serviceStartedFlag == false) {
            this.startService()
        }
    }

    startService() {
        // get from cache and discover
        if (this.cache.length != 0) {
            this.serviceStartedFlag = true;
            this.listIP = [];


            this._metadataFetcher.getMetadata(this.cache.shift())

        } else {
            this.serviceStartedFlag = false;
            this.emit("cacheEmpty");
        }
    }
}

module.exports = BTClient;