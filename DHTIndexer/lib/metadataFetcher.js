var PeerDiscovery = require('./PeerDiscovery');
const Protocol = require('bittorrent-protocol');
const ut_metadata = require('ut_metadata');
const bencode = require('bencode');
const net = require('net');


//hashes must be always lowercase
const SELF_HASH = '4290a5ff50130a90f1de64b1d9cc7822799affd5';   // Random infohash
const INFO_HASH = '5636cd5dadf6672ae29e538e5c82ed5e4a2bd562';   // ubuntu-16.04.1-server-amd64.iso
//77e0091dd0f5e12ade5b45b509f1768b2ba83b8a
//9d9b0a063b9dd4aad72dfb6e62617e343ab024f8


var peerList = [];
var instance = new PeerDiscovery({ port: 6881, dht: false })

instance.on('peer', function (peer, infoHash, from) {
    const peerAddress = { address: peer.host, port: peer.port };
    console.log('found potential peer ' + peer.host + ':' + peer.port + ' through ' + from.address + ':' + from.port);
    getMetadata(peerAddress, INFO_HASH);
});

function getMetadata(peerAddress, infoHash) {
    const socket = new net.Socket();
    socket.on('timeout', function () {
        console.log("Timeout");
    });

    socket.setTimeout(5000);

    socket.connect(peerAddress.port, peerAddress.address, () => {
        const wire = new Protocol();

        socket.pipe(wire).pipe(socket);
        wire.use(ut_metadata());

        wire.handshake(infoHash, SELF_HASH, { dht: true });
        wire.on('handshake', function (infoHash, peerId) {
            wire.ut_metadata.fetch();
        })

        wire.ut_metadata.on('metadata', function (rawMetadata) {
            metadata = bencode.decode(rawMetadata).info;                // Got it!


            console.log("Metadata got from: %s", socket.remoteAddress);
            console.log(`${metadata.name.toString('utf-8')}:`);
            var files = [];
            var totalLenght = 0;

            //if multiple files
            if (metadata.hasOwnProperty('files')) {
                var l = metadata.files.length;
                for (var i = 0; i < l; i++) {
                    files.push(
                        {
                            filename: metadata.files[i].path.toString('utf-8'),
                            length: metadata.files[i].length
                        });

                    totalLenght += metadata.files[i].length;
                }
            } else {

                //single file
                files.push(
                    {
                        filename: metadata.name.toString('utf-8'),
                        length: metadata.length
                    });
            }

            process.exit(0); //critical
            instance.destroy();
        })
    });
    socket.on('error', err => { socket.destroy(); });
}

instance.lookup(INFO_HASH);