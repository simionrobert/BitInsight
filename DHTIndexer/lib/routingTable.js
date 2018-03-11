var utils = require('./utils');

class RoutingTable {
    constructor(maxsize) {
        this.nid = utils.generateRandomID();
        this.nodes = [];
        this.maxsize = maxsize;
    }

    push(node) {
        if (this.nodes.length >= this.maxsize) {
            return;
        }
        this.nodes.push(node);
    }
}

module.exports = RoutingTable;