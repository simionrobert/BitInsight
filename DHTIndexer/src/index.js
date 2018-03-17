'use strict'

var config = require('../config');
var ElasticSearch = require('../lib/ElasticSearch');
var DHTCrawler = require('./DHTCrawler');
var BTClient = require('./BTClient');


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


crawler.start();