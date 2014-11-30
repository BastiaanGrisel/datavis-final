// Creat a WebSocketServer
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8080});

var util = require('util');
var pcap = require('pcap');

var session = pcap.createSession('', 'tcp');
var clients = [];
var my_ips = get_ip_addresses(session);

wss.on('connection', function(ws) {
	// First send the client the IP address of the server
	ws.send(JSON.stringify({"type": "ip", "ip": my_ips}));

	clients.push(ws);
	log_clients();

	ws.on('close', function() {
	    clients.splice(clients.indexOf(ws), 1);
	    log_clients();
	});	
});

session.on('packet', function(raw_packet) {
	var packet = pcap.decode.packet(raw_packet);

	for (client in clients)
		clients[client].send(JSON.stringify({"type": "packet", "packet": packet}));
});

function log_clients() {
	console.log("Connected clients: ", clients.length);
}

function get_ip_addresses(session) {
	res = [];

	session
		// Find all the interfaces
		.findalldevs()
		// Get adresses of the active one
		.filter(function(all_devs) { return session.device_name === all_devs.name; })[0].addresses
		.forEach(function(e){ res.push(e.addr) })

	return res;
}


