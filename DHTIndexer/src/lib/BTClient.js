'use strict';

const EventEmitter = require('events')
const _ = require('lodash');
const MetadataResolver = require('./MetadataResolver');
const PeerDiscovery = require('./PeerDiscovery');
const Categoriser = require('./Categoriser');
const parseTorrent = require('parse-torrent')


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

        this._onPeer = function (peer, infohash, from) {
            this.listIP.push(peer);
        }
        this._onDiscoveryEnded = function (infohash) {
            var torrent = {
                infohash: infohash,
                listIP: _.uniq(this.listIP)
            }

            this.nextInfohash();
            this.emit('ip', torrent);
            if (this.semaphore == false)
                this.startService()
        }

        this._onMetadata = function (torrent, remoteAddress) {
            torrent = this.categoriser.parse(torrent)

            this.nextInfohash();
            this.emit('metadata', torrent);
            if (this.semaphore == false)
                this.startService()
        }

        this._onMetadataTimeout = function (infohash) {
            //failed with metadata dht fetcher

            //TODO: Separate parse torrent from btclient
            //TODO: Add webtorrent tracker to download ips from trackers

            //try through torcache
            parseTorrent.remote(this.torcacheURL + infohash + ".torrent", function (err, parsedTorrent) {
                if (err || typeof parsedTorrent === "undefined") {
                    this.nextInfohash();
                    if (this.semaphore == false)
                        this.startService()
                    return;
                }

                var torrent = this._parseMetadata(parsedTorrent)
                torrent = this.categoriser.parse(torrent)

                this.nextInfohash();
                this.emit('metadata', torrent);
                if (this.semaphore == false)
                    this.startService()
            }.bind(this))
        }

        if (metadataFlag) {
            this._metadataFetcher = new MetadataResolver(opts.DEFAULT_METADATA_FETCHER_OPTIONS);
            this._metadataFetcher.on('metadata', this._onMetadata.bind(this));
            this._metadataFetcher.on('timeout', this._onMetadataTimeout.bind(this));
        }
    }

    _parseMetadata(parsedTorrent) {
        var files = [];

        if (parsedTorrent.hasOwnProperty('files')) {

            // multiple files
            var l = parsedTorrent.files.length;
            for (var i = 0; i < l; i++) {
                files.push(
                    {
                        name: parsedTorrent.files[i].path,
                        size: parsedTorrent.files[i].length
                    });
            }
        }

        return {
            infohash: parsedTorrent.infoHash,
            name: parsedTorrent.name,
            files: files
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
        }
    }

    getID() {
        return this.lastInfohashID
    }
}

module.exports = BTClient;