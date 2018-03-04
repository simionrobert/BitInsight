module.exports = PeerDiscovery

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
    self.destroyed = false
    self._dhtAnnouncing = false
    self._dhtTimeout = false

    if (opts.dht) {
        self.dht = dht;
    }
    else {
        self.dht = new DHT(opts)
        self.dht.on('warning', self._onWarning)
        self.dht.on('error', self._onError)
        self.dht.listen(port)
    }

    self._onWarning = function (err) {
        self.emit('warning', err)
    }
    self._onError = function (err) {
        self.emit('error', err)
    }
    self._onDHTPeer = function (peer, infoHash, from) {
        self.emit('peer',peer, infoHash, from)
    }

    if (self.dht) {
        self.dht.on('peer', self._onDHTPeer)
    }
}

function createDHT(port, opts) {

    return dht
}

PeerDiscovery.prototype.lookup = function (infohash) {
    this.infohash = infohash;
    this.dht.lookup(infohash);
    this._dhtAnnounce();
}

PeerDiscovery.prototype._dhtAnnounce = function () {
    var self = this
    if (self._dhtAnnouncing)
        return
    console.log('announcing')
    self._dhtAnnouncing = true
    clearTimeout(self._dhtTimeout)

    self.dht.announce(self.infohash, self._port, function (err) {
        self._dhtAnnouncing = false

        if (err) self.emit('warning', err)
        self.emit('dhtAnnounce')

        if (!self.destroyed) {
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
    var self = this
    if (self.destroyed) return
    self.destroyed = true
     
    clearTimeout(self._dhtTimeout)

    if (self.dht) {
        self.dht.removeListener('peer', self._onDHTPeer)
    }

    self.dht.removeListener('warning', self._onWarning)
    self.dht.removeListener('error', self._onError)
    self.dht.destroy(cb)

    // cleanup
    self.dht = null
}