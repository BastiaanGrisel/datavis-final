var WebSocketServer = require('ws').Server,
	Router 	= require("node-simple-router"),
	util 	= require('util'),
 	pcap 	= require('pcap'),
	swig 	= require("swig"),
	http 	= require("http"),
	geo_reader = require('maxmind-db-reader'),
	getIP = require('external-ip')();

var session = pcap.createSession('', 'tcp'),
	geolocation = geo_reader.openSync('./public/data/GeoLite2-Country.mmdb'),
	router 	= new Router(),
	server 	= http.createServer(router),
	wss 	= new WebSocketServer({port: 8080}),
	clients = [],
	internal_ips = get_ip_addresses(session),
	external_ip = null;

getIP(function (err, ip) {
    if (err) {
        // every service in the list has failed 
        throw err;
    }
    
    external_ip = ip;

    // Websocket server code
	wss.on('connection', function(ws) {
		// First send the client the IP address(es) of the server
		ws.send(JSON.stringify({"type": "ip", "ip": external_ip}));

		clients.push(ws);
		log_clients(); // Display the number of connected clients in the terminal

		ws.on('close', function() {
		    clients.splice(clients.indexOf(ws), 1);
		    log_clients();
		});	
	});

	session.on('packet', function(raw_packet) {
		var packet = pcap.decode.packet(raw_packet);

		var saddr = packet.payload.payload.saddr.toString();
		var daddr = packet.payload.payload.daddr.toString();
		var size  = packet.pcap_header.len;

		if(internal_ips.indexOf(saddr) != -1) {
			saddr = external_ip;
		}

		if(internal_ips.indexOf(daddr) != -1) {
			daddr = external_ip;
		}

		try {
			saddr = geolocation.getGeoDataSync(saddr).country.iso_code;
			daddr = geolocation.getGeoDataSync(daddr).country.iso_code;

			// Dispatch the packet to all connected clients
			for (client in clients)
				clients[client].send(JSON.stringify({"type": "packet", "packet": {"sloc": saddr, "dloc": daddr, "size": size}}));
		} catch(err) {
			console.log("No country found ("+err+")");
		}
	});

    server.listen(80);
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
		.forEach(function(e){ res.push(e.addr); })

	return res;
}


// HTTP server code
router.get("/", function(request, response) {
	response.writeHead(200, {"Content-Type": "text/html"});

	response.write(swig.renderFile("index.html"));
	response.end();
});

