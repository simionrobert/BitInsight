'use strict';

const EventEmitter = require('events')
const _ = require('lodash');
const MetadataResolver = require('./MetadataResolver');
const PeerDiscovery = require('./PeerDiscovery');
const Categoriser = require('../Database/Categoriser');

class MetadataService extends EventEmitter {
    constructor(opts) {
        super();
        if (!(this instanceof MetadataService))
            return new MetadataService(opts);

        this.opts = opts

        this.metadataFetcher = new MetadataResolver(opts.DEFAULT_METADATA_FETCHER_OPTIONS);
        this.categoriser = new Categoriser();
        this.cache = [];
        this.peerDiscovery = null;

        this.onMetadata = function (torrent, remoteAddress) {
            this.emit("metadata", this.categoriser.parse(torrent))
            this._nextInfohash()
        }

        this.onMetadataTimeout = function (infohash) {
            this.emit('metadataTimeout', infohash);
            this._nextInfohash()
        }

        this.metadataFetcher.on('metadata', this.onMetadata.bind(this));
        this.metadataFetcher.on('timeout', this.onMetadataTimeout.bind(this));
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
            this.peerDiscovery = new PeerDiscovery(this.opts.DEFAULT_PEER_DISCOVERY_OPTIONS);

            // Start metadata fetcher
            var infohash = this.cache.shift();
            this.metadataFetcher.start(infohash, this.peerDiscovery)

        } else {
            this.emit("cacheEmpty");
        }
    }

    _nextInfohash() {
        this.peerDiscovery.destroy();

        setImmediate(function () {
            this.startService();
        }.bind(this));
    }
}

module.exports = MetadataService;