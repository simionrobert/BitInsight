'use strict';

var dgram = require('dgram');
var bencode = require('bencode');
var utils = require('./utils');
var RoutingTable = require('./routingTable');

var BOOTSTRAP_NODES = [
    ['router.bittorrent.com', 6881],
    ['dht.transmissionbt.com', 6881]
];

var DHTIndexer = function (options) {
    this.address = options.address;
    this.port = options.port;
    this.dhtAnnouncing = options.dhtAnnouncing;

    this.verticalAttackMode = options.verticalAttackMode;
    this.verticalAttackNrNodes = options.verticalAttackNrNodes;
    this.BEP51Mode = options.BEP51Mode;

    this.socket = dgram.createSocket('udp4');
    this.routingTable = new RoutingTable(options.tableMaxSize);
};

DHTIndexer.prototype.sendKRPC = function (msg, rinfo) {
    var buf = bencode.encode(msg);
    this.socket.send(buf, 0, buf.length, rinfo.port, rinfo.address);
};

DHTIndexer.prototype.sendFindNodeRequest = function (rinfo, nodeID) {

    // generateNeighborID(nid, this.routingTable.nid) to make other store my id in their routing table (close to him)
    // this.routingTable.nid to have same id, if i send to him my id. Random or this?
    var targetID = utils.generateRandomID();
    var msg = {
        t: targetID.slice(0, 4),
        y: 'q',
        q: 'find_node',
        a: {
            id: nodeID,
            target: targetID
        }
    };
    this.sendKRPC(msg, rinfo);
};

DHTIndexer.prototype.onFindNodeResponse = function (data) {
    var nodes = utils.decodeNodes(data);
    nodes.forEach(function (node) {
        if (node.address != this.address && node.nid != this.routingTable.nid
            && node.port < 65536 && node.port > 0) {
            this.routingTable.push(node);
        }
    }.bind(this));
};

DHTIndexer.prototype.sendSampleInfohashesRequest = function (rinfo, nid) {
    var targetID = utils.generateRandomID();

    var msg = {
        t: targetID.slice(0, 4),
        y: 'q',
        q: 'sample_infohashes',
        a: {
            id: this.routingTable.nid,
            target: targetID
        }
    };

    this.sendKRPC(msg, rinfo);
};

DHTIndexer.prototype.onSampleInfohashesResponse = function (data) {
    console.log('Nr of infohashes: %d', (data.samples.length / 20).toString());

    //var infohash = new Uint8Array(20);
    //var j;
    //for (i = 0; i < data.samples.length; i +=20) {
    //    for (j = i; j < i + 20; j++) {
    //        infohash[j % 20] = data.samples[j];
    //    }
    //    console.log(toHexString(infohash));
    //}
};

DHTIndexer.prototype.onPingRequest = function (msg, rinfo) {

    var tid = msg.t;
    var nid = msg.a.id;

    if (tid === undefined || nid.length != 20) {
        throw new Error("Invalid Ping RPC received");
    }

    this.sendKRPC({
        t: tid,
        y: 'r',
        r: {
            id: utils.generateNeighborID(nid, this.routingTable.nid)
        }
    }, rinfo);
};


DHTIndexer.prototype.onFindNodeRequest = function (msg, rinfo) {
    var tid = msg.t;
    var nid = msg.a.id;

    if (tid === undefined || nid.length != 20) {
        throw new Error("Invalid FindNode RPC received");
    }

    this.sendKRPC({
        t: tid,
        y: 'r',
        r: {
            id: utils.generateNeighborID(nid, this.routingTable.nid),
            nodes: this.routingTable.nid
        }
    }, rinfo);
};

DHTIndexer.prototype.onGetPeersRequest = function (msg, rinfo) {

    var infohash = msg.a.info_hash;
    var tid = msg.t;
    var nid = msg.a.id;
    var token = infohash.slice(0, 2);

    if (tid === undefined || infohash.length != 20 || nid.length != 20) {
        throw new Error("Invalid GetPeers RPC received");
    }

    this.sendKRPC({
        t: tid,
        y: 'r',
        r: {
            id: utils.generateNeighborID(infohash, this.routingTable.nid),
            nodes: '',
            token: token
        }
    }, rinfo);

    console.log("magnet:?xt=urn:btih:%s from %s:%s", infohash.toString("hex"), rinfo.address, rinfo.port);
};

DHTIndexer.prototype.onAnnouncePeerRequest = function (msg, rinfo) {
    var port;
    var infohash = msg.a.info_hash;
    var token = msg.a.token;
    var nid = msg.a.id;
    var tid = msg.t;

    if (tid == undefined) {
        throw new Error("Invalid AnnouncePeer RPC received");
    }

    if (infohash.slice(0, 2).toString() != token.toString()) {
        return;
    }

    if (msg.a.implied_port != undefined && msg.a.implied_port != 0) {
        port = rinfo.port;
    }
    else {
        port = msg.a.port || 0;
    }

    if (port >= 65536 || port <= 0) {
        return;
    }

    this.sendKRPC({
        t: tid,
        y: 'r',
        r: {
            id: utils.generateNeighborID(nid, this.routingTable.nid)
        }
    }, rinfo);

    console.log("magnet:?xt=urn:btih:%s from %s:%s", infohash.toString("hex"), rinfo.address, rinfo.port);
};

DHTIndexer.prototype.contactBootstrapNodes = function () {
    BOOTSTRAP_NODES.forEach(function (node) {
        this.sendFindNodeRequest({ address: node[0], port: node[1] }, this.routingTable.nid);
    }.bind(this));
};

DHTIndexer.prototype.horrizontalAttack = function () {
    this.routingTable.nodes.forEach(function (node) {
        this.sendFindNodeRequest({
            address: node.address,
            port: node.port
        }, utils.generateNeighborID(node.nid, this.routingTable.nid));
    }.bind(this));
};

DHTIndexer.prototype.indexDHT = function () {
    this.routingTable.nodes.forEach(function (node) {
        this.sendSampleInfohashesRequest({
            address: node.address,
            port: node.port
        }, node.nid);
    }.bind(this));
};

DHTIndexer.prototype.verticalAttack = function () {
    this.routingTable.nodes.forEach(function (node) {
        for (var i = 0; i < this.verticalAttackNrNodes; i++) {
            this.sendFindNodeRequest({
                address: node.address,
                port: node.port
            }, utils.generateNeighborID(node.nid, generateRandomID()));
        }
    }.bind(this));
};

DHTIndexer.prototype.onMessage = function (data, rinfo) {
    // TODO: Respond properly to querries IDs, data, etc.
    try {
        var msg = bencode.decode(data);

        if (msg.y == 'r' && msg.r.samples !== undefined) {

            // BEP51 message received
            this.onSampleInfohashesResponse(msg.r);

            if (msg.r.nodes) {
                this.onFindNodeResponse(msg.r.nodes);
            }
        }
        else if (msg.y == 'r' && msg.r.nodes) {

            // List of nodes got
            this.onFindNodeResponse(msg.r.nodes);
        }
        else if (msg.y == 'q' && msg.q == 'ping') {

            // horrizontal attack: not to be deleted from nodes tables
            this.onPingRequest(msg, rinfo);
        }
        else if (msg.y == 'q' && msg.q == 'find_node') {

            // horrizontal attack: not to be deleted from nodes tables
            this.onFindNodeRequest(msg, rinfo);
        }
        else if (msg.y == 'q' && msg.q == 'get_peers') {

            // passively observe get_peers querries
            // infohash catched
            // TODO: respond properly
            this.onGetPeersRequest(msg, rinfo);
        }
        else if (msg.y == 'q' && msg.q == 'announce_peer') {

            // infohash catched
             // TODO: respond properly
            this.onAnnouncePeerRequest(msg, rinfo);
        }
    }
    catch (err) {
        console.log(err.message);
    }
};

DHTIndexer.prototype.start = function () {
    this.socket.bind(this.port, this.address);

    this.socket.on('listening', function () {
        console.log('UDP Server listening on %s:%s', this.address, this.port);
    }.bind(this));

    this.socket.on('message', function (msg, rinfo) {
        this.onMessage(msg, rinfo);
    }.bind(this));

    this.socket.on('error', function (err) {
        console.error("UDP error: %s",err);
        // do nothing
    }.bind(this));

    setInterval(function () {
        this.contactBootstrapNodes();
        this.horrizontalAttack(); 

        if (this.verticalAttackMode == true)
            this.verticalAttack();

        if (this.BEP51Mode == true)
            this.indexDHT();

        this.routingTable.nodes = [];
    }.bind(this), this.dhtAnnouncing);
};



module.exports = DHTIndexer;