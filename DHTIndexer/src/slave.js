'use strict'

const config = require('../config');
const ElasticSearch = require('./lib/Elasticsearch');
const BTClient = require('./lib/BTClient');

const batchSize = 20;

var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var btClient = new BTClient(config,1,1);


btClient.on('ip', function (torrent) {
    console.log('\nList ip sent to batch');
    console.log('Infohash ' + torrent.infohash.toString('hex'));
    indexer.indexIP(torrent)
});

btClient.on('metadata', function (torrent) {
    console.log('\nTorrent sent to batch: ' + torrent.name);
    console.log('Infohash ' + torrent.infohash.toString('hex'));

    indexer.indexTorrent(torrent)
});

btClient.on('cacheEmpty', function () {

    var lastInfohashID = btClient.getID()

    indexer.getLastInfohashes(lastInfohashID, lastInfohashID + batchSize - 1, function infohashRetrieved(listInfohashes) {
        btClient.addToCache(listInfohashes);

        // Reload service
        btClient.startService()
    })

})

btClient.startService()

