'use strict'
process.env.UV_THREADPOOL_SIZE = 64

const { spawn } = require('child_process');
const config = require('../config');
const ElasticSearch = require('./lib/Database/Elasticsearch');
const DHTCrawler = require('./lib/Crawling/DHTCrawler');
const fs = require('fs');


var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);
var crawler = new DHTCrawler(config.DEFAULT_CRAWLER_OPTIONS);

crawler.on('infohash', function (listInfohash, rinfo) {

    setImmediate((listInfohash, rinfo) => {
        for (let i = 0; i < listInfohash.length; i++) {
            console.log((count++) + ". magnet:?xt=urn:btih:%s from %s:%s", listInfohash[i].toString("hex"), rinfo.address, rinfo.port);
            indexer.indexInfohash(listInfohash[i]);
        }
    }, listInfohash, rinfo);
});

function startRegistering(file, endTime, periodTime) {

    //initialise variabiles for statistics
    var secTimeoutHours = 0;
    var secRemaining = 0;

    function setTimeoutHours(timeout) {
        secTimeoutHours = setTimeout(function () {
            clearInterval(secRemaining)
            crawler.end();
        }, timeout)
    }

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

var count = 0;
crawler.start();
startRegistering("resource/countPerMinute.txt",60 * 60 * 1000, 60 * 1000); //1h and each minute



//function startSlaveProcess() {
//    const subprocess = spawn('node', ['"' + __dirname + '/slave.js' + '"'], {
//        shell: true,
//        detached: true,
//        stdio: 'ignore'
//    });

//    subprocess.unref();
//}

//setTimeout(function () {
//    startSlaveProcess();
//}, 10 * 1000)