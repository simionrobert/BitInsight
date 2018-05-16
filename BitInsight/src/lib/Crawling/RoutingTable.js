var utils = require('../utils');

class RoutingTable {
    constructor(maxsize) {
        this.nid = utils.generateRandomIDSync();
        //this.nid = new Uint8Array([61, 67, 77, 134, 255, 61, 143, 59, 44, 118, 178, 114, 123, 212, 166, 73, 131, 27, 72, 240]);
        this.nodes = [];
        this.maxsize = maxsize;
    }

    push(node) {
        if (this.nodes.length < this.maxsize) {
            this.nodes.push(node);
        }
    }
}

module.exports = RoutingTable;