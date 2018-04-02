var parseTorrent = require('parse-torrent')

parseTorrent.remote("http://itorrents.org/torrent/B415C913643E5FF49FE37D304BBB5E6E11AD5101.torrent", function (err, parsedTorrent) {
    if (err) throw err

    var torrent = _parseMetadata(parsedTorrent)
    console.log(parsedTorrent)
})

function _parseMetadata(parsedTorrent) {
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