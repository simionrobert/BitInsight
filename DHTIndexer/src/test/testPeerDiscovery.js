var PeerDiscovery = require('../lib/PeerDiscovery');
const INFO_HASH1 = '5636cd5dadf6672ae29e538e5c82ed5e4a2bd562';   // ubuntu-16.04.1-server-amd64.iso
const INFO_HASH2 = 'a236f822243ac8356084b0d9f7a0c2a11c06b789'
const INFO_HASH32 = '726b4809351adf6fedc6ad779762829bf5512ae1'
var config = require('../../config');


var peerDiscovery = new PeerDiscovery(config.DEFAULT_PEER_DISCOVERY_OPTIONS);
var count = 1;
peerDiscovery.on('peer', function (peer, infohash, from) {
    console.log('Infohash: ' + infohash.toString("hex") + ' found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port);
});
peerDiscovery.on('discoveryEnded', function (peer, infohash, from) {
    console.log('Discovery ended ');
    //if ( count == 1) { 
    //    count++
    //    peerDiscovery.lookup(INFO_HASH2);
    //}
    //else
    //    if (count== 2) {
    //        count++
    //        peerDiscovery.lookup(INFO_HASH1);
    //    }
           
    //else
    //        if (count == 3) {
    //            count++
    //            peerDiscovery.lookup(INFO_HASH2);
    //        }
    //else
    //            if (count == 4) {
    //                count++
    //                peerDiscovery.lookup(INFO_HASH1);
    //            }
});


peerDiscovery.lookup(INFO_HASH1);
peerDiscovery.lookup(INFO_HASH2);
peerDiscovery.lookup(INFO_HASH32);

