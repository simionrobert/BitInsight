'use strict'

process.env.UV_THREADPOOL_SIZE = 64

const fs = require('fs');
const config = require('../config');
const ElasticSearch = require('./lib/Database/Elasticsearch');
const MetadataService = require('./lib/Metadata/MetadataService');
const PeerDiscoveryService = require('./lib/Metadata/PeerDiscoveryService');
const batchSize = 10;

var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var metadataService = new MetadataService(config);
var peerDiscoveryService = new PeerDiscoveryService(config);

var lastInfohashIdMetadata = parseInt(fs.readFileSync('resource/lastInfohashIdMetadata.txt'), 10);
var lastInfohashIdIPs = parseInt(fs.readFileSync('resource/lastInfohashIdIPs.txt'), 10);



peerDiscoveryService.on('ip', function (torrent) {
    lastInfohashIdIPs++;

    console.log('\n' + lastInfohashIdIPs + ". Infohash: " + torrent.infohash.toString('hex'));
    console.log('List ip sent to batch ' + torrent.listIP.length);

    setImmediate((torrent) => {
        indexer.indexIP(torrent)
    }, torrent);
});

peerDiscoveryService.on('cacheEmpty', function () {

    //periodically save to keep log of where i remained and to continue from
    fs.writeFile('resource/lastInfohashIdIPs.txt', lastInfohashIdIPs);

    indexer.getLastInfohashes(lastInfohashIdIPs + 1, lastInfohashIdIPs + batchSize, function (listInfohashes) {
        if (listInfohashes.length != 0) {
            peerDiscoveryService.addToCache(listInfohashes);
            peerDiscoveryService.startService()
        }
    })
})



metadataService.on('metadata', function (torrent) {
    lastInfohashIdMetadata++;

    console.log('\n' + lastInfohashIdMetadata + ". Infohash: " + torrent.infohash.toString('hex'));
    console.log('Torrent sent to batch: ' + torrent.name);

     setImmediate((metadata) => {
            indexer.indexTorrent(metadata)
      }, torrent);
});

metadataService.on('metadataTimeout', function (infohash) {
    lastInfohashIdMetadata++;

    console.log('\n' + lastInfohashIdMetadata + ". Infohash: " + infohash.toString('hex'));
    console.log('No metadata available');
})

metadataService.on('cacheEmpty', function () {

    //periodically save to keep log of where i remained and to continue from
    fs.writeFile('resource/lastInfohashIdMetadata.txt', lastInfohashIdMetadata);

    indexer.getLastInfohashes(lastInfohashIdMetadata + 1, lastInfohashIdMetadata + batchSize, function (listInfohashes) {
        if (listInfohashes.length != 0) {
            metadataService.addToCache(listInfohashes);
            metadataService.startService()
        }
    })
})


metadataService.startService()
//peerDiscoveryService.startService()
