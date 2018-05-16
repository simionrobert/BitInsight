'use strict'

var config = require('../../config');
var BTClient = require('../lib/BTClient');


var btClient = new BTClient(config,1,1);

btClient.on('torrent', function (torrent) {

    console.log('\n' + btClient.getID() + ". Infohash: " + torrent.ip.infohash.toString('hex'));

    if (torrent.metadata != null) {
        console.log('Torrent sent to batch: ' + torrent.metadata.name);

        
    }
    else
        console.log('No metadata available');

    console.log('List ip sent to batch ' + torrent.ip.listIP.length);

});


btClient.addToCache('8CA378DBC8F62E04DF4A4A0114B66018666C17CD')
btClient.addToCache('1f883132cd8beaed336d3f6744b6c0d6cd9b9ecb')
btClient.addToCache('0d5b1c570e7c03bc456f53d0e9628b12a64f638f')
btClient.addToCache('a236f822243ac8356084b0d9f7a0c2a11c06b789')

btClient.startService();