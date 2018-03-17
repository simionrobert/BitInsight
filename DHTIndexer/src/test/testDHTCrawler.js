'use strict'

var DHTCrawler = require('../lib/DHTCrawler');
var config = require('../../config');

var crawler = new DHTCrawler(config.DEFAULT_CRAWLER_OPTIONS);
var count = 1;

crawler.on('infohash', function (listInfohash,rinfo) {
    for (let i = 0; i < listInfohash.length; i++) {
        console.log((count++) + ". magnet:?xt=urn:btih:%s from %s:%s", listInfohash[i].toString("hex"), rinfo.address, rinfo.port);
    }
});

crawler.start();