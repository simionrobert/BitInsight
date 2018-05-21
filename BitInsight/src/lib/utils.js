var crypto = require('crypto');
const bencode = require('bencode');

exports.generateRandomIDAsync = function (rinfo, nodeID, cb) {

    crypto.randomBytes(20, (err, buf) => {
        if(err) throw err
        cb(rinfo, nodeID, buf)
    })
};

exports.generateRandomIDSync = function () {
    return crypto.randomBytes(20)
};

exports.generateNeighborID = function (target, nid) {
    return Buffer.concat([target.slice(0, 10), nid.slice(10)]);
};

exports.decodeNodes = function (data) {
    var nodes = [];

    for (var i = 0; i + 26 <= data.length; i += 26) {
        nodes.push({
            nid: data.slice(i, i + 20),
            address: data[i + 20] + '.' + data[i + 21] + '.' + data[i + 22] + '.' + data[i + 23],
            port: data.readUInt16BE(i + 24)
        });
    }
    return nodes;
};

exports.encodeNodes = function (nodes) {

    return Buffer.concat(nodes.map((node) => Buffer.concat([node.nid, _encodeIP(node.address), _encodePort(node.port)])))
};

function _encodeIP(ip) {
    return Buffer.from(ip.split('.').map((i) => parseInt(i)))
};

function _encodePort(port) {
    const data = Buffer.alloc(2)
    data.writeUInt16BE(port, 0)
    return data
};


exports.parseMetadataTracker = function (parsedTorrent) {
    var files = [];

    if (parsedTorrent.hasOwnProperty('files')) {

        // multiple files
        var l = parsedTorrent.files.length;
        for (var i = 0; i < l; i++) {
            files.push(
                {
                    name: parsedTorrent.files[i].path,
                    size: parsedTorrent.files[i].length
                });
        }
    }

    return {
        infohash: parsedTorrent.infoHash,
        name: parsedTorrent.name,
        files: files
    }
}

exports.parseMetadataDHT = function (rawMetadata, infohash) {
    var metadata = bencode.decode(rawMetadata).info;

    var torrentName = metadata.name.toString('utf-8');
    var files = [];

    if (metadata.hasOwnProperty('files')) {

        // multiple files
        var l = metadata.files.length;
        for (var i = 0; i < l; i++) {
            files.push(
                {
                    name: metadata.files[i].path.toString('utf-8'),
                    size: metadata.files[i].length
                });
        }
    } else {

        // single file
        files.push(
            {
                name: metadata.name.toString('utf-8'),
                size: metadata.length
            });
    }

    return {
        infohash: infohash,
        name: torrentName,
        files: files
    }
}
