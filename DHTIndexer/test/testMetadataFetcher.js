'use strict';

var MetadataFetcher = require('../lib/MetadataFetcher');

var DEFAULT_METADATA_FETCHER_OPTIONS = {
    DEFAULT_PEER_DISCOVERY_OPTIONS: {
        port: 6881,
        intervalMs: 1000,
        dht: false
    }
}

var metadataFetcher = new MetadataFetcher(DEFAULT_METADATA_FETCHER_OPTIONS);

metadataFetcher.on('metadata', function (name, files, remoteAddress) {
    console.log('\nTorrent found: ' + name);
    console.log('From: ' + remoteAddress);
    console.log('Files: ' );

    for (let i = 0; i < files.length; i++) {
        console.log('\t'+files[i].name);
    }
});

metadataFetcher.on('peer', function (peer, infoHash, from) {
    console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port);
});

metadataFetcher.getMetadata('5636cd5dadf6672ae29e538e5c82ed5e4a2bd562');