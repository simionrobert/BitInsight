'use strict'

process.env.UV_THREADPOOL_SIZE = 64

const config = require('../config');
const ElasticSearch = require('./lib/Elasticsearch');
const BTClient = require('./lib/BTClient');

const batchSize = 10;

var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var btClient = new BTClient(config);


btClient.on('torrent', function (torrent) {

    console.log('\n' + btClient.getID() + ". Infohash: " + torrent.ip.infohash.toString('hex'));

    if (torrent.metadata != null) {
        console.log('Torrent sent to batch: ' + torrent.metadata.name);

        setImmediate((metadata) => {
            indexer.indexTorrent(metadata)
        }, torrent.metadata);
    }
    else
        console.log('No metadata available');

    console.log('List ip sent to batch ' + torrent.ip.listIP.length);


    console.log("\n///////////////////////////////////////////"); //to be deleted


    setImmediate((ips) => {
        indexer.indexIP(ips)
    }, torrent.ip);
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

