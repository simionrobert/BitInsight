﻿module.exports = PeerDiscovery

var DHT = require('bittorrent-dht/client') // empty object in browser
var EventEmitter = require('events').EventEmitter
var util = require('util')


util.inherits(PeerDiscovery, EventEmitter)

function PeerDiscovery(opts) {
    var self = this
    if (!(self instanceof PeerDiscovery)) 
        return new PeerDiscovery(opts)
    EventEmitter.call(self)

    self._port = opts.port ? opts.port : 20000; // torrent port
    self._intervalMs = opts.intervalMs || (15 * 60 * 1000)

    self._destroyed = false
    self._dhtAnnouncing = false
    self._dhtTimeout = false


    self._onWarning = function (err) {
        self.emit('warning', err)
    }
    self._onError = function (err) {
        self.emit('error', err)
    }
    self._onDHTPeer = function (peer, infoHash, from) {
        if (infoHash.toString('hex') !== self._infohash) return
        self.emit('peer', peer, infoHash, from)
    }.bind(this);


    if (opts.dht) {
        self.dht = dht;
    }
    else {
        self.dht = new DHT(opts)
        self.dht.on('warning', self._onWarning)
        self.dht.on('error', self._onError)
        self.dht.listen(self._port)
    }

    if (self.dht) {
        self.dht.on('peer', self._onDHTPeer)
    }
}

PeerDiscovery.prototype.lookup = function (infohash) {

    //entry point
    this._infohash = infohash;
    this.dht.lookup(infohash);
    this._dhtAnnounce();
}

PeerDiscovery.prototype._dhtAnnounce = function () {
    var self = this
    if (self._dhtAnnouncing)
        return
    console.log('Announcing')
    self._dhtAnnouncing = true
    clearTimeout(self._dhtTimeout)

    self.dht.announce(self._infohash, self._port, function (err) {
        self._dhtAnnouncing = false

        if (err) self.emit('warning', err)
        self.emit('dhtAnnounce')

        if (!self._destroyed) {
            self._dhtTimeout = setTimeout(function () {
                self._dhtAnnounce()
            }, getRandomTimeout())
            if (self._dhtTimeout.unref) self._dhtTimeout.unref()
        }
    })

    // Returns timeout interval, with some random jitter
    function getRandomTimeout() {
        return self._intervalMs + Math.floor(Math.random() * self._intervalMs / 5)
    }
}


PeerDiscovery.prototype.destroy = function (cb) {
    if (this._destroyed) return
    this._destroyed = true
     
    clearTimeout(this._dhtTimeout)

    if (self.dht) {
        this.dht.removeListener('peer', this._onDHTPeer)
    }

    this.dht.removeListener('warning', this._onWarning)
    this.dht.removeListener('error', this._onError)
    this.dht.destroy(cb)

    // cleanup
    this.dht = null
}