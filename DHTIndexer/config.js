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
        timeout: 6*1000,
        dht: false
    },

    DEFAULT_METADATA_FETCHER_OPTIONS: {
        timeout: 9*1000,
        socketTimeout: 5000
    },
    
    DEFAULT_ELASTIC_SEARCH_OPTIONS: {
        connection: {
            host: 'localhost:9200',
            log: 'trace'
        },
        batchSizeDHT: 100,
        batchSizeTorrent:10
    },

    DEFAULT_BTCLIENT_OPTIONS: {
        torcacheURL: "http://itorrents.org/torrent/"
    }
};

module.exports = config;


/*
Updates:
- Implement Batch Metadata download

Done:
- DHTCrawl & PD+MF different processes save & updates different indexes
- means of saving state: count (id in IP index)
- To be perfect: Make peer Discovery independent of infohash (multiple infohashes same time). Discuss with creator+propose
- IP index, PD updates docs by id
- DHT Crawl cache & bulk + transmit partial cache after a timeout
- Veriy Peer Discover conccurent
*/