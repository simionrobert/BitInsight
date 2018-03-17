var Manager = require('../lib/Manager');
var ESIndexer = require('../lib/ESIndexer');
var MetadataFetcher = require('../lib/MetadataFetcher');
var PeerDiscovery = require('../lib/PeerDiscovery');
var DHTCrawler = require('../lib/DHTCrawler');

var DEFAULT_CRAWLER_OPTS = {
    address: '0.0.0.0',
    port: 6881,
    tableMaxSize: 256,
    dhtAnnouncing: 1000,
    BEP51Mode: true,
    verticalAttackMode: true,
    verticalAttackNrNodes: 8
};

var crawler = new DHTCrawler(DEFAULT_CRAWLER_OPTS);
var count = 1;

crawler.on('sampleInfohashResponse', function (listInfohash, rinfo) {
    for (let i = 0; i < listInfohash.length; i++) {
        console.log((count++) + ". magnet:?xt=urn:btih:%s from %s:%s", listInfohash[i].toString("hex"), rinfo.address, rinfo.port);
        manager.addToCache(listInfohash[i].toString("hex"))
    }
});

crawler.on('infohash', function (infohash, rinfo) {
    console.log((count++) + ".magnet:?xt=urn:btih:%s from %s:%s", infohash.toString("hex"), rinfo.address, rinfo.port);
    manager.addToCache(infohash.toString("hex"))
});



var DEFAULT_PEER_DISCOVERY_OPTIONS = {
    port: 6880,
    intervalMs: 15 * 60 * 1000,
    intervalDiscoveryTimeoutMS: 2000,
    dht: false
}
peerDiscovery = new PeerDiscovery(DEFAULT_PEER_DISCOVERY_OPTIONS);


var DEFAULT_METADATA_FETCHER_OPTIONS = {
    peerDiscovery: peerDiscovery
}

metadataFetcher = new MetadataFetcher(DEFAULT_METADATA_FETCHER_OPTIONS);
metadataFetcher.on('metadata', function (name, files, remoteAddress) {
    console.log('\nTorrent found: ' + name);
    console.log('From: ' + remoteAddress);
    console.log('Files: ');

    for (let i = 0; i < files.length; i++) {
        console.log('\t' + files[i].name);
    }
});

var indexer = new ESIndexer();


var managerOptions = {
    peerDiscovery: peerDiscovery,
    metadataFetcher: metadataFetcher
};

manager = new Manager(managerOptions);
manager.on('infoEnded', function (infohash, name, files, listIP) {
    indexer.indexTorrent(infohash, name, files, listIP)
});


crawler.start();