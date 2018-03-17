const config = {

    DEFAULT_CRAWLER_OPTIONS : {
        address: '0.0.0.0',
        port: 6881,
        tableMaxSize: 128,
        dhtAnnouncing: 1000,
        BEP51Mode: true,
        verticalAttackMode: false,
        verticalAttackNrNodes: 8
    },

    DEFAULT_PEER_DISCOVERY_OPTIONS : {
        port: 6880,
        intervalMs: 15 * 60 * 1000,
        intervalDiscoveryTimeoutMS: 2000,
        dht: false
    },
    
    DEFAULT_ELASTIC_SEARCH_OPTIONS: {
        host: 'localhost:9200',
        log: 'trace'
    }
};

module.exports = config;