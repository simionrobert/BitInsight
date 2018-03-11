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
        this._intervalMs = opts.intervalMs || (15 * 60 * 1000) //15 minutes

        this._destroyed = false
        this._dhtAnnouncing = false
        this._dhtTimeout = false


        this._onWarning = function (err) {
            this.emit('warning', err)
        }.bind(this);
        this._onError = function (err) {
            this.emit('error', err)
        }.bind(this);
        this._onDHTPeer = function (peer, infoHash, from) {
            if (infoHash.toString('hex') !== this._infohash)
                return;

            this.emit('peer', peer, infoHash, from);
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

        if (this.dht) {
            this.dht.on('peer', this._onDHTPeer)
        }
    }

    lookup(infohash) {

        //entry point
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
        clearTimeout(this._dhtTimeout);

        this.dht.announce(this._infohash, this._port, function (err) {
            this._dhtAnnouncing = false

            if (err)
                this.emit('warning', err)

            if (!this._destroyed) {
                this.emit('dhtAnnounce')

                this._dhtTimeout = setTimeout(function () {
                    this.dhtAnnounce()
                }.bind(this), this._getRandomTimeout())

                if (this._dhtTimeout.unref)
                    this._dhtTimeout.unref()
            }
        }.bind(this));
    }

    destroy(cb) {
        if (this._destroyed)
            return
        this._destroyed = true

        clearTimeout(this._dhtTimeout)

        this.dht.removeListener('peer', this._onDHTPeer)
        this.dht.removeListener('warning', this._onWarning)
        this.dht.removeListener('error', this._onError)
        this.dht.destroy(cb)

        // cleanup
        this.dht = null
    }

    // Returns timeout interval, with some random jitter
    _getRandomTimeout() {
        return this._intervalMs + Math.floor(Math.random() * this._intervalMs / 5)
    }
}

module.exports = PeerDiscovery