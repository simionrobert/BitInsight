var PeerDiscovery = require('../lib/PeerDiscovery');
const INFO_HASH = '5636cd5dadf6672ae29e538e5c82ed5e4a2bd562';   // ubuntu-16.04.1-server-amd64.iso

var DEFAULT_PEER_DISCOVERY_OPTIONS = {
    port: 6881,
    intervalMs: 1000,
    dht: false 
};

var instance = new PeerDiscovery(DEFAULT_PEER_DISCOVERY_OPTIONS);
instance.on('peer', function (peer, infoHash, from) {
    console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port);
});

instance.lookup(INFO_HASH);

