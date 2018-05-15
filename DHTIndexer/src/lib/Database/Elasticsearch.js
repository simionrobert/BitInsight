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

        // for dht indexing
        this._getLastID() //is async but it is executed first
    }

    indexTorrent(torrent) {
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
        this._queue();
    }

    updateSizeTorrent(torrent) {
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
        this._queue();
    }
   
    indexIP(torrent) {
        var index = {
            index: {
                _index: 'ip',
                _type: 'doc',
                _id: torrent.infohash.toString('hex'),
                pipeline: 'geoip'
            }
        }

        var jsonObject = {
                IPs: [],
                Date: Date.now()
        };

        for (let i = 0; i < torrent.listIP.length; i++) {
            jsonObject.IPs.push(
                {
                    IP: torrent.listIP[i].host,
                    Port: torrent.listIP[i].port
                })
        }

        this.recordIPQueue.push(index);
        this.recordIPQueue.push(jsonObject);
        this._queue();
    }

    indexInfohash(infohash) {
        var index = {
            index: {
                _index: 'torrent',
                _type: 'doc',
                _id: infohash.toString('hex')
            }
        }
        var jsonObject = {
            ID: (this._id++),
            Peers:0
        };

        this.recordInfohashQueue.push(index);
        this.recordInfohashQueue.push(jsonObject);
        this._queue();
    }
     
    _queue() {
        if (this.recordInfohashQueue.length / 2 >= this.batchSizeDHT) {
            this.client.bulk({
                body: this.recordInfohashQueue
            }, function (err, resp) {
                //console.log(resp);
            });

            this.recordInfohashQueue = [];
            return;
        }

        if (this.recordIPQueue.length / 2 >= this.batchSizeTorrent) {
            this.client.bulk({
                body: this.recordIPQueue
            }, function (err, resp) {
                //console.log(resp);
            });
            this.recordIPQueue = [];

            console.log('Elasticsearch Class: IP Indexed')
            return;
        }

        if (this.recordTorrentQueue.length / 2 >= this.batchSizeTorrent) {
            this.client.bulk({
                body: this.recordTorrentQueue
            }, function (err, resp) {
                //console.log(resp);
            });

            this.recordTorrentQueue = [];
            console.log('Elasticsearch Class: Metadata Indexed')
        }
    }

    getLastInfohashes(min,max,callback) {
        this.client.search({
            index: "torrent",
            body: {
                _source: false,
                sort: [{ "ID": { "order": "asc" } }],
                size: max-min+1,
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

     _getLastID() {
        this.client.search({
            index: 'torrent',
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
            }.bind(this))
    }

    createTorrentIndex() {
        this.client.indices.create({
            index: 'torrent',
            body: {
                "mappings": {
                    "doc": {
                        "properties": {
                            "ID": { "type": "long" },
                            "Name": {
                                "type": "text",
                                "fields": {
                                    "keyword": {
                                        "type": "keyword"
                                    }
                                }
                            },
                            "Search": { "type": "text" },
                            "Type": {
                                "type": "text",
                                "fields": {
                                    "keyword": {
                                        "type": "keyword"
                                    }
                                }
                            },
                            "Categories": {
                                "type": "text",
                                "fields": {
                                    "keyword": {
                                        "type": "keyword"
                                    }
                                }
                            },
                            "Files": {
                                "properties": {
                                    "Name": { "type": "text" },
                                    "Size": { "type": "long" }
                                }
                            },
                            "Peers": { "type": "integer" },
                            "Size": { "type": "long" },
                            "Date": {"type": "date"}
                        }
                    }
                }
            }
        }, function (err, resp, status) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("create", resp);
            }
        });
    }

    createIPIndex() {
        this.client.indices.create({
            index: "ip",
            body: {
                "mappings": {
                    "doc": {
                        "properties": {
                            "IPs": {
                                "type": "nested",
                                "properties": {
                                    "IP": { "type": "ip" },
                                    "Port": { "type": "integer" },
                                    "geoip": {
                                        "type": "nested",
                                        "properties": {
                                            "continent_name": { "type": "text" },
                                            "city_name": { "type": "text" },
                                            "country_iso_code": { "type": "text" },
                                            "region_name": { "type": "text" },
                                            "location": { "type": "geo_point" }
                                        }
                                    }
                                }
                            },
                            "Date": { "type": "date"}
                        }
                    }
                }
            }
        }, function (err, resp, status) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("create", resp);
            }
        });
    }

    createRelationIndex() {
        this.client.indices.create({
            index: "ip",
            body: {
                "mappings": {
                    "doc": {
                        "properties": {
                            "IPs": {
                                "type": "nested",
                                "properties": {
                                    "IP": { "type": "ip" },
                                    "Port": { "type": "integer" },
                                    "geoip": {
                                        "type": "nested",
                                        "properties": {
                                            "continent_name": { "type": "text" },
                                            "city_name": { "type": "text" },
                                            "country_iso_code": { "type": "text" },
                                            "region_name": { "type": "text" },
                                            "location": { "type": "geo_point" }
                                        }
                                    }
                                }
                            },
                            "Date": { "type": "date" }
                        }
                    }
                }
            }
        }, function (err, resp, status) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("create", resp);
            }
        });
    }
}


module.exports = ElasticSearch