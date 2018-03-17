var PeerDiscovery = require('../lib/PeerDiscovery');
const INFO_HASH1 = '5636cd5dadf6672ae29e538e5c82ed5e4a2bd562';   // ubuntu-16.04.1-server-amd64.iso
const INFO_HASH2 = '726b4809351adf6fedc6ad779762829bf5512ae1'

var config = require('../../config');


var peerDiscovery = new PeerDiscovery(config.DEFAULT_PEER_DISCOVERY_OPTIONS);

peerDiscovery.on('peer', function (peer, infohash, from) {
    console.log('Infohash: ' + infohash.toString("hex") + ' found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port);
});
peerDiscovery.on('discoveryEnded', function (peer, infohash, from) {
    console.log('Discovery ended ');
});


peerDiscovery.lookup(INFO_HASH1);


