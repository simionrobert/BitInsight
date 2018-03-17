'use strict'

var config = require('../config');
var ElasticSearch = require('./lib/Elasticsearch');
var DHTCrawler = require('./lib/DHTCrawler');
var BTClient = require('./lib/BTClient');


var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var btClient = new BTClient(config);
var crawler = new DHTCrawler(config.DEFAULT_CRAWLER_OPTIONS);
var count = 1;


crawler.on('infohash', function (listInfohash, rinfo) {
    for (let i = 0; i < listInfohash.length; i++) {
        console.log((count++) + ". magnet:?xt=urn:btih:%s from %s:%s", listInfohash[i].toString("hex"), rinfo.address, rinfo.port);
        btClient.addToCache(listInfohash[i].toString("hex"))
    }
});

btClient.on('torrent', indexer.indexTorrent.bind(indexer));
btClient.addToCache('5636cd5dadf6672ae29e538e5c82ed5e4a2bd562')
btClient.addToCache('726b4809351adf6fedc6ad779762829bf5512ae1')
//crawler.start();