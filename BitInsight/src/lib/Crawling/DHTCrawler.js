'use strict';

var EventEmitter = require('events')
var dgram = require('dgram');
var bencode = require('bencode');
var utils = require('../utils');
var RoutingTable = require('./RoutingTable');

//TODO: Implement BitTorrent Protocol Extension http://www.bittorrent.org/beps/bep_0005.html Tracker peers exhange DHT data
//TODO: Make vertical attack only on interesting targets
class DHTCrawler extends EventEmitter {

    constructor(options) {
        super();

        this.address = options.address || '0.0.0.0';
        this.port = options.port || 6881;
        this.dhtAnnouncing = options.dhtAnnouncing || 1000;
        this.BOOTSTRAP_NODES = options.BOOTSTRAP_NODES;
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

        this.refreshInterval = setInterval(function () {

            this.contactBootstrapNodes();
            this.horrizontalAttack();

            if (this.verticalAttackMode == true) //TODO: Heuristically decide if vertical attack is feazible
                this.verticalAttack();

            if (this.BEP51Mode == true)
                this.indexDHT();

            this.routingTable.nodes = [];
        }.bind(this), this.dhtAnnouncing);
    }

    end() {
        clearInterval(this.refreshInterval);
        this.socket.close();
    }

    contactBootstrapNodes() {
        this.BOOTSTRAP_NODES.forEach(function (node) {
            this.sendFindNodeRequest({ address: node[0], port: node[1] }, this.routingTable.nid);
        }.bind(this));
    }

      /* 
   * Send KRPC find_node query to all nodes in the kbucket. The queryingNodeId is
   * calculated by using some high bytes of peer node's id, which makes our id close
   * to the peer node XOR wise.
   * After broadcasting, nodes in the kbucket are useless for crawler's sake. Just
   * empty the kbucket for future peer nodes.
   */
    horrizontalAttack() {

        // generateNeighborID(nid, this.routingTable.nid) to have greater chance that others store my id in their routing table (close to him)
        // this.routingTable.nid to have same id, if i send to him my id. Random or this?
        this.routingTable.nodes.forEach(function (node) {
            this.sendFindNodeRequest({
                address: node.address,
                port: node.port
            }, utils.generateNeighborID(node.nid, this.routingTable.nid))
        }.bind(this));
    }

    verticalAttack() {
        this.routingTable.nodes.forEach(function (node) {
            for (var i = 0; i < this.verticalAttackNrNodes; i++) {
                utils.generateRandomIDAsync(node, null, function (node, x, randomID) {

                    // We limit the number of outgoing UDP requests to 1000 packages per second.
                    setTimeout(function () {
                        this.sendFindNodeRequest({
                            address: node.address,
                            port: node.port
                        }, utils.generateNeighborID(node.nid, randomID));
                    }.bind(this), 0)

                }.bind(this));
            }
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


      /*
   * The KRPC protocol is a simple RPC mechanism consisting of bencoded dictionaries sent
   * over UDP. A single query packet is sent out and a single packet is sent in response. 
   * There is no retry.
   */
    sendKRPC(msg, rinfo) {
        var buf = bencode.encode(msg);
        this.socket.send(buf, 0, buf.length, rinfo.port, rinfo.address);
    }

      /*
   * The KRPC find_node query lets other DHT peer nodes know us. Before having any peer
   * nodes, bootstrap nodes are used to query selfId. Then nodes from find_node responses
   * can be used to fill up the kbucket. Once there are some nodes in the kbucket, further
   * find_node queries can be made by using peer nodes' neighbor id.
   */
    sendFindNodeRequest(rinfo, personalID) {
        utils.generateRandomIDAsync(rinfo, personalID, function (rinfo, personalID, targetID) {
            var msg = {
                t: targetID.slice(0, 4),
                y: 'q',
                q: 'find_node',
                a: {
                    id: personalID,
                    target: targetID
                }
            };
            this.sendKRPC(msg, rinfo);

        }.bind(this));
    }

    sendSampleInfohashesRequest(rinfo, nid) {
        utils.generateRandomIDAsync(rinfo, nid, function (rinfo, nid, targetID) {
            var msg = {
                t: targetID.slice(0, 4),
                y: 'q',
                q: 'sample_infohashes',
                a: {
                    id: this.routingTable.nid,
                    target: targetID //TODO:random or static->speed
                }
            };

            this.sendKRPC(msg, rinfo);

        }.bind(this));
    }



    ////////////////////////////////////////////////Messages got////////////////////////////////////
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

                // horrizontal attack: not to be deleted from nodes tables or Bootstrap node's protection
                this.onPingRequest(msg, rinfo);
            }
            else if (msg.y == 'q' && msg.q == 'find_node') {

                // horrizontal attack: not to be deleted from nodes tables or Bootstrap node's protection
                this.onFindNodeRequest(msg, rinfo);
            }
            else if (msg.y == 'q' && msg.q == 'get_peers') {

                // passively observe get_peers querries
                // infohash catched
                this.onGetPeersRequest(msg, rinfo);
            }
            else if (msg.y == 'q' && msg.q == 'announce_peer') {

                // infohash catched
                this.onAnnouncePeerRequest(msg, rinfo);
            }
        }
        catch (err) {
            console.log(err.message);
        }
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

    onPingRequest(msg, rinfo) {
        //TODO: Verify if it's a bootstrap node. If it is, send only my id
        //QUestion: Does bootstrap verify its nodes? Maybe

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
                nodes: utils.encodeNodes(this.routingTable.pop8())  //Previous: this.routingTable.nid
            }
        }, rinfo);
    }

      /*
   * First 2 bytes of infohash are used to be the token. If the peer querying for
   * the infohash finds it in the future, it is supposed to send announce_peer to
   * us with the token, which can be used to verify the announce_peer packet.
   * The infohash in the message is not guaranteed to be legit.  
   */
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
                nodes: utils.encodeNodes(this.routingTable.pop8()), //Previous:''
                token: token
            }
        }, rinfo);

        this._emitStandardForm(msg.a.info_hash, rinfo, 0);
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


            /* There is an optional argument called implied_port which value is either 0 or 1.
     * If it is present and non-zero, the port argument should be ignored and the source 
     * port of the UDP packet should be used as the peer's port instead.
     */
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


        this._emitStandardForm(msg.a.info_hash, rinfo, 0);
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

