'use strict';

var MetadataFetcher = require('../lib/MetadataFetcher');
var PeerDiscovery = require('../lib/PeerDiscovery');

var DEFAULT_PEER_DISCOVERY_OPTIONS = {
        port: 6881,
        intervalMs: 15 * 60 * 1000,
        dht: false
}

var DEFAULT_METADATA_FETCHER_OPTIONS = {
    peerDiscovery: null
}

var peerDiscovery = new PeerDiscovery(DEFAULT_PEER_DISCOVERY_OPTIONS);

peerDiscovery.on('peer', function (peer, infoHash, from) {
    console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port);
});
peerDiscovery.on('discoveryEnded', function (peer, infoHash, from) {
    console.log('Discovery ended ');
}.bind(this));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var DEFAULT_METADATA_FETCHER_OPTIONS = {
    peerDiscovery: peerDiscovery
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
metadataFetcher.getMetadata('726b4809351adf6fedc6ad779762829bf5512ae1');
