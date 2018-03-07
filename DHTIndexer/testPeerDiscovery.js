//var DHT = require('bittorrent-dht');
//var magnet = require('magnet-uri');

//var uri = 'magnet:?xt=urn:btih:4EF3180F2D2C14E55D61B67C3B888793B5267195';
//var parsed = magnet(uri);

//var _dhtAnnouncing = false;
//var _dhtTimeout = false;
//var _intervalMs = 15 * 60 * 1000;
//var port = 20000;

//var dht = new DHT();
//console.log(parsed.infoHash); // 'e3811b9539cacff680e418124272177c47477157'

//dht.listen(20000, '0.0.0.0', function () {
//    console.log('now listening');
//})

//dht.on('peer', function (peer, infoHash, from) {
//    console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port);
//})

//// find peers for the given torrent info hash
//dht.lookup(parsed.infoHash);
//_dhtAnnounce();

var PeerDiscovery = require('./lib/PeerDiscovery');

const INFO_HASH = '5dfcf599f5eac360e107701d0ed72c416a5097fc';   // ubuntu-16.04.1-server-amd64.iso

var instance = new PeerDiscovery({ port: 6881, dht: false })

instance.on('peer', function (peer, infoHash, from) {
    console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port);
});

instance.lookup(INFO_HASH);

