'use strict'

const config = require('../config');
const ElasticSearch = require('./lib/Database/Elasticsearch');
const DHTCrawler = require('./lib/Crawling/DHTCrawler');
const MetadataService = require('./lib/Services/MetadataResolverService');
const PeerDiscoveryService = require('./lib/Services/PeerDiscoveryService');
const utils = require('./lib/utils');

config.DEFAULT_ELASTIC_SEARCH_OPTIONS.batchSizeDHT = 1;
config.DEFAULT_ELASTIC_SEARCH_OPTIONS.batchSizeTorrent = 1;

var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var metadataService = new MetadataService(config);
var peerDiscoveryService = new PeerDiscoveryService(config);


metadataService.on('metadata', function (torrent) {
    console.log("Infohash: " + torrent.infohash.toString('hex'))
    console.log('Torrent sent to batch: ' + torrent.name);

    setImmediate((metadata) => {

        //Second, index torrent
        indexer.indexTorrent(metadata, null)
    }, torrent);

    console.log('/////////////////////////////////////////////////////');
});

metadataService.on('metadataTimeout', function (infohash) {
    console.log("Infohash: " + infohash.toString('hex'));
    console.log('No metadata available');
    console.log('/////////////////////////////////////////////////////');
})

metadataService.on('cacheEmpty', function () {
    console.log("Metadata indexing Done")
})


peerDiscoveryService.on('ip', function (torrent) {
    console.log("Infohash: " + torrent.infohash.toString('hex'));
    console.log('List ip sent to batch ' + torrent.listIP.length);

    setImmediate((torrent) => {

        //Third, index IPs
        indexer.indexIP(torrent, null)
    }, torrent);
});

peerDiscoveryService.on('cacheEmpty', function () {
    console.log("IP indexing Done")
})


indexer.ready(function () {
    var listInfohashes = ["f3077eaaa6cb8f420f97a4553905b3cac444d998", "a45776cef4455136f4782e331a87fee5cfbff599"];

    // First index infohash
    listInfohashes.forEach(function (element, index, array) {
         indexer.indexInfohash(Buffer.from(element, "hex"));
    });


    // Metadata Service uses PeerDiscovery Services, which uses port 6801. DO NOT call peerDiscoveryService and metadataService at the same time
    var x = 1
    if (x == 0) {
        peerDiscoveryService.addToCache(listInfohashes);
        peerDiscoveryService.startService()
    } else {
        metadataService.addToCache(listInfohashes);
        metadataService.startService()
    }
});




