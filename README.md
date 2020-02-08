# BitInsight

BitTorrent Nodejs indexer which leverages the DHT protocol for crawling infohashes, torrent metadata and IPs.

The following solution presents an implementation which leverages the BitTorrent DHT Network in order to build a clean torent search engine. Moreover, it can be used to monitor pirates behaviour by tracking their torent download history in preparation for legal attacks. It also provides in-depth analytics and data statistics about the BitTorrent network. In fact, this issue becomes more significant as the copyright and legal pressure from authorities systematically determines the closure of torent hosting sites, futilely trying to stop the damage done to the creative industry. 

A tool was written to crawl the DHT Mainline for torents using both Sybil attack and BEP 51 protocol extension. Following, the network was used to collect addresses of downloaders. The gathered data was then stored and analysed throught Elasticsearch. On top of that, a web application was build to interface and query the related data. See [BitInsight-WebInterface](https://github.com/simionrobert/BitInsight-WebInterface.git), a statistical analyser and data visualisation tool.

Over half a million torents have been captured in one hour and 61.315 IP addresses have been also tracked, downloading 7733 torents over 14 hours. The subsequent analyses showed that the largest IP clusters were mainly located in Europe and Asia. All these results imply that the adoption of DHT indexing over centralised tracking servers will have mixed implications. While it will likely make illicit torents harder to supress, it will not help users hide their actions. 

## Prerequistes

1. Download and install [https://www.elastic.co/downloads/elasticsearch](https://www.elastic.co/downloads/elasticsearch). Run bin/elasticsearch (or bin\elasticsearch.bat on Windows)

2. (Optionally) Download and install [https://www.elastic.co/downloads/kibana](https://www.elastic.co/downloads/kibana). Run bin/kibana (or bin\kibana.bat on Windows)

## Install

Get the latest snapshot:

```
git clone https://github.com/simionrobert/BitInsight.git

npm install
```

## Usage

```
# Create elasticsearch database index mappings
node createESDatabase.js

# Choice 1. Crawling infohashes
node crawlInfohases.js

# Choice 2. Download metadata for each infohash from the db (infohashes must be prior in db)
node indexMetadata.js

# Choice 3. Getting peers IP address for each infohash from the db (infohashes must be prior in db)

#You need to access http://localhost:5601/app/kibana#/dev_tools/console?_g=() and run this command
PUT /_ingest/pipeline/geoip?pretty
{
 "description" : "Add geoip information to the given IP address",
 "processors" : [
   {
     "geoip" : {
        "field" : "IP"
      }
   }
 ]
}

#Then start indexing IPs
node indexPeers.js
```

Visit http://localhost:5601/app/kibana to view your data

## Modules Description

This repo contains the following modules:

1. BitTorrent DHT Indexer
2. BitTorrent Peer Discovery
3. BitTorrent Torrent Metadata

### BitTorrent DHT Indexer

This module crawls the DHT Network for infohashes. Implement several functionalities from [BEP5](http://www.bittorrent.org/beps/bep_0005.html)

- it uses the Sybil attack (horrizontal and/or vertical) on other nodes's routing tables.
- efficiently discovers infohashes on DHT
- has a mechanism for avoiding 'bad/questionable node' tag from other nodes
- complete implementation of the [BEP51](http://www.bittorrent.org/beps/bep_0051.html) in JavaScript
- follows [the spec](http://www.bittorrent.org/beps/bep_0051.html)

The idea of a Sybil attack is to inject multiple fake identities into the system, and use them as a starting point to perform further attacks.

### BitTorrent Peer Discovery

This module uses bittorrent-dht, a Node.js implementation of BEP5, for discovering BitTorrent peers.

- finds peers from DHT network based on an infohash
- can start finding peers with just an infohash, before full metadata is available
- automatically announces, so other peers can discover us

### BitTorrent Torrent Metadata

This module uses bittorrent-protocol and ut_metadata for getting torrent metadata.

- allows a client to join a swarm and complete a download without a .torrent file
- uses Bittorrent Peer Discovery for finding peers
- get torrent structure, file names and sizes

## Performance

A crawling rate comparison was made between our algorithm, [AlphaReign](https://github.com/AlphaReign/scraper) and [simDHT](https://github.com/wuzhenda/simDHT).

Also a paper has been published: `A BitTorrent DHT Crawler, IEEE 13th SACI, Simion Robert George`.

![](https://github.com/simionrobert/BitInsight/blob/master/images/Captur2.JPG)

## Further reading

- [BitTorent DHT protocol](http://www.bittorrent.org/beps/bep_0005.html)
- [BEP51-DHT Infohash Indexing](http://www.bittorrent.org/beps/bep_0051.html)
- [Crawling BitTorrent DHTs for Fun and Profit](https://www.usenix.org/legacy/event/woot10/tech/full_papers/Wolchok.pdf)
- [Real-world sybil attacks in BitTorrent mainline DHT](https://www.researchgate.net/profile/Liang_Wang84/publication/261046350_Real-world_sybil_attacks_in_BitTorrent_mainline_DHT/links/550808160cf27e990e08c7bb/Real-world-sybil-attacks-in-BitTorrent-mainline-DHT.pdf)
- [Kademlia: A Peer-to-peer Information System Based on the XOR Metric](http://www.ic.unicamp.br/~bit/ensino/mo809_1s13/papers/P2P/Kademlia-%20A%20Peer-to-Peer%20Information%20System%20Based%20on%20the%20XOR%20Metric%20.pdf)

## Thank You

I really appreciate all kinds of feedback and contributions.

**Aditional notes:**
If you have some issues referring parts of code in the master branch add them in the issues section.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
