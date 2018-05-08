var crypto = require('crypto');

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
            address: data[i + 20] + '.' + data[i + 21] + '.' +
            data[i + 22] + '.' + data[i + 23],
            port: data.readUInt16BE(i + 24)
        });
    }
    return nodes;
};


exports.parseMetadata = function (parsedTorrent) {
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