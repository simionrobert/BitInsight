'use strict';

var EventEmitter = require('events')
var MetadataResolver = require('./MetadataResolver');
var PeerDiscovery = require('./PeerDiscovery');
const fs = require('fs');


class BTClient extends EventEmitter{
    constructor(opts) {
        super();
        if (!(this instanceof BTClient))
            return new BTClient(opts);

        this._peerDiscovery = new PeerDiscovery(opts.DEFAULT_PEER_DISCOVERY_OPTIONS);
        this._metadataFetcher = new MetadataResolver(opts.DEFAULT_METADATA_FETCHER_OPTIONS, this._peerDiscovery);

        this.cache = [];
        this.listIP = [];

        this.semaphore = false
        this.countInfohashesDone = 0 //parseInt(fs.readFileSync('id.txt'), 10);

        this._peerDiscovery.on('peer', function (peer, infohash, from) {
            this.listIP.push(peer);
        }.bind(this));

        this._peerDiscovery.on('discoveryEnded', function (infohash) {
            var torrent = {
                infohash: infohash,
                listIP: this.listIP
            }
            this.emit('torrentIP', torrent);

            this.nextInfohash();
        }.bind(this));

        this._metadataFetcher.on('metadata', function (torrent, remoteAddress) {
            this.emit('torrentMetadata', torrent);

            this.nextInfohash();
        }.bind(this));

        this._metadataFetcher.on('timeout', function () {
            console.log("Timeout")
            this.nextInfohash();
        }.bind(this));
    }

    addToCache(infohash) {
        if (Array.isArray(infohash))
            this.cache = this.cache.concat(infohash)
        else
            this.cache.push(infohash)
    }

    startService() {

        // get from cache and discover
        if (this.cache.length != 0) {
            this.listIP = [];

            var inf = this.cache.shift();
            console.log("\n\n\n\Initiating request to " + inf)
            this._metadataFetcher.getMetadata(inf)
        } else {
            this.listIP = [];
            this.emit("cacheEmpty");
        }
    }

    nextInfohash() {
        this.semaphore = !this.semaphore;

        if (this.semaphore == false) {
            fs.writeFile('id.txt', (this.countInfohashesDone++));
            this.startService()
        }
    }

    getID() {
        return this.countInfohashesDone
    }
}

module.exports = BTClient;