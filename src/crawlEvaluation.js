'use strict'

const config = require('../config');
const DHTCrawler = require('./lib/Crawling/DHTCrawler');
const fs = require('fs');


var crawler = new DHTCrawler(config.DEFAULT_CRAWLER_OPTIONS);
var count = 0;
var id = 0;

function startRegistering(file, endTime, periodTime) {
    function setTimeoutHours(timeout) {
        secTimeoutHours = setTimeout(function() {
            clearInterval(secRemaining)
            fs.appendFile(file, count + "\nTotal infohashes crawled in " + timeout / 60000 + " minutes: " + id, function(err) {
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
    fs.writeFile(file, "", function(err) {
        if (err) {
            return console.log(err);
        }

        console.log("File cleaned");
    });

    //set crawler for 1 hour
    setTimeoutHours(endTime)

    // Set interval to write
    secRemaining = setInterval(function() {
        fs.appendFile(file, count + "\n", function(err) {
            if (err) {
                return console.log(err);
            }

            console.log("Count registered");
        });

        count = 0;
    }, periodTime)
}

crawler.on('infohash', function(listInfohash, rinfo) {
    count++;
    id++;
});


crawler.start();
startRegistering("resources/countPerMinute.txt", 60 * 60 * 1000, 60 * 1000); //1h and each minute