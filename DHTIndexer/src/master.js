﻿'use strict'

const { spawn } = require('child_process');
const config = require('../config');
const ElasticSearch = require('./lib/Elasticsearch');
const DHTCrawler = require('./lib/DHTCrawler');


var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var crawler = new DHTCrawler(config.DEFAULT_CRAWLER_OPTIONS);

var count = 1;
crawler.on('infohash', function (listInfohash, rinfo) {
    for (let i = 0; i < listInfohash.length; i++) {
        console.log((count++) + ". magnet:?xt=urn:btih:%s from %s:%s", listInfohash[i].toString("hex"), rinfo.address, rinfo.port);
        indexer.indexInfohash(listInfohash[i]);
    }
});

function startSlaveProcess() {
    const subprocess = spawn('node', ['"' + __dirname + '/slave.js' + '"'], {
        shell: true,
        detached: true,
        stdio: 'ignore'
    });

    subprocess.unref();
}

setTimeout(function () {
    startSlaveProcess();
}, 10* 1000)

crawler.start();