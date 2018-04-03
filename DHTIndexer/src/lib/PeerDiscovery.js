'use strict';

var DHT = require('bittorrent-dht/client') // empty object in browser
var EventEmitter = require('events')

class PeerDiscovery extends EventEmitter {

    constructor(opts) {
        super();
        if (!(this instanceof PeerDiscovery))
            return new PeerDiscovery(opts)

        this._port = opts.port ? opts.port : 20000; // torrent port
        this.timeout = opts.timeout || 3000;
        this.secRemaining = 0;
        this.currentInfohash = 0;
        this.semaphore = 0;

        this.dht = new DHT(opts)

        this._onDHTPeer = function (peer, infohash, from) {
            if (this.currentInfohash.equals(infohash)) {

                clearTimeout(this.secRemaining);

                this.emit('peer', peer, infohash, from);

                this._setInfohashTimeout(infohash, this.timeout)
            }
        }

        this.dht.on('peer', this._onDHTPeer.bind(this))
        this.dht.listen(this._port)
    }

    lookup(infohash) {
        this.currentInfohash = Buffer.from(infohash, 'hex');
        this._setInfohashTimeout(infohash,this.timeout)

        this.dht.lookup(infohash);
    }

    _setInfohashTimeout(infohash, timeout) {
        this.secRemaining = setTimeout(function () {
            if (this.semaphore == 0) {
                this.semaphore = 1;

                this.dht.removeListener('peer', this._onDHTPeer)

                this.emit('timeout', infohash);
            }
        }.bind(this), timeout)
    }

    destroy(cb) {
        clearTimeout(this.secRemaining);

        if (this.semaphore == 0) {
            this.dht.removeListener('peer', this._onDHTPeer)
        }

        this.dht.destroy(cb)
    }
}

module.exports = PeerDiscovery


