'use strict'

process.env.UV_THREADPOOL_SIZE = 64

const fs = require('fs');
const config = require('../config');
const ElasticSearch = require('./lib/Database/Elasticsearch');
const MetadataService = require('./lib/Metadata/MetadataService');

var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var metadataService = new MetadataService(config);

var lastInfohashIdMetadata = parseInt(fs.readFileSync('resource/lastInfohashIdMetadata.txt'), 10);
if (isNaN(lastInfohashIdMetadata)) {
    lastInfohashIdMetadata = 0;
}


function saveMetaIDCallback() {
    //periodically save to keep log of where i remained and to continue from
    fs.writeFile('resource/lastInfohashIdMetadata.txt', lastInfohashIdMetadata, function(){
        console.log('File updated')
    });
}

metadataService.on('metadata', function (torrent) {
    lastInfohashIdMetadata++;

    console.log('\n' + lastInfohashIdMetadata + ". Infohash: " + torrent.infohash.toString('hex'))
    console.log('Torrent sent to batch: ' + torrent.name);

    setImmediate((metadata) => {
        indexer.indexTorrent(metadata, saveMetaIDCallback)
    }, torrent);

    console.log('/////////////////////////////////////////////////////');
});

metadataService.on('metadataTimeout', function (infohash) {
    lastInfohashIdMetadata++;

    console.log('\n' + lastInfohashIdMetadata + ". Infohash: " + infohash.toString('hex'));
    console.log('No metadata available');
    console.log('/////////////////////////////////////////////////////');
})

metadataService.on('cacheEmpty', function () {

    console.log('Cache Empty');

    indexer.getLastInfohashes(lastInfohashIdMetadata + 1, lastInfohashIdMetadata + 10, function (listInfohashes) {
        if (listInfohashes.length != 0) {
            metadataService.addToCache(listInfohashes);
            metadataService.startService()
        }
    })
})


metadataService.startService()

