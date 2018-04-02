'use strict';

var EventEmitter = require('events')
var dgram = require('dgram');
var bencode = require('bencode');
var utils = require('./utils');
var RoutingTable = require('./routingTable');

var BOOTSTRAP_NODES = [
    ['router.bittorrent.com', 6881],
    ['dht.transmissionbt.com', 6881]
];

class DHTCrawler extends EventEmitter {

    constructor(options) {
        super();

        this.address = options.address || '0.0.0.0';
        this.port = options.port || 6881;
        this.dhtAnnouncing = options.dhtAnnouncing || 1000;

        this.verticalAttackMode = options.verticalAttackMode || false;
        this.verticalAttackNrNodes = options.verticalAttackNrNodes || 8;
        this.BEP51Mode = options.BEP51Mode || true;

        this.socket = dgram.createSocket('udp4');
        this.routingTable = new RoutingTable(options.tableMaxSize || 128);
    }


    start() {
        this.socket.bind(this.port, this.address);

        this.socket.on('listening', function () {
            console.log('UDP Server listening on %s:%s', this.address, this.port);
        }.bind(this));

        this.socket.on('message', function (msg, rinfo) {
            this.onMessage(msg, rinfo);
        }.bind(this));

        this.socket.on('error', function (err) {
            console.error("UDP error: %s", err);
        });

        setInterval(function () {
            this.contactBootstrapNodes();
            this.horrizontalAttack();

            if (this.verticalAttackMode == true)
                this.verticalAttack();

            if (this.BEP51Mode == true)
                this.indexDHT();

            this.routingTable.nodes = [];
        }.bind(this), this.dhtAnnouncing);
    }

    contactBootstrapNodes() {
        BOOTSTRAP_NODES.forEach(function (node) {
            this.sendFindNodeRequest({ address: node[0], port: node[1] }, this.routingTable.nid);
        }.bind(this));
    }

    horrizontalAttack() {
        this.routingTable.nodes.forEach(function (node) {
            this.sendFindNodeRequest({
                address: node.address,
                port: node.port
            }, utils.generateNeighborID(node.nid, this.routingTable.nid));
        }.bind(this));
    }

    indexDHT() {
        this.routingTable.nodes.forEach(function (node) {
            this.sendSampleInfohashesRequest({
                address: node.address,
                port: node.port
            }, node.nid);
        }.bind(this));
    }

    verticalAttack() {
        this.routingTable.nodes.forEach(function (node) {
            for (var i = 0; i < this.verticalAttackNrNodes; i++) {
                this.sendFindNodeRequest({
                    address: node.address,
                    port: node.port
                }, utils.generateNeighborID(node.nid, utils.generateRandomID()));
            }
        }.bind(this));
    }

    onMessage(data, rinfo) {
        try {
            var msg = bencode.decode(data);

            if (msg.y == 'r' && msg.r.samples !== undefined) {

                // BEP51 message received
                if (msg.r.nodes) {
                    var listInfohash = [];
                    for (let i = 0; i < msg.r.samples.length; i += 20) {

                        let infohash = [];
                        for (let j = i; j < i + 20; j++) {
                            infohash[j % 20] = msg.r.samples[j];
                        }
                        infohash = Buffer.from(infohash);

                        listInfohash.push(infohash);
                    }

                    this._emitStandardForm(listInfohash, rinfo,1);
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
                
                this._emitStandardForm(msg.a.info_hash, rinfo,0);
                this.onGetPeersRequest(msg, rinfo);
            }
            else if (msg.y == 'q' && msg.q == 'announce_peer') {

                // infohash catched
                this._emitStandardForm(msg.a.info_hash, rinfo,0);
                this.onAnnouncePeerRequest(msg, rinfo);
            }
        }
        catch (err) {
            console.log(err.message);
        }
    }

    sendKRPC(msg, rinfo) {
        var buf = bencode.encode(msg);
        this.socket.send(buf, 0, buf.length, rinfo.port, rinfo.address);
    }

    sendFindNodeRequest(rinfo, nodeID) {

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
    }

    onFindNodeResponse(data) {
        var nodes = utils.decodeNodes(data);
        nodes.forEach(function (node) {
            if (node.address != this.address && node.nid != this.routingTable.nid
                && node.port < 65536 && node.port > 0) {
                this.routingTable.push(node);
            }
        }.bind(this));
    }

    sendSampleInfohashesRequest(rinfo, nid) {
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
    }

    onPingRequest(msg, rinfo) {

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
    }


    onFindNodeRequest(msg, rinfo) {
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
    }

    onGetPeersRequest(msg, rinfo) {

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
    }

    onAnnouncePeerRequest(msg, rinfo) {
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
    }

    _emitStandardForm(infohash,rinfo,type) {
        if (type) {
            this.emit('infohash', infohash, rinfo);
        } else {
            var listInfohash = [];
            listInfohash.push(infohash);

            this.emit('infohash', listInfohash, rinfo);
        }
        
    }
}

module.exports = DHTCrawler;

