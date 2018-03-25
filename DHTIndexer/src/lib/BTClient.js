'use strict';

var EventEmitter = require('events')
var MetadataResolver = require('./MetadataResolver');
var PeerDiscovery = require('./PeerDiscovery');
const fs = require('fs');


class BTClient extends EventEmitter{
    constructor(opts, metadataFlag, ipFlag) {
        super();
        if (!(this instanceof BTClient))
            return new BTClient(opts);

        this.opts = opts
        this.metadataFlag = metadataFlag
        this.ipFlag = ipFlag

        this.cache = [];
        this.semaphore = false
        this.lastInfohashID = parseInt(fs.readFileSync('id.txt'), 10);

        this._onPeer = function (peer, infohash, from) {
            this.listIP.push(peer);
        }
        this._onDiscoveryEnded = function (infohash) {
            var torrent = {
                infohash: infohash,
                listIP: this.listIP
            }
            this.emit('ip', torrent);
            this.nextInfohash();
        }

        this._onMetadata = function (torrent, remoteAddress) {
            this.emit('metadata', torrent);
            this.nextInfohash();
        }
        this._onMetadataTimeout = function () {
            this.nextInfohash();
        }

        if (metadataFlag) {
            this._metadataFetcher = new MetadataResolver(opts.DEFAULT_METADATA_FETCHER_OPTIONS);
            this._metadataFetcher.on('metadata', this._onMetadata.bind(this));
            this._metadataFetcher.on('timeout', this._onMetadataTimeout.bind(this));
        }
    }

    addToCache(infohash) {
        if (Array.isArray(infohash))
            this.cache = this.cache.concat(infohash)
        else
            this.cache.push(infohash)
    }

    startService() {
        if (this.cache.length != 0) {
            this.lastInfohashID++;
            this.listIP = [];
            this.semaphore = false
            var infohash = this.cache.shift();

            //create new PeerDiscovery for each infohash
            this._peerDiscovery = new PeerDiscovery(this.opts.DEFAULT_PEER_DISCOVERY_OPTIONS);

            if (this.ipFlag) {
                this._peerDiscovery.on('peer', this._onPeer.bind(this));
                this._peerDiscovery.on('done', this._onDiscoveryEnded.bind(this));
            }

            //register peerdiscovery to metadataFetcher
            if (this.metadataFlag)
                this._metadataFetcher.register(infohash, this._peerDiscovery)

            //start getting metadata
            this._peerDiscovery.lookup(infohash);
        } else {
            this.listIP = [];

            //periodically save to keep log of where i remained and to continue from
            fs.writeFile('id.txt', this.lastInfohashID);

            this.emit("cacheEmpty");
        }
    }

    nextInfohash() {
        this.semaphore = !(this.semaphore || !(this.metadataFlag & this.ipFlag))

        if (this.semaphore == false) {
            if (this.ipFlag) {
                this._peerDiscovery.removeListener('peer', this._onPeer);
                this._peerDiscovery.removeListener('done', this._onDiscoveryEnded);
            }

            this._peerDiscovery.destroy();

            this.startService()
        }
    }

    getID() {
        return this.lastInfohashID
    }
}

module.exports = BTClient;