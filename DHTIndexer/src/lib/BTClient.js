'use strict';

const EventEmitter = require('events')
const _ = require('lodash');
const MetadataResolver = require('./MetadataResolver');
const PeerDiscovery = require('./PeerDiscovery');
const Categoriser = require('./Categoriser');
const parseTorrent = require('parse-torrent')
const utils = require('./utils');

const fs = require('fs');


class BTClient extends EventEmitter{
    constructor(opts, metadataFlag, ipFlag) {
        super();
        if (!(this instanceof BTClient))
            return new BTClient(opts);

        this.opts = opts
        this.metadataFlag = metadataFlag
        this.ipFlag = ipFlag
        this.torcacheURL = opts.DEFAULT_BTCLIENT_OPTIONS.torcacheURL

        this.categoriser = new Categoriser();
        this.cache = [];
        this.semaphore = false
        this.lastInfohashID = parseInt(fs.readFileSync('id.txt'), 10);

        this.torrent = {};

        this.onPeer = function (peer, infohash, from) {
            this.listIP.push(peer);
        }
        this.onDiscoveryEnded = function (infohash) {
            var ip = {
                infohash: infohash,
                listIP: _.uniq(this.listIP)
            }

            this.torrent.ip = ip;

            this._nextInfohash();
        }

        this.onMetadata = function (torrent, remoteAddress) {

            var metadata = this.categoriser.parse(torrent)
            this.torrent.metadata = metadata;

            this._nextInfohash();
        }

        this.onMetadataTimeout = function (infohash) {
            //failed with metadata dht fetcher

            //try through torcache
            parseTorrent.remote(this.torcacheURL + infohash + ".torrent", function (err, parsedTorrent) {

                if (err || typeof parsedTorrent === "undefined") {
                    this._nextInfohash();
                    return;
                }

                var metadata = utils.parseMetadata(parsedTorrent)
                metadata = this.categoriser.parse(metadata)
                this.torrent.metadata = metadata;

                this._nextInfohash();
            }.bind(this))
        }

        if (metadataFlag) {
            this.metadataFetcher = new MetadataResolver(opts.DEFAULT_METADATA_FETCHER_OPTIONS);
            this.metadataFetcher.on('metadata', this.onMetadata.bind(this));
            this.metadataFetcher.on('timeout', this.onMetadataTimeout.bind(this));
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
            this.torrent = {};
            var infohash = this.cache.shift();

            //create new PeerDiscovery for each infohash
            this.peerDiscovery = new PeerDiscovery(this.opts.DEFAULT_PEER_DISCOVERY_OPTIONS);
            if (this.ipFlag) {
                this.peerDiscovery.on('peer', this.onPeer.bind(this));
                this.peerDiscovery.on('timeout', this.onDiscoveryEnded.bind(this));
            }

            //register peerdiscovery to metadataFetcher
            if (this.metadataFlag)
                this.metadataFetcher.register(infohash, this.peerDiscovery)

            //start getting metadata
            this.peerDiscovery.lookup(infohash);
        } else {
            this.listIP = [];

            //periodically save to keep log of where i remained and to continue from
            fs.writeFile('id.txt', this.lastInfohashID);

            this.emit("cacheEmpty");
        }
    }

    getID() {
        return this.lastInfohashID
    }

    _nextInfohash() {
        this.semaphore = !(this.semaphore || !(this.metadataFlag & this.ipFlag))

        if (this.semaphore == false) {

            // Minor adjustment here for easier ES queries
            if (this.torrent.metadata!=null &&this.metadataFlag == true && this.ipFlag == true) {
                this.torrent.metadata.Peers = this.torrent.ip.listIP.length;
            }

            if (this.ipFlag) {
                this.peerDiscovery.removeListener('peer', this.onPeer);
                this.peerDiscovery.removeListener('timeout', this.onDiscoveryEnded);
            }

            this.peerDiscovery.destroy();

            this.emit("torrent",this.torrent)

            setImmediate(function() {
                this.startService();
            }.bind(this));
        }
    }

}

module.exports = BTClient;