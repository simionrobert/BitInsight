'use strict'

const config = require('../config');
const ElasticSearch = require('./lib/Elasticsearch');
const BTClient = require('./lib/BTClient');

const batchSize = 100;

var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var btClient = new BTClient(config);


btClient.on('torrentIP', function (torrent) {

    //aprox all the time for each infohash
    indexer.indexIP(torrent)
});

btClient.on('torrentMetadata', function (torrent) {

    //maybe not all the time for each infohash
    indexer.indexTorrent(torrent)
});

btClient.on('cacheEmpty', function () {

    indexer.getLastInfohashes(btClient.getID(), btClient.getID() + batchSize - 1, function infohashRetrieved(listInfohashes) {
        btClient.addToCache(listInfohashes);
    })

   // btClient.addToCache('5636cd5dadf6672ae29e538e5c82ed5e4a2bd562')
   // btClient.addToCache('726b4809351adf6fedc6ad779762829bf5512ae1')

})

btClient.startService()

