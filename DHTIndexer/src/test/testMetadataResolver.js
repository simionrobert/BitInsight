'use strict';

var MetadataResolver = require('../lib/MetadataResolver');
var PeerDiscovery = require('../lib/PeerDiscovery');
var config = require('../../config');
const INFO_HASH1 = '5636cd5dadf6672ae29e538e5c82ed5e4a2bd562';   // ubuntu-16.04.1-server-amd64.iso
const INFO_HASH2 = '726b4809351adf6fedc6ad779762829bf5512ae1'


var metadataFetcher = new MetadataResolver(config.DEFAULT_METADATA_FETCHER_OPTIONS,peerDiscovery);
var count = 1

metadataFetcher.on('metadata', function (torrent, remoteAddress) {
    console.log('\nTorrent found: ' + torrent.name);
    console.log('From: ' + remoteAddress);
    console.log('Files: ' );

    for (let i = 0; i < torrent.files.length; i++) {
        console.log('\t' +torrent.files[i].name);
    }

    reccursiveCall()

}.bind(this));

metadataFetcher.on('timeout', function (infohash) {
    console.log("Metadata Timeout: " + infohash.toString('hex'))

    reccursiveCall()
}.bind(this));

function reccursiveCall() {
    if (count == 1) {
        count++
        peerDiscovery.destroy();
        var peerDiscovery = new PeerDiscovery(config.DEFAULT_PEER_DISCOVERY_OPTIONS);
        metadataFetcher.getMetadata(INFO_HASH2, peerDiscovery)
    }
    else
        if (count == 2) {
            count++
            peerDiscovery.destroy();
            var peerDiscovery = new PeerDiscovery(config.DEFAULT_PEER_DISCOVERY_OPTIONS);
            metadataFetcher.getMetadata(INFO_HASH1, peerDiscovery)
        }

        else
            if (count == 3) {
                count++
                peerDiscovery.destroy();
                var peerDiscovery = new PeerDiscovery(config.DEFAULT_PEER_DISCOVERY_OPTIONS);
                metadataFetcher.getMetadata(INFO_HASH2, peerDiscovery)
            }
            else
                if (count == 4) {
                    count++
                    peerDiscovery.destroy();
                    var peerDiscovery = new PeerDiscovery(config.DEFAULT_PEER_DISCOVERY_OPTIONS);
                    metadataFetcher.getMetadata(INFO_HASH1, peerDiscovery)
                }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var peerDiscovery = new PeerDiscovery(config.DEFAULT_PEER_DISCOVERY_OPTIONS);
metadataFetcher.getMetadata(INFO_HASH1, peerDiscovery)
