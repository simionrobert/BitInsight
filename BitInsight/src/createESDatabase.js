'use strict'


var elasticsearch = require('elasticsearch');
var config = require('../config');

client = new elasticsearch.Client(config.DEFAULT_ELASTIC_SEARCH_OPTIONS.connection);

createTorrentIndex();
createIPIndex();
createRelationIndex();


function createTorrentIndex() {
    client.indices.create({
        index: 'torrent',
        body: {
            "mappings": {
                "doc": {
                    "properties": {
                        "ID": {
                            "type": "long"
                        },
                        "Name": {
                            "type": "text",
                            "fields": {
                                "keyword": {
                                    "type": "keyword"
                                }
                            }
                        },
                        "Search": {
                            "type": "text"
                        },
                        "Type": {
                            "type": "keyword"
                        },
                        "Categories": {
                            "type": "keyword"
                        },
                        "Files": {
                            "properties": {
                                "Name": {
                                    "type": "text"
                                },
                                "Size": { "type": "long" }
                            }
                        },
                        "Peers": { "type": "integer" },
                        "Size": { "type": "long" },
                        "Date": { "type": "date" }
                    }
                }
            }
        }
    }, function (err, resp, status) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("create", resp);
        }
    });
}

function createIPIndex() {
    client.indices.create({
        index: "ip",
        body: {
            "mappings": {
                "doc": {
                    "properties": {
                        "IP": { "type": "ip" },
                        "Port": { "type": "integer" },
                        "Date": { "type": "date" },
                        "geoip": {
                            "properties": {
                                "continent_name": { "type": "keyword" },
                                "city_name": { "type": "keyword" },
                                "country_iso_code": { "type": "keyword" },
                                "region_name": { "type": "keyword" },
                                "location": { "type": "geo_point" }
                            }
                        }
                    }
                }
            }
        }
    }, function (err, resp, status) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("create", resp);
        }
    });
}

function createRelationIndex() {
    client.indices.create({
        index: "relation",
        body: {
            "mappings": {
                "doc": {
                    "properties": {
                        "ID": { "type": "long" },
                        "IPs": { "type": "ip" }
                    }
                }
            }
        }
    }, function (err, resp, status) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("create", resp);
        }
    });
}
