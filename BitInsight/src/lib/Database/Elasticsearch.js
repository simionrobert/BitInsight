'use strict'

const _ = require('lodash');
var elasticsearch = require('elasticsearch');

class ElasticSearch {

    constructor(opts) {
        if (!(this instanceof ElasticSearch))
            return new ElasticSearch(opts)

        this.client = new elasticsearch.Client(opts.connection);
        this.batchSizeDHT = opts.batchSizeDHT;
        this.batchSizeTorrent = opts.batchSizeTorrent
        this.recordInfohashQueue = [];
        this.recordTorrentQueue = [];
        this.recordIPQueue = [];
        this.recordRelationQueue = [];
    }

    ready(callback) {

        // do something async and call the callback:
        this._getLastID(callback)
    }

    indexTorrent(torrent, callback) {
        var update = {
            update: {
                _index: 'torrent',
                _type: 'doc',
                _id: torrent.infohash.toString('hex')
            }
        }

        var jsonObject = {
            doc: {
                Name: torrent.name,
                Search: torrent.name.replace(/\./g, ' ').replace(/_/g, ' '),
                Type: torrent.type,
                Categories: torrent.categories,
                Files: [],
                Size: 0,
                Date: Date.now()
            }
        };

        var size = 0;
        for (let i = 0; i < torrent.files.length; i++) {
            jsonObject.doc.Files.push({
                Name: torrent.files[i].name,
                Size: torrent.files[i].size
            });

            size += torrent.files[i].size;
        }

        // Attribuite size to object
        jsonObject.doc.Size = size;

        this.recordTorrentQueue.push(update);
        this.recordTorrentQueue.push(jsonObject);
        this._queue(callback);
    }

    indexInfohash(infohash, callback) {
        var index = {
            index: {
                _index: 'torrent',
                _type: 'doc',
                _id: infohash.toString('hex')
            }
        }
        var jsonObject = {
            ID: (this._id++),
            Peers: 0
        };

        this.recordInfohashQueue.push(index);
        this.recordInfohashQueue.push(jsonObject);
        this._queue(callback);
    }

    indexIP(torrent, callback) {
        if (torrent.listIP.length != 0) {

            //update torrent Peers value
            this._updateSizeTorrent(torrent)

            // Index relation first
            this._indexRelation(torrent);

            //Index every ip
            for (let i = 0; i < torrent.listIP.length; i++) {
                this.recordIPQueue.push({
                    index: {
                        _index: 'ip',
                        _type: 'doc',
                        _id: torrent.listIP[i].host, //+torrent.listIP[i].port TODO: Discuss IP:port
                        pipeline: 'geoip'
                    }
                });
                this.recordIPQueue.push({
                    IP: torrent.listIP[i].host,
                    Port: torrent.listIP[i].port,
                    Date: Date.now()
                });
            }

            //Verify if it needs to be inserted
            this._queue(callback);
        }
    }

    _indexRelation(torrent) {
        var index = {
            index: {
                _index: 'relation',
                _type: 'doc',
                _id: torrent.infohash.toString('hex')
            }
        }

        var jsonObject = {
            IPs: []
        };

        for (let i = 0; i < torrent.listIP.length; i++) {
            jsonObject.IPs.push(torrent.listIP[i].host) //+torrent.listIP[i].port TODO: Discuss IP:port
        }

        this.recordRelationQueue.push(index);
        this.recordRelationQueue.push(jsonObject);
    }

    _updateSizeTorrent(torrent) {
        var update = {
            update: {
                _index: 'torrent',
                _type: 'doc',
                _id: torrent.infohash.toString('hex')
            }
        }

        var jsonObject = {
            doc: {
                Peers: torrent.listIP.length,
                Date: Date.now()
            }
        };

        this.recordTorrentQueue.push(update);
        this.recordTorrentQueue.push(jsonObject);
    }

    _queue(callback) {
        if (this.recordInfohashQueue.length / 2 >= this.batchSizeDHT) {
            this.client.bulk({
                body: this.recordInfohashQueue
            }, function (err, resp) {
            });
            this.recordInfohashQueue = [];

            console.log('Elasticsearch Class: Infohash Indexed')
            return;
        }

        if (this.recordRelationQueue.length / 2 >= this.batchSizeTorrent) {
            this.client.bulk({
                body: this.recordRelationQueue
            }, function (err, resp) {
            });
            this.recordRelationQueue = [];

            this.client.bulk({
                body: this.recordIPQueue
            }, function (err, resp) {
            });
            this.recordIPQueue = [];
            console.log('Elasticsearch Class: IP and Relation Indexed')

            this.client.bulk({
                body: this.recordTorrentQueue
            }, function (err, resp) {
            });

            this.recordTorrentQueue = [];
            console.log('Elasticsearch Class: Peers updated')

            if (callback != null)
                callback();
            return;
        }

        if (this.recordTorrentQueue.length / 2 >= this.batchSizeTorrent) {
            this.client.bulk({
                body: this.recordTorrentQueue
            }, function (err, resp) {
            });

            this.recordTorrentQueue = [];
            console.log('Elasticsearch Class: Metadata Indexed')
            if (callback != null)
                callback();
        }
    }

    getLastInfohashes(min, max, callback) {
        this.client.search({
            index: "torrent",
            body: {
                _source: false,
                sort: [{ "ID": { "order": "asc" } }],
                size: max - min + 1,
                query: {
                    range: {
                        "ID": {
                            gte: min,
                            lte: max
                        }
                    }
                }
            }
        }, function (error, response) {
            if (error) {
                console.log("error GetLastInfohashes");
            } else {
                callback(this._decodeGetLastInfohashes(response));
            }
        }.bind(this));
    }

    _decodeGetLastInfohashes(response) {
        var listObjects = response.hits.hits;
        var listInfohashes = []

        for (let i = 0; i < listObjects.length; i++) {
            listInfohashes.push(listObjects[i]._id)
        }

        return listInfohashes;
    }

    _getLastID(callback) {
        this.client.search({
            index: 'torrent',
            _source: false,
            size: 0,
            body: {
                "aggs": {
                    "max_id": {
                        "max": {
                            "field": "ID"
                        }
                    }
                }
            }
        }, function (error, response) {
            if (error != undefined) {
                console.log("unexpected error from elasticsearch");
                process.exit(0);
            }

            this._id = response.aggregations.max_id.value + 1;
            callback();
        }.bind(this))
    }
}


module.exports = ElasticSearch