'use strict';

var MetadataFetcher = require('../lib/MetadataFetcher');
var PeerDiscovery = require('../lib/PeerDiscovery');
var config = require('../../config');
const INFO_HASH1 = '5636cd5dadf6672ae29e538e5c82ed5e4a2bd562';   // ubuntu-16.04.1-server-amd64.iso
const INFO_HASH2 = '726b4809351adf6fedc6ad779762829bf5512ae1'

var peerDiscovery = new PeerDiscovery(config.DEFAULT_PEER_DISCOVERY_OPTIONS);
var metadataFetcher = new MetadataFetcher(config.DEFAULT_METADATA_FETCHER_OPTIONS,peerDiscovery);
var count = 1

metadataFetcher.on('metadata', function (infohash,name, files, remoteAddress) {
    console.log('\nTorrent found: ' + name);
    console.log('From: ' + remoteAddress);
    console.log('Files: ' );

    for (let i = 0; i < files.length; i++) {
        console.log('\t'+files[i].name);
    }

    if (count == 1) {
        count++
        metadataFetcher.getMetadata(INFO_HASH2)
    }
    else
        if (count == 2) {
            count++
            metadataFetcher.getMetadata(INFO_HASH1)
        }

        else
            if (count == 3) {
                count++
                metadataFetcher.getMetadata(INFO_HASH2)
            }
            else
                if (count == 4) {
                    count++
                    metadataFetcher.getMetadata(INFO_HASH1)
                }
});

metadataFetcher.on('timeout', function () {
    console.log("Metadata Timeout")
    if (count == 1) {
        count++
        metadataFetcher.getMetadata(INFO_HASH2)
    }
    else
        if (count == 2) {
            count++
            metadataFetcher.getMetadata(INFO_HASH1)
        }

        else
            if (count == 3) {
                count++
                metadataFetcher.getMetadata(INFO_HASH2)
            }
            else
                if (count == 4) {
                    count++
                    metadataFetcher.getMetadata(INFO_HASH1)
                }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
metadataFetcher.getMetadata(INFO_HASH1)
