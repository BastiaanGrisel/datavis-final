d3.select(window).on("resize", throttle);

var map_width  = document.getElementById('map_container').offsetWidth,
	map_height = document.getElementById('map_container').offsetHeight;

var zoom = d3.behavior.zoom()
	.scaleExtent([1, 9])
	.on("zoom", move);

var topo,projection,path,svg,g;

var country_color = d3.scale.linear().domain([0, 10000]).range(["#ccc", "red"]);

var tooltip = d3.select("#map_container").append("div").attr("class", "tooltip hidden");

setup(map_width, map_height);

function setup(width, height) {
	projection = d3.geo.mercator()
		.translate([width/2, (height/2)])
		.scale( width / 2 / Math.PI);

	path = d3.geo.path().projection(projection);

	svg = d3.select("#map_container").append("svg")
		.attr("width", width)
		.attr("height", height)
		.call(zoom)
		//.on("click", click)
		.append("g");

	g = svg.append("g");
}

function draw(topo) {
	var domain_max = d3.max(topo, function(d) { 
		if(d.stats !== undefined) {
			return  d.stats.packets_total.in + 
					d.stats.packets_total.out + 
					d.stats.size_total.in + 
					d.stats.size_total.out;
		}
		return 10000;
	});

	country_color.domain([0, domain_max]);
	d3.select("#legend #legend_max span").text(Math.round(domain_max/(1024*1024)*100)/100);

	var country = g.selectAll(".country").data(topo);

	country
		.attr("d", path)
		.attr("id", function(d,i) { return d.id; })
		.attr("title", function(d,i) { return d.properties.name; })
		.attr("fill", function(d, i) { 
			if(d.stats !== undefined) {
				return country_color(
					d.stats.packets_total.in + 
					d.stats.packets_total.out + 
					// d.stats.packets_ps.in + 
					// d.stats.packets_ps.out + 
					d.stats.size_total.in + 
					d.stats.size_total.out 
					// d.stats.size_ps.in + 
					// d.stats.size_ps.out
					)
			}
			return d.properties.color; 
		})
	.enter().insert("path")
		.attr("class", "country")
		.attr("d", path)
		.attr("id", function(d,i) { return d.id; })
		.attr("title", function(d,i) { return d.properties.name; })
		.attr("fill", function(d, i) { 
			if(d.stats !== undefined) {
				return country_color(
					d.stats.packets_total.in + 
					d.stats.packets_total.out + 
					// d.stats.packets_ps.in + 
					// d.stats.packets_ps.out + 
					d.stats.size_total.in + 
					d.stats.size_total.out 
					// d.stats.size_ps.in + 
					// d.stats.size_ps.out
					)
			}
			return d.properties.color; 
		})

	// offsets for tooltips
	var offsetL = document.getElementById('map_container').offsetLeft+20;
	var offsetT = document.getElementById('map_container').offsetTop+10;

	// tooltips
	country
		.on("mousemove", function(d,i) {
			var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );

			tooltip.classed("hidden", false)
				.attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
				.html(d.properties.name);
		})
		.on("mouseout",  function(d,i) {
			tooltip.classed("hidden", true);
		})
		.on("click", function(country,i) {
			filter_country(country);
		});

	// var route = svg.append("path")
 //           .datum({type: "LineString", coordinates: [[50,50], [100,50]]})
 //           .attr("class", "route")
 //           .attr("d", path);
}

function redraw() {
	width = document.getElementById('map_container').offsetWidth;
	height = width / 2;
	// d3.select('svg').remove();
	// setup(width,height);
	draw(_.values(countries));
}

function move() {
	var t = d3.event.translate;
	var s = d3.event.scale; 
	zscale = s;
	var h = map_height/4;

	t[0] = Math.min(
		(map_width/map_height)  * (s - 1), 
		Math.max( map_width * (1 - s), t[0] )
		);

	t[1] = Math.min(
		h * (s - 1) + h * s, 
		Math.max(map_height  * (1 - s) - h * s, t[1])
		);

	zoom.translate(t);
	g.attr("transform", "translate(" + t + ")scale(" + s + ")");

	//adjust the country hover stroke width based on zoom level
	d3.selectAll(".country").style("stroke-width", 1.5 / s);
}

var throttleTimer;
function throttle() {
	window.clearTimeout(throttleTimer);
	throttleTimer = window.setTimeout(function() {
		redraw();
	}, 200);
}

//geo translation on mouse click in map
function filter_country(country) {
	console.log(country);
}

//function to add points and text to the map (used in plotting capitals)
function addpoint(lat,lon,text) {
	var gpoint = g.append("g").attr("class", "gpoint");
	var x = projection([lat,lon])[0];
	var y = projection([lat,lon])[1];

	gpoint.append("svg:circle")
	.attr("cx", x)
	.attr("cy", y)
	.attr("class","point")
	.attr("r", 1.5);

  //conditional in case a point has no associated text
  if(text.length>0){

  	gpoint.append("text")
  	.attr("x", x+2)
  	.attr("y", y+2)
  	.attr("class","text")
  	.text(text);
  }
}