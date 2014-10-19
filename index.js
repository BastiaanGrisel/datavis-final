// Creat a WebSocketServer
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8080});

var util = require('util');
var pcap = require('pcap');

var session = pcap.createSession('', 'tcp');

wss.on('connection', function(ws) {
	session.on('packet', function(raw_packet) {
		var packet = pcap.decode.packet(raw_packet);
    	ws.send(JSON.stringify(packet));
	});
});
