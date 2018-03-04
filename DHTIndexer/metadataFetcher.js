const Discovery = require('torrent-discovery');
const Protocol = require('bittorrent-protocol');
const ut_metadata = require('ut_metadata');
const addrToIPPort = require('addr-to-ip-port');
const bencode = require('bencode');
const net = require('net');

const SELF_HASH = '4290a5ff50130a90f1de64b1d9cc7822799affd5';   // Random infohash
const INFO_HASH = '77e0091dd0f5e12ade5b45b509f1768b2ba83b8a';   // ubuntu-16.04.1-server-amd64.iso

Discovery({ infoHash: INFO_HASH, peerId: SELF_HASH, port: 6881, dht: true })
    .on('peer', function (peer) {
        const peerAddress = { address: addrToIPPort(peer)[0], port: addrToIPPort(peer)[1] };
        console.log(`download metadata from peer ${peerAddress.address}:${peerAddress.port}`);
        getMetadata(peerAddress, INFO_HASH);
    });

function getMetadata(peerAddress, infoHash) {
    const socket = new net.Socket();
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
            console.log(`${metadata.name.toString('utf-8')}:`);
            console.log(metadata);
            process.exit(0);
        })
    });
    socket.on('error', err => { socket.destroy(); });
}