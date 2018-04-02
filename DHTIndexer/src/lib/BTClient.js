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

        this.onPeer = function (peer, infohash, from) {
            this.listIP.push(peer);
        }
        this.onDiscoveryEnded = function (infohash) {
            var torrent = {
                infohash: infohash,
                listIP: _.uniq(this.listIP)
            }

            this.nextInfohash();
            this.emit('ip', torrent);
            if (this.semaphore == false)
                this.startService()
        }

        this.onMetadata = function (torrent, remoteAddress) {
            torrent = this.categoriser.parse(torrent)

            this.nextInfohash();
            this.emit('metadata', torrent);
            if (this.semaphore == false)
                this.startService()
        }

        this.onMetadataTimeout = function (infohash) {
            //failed with metadata dht fetcher

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
            var infohash = this.cache.shift();

            //create new PeerDiscovery for each infohash
            this.peerDiscovery = new PeerDiscovery(this.opts.DEFAULT_PEER_DISCOVERY_OPTIONS);
            if (this.ipFlag) {
                this.peerDiscovery.on('peer', this.onPeer.bind(this));
                this.peerDiscovery.on('done', this.onDiscoveryEnded.bind(this));
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

    nextInfohash() {
        this.semaphore = !(this.semaphore || !(this.metadataFlag & this.ipFlag))

        if (this.semaphore == false) {
            if (this.ipFlag) {
                this.peerDiscovery.removeListener('peer', this.onPeer);
                this.peerDiscovery.removeListener('done', this.onDiscoveryEnded);
            }

            this.peerDiscovery.destroy();
        }
    }

    getID() {
        return this.lastInfohashID
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
}

module.exports = BTClient;