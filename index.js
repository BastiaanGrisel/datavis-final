// Creat a WebSocketServer
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8080});

var util = require('util');
var pcap = require('pcap');

var session = pcap.createSession('', 'tcp');
var clients = [];

wss.on('connection', function(ws) {
	clients.push(ws);

	ws.on('close', function() {
	    clients.splice(clients.indexOf(ws), 1);
	});	
});

session.on('packet', function(raw_packet) {
	var packet = pcap.decode.packet(raw_packet);

	for (client in clients)
		clients[client].send(JSON.stringify(packet));
});

setInterval(function(){
	console.log("Connected clients: ", clients.length)
}, 500)
