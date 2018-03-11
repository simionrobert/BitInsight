'use strict'

var DHTIndexer = require('../lib/DHTIndexer');

var DEFAULT_CRAWLER_OPTS = {
    address: '0.0.0.0',
    port: 6881,
    tableMaxSize: 128,
    dhtAnnouncing: 1000,
    BEP51Mode: true,
    verticalAttackMode: true,
    verticalAttackNrNodes: 8
};

var indexer = new DHTIndexer(DEFAULT_CRAWLER_OPTS);
indexer.addListener('sampleInfohashResponse', function (listInfohash,rinfo) {
    for (let i = 0; i < listInfohash.length; i ++) {
        console.log("magnet:?xt=urn:btih:%s from %s:%s", listInfohash[i].toString("hex"), rinfo.address, rinfo.port);
    }
});

indexer.addListener('infohash', function (infohash,rinfo) {
    console.log("magnet:?xt=urn:btih:%s from %s:%s", infohash.toString("hex"), rinfo.address, rinfo.port);
});

indexer.start();