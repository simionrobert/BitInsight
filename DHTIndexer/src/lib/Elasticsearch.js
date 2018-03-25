'use strict'

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

        this.getLastID()
    }

    indexTorrent(torrent) {
        var index = {
            index: {
                _index: 'torrent',
                _type: 'doc',
                _id: torrent.infohash.toString('hex')
            }
        }

        var jsonObject = {
                Name: torrent.name,
                Search: torrent.name.replace(/\./g, ' ').replace(/\./g, ' '),
                Files: []
        };

        for (let i = 0; i < torrent.files.length; i++) {
            jsonObject.Files.push({
                file: torrent.files[i].name,
                size: torrent.files[i].size
            });
        }

        this.recordTorrentQueue.push(index);
        this.recordTorrentQueue.push(jsonObject);
        this._queue();
    }

    indexIP(torrent) {
        var update = {
            update: {
                _index: 'ip',
                _type: 'doc',
                _id: torrent.infohash.toString('hex')
            }
        }

        var jsonObject = {
            doc: {
                IPs: []
            }
        };
        for (let i = 0; i < torrent.listIP.length; i++) {
            jsonObject.doc.IPs.push(torrent.listIP[i].host);
        }

        this.recordIPQueue.push(update);
        this.recordIPQueue.push(jsonObject);
        this._queue();
    }

    indexInfohash(infohash) {

        //This execute in separate process => record queue is always of infohashes
        var index = {
            index: {
                _index: 'ip',
                _type: 'doc',
                _id: infohash.toString('hex')
            }
        }

        var jsonObject = {
            ID: (this._id++),
            IPs: []
        };


        this.recordInfohashQueue.push(update);
        this.recordInfohashQueue(jsonObject);
        this._queue();
    }

    _queue() {
        if (this.recordInfohashQueue.length / 2 >= this.batchSizeDHT) {

            this.client.bulk({
                body: this.recordInfohashQueue
            }, function (err, resp) {
                console.log(resp);
            });

            this.recordInfohashQueue = [];
            return;
        }

        if (this.recordIPQueue.length / 2 >= this.batchSizeTorrent) {

            this.client.bulk({
                body: this.recordIPQueue
            }, function (err, resp) {
                console.log(resp);
            });

            this.client.bulk({
                body: this.recordTorrentQueue
            }, function (err, resp) {
                console.log(resp);
            });

            this.recordTorrentQueue = [];
            this.recordIPQueue = [];
        }
    }


    decodeGetLastInfohashes(response) {
        var listObjects = response.hits.hits;
        var listInfohashes = []

        for (let i = 0; i < listObjects.length; i++) {
            listInfohashes.push(listObjects[i]._id)
        }

        return listInfohashes;
    }

    getLastInfohashes(min,max,callback) {
        this.client.search({
            index: "ip",
            body: {
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
                callback(this.decodeGetLastInfohashes(response));
            }
        }.bind(this));
    }

    getLastID() {
        this.client.count({
            index: 'ip'
        }, function (error, response) {
                if (error != undefined) {
                    console.log("unexpected error from elasticsearch");
                    process.exit(0);
                }

            this._id = response.count+1;
        }.bind(this));
    }

    createTorrentIndex() {
        this.client.indices.create({
            index: 'torrent',
            body: {
                "mappings": {
                    "doc": {
                        "properties": {
                            "Name": { "type": "text"},
                            "Search": { "type": "text"},
                            "Files": {
                                "properties": {
                                    "Name": { "type": "text" },
                                    "Size": { "type": "long" }
                                }
                            }
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
                            "ID": { "type": "long" },
                            "IP": { "type": "ip" }
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