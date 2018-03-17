var PeerDiscovery = require('../lib/PeerDiscovery');
const INFO_HASH1 = '5636cd5dadf6672ae29e538e5c82ed5e4a2bd562';   // ubuntu-16.04.1-server-amd64.iso
const INFO_HASH2 = '726b4809351adf6fedc6ad779762829bf5512ae1'

var DEFAULT_PEER_DISCOVERY_OPTIONS = {
    port: 6881,
    intervalMs: 15 * 60 * 1000,
    dht: false 
};

var instance = new PeerDiscovery(DEFAULT_PEER_DISCOVERY_OPTIONS);
var count = 1;
instance.on('peer', function (peer, infoHash, from) {
    console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port);
});

instance.on('discoveryEnded', function (infoHash) {
    if (count == 2)
        return;

    count++;
    console.log('//////////////////////////////////////////////////////////////////////')
    instance.lookup(INFO_HASH2);
});

instance.lookup(INFO_HASH1);

