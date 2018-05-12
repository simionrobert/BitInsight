'use strict';

const EventEmitter = require('events')
const _ = require('lodash');
const PeerDiscovery = require('./PeerDiscovery');

class PeerDiscoveryService extends EventEmitter {
    constructor(opts) {
        super();
        if (!(this instanceof PeerDiscoveryService))
            return new PeerDiscoveryService(opts);

        this.opts = opts
        this.cache = [];
        this.listIP = [];

        this.onPeer = function (peer, infohash, from) {
            this.listIP.push(peer);
        }

        this.onDiscoveryEnded = function (infohash) {
            var torrent = {};
            torrent.infohash = infohash;
            torrent.listIP = _.uniq(this.listIP)

            this.peerDiscovery.removeListener('peer', this.onPeer);
            this.peerDiscovery.removeListener('timeout', this.onDiscoveryEnded);
            this.peerDiscovery.destroy();

            this.emit("ip", torrent)

            setImmediate(function () {
                this.startService();
            }.bind(this));
        }
    }

    addToCache(infohash) {
        if (Array.isArray(infohash))
            this.cache = this.cache.concat(infohash)
        else
            this.cache.push(infohash)
    }

    startService() {
        //TODO:Use DHT not PeerDiscovery
        if (this.cache.length != 0) {
            var infohash = this.cache.shift();
            this.listIP = [];

            //create new PeerDiscovery for each infohash
            this.peerDiscovery = new PeerDiscovery(this.opts.DEFAULT_PEER_DISCOVERY_OPTIONS);
            this.peerDiscovery.on('peer', this.onPeer.bind(this));
            this.peerDiscovery.on('timeout', this.onDiscoveryEnded.bind(this));

            //start getting metadata
            this.peerDiscovery.lookup(infohash);
        } else {
            this.listIP = [];
            this.emit("cacheEmpty");
        }
    }
}

module.exports = PeerDiscoveryService;