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

        this.opts = opts
        this._metadataFetcher = new MetadataResolver(opts.DEFAULT_METADATA_FETCHER_OPTIONS);
        this.cache = [];
        this.semaphore = false
        this.countInfohashesDone = 0 //parseInt(fs.readFileSync('id.txt'), 10);

        this._onPeer = function (peer, infohash, from) {
            this.listIP.push(peer);
        }
        this._onDiscoveryEnded = function (infohash) {
            var torrent = {
                infohash: infohash,
                listIP: this.listIP
            }
            this.emit('torrentIP', torrent);
            this.nextInfohash();
        }

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
        if (this.cache.length != 0) {

            //create new PeerDiscovery for each infohash
            this._peerDiscovery = new PeerDiscovery(this.opts.DEFAULT_PEER_DISCOVERY_OPTIONS);
            this.listIP = [];

            //attach listeners to PeerDiscovery
            this._peerDiscovery.on('peer', this._onPeer.bind(this));
            this._peerDiscovery.on('done', this._onDiscoveryEnded.bind(this));

            //start getting metadata
            this._metadataFetcher.getMetadata(this.cache.shift(), this._peerDiscovery)
        } else {
            this.listIP = [];
            this.emit("cacheEmpty");
        }
    }

    nextInfohash() {
        this.semaphore = !this.semaphore;

        if (this.semaphore == false) {
            this._peerDiscovery.removeListener('peer', this._onPeer);
            this._peerDiscovery.removeListener('done', this._onDiscoveryEnded);

            //fs.writeFile('id.txt', (this.countInfohashesDone++));
            this.startService()
        }
    }

    getID() {
        return this.countInfohashesDone
    }
}

module.exports = BTClient;