'use strict'

var client = require('./dbConnection');
var EventEmitter = require('events');
var Manager = require('./Manager');


class ESIndexer extends EventEmitter {

    constructor(opts) {
        super();
        if (!(this instanceof ESIndexer))
            return new DBIndexer(opts)

        this._manager = new Manager();    
        this._manager.on('dataReady', function (infohash,name, files, listIP) {
            this._indexTorrent(infohash, name, files, listIP);
        }.bind(this));
    }

    index(infohash) {
        this._manager.getInfo(infohash);
    }

    createOnceIndex() {
        client.indices.create({
            index: 'torrent'
        }, function (err, resp, status) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("create", resp);
            }
        });
    }

    _indexTorrent(infohash, name, files, listIP) {
        var jsonObject = {
            index: 'torrent',
            type: 'torrentType',
            id: '1',
            body: {
                Infohash: infohash,
                Name: name,
                Files: [],
                IPs: []
            }
        };

        for (let i = 0; i < files.length; i++) {
            jsonObject.body.Files.push({
                file: files[i].name,
                size: files[i].size
            });
        }

        for (let i = 0; i < listIP.length; i++) {
            jsonObject.body.IPs.push({
                IP: listIP[i].host,
                port: listIP[i].port
            });
        }


        client.index(jsonObject, function (err, resp, status) {
            console.log(resp);
        });
    }
}

var indexer = new ESIndexer();
indexer.index('726b4809351adf6fedc6ad779762829bf5512ae1')


module.exports = ESIndexer