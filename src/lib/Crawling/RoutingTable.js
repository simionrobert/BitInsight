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

    pop8() {
        if (this.nodes.length >= 8) {
            return this.nodes.slice(0, 8)
        } else if (this.nodes.length > 0) {
            return new Array(8).join().split(',').map(() => this.nodes[0])
        }
        return []
    }


}

module.exports = RoutingTable;