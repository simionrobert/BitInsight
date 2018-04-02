'use strict'

process.env.UV_THREADPOOL_SIZE = 64

const config = require('../config');
const ElasticSearch = require('./lib/Elasticsearch');
const BTClient = require('./lib/BTClient');

const batchSize = 10;

var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var btClient = new BTClient(config,1,1);


btClient.on('metadata', function (torrent) {

    console.log('\n' + btClient.getID() + ". Infohash: " + torrent.infohash.toString('hex'));
    console.log('Torrent sent to batch: ' + torrent.name);

    setImmediate((torrent) => {
        indexer.indexTorrent(torrent)
    }, torrent);
});

btClient.on('ip', function (torrent) {

    console.log('\n' + btClient.getID() + ". Infohash: " + torrent.infohash.toString('hex'));
    console.log('List ip sent to batch ' + torrent.listIP.length);

    setImmediate((torrent) => {
        indexer.indexIP(torrent)
    }, torrent);
});


btClient.on('cacheEmpty', function () {
    var lastInfohashID = btClient.getID()

    indexer.getLastInfohashes(lastInfohashID + 1, lastInfohashID + batchSize, function (listInfohashes) {

        btClient.addToCache(listInfohashes);
        if (listInfohashes.length != 0) {
            btClient.startService()
        }
    })

})

btClient.startService()

