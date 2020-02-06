'use strict'

process.env.UV_THREADPOOL_SIZE = 64

const fs = require('fs');
const config = require('../config');
const ElasticSearch = require('./lib/Database/Elasticsearch');
const PeerDiscoveryService = require('./lib/Services/PeerDiscoveryService');

var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var peerDiscoveryService = new PeerDiscoveryService(config);

var lastInfohashIdIPs = parseInt(fs.readFileSync('resources/lastInfohashIdIPs.txt'), 10);

if (isNaN(lastInfohashIdIPs)) {
    lastInfohashIdIPs = 0;
}


function saveInfohashIDCallback() {
    //periodically save to keep log of where i remained and to continue from
    fs.writeFile('resources/lastInfohashIdIPs.txt', lastInfohashIdIPs, function() {
        console.log("File updated")
    });
}
peerDiscoveryService.on('ip', function(torrent) {
    lastInfohashIdIPs++;

    console.log('\n' + lastInfohashIdIPs + ". Infohash: " + torrent.infohash.toString('hex'));
    console.log('List ip sent to batch ' + torrent.listIP.length);



    setImmediate((torrent) => {
        indexer.indexIP(torrent, saveInfohashIDCallback)
    }, torrent);
});

peerDiscoveryService.on('cacheEmpty', function() {
    indexer.getLastInfohashes(lastInfohashIdIPs, lastInfohashIdIPs + 9, function(listInfohashes) {
        if (listInfohashes.length != 0) {
            peerDiscoveryService.addToCache(listInfohashes);
            peerDiscoveryService.startService()
        }
    })
})

indexer.ready(function() {
    peerDiscoveryService.startService()
})