var dhtIndexer = require('./lib/DHTIndexer')
var peerDiscovery = require('./lib/PeerDiscovery')
var metadataFetcher = require('./lib/MetadataFetcher')

module.exports = dhtIndexer
module.exports.DHTIndexer = dhtIndexer
module.exports.PeerDiscovery = peerDiscovery
module.exports.MetadataFetcher = metadataFetcher
