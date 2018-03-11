'use strict'

var DHTIndexer = require('../lib/DHTIndexer');

var DEFAULT_CRAWLER_OPTS = {
    address: '0.0.0.0',
    port: 6881,
    tableMaxSize: 128,
    dhtAnnouncing: 1000,
    BEP51Mode: true,
    verticalAttackMode: false,
    verticalAttackNrNodes: 8
};

var indexer = new DHTIndexer(DEFAULT_CRAWLER_OPTS);
indexer.start();