// Creat a WebSocketServer
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8080});

var util = require('util');
var pcap = require('pcap');

var session = pcap.createSession('', 'tcp');
var clients = [];

wss.on('connection', function(ws) {
	clients.push(ws);
	logClients();

	ws.on('close', function() {
	    clients.splice(clients.indexOf(ws), 1);
	    logClients();
	});	
});

session.on('packet', function(raw_packet) {
	var packet = pcap.decode.packet(raw_packet);

	for (client in clients)
		clients[client].send(JSON.stringify(packet));
});

function logClients() {
	console.log("Connected clients: ", clients.length);
}
