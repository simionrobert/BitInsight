﻿const config = {

    DEFAULT_CRAWLER_OPTIONS : {
        address: '0.0.0.0',
        port: 6881,
        tableMaxSize: 200,
        dhtAnnouncing: 1000,
        BEP51Mode: false,
        BOOTSTRAP_NODES : [
            ['router.bittorrent.com', 6881],
            ['dht.transmissionbt.com', 6881]
        ]
    },

    DEFAULT_PEER_DISCOVERY_OPTIONS : {
        port: 6880,
        timeout: 7 * 1000, //for rServicesd crawling put 2
        timeout_initial: 5*1000,
        dht: false
    },

    DEFAULT_METADATA_FETCHER_OPTIONS: {
        timeout: 8*1000, 
        socketTimeout: 5000,
        tracker: true,
        torcacheURL: "http://itorrents.org/torrent/"
    },
    
    DEFAULT_ELASTIC_SEARCH_OPTIONS: {
        connection: {
            host: 'localhost:9200'
        },
        batchSizeDHT: 100,
        batchSizeTorrent:10
    },
};

module.exports = config;


/*
Done:
- Implement Batch Metadata download
- DHTCrawl & PD+MF different processes save & updates different indexes
- means of saving state: count (id in IP index)
- To be perfect: Make peer Discovery independent of infohash (multiple infohashes same time). Discuss with creator+propose
- IP index, PD updates docs by id
- DHT Crawl cache & bulk + transmit partial cache after a timeout
- Veriy Peer Discover conccurent
- ES: Add timestamp auto (Done)
*/