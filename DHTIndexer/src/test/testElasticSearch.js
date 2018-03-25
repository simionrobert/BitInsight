'use strict'

var config = require('../../config');
var ElasticSearch = require('../lib/Elasticsearch');


var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);

indexer.createTorrentIndex();
//indexer.getLastID();
