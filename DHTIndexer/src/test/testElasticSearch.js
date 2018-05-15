'use strict'

var config = require('../../config');
var ElasticSearch = require('../lib/Database/Elasticsearch');


var indexer = new ElasticSearch(config.DEFAULT_ELASTIC_SEARCH_OPTIONS);

indexer.createIPIndex();
//indexer.createTorrentIndex();