var utils = require('./utils');

var RoutingTable = function (maxsize) {
    this.nid = utils.generateRandomID();
    this.nodes = [];
    this.maxsize = maxsize;
};

RoutingTable.prototype.push = function (node) {
    if (this.nodes.length >= this.maxsize) {
        return;
    }
    this.nodes.push(node);
};

module.exports = RoutingTable;