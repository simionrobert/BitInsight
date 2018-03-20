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
        intervalDiscoveryTimeoutMS: 3000,
        dht: false
    },

    DEFAULT_METADATA_FETCHER_OPTIONS: {
        timeout: 10000,
        socketTimeout: 5000
    },
    
    DEFAULT_ELASTIC_SEARCH_OPTIONS: {
        connection: {
            host: 'localhost:9200',
            log: 'trace'
        },
        batchSizeDHT: 100,
        batchSizeTorrent:10
    }
};

module.exports = config;


/*
Updates:
- DHTCrawl & PD+MF different processes save & updates different indexes
- 2 Indexes: Torrent and IP
- means of saving state: count (id in IP index)
- To be perfect: Make peer Discovery independent of infohash (multiple infohashes same time). Discuss with creator+propose
- IP index, PD updates docs by id
- DHT Crawl cache & bulk + transmit partial cache after a timeout
*/