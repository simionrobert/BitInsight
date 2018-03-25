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
        this.timeout = opts.timeout || 3000;
        this._destroyed = false
        this._timeoutArrayDiscovery = {};


        this.dht = new DHT(opts)

        this._onDHTPeer = function (peer, infohash, from) {
            clearTimeout(this._timeoutArrayDiscovery[infohash.toString('hex')]);

            this.emit('peer', peer, infohash, from);

            this.setInfohashTimeout(infohash, this.timeout)
        }

        this._onWarning = function (err) {
            this.emit("warning", err);
        }.bind(this);
        this._onError = function (err) {
            this.emit("error", err);
        }.bind(this);

        this.dht.on('peer', this._onDHTPeer.bind(this))
        this.dht.on('warning', this._onWarning.bind(this))
        this.dht.on('error', this._onError.bind(this))

        this.dht.listen(this._port)
    }

    lookup(infohash) {
        this._timeoutArrayDiscovery[infohash] = 0;

        this.dht.lookup(infohash);
        this.setInfohashTimeout(infohash, 10*1000 + this.timeout)
    }

    setInfohashTimeout(infohash, timeout) {
        this._timeoutArrayDiscovery[infohash.toString('hex')] = setTimeout(function (infohash) {
            return function () {

                delete this._timeoutArrayDiscovery[infohash.toString('hex')];
                this.emit('done', infohash);
            }
        }(infohash).bind(this), timeout)
    }

    destroy(cb) {
        if (this._destroyed)
            return

        this._destroyed = true

        for (var property in this._timeoutArrayDiscovery) {
            if (this._timeoutArrayDiscovery.hasOwnProperty(property)) {
                clearTimeout(this._timeoutArrayDiscovery[property]);
            }
        }

        delete this._timeoutArrayDiscovery 

        this.dht.removeListener('peer', this._onDHTPeer)
        this.dht.removeListener('warning', this._onWarning)
        this.dht.removeListener('error', this._onError)
        this.dht.destroy(cb)

        // cleanup
        this.dht = null
    }
}

module.exports = PeerDiscovery