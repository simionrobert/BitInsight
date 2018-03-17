'use strict';

var DHT = require('bittorrent-dht/client') // empty object in browser
var EventEmitter = require('events')
var util = require('util')

class PeerDiscovery extends EventEmitter {

    constructor(opts) {
        super();
        if (!(this instanceof PeerDiscovery))
            return new PeerDiscovery(opts)
      

        this._port = opts.port ? opts.port : 20000; // torrent port
        this._intervalAnnounceMs = opts.intervalMs || (15 * 60 * 1000) //15 minutes
        this._intervalDiscoveryTimeoutMS = opts.intervalDiscoveryTimeoutMS || 3000;

        this._destroyed = false
        this._dhtAnnouncing = false

        this._dhtAnnounceTimeout = 0
        this._peerDiscoveryTimeout = 0;

        this._onWarning = function (err) {
            this.emit('warning', err)
        }.bind(this);
        this._onError = function (err) {
            this.emit('error', err)
        }.bind(this);


        this._onDHTPeer = function (peer, infoHash, from) {
            if (infoHash.toString('hex') !== this._infohash)
                return;

            clearTimeout(this._peerDiscoveryTimeout);

            this.emit('peer', peer, infoHash, from);

            this._peerDiscoveryTimeout = setTimeout(function () {

                this.dht.removeListener('peer', this._onDHTPeer);
                this.emit('discoveryEnded', infoHash);

            }.bind(this), this._intervalDiscoveryTimeoutMS)

        }.bind(this);


        if (opts.dht) {
            this.dht = dht;
        }
        else {
            this.dht = new DHT(opts)
            this.dht.on('warning', this._onWarning)
            this.dht.on('error', this._onError)
            this.dht.listen(this._port)
        }

    }

    lookup(infohash) {

        //entry point
        if (this.dht) {
            this.dht.on('peer', this._onDHTPeer)
        }
        this._infohash = infohash;
        this.dht.lookup(infohash);
        this.dhtAnnounce();
    }

    dhtAnnounce() {
        //Announce that the peer, controlling the querying node, is downloading a torrent on a port.

        if (this._dhtAnnouncing)
            return;

        console.log('Announcing');
        this._dhtAnnouncing = true;
        clearTimeout(this._dhtAnnounceTimeout);

        this.dht.announce(this._infohash, this._port, function (err) {
            this._dhtAnnouncing = false

            if (err)
                this.emit('warning', err)

            if (!this._destroyed) {
                this.emit('dhtAnnounce')

                this._dhtAnnounceTimeout = setTimeout(function () {
                    this.dhtAnnounce()
                }.bind(this), this._getRandomTimeout())

                if (this._dhtAnnounceTimeout.unref)
                    this._dhtAnnounceTimeout.unref()
            }
        }.bind(this));
    }

    destroy(cb) {
        if (this._destroyed)
            return
        this._destroyed = true

        clearTimeout(this._dhtAnnounceTimeout)

        this.dht.removeListener('peer', this._onDHTPeer)
        this.dht.removeListener('warning', this._onWarning)
        this.dht.removeListener('error', this._onError)
        this.dht.destroy(cb)

        // cleanup
        this.dht = null
    }

    // Returns timeout interval, with some random jitter
    _getRandomTimeout() {
        return this._intervalAnnounceMs + Math.floor(Math.random() * this._intervalAnnounceMs / 5)
    }
}

module.exports = PeerDiscovery