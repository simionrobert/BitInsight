'use strict'

var elasticsearch = require('elasticsearch');

class ElasticSearch{

    constructor(opts) {
        if (!(this instanceof ElasticSearch))
            return new ElasticSearch(opts)

        this.client = new elasticsearch.Client(opts);
    }

    indexTorrent(torrent) {
        var jsonObject = {
            index: 'torrent',
            type: 'torrentType',
            body: {
                Infohash: torrent.infohash,
                Name: torrent.name,
                Files: [],
                IPs: []
            }
        };

        for (let i = 0; i < torrent.files.length; i++) {
            jsonObject.body.Files.push({
                file: torrent.files[i].name,
                size: torrent.files[i].size
            });
        }

        for (let i = 0; i < torrent.listIP.length; i++) {
            jsonObject.body.IPs.push({
                IP: torrent.listIP[i].host,
                port: torrent.listIP[i].port
            });
        }


        client.index(jsonObject, function (err, resp, status) {
            console.log(resp);
        });
    }


    createIndex(name) {
        client.indices.create({
            index: name
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