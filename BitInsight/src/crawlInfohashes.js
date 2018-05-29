'use strict'
process.env.UV_THREADPOOL_SIZE = 64

const { spawn } = require('child_process');
const config = require('../config');
const ElasticSearch = require('./lib/Database/Elasticsearch');
const DHTCrawler = require('./lib/Crawling/DHTCrawler');
const fs = require('fs');


var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var crawler = new DHTCrawler(config.DEFAULT_CRAWLER_OPTIONS);
var id = 0;
var count = 0;

crawler.on('listInfohash', function (listInfohash, rinfo) {

    setImmediate((listInfohash, rinfo) => {
        for (let i = 0; i < listInfohash.length; i++) {
            console.log((id++) + ". magnet:?xt=urn:btih:%s from %s:%s", listInfohash[i].toString("hex"), rinfo.address, rinfo.port);
            indexer.indexInfohash(listInfohash[i]);
            count++;
        }
    }, listInfohash, rinfo);
});

crawler.on('infohash', function (infohash, rinfo) {

    setImmediate((infohash, rinfo) => {
        console.log((id++) + ". magnet:?xt=urn:btih:%s from %s:%s", infohash.toString("hex"), rinfo.address, rinfo.port);
        indexer.indexInfohash(infohash);
        count++;
    }, infohash, rinfo);
});

function startRegistering(file, endTime, periodTime) {
    function setTimeoutHours(timeout) {
        secTimeoutHours = setTimeout(function () {
            clearInterval(secRemaining)
            fs.appendFile(file, count + "\nTotal infohashes crawled in " + timeout / 60000 + " minutes: " + id, function (err) {
                if (err) {
                    return console.log(err);
                }

                console.log("Count registered");
                console.log("Crawling process done");
                crawler.end();
                process.exit();
            });
        }, timeout)
    }

    //initialise variabiles for statistics
    var secTimeoutHours = 0;
    var secRemaining = 0;

    // Clean file
    fs.writeFile(file, "", function (err) {
        if (err) {
            return console.log(err);
        }

        console.log("File cleaned");
    });

    //set crawler for 1 hour
    setTimeoutHours(endTime)

    // Set interval to write
    secRemaining = setInterval(function () {
        fs.appendFile(file, count + "\n", function (err) {
            if (err) {
                return console.log(err);
            }

            console.log("Count registered");
        });

        count = 0;
    }, periodTime)
}



indexer.ready(function () {
    crawler.start();
    startRegistering("resource/countPerMinute.txt", 60 * 60 * 1000, 60 * 1000); //1h and each minute
});
