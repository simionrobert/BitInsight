'use strict'

var elasticsearch = require('elasticsearch');

class ElasticSearch {

    constructor(opts) {
        if (!(this instanceof ElasticSearch))
            return new ElasticSearch(opts)

        this.client = new elasticsearch.Client(opts.connection);
        this.batchSize = opts.batchSize;
        this.recordQueue = [];
    }

    indexTorrent(torrent) {
        var jsonObject = {
                Infohash: torrent.infohash.toString('hex'),
                Name: torrent.name,
                Search: torrent.name.replace(/\./g, ' ').replace(/\./g, ' '),
                Files: [],
                IPs: []
        };

        for (let i = 0; i < torrent.files.length; i++) {
            jsonObject.Files.push({
                file: torrent.files[i].name,
                size: torrent.files[i].size
            });
        }

        for (let i = 0; i < torrent.listIP.length; i++) {
            jsonObject.IPs.push({
                IP: torrent.listIP[i].host,
                port: torrent.listIP[i].port
            });
        }

        this._queue(jsonObject);
    }

    _queue(jsonObject) {
        this.recordQueue.push(jsonObject);

        if (this.recordQueue.length < this.batchSize) {
            return;
        }


        var body = [];
        var index = {
            index: {
                _index: 'torrent',
                _type: 'torrentType'
            }
        }
        for (let i = 0; i < this.recordQueue.length; i++) {
            body.push(index);
            body.push(this.recordQueue[i]);
        }

        this.client.bulk({
            body: body
        }, function (err, resp) {
            //console.log(resp);
        });

        this.recordQueue = [];
    }

    createIndex(name) {
        this.client.indices.create({
            index: name,
            body: {
                "mappings": {
                    "torrentType": {
                        "properties": {
                            "Infohash": { "type": "string"},
                            "Name": { "type": "string"},
                            "Search": { "type": "string"},
                            "Files": {
                                "Name": { "type": "string" },
                                "Size": { "type": "long" },
                            },
                            "IP": { "type": "ip" },
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