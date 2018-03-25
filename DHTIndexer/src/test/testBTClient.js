'use strict'

var config = require('../../config');
var BTClient = require('../lib/BTClient');


var btClient = new BTClient(config,1,1);

btClient.on('metadata', function (torrent) {

    console.log('\nTorrent found: ' + torrent.name);
    console.log('Infohash ' + torrent.infohash.toString('hex'));

    console.log('Files: ');
    for (let i = 0; i < torrent.files.length; i++) {
        console.log('\t' + torrent.files[i].name);
    }

});

btClient.on('ip', function (torrent) {

    console.log('IPs: ' + torrent.listIP.length);
    for (let i = 0; i < torrent.listIP.length; i++) {
        console.log(torrent.infohash.toString('hex')+ '\t' + torrent.listIP[i].host);
    }
});


btClient.addToCache('a236f822243ac8356084b0d9f7a0c2a11c06b2b2')
btClient.addToCache('726b4809351adf6fedc6ad779762829bf5512ae1')
btClient.addToCache('0d5b1c570e7c03bc456f53d0e9628b12a64f638f')
btClient.addToCache('a236f822243ac8356084b0d9f7a0c2a11c06b789')
btClient.addToCache('726b4809351adf6fedc6ad779762829bf5512ae1')
btClient.addToCache('0d5b1c570e7c03bc456f53d0e9628b12a64f638f')
btClient.addToCache('a236f822243ac8356084b0d9f7a0c2a11c06b789')
btClient.addToCache('726b4809351adf6fedc6ad779762829bf5512ae1')
btClient.addToCache('0d5b1c570e7c03bc456f53d0e9628b12a64f638f')

btClient.startService();