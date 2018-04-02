'use strict'

const config = require('../config');
const ElasticSearch = require('./lib/Elasticsearch');
const BTClient = require('./lib/BTClient');

const batchSize = 10;

var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var btClient = new BTClient(config,1,1);


btClient.on('metadata', function (torrent) {
    var lastInfohashID = btClient.getID()
    console.log('\n' + lastInfohashID +". Infohash: "+ torrent.infohash.toString('hex'));
    console.log('Torrent sent to batch: ' + torrent.name);

    indexer.indexTorrent(torrent)
});

btClient.on('ip', function (torrent) {
    var lastInfohashID = btClient.getID()
    console.log('\n' + lastInfohashID + ". Infohash: " + torrent.infohash.toString('hex'));
    console.log('List ip sent to batch ' + torrent.listIP.length);


    indexer.indexIP(torrent)
});


btClient.on('cacheEmpty', function () {

    var lastInfohashID = btClient.getID()

    indexer.getLastInfohashes(lastInfohashID+1, lastInfohashID + batchSize, function infohashRetrieved(listInfohashes) {
        btClient.addToCache(listInfohashes);

        // Reload service
        if (listInfohashes.length != 0) {
            btClient.startService()
        }
    })

})

btClient.startService()

