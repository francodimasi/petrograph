d3.xml("../354306_diadema.xml", function(error, x) {
	if (error) throw error;

vars = [];

////////////////////////////////////////////////////////////// 
///////////////////// Initialize Locale ////////////////////// 
////////////////////////////////////////////////////////////// 

var locale = d3.locale({
	"decimal": ".",
	"thousands": ",",
	"grouping": [3],
	"currency": ["$", ""],
	"dateTime": "%a %b %e %X %Y",
	"date": "%d/%m/%Y",
	"time": "%H:%M:%S",
	"periods": ["AM", "PM"],
	"days": ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
	"shortDays": ["Dom", "Lun", "Mar", "Mi", "Jue", "Vie", "Sab"],
	"months": ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
	"shortMonths": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
});

var parseYear = locale.timeFormat("%b-%Y");
var parseDate = locale.timeFormat("%d/%m/%Y");

	Neta = [].map.call(x.querySelectorAll("PRODUCCION"), function(PRODUCCION) {
		return {
			year: parseYear.parse(PRODUCCION.querySelector("Periodo").textContent),
			position: (PRODUCCION.querySelector("Neta") !== null) ? +parseFloat(PRODUCCION.querySelector("Neta").textContent.replace(',','.').replace(' ','')) : 0
		};
	});

	Bruta = [].map.call(x.querySelectorAll("PRODUCCION"), function(PRODUCCION) {
		return {
			year: parseYear.parse(PRODUCCION.querySelector("Periodo").textContent),
			position: (PRODUCCION.querySelector("Bruta") !== null) ? +parseFloat(PRODUCCION.querySelector("Bruta").textContent.replace(',','.').replace(' ','')) : 0
		};
	});

	Acumulada = [].map.call(x.querySelectorAll("PRODUCCION"), function(PRODUCCION) {
		return {
			year: parseYear.parse(PRODUCCION.querySelector("Periodo").textContent),
			position: (PRODUCCION.querySelector("Acumulada") !== null) ? +parseFloat(PRODUCCION.querySelector("Acumulada").textContent.replace(',','.').replace(' ','')) : 0
		};
	});

	Agua = [].map.call(x.querySelectorAll("PRODUCCION"), function(PRODUCCION) {
		return {
			year: parseYear.parse(PRODUCCION.querySelector("Periodo").textContent),
			position: (PRODUCCION.querySelector("Agua") !== null) ? +parseFloat(PRODUCCION.querySelector("Agua").textContent.replace(',','.').replace(' ','')) : 0
		};
	});

	Intervenciones = [].map.call(x.querySelectorAll("INTERVENCION"), function(INTERVENCION) {
		return {
			year: (INTERVENCION.querySelector("Fecha") !== null) ? parseDate.parse(INTERVENCION.querySelector("Fecha").textContent) : null,
			position: 50,
			tipo: INTERVENCION.querySelector("Tipo").textContent,
			equipo: INTERVENCION.querySelector("Equipo").textContent,
			motivo: INTERVENCION.querySelector("Motivo").textContent,
			observaciones: INTERVENCION.querySelector("Observaciones").textContent
		};
	});


	vars.push({ name: "Bruta", values: Bruta, active: true });
	vars.push({ name: "Neta", values: Neta, active: true });
	vars.push({ name: "Acumulada", values: Acumulada, active: true });
	vars.push({ name: "Agua", values: Agua, active: true });
	vars.push({ name: "Intervenciones", values: [], active: true });


allVarNames = [];
allVarDates = [];
varNamesByID = [];
vars.forEach(function(d,i) {
    allVarNames[i] = d.name;
	varNamesByID[d.name] = i;
	d.values.forEach(function(d) {
		if (isNaN(d.position)) {
			d.position = 0;	
		}
	})
});

Bruta.forEach(function(d) {
	allVarDates.push(d.year);
});

//Brush is the higher focus chart, All is the smaller context chart	
var margin = {top: 20, right: 50, bottom: 30, left: 70},
	marginAll = {top: 20, right: 50, bottom: 30, left: 70}
    width = ($(".chart.focus").width()-10) - margin.left - margin.right,
    heightBrush = 500 - margin.top - margin.bottom,
	heightAll = 100 - marginAll.top - marginAll.bottom,
	heightInter = 30;
	
//Stroke width per max position
// var strokeWidth = [12,8,8,6,6,4,4,2,2,2];

var colorVars = d3.scale.ordinal()
		.range(["#000000", "#FF0000", "#FFA500", "#6CC4EE", "#0000FF"])
		.domain(allVarNames);


////////////////////////////////////////////////////////////// 
///////////////////// Flat Data & Scale Setup //////////////// 
////////////////////////////////////////////////////////////// 


 //Create a flat data version for the Voronoi per gender
/*************************************************************/
var flatDataVars = [];
for (k in vars) {
		var k_data = vars[k];
		k_data.values.forEach(function(d) {  
			flatDataVars.push({name: k_data.name, year: d.year, position: d.position, tipo: d.tipo, equipo: d.equipo, motivo: d.motivo, observaciones: d.observaciones, active: true});
		});
}//for k

var maxPositions = d3.nest()
	.key(function(d) { return d.name; })
	.rollup(function(d) {return d3.max(d, function(g) {return Math.ceil(g.position);});})
	.entries(flatDataVars);

var maxPosition = d3.max(maxPositions, function(d) {return d.values});

var extentsVars = d3.nest()
	.key(function(d) { return d.name; })
	.rollup(function(d) {return d3.extent(d, function(g) {return g.year;});})
	.entries(flatDataVars);


var tempMinDate = extentsVars.map(function(d) {
    return  d.values[0];
});

var tempMaxDate = extentsVars.map(function(d) {
    return  d.values[1];
});

var startYear = d3.min(d3.values(tempMinDate)),
	endYear = d3.max(d3.values(tempMaxDate)),
	yearRange = d3.time.day.range(startYear, endYear);


////////////////////////////////////////////////////////////// 
//////////////////////// Vars //////////////////////////////// 
////////////////////////////////////////////////////////////// 

//Variables needed for the looping
var color = colorVars;
var namesByID = varNamesByID;

////////////////////////////////////////////////////////////// 
////////////////////// Color Legend ////////////////////////// 
////////////////////////////////////////////////////////////// 
var marginLegend = {top: 15, right: 30, bottom: 10, left: 30},
    widthLegend = Math.min($(".colorLegend").width(),400) - marginLegend.left - marginLegend.right,
	heightLegend = 30;

var svgLegned4 = d3.select(".colorLegend").append("svg")
	.attr("width", widthLegend + marginLegend.left + marginLegend.right)
	.attr("height", heightLegend + marginLegend.bottom)
	.append("g")
	.attr("class", "colorLegendWrapper")
    .attr("transform", "translate(" + marginLegend.left + "," + marginLegend.top + ")");

var dataL = 0;
var offset = 70;

var colorLegend = svgLegned4.selectAll('.legends4')
	.data(vars, function(d) { return d.name })
	.enter().append('g')
	.attr("transform", function (d, i) {
	 if (i === 0) {
		dataL = d.name.length + offset
		return "translate(0,0)"
	} else { 
	 var newdataL = dataL
	 dataL +=  d.name.length + offset
	 return "translate(" + (newdataL) + ",0)"
	}
})

colorLegend.append('rect')
	.attr("x", 0)
	.attr("y", 0)
	.attr("width", 10)
	.attr("height", 10)
	.attr("fill", function (d, i) {
		return color(i)
	})
	.on("click",function(d){
		d.active = !d.active;

		d3.select(this).attr("fill", function(d){
		  if(d3.select(this).attr("fill")  == "#ccc"){
			for (k in flatDataVars) {
				var k_data = flatDataVars[k];
				if (k_data.name === d.name){
					flatDataVars[k].active = true;
				}
			}//for k
			return color(d.name);
		  }else {
			for (k in flatDataVars) {
				var k_data = flatDataVars[k];
				if (k_data.name === d.name){
					flatDataVars[k].active = false;
				}
			}//for k
			return "#ccc";
		  }
		})

		redraw();
	});

colorLegend.append('text')
	.attr("x", 5)
	.attr("y", 25)
	.text(function (d, i) {
		return d.name
	})
	.style("font-size", 11)
	.style("text-anchor", "middle");
			
////////////////////////////////////////////////////////////// 
///////////////////// Scales & Axes ////////////////////////// 
////////////////////////////////////////////////////////////// 

var xAll = d3.time.scale().domain([startYear, endYear]).range([0, width]),
	xBrush = d3.time.scale().domain([startYear, endYear]).range([0, width]),
	yAll = d3.scale.linear().domain([0,maxPosition]).range([heightAll, 0]),
	yAllAgua = d3.scale.linear().domain([0,100]).range([heightAll, 0]),
	yAllAcumulada = d3.scale.linear().domain([0,5]).range([heightAll, 0]),
	yBrush = d3.scale.linear().domain([0,maxPosition]).range([heightBrush, 0]),
	yBrushAgua = d3.scale.linear().domain([0,100]).range([heightBrush, 0]),
	yBrushAcumulada = d3.scale.linear().domain([0,5]).range([heightBrush, 0]),
	yInter = d3.scale.linear().domain([0,100]).range([heightInter, 0]);

var xAxisAll = d3.svg.axis().scale(xAll).orient("bottom").tickSize(0),
	xAxisBrush = d3.svg.axis().scale(xBrush).orient("bottom").tickSize(0),
	yAxisBrush = d3.svg.axis().scale(yBrush).orient("left").innerTickSize(-width).outerTickSize(5),
	yAxisAgua = d3.svg.axis().scale(yBrushAgua).orient("right").outerTickSize(5);
	yAxisAcumulada = d3.svg.axis().scale(yBrushAcumulada).orient("right").outerTickSize(5);

////////////////////////////////////////////////////////////// 
/////////////// Other initializations //////////////////////// 
////////////////////////////////////////////////////////////// 

var lineAll = d3.svg.line()
    .x(function(d) { return xAll(d.year); })
	.y(function(d) { return yAll(d.position); });

var lineAllAcumulada = d3.svg.line()
    .x(function(d) { return xAll(d.year); })
	.y(function(d) { return yAllAcumulada(d.position); });

var lineAllAgua = d3.svg.line()
    .x(function(d) { return xAll(d.year); })
	.y(function(d) { return yAllAgua(d.position); });

var lineAcumulada = d3.svg.line()
    .x(function(d) { return xBrush(d.year); })
	.y(function(d) { return yBrushAcumulada(d.position); });

var lineAgua = d3.svg.line()
    .x(function(d) { return xBrush(d.year); })
	.y(function(d) { return yBrushAgua(d.position); });

var lineBrush = d3.svg.line()
	// .interpolate("monotone") //Slight rounding without too much deviation
    .x(function(d) { return xBrush(d.year); })
	.y(function(d) { return yBrush(d.position); });


// Define the div for the tooltip
var div = d3.select("body").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);
	
////////////////////////////////////////////////////////////// 
//////////////////////// Context ///////////////////////////// 
////////////////////////////////////////////////////////////// 
	
//Create context SVG
var context = d3.select(".chart.context").append("svg")
    .attr("width", width + marginAll.left + marginAll.right)
    .attr("height", heightAll + marginAll.top + marginAll.bottom)
  .append("g")
	.attr("class", "contextWrapper")
    .attr("transform", "translate(" + marginAll.left + "," + marginAll.top + ")");
//Append clippath to context chart
context.append("defs").append("clipPath")
    .attr("id", "clipContext")
    .append("rect")
    .attr("width", width)
    .attr("height", heightAll);
	
//Append x axis to context chart
context.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + (heightAll + 5) + ")")
  .call(xAxisAll)
.selectAll(".tick text")
  .attr("y", 10);

//Vars - For the context the line needs to start put grey
//then be coloured to the name and after the brush handle be grey again
var linearGradientVars = context.selectAll(".linearGradientVars")
	.data(vars).enter()
	.append("linearGradient")
	.attr("class", "linearGradientVars")
	.attr("gradientUnits", "userSpaceOnUse")    
	.attr("x1", xAll(startYear)).attr("y1", "0")         
	.attr("x2", xAll(endYear)).attr("y2", "0")                 
	.attr("id", function(d) {return "line-gradient-vars-" + d.name; });
linearGradientVars.append("stop").attr("class", "start") .attr("offset", "0%").attr("stop-color", "#9E9E9E").attr("stop-opacity", 0.5); 
linearGradientVars.append("stop").attr("class", "left") .attr("offset", "40%").attr("stop-color", "#9E9E9E").attr("stop-opacity", 0.5); 
linearGradientVars.append("stop").attr("class", "left") .attr("offset", "40%").attr("stop-color", function(d) { return colorVars(d.name); }).attr("stop-opacity", 1); 
linearGradientVars.append("stop").attr("class", "right") .attr("offset", "60%").attr("stop-color", function(d) { return colorVars(d.name); }).attr("stop-opacity", 1); 
linearGradientVars.append("stop").attr("class", "right") .attr("offset", "60%").attr("stop-color", "#9E9E9E").attr("stop-opacity", 0.5); 
linearGradientVars.append("stop").attr("class", "end") .attr("offset", "100%").attr("stop-color", "#9E9E9E").attr("stop-opacity", 0.5); 

////////////////////////////////////////////////////////////// 
////////////////////////// Focus ///////////////////////////// 
////////////////////////////////////////////////////////////// 

//Create focus SVG
var focus = d3.select(".chart.focus").append("svg")
    .attr("width", width + margin.left + margin.right)
	.attr("height", heightBrush + margin.top + margin.bottom)
  .append("g")
	.attr("class", "focusWrapper")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//Append clippath to focus chart
focus.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", heightBrush);	

//Append x axis to focus chart	
focus.append("g")
  .attr("class", "x axis")
  .style("font-size", 13)
  .attr("transform", "translate(0," + heightBrush + ")")
  .call(xAxisBrush)
  .selectAll(".tick text")
	.attr("y", 10);
  
//Append y axis to focus chart	
focus.append("g")
  .attr("class", "y axis")
  .attr("transform", "translate(0,0)")
  .call(yAxisBrush)
.append("text")
  .attr("class", "titles")
  .attr("transform", "rotate(-90)")
  .attr("x", -(heightBrush/2))
  .attr("y", -35)
  .attr("dy", ".71em")
  .style("font-size", 14)
  .style("text-anchor", "middle")
  .text("m3/día");

focus.append("g")
  .attr("class", "y axis Agua")
  .attr("transform", "translate(" + (width) + ",0)")
  .call(yAxisAgua)
.append("text")
  .attr("class", "titles Agua")
  .attr("transform", "rotate(-90)")
  .attr("x", -(heightBrush/2))
  .attr("y", 25)
  .attr("dy", ".71em")
  .style("font-size", 14)
  .style("text-anchor", "middle")
  .text("% de Agua");

  focus.append("g")
  .attr("class", "y axis Acumulada")
  .attr("transform", "translate(-70,0)")
  .call(yAxisAcumulada);


////////////////////////////////////////////////////////////// 
////////////////////////// Inter ///////////////////////////// 
////////////////////////////////////////////////////////////// 

//Create inter SVG
var inter = d3.select(".chart.inter").append("svg")
    .attr("width", width)
	.attr("height", heightInter)
	.attr("transform", "translate( 10,0)")
  .append("g")
	.attr("class", "interWrapper");
	
//Append x axis to inter chart
inter.append("g")
  .attr("class", "x axis inter")
  .call(xAxisBrush)
.selectAll(".tick text")
  .attr("y", 10);

////////////////////////////////////////////////////////////// 
//////////////////////// Tooltip ///////////////////////////// 
////////////////////////////////////////////////////////////// 
 
var popUpName = focus.append("g")
    .attr("transform", "translate(-100,-100)")
    .attr("class", "popUpName")
	.style("pointer-events", "none");

popUpName.append("circle")
	.attr("class", "tooltipCircle")
    .attr("r", 3.5);

popUpName.append("text")
	.style("font-size", 12)
	.attr("class", "titles")
	.attr("y", -15);
	

////////////////////////////////////////////////////////////// 
//////////////////////// Voronoi ///////////////////////////// 
////////////////////////////////////////////////////////////// 

var flatData = flatDataVars;
var nestedFlatData = d3.nest().key(function(d) { return d.name; }).entries(flatData);

/*************************************************************/

//Initiate the voronoi function
var voronoi = d3.geom.voronoi()
    .x(function(d) { return xBrush(d.year); })
    .y(function(d) { 
		switch (d.name) {
			case "Acumulada":
				return yBrushAcumulada(d.position);
			case "Agua":
				return yBrushAgua(d.position);
			default:
				return yBrush(d.position);
		}
	})
    .clipExtent([[-margin.left, -margin.top], [width + margin.right, heightBrush + margin.bottom]]);
	
//Initiate the voronoi group element	
var voronoiGroup = focus.append("g")
	.attr("class", "voronoi");

//Voronoi mouseover and mouseout functions	
function mouseover(d) {

    focus.selectAll(".focus").style("opacity", 0.1);
    d3.selectAll(".focus."+d.name).style("opacity", 0.8);

	context.selectAll(".context").selectAll(".line").style("opacity", 0.1);	
	context.selectAll(".context."+d.name).selectAll(".line")
		.style("opacity", 1)
		.style("stroke", color(d.name));
	
	
	switch (d.name) {
		case "Acumulada":
			//Move the tooltip to the front
			d3.select(".popUpName").moveToFront();
			//Change position, size of circle and text of tooltip
			popUpName.attr("transform", "translate(" + xBrush(d.year) + "," + yBrushAcumulada(d.position) + ")");
			var circleSize = parseInt(d3.selectAll(".focus."+d.name).selectAll(".line").style("stroke-width"));
			popUpName.select(".tooltipCircle").style("fill", color(d.name)).attr("r", circleSize);
			popUpName.select("text").text(d.position);
			break;
		case "Agua":
			//Move the tooltip to the front
			d3.select(".popUpName").moveToFront();
			//Change position, size of circle and text of tooltip
			popUpName.attr("transform", "translate(" + xBrush(d.year) + "," + yBrushAgua(d.position) + ")");
			var circleSize = parseInt(d3.selectAll(".focus."+d.name).selectAll(".line").style("stroke-width"));
			popUpName.select(".tooltipCircle").style("fill", color(d.name)).attr("r", circleSize);
			popUpName.select("text").text(d.position + " %");
			break;
		default:
			//Move the tooltip to the front
			d3.select(".popUpName").moveToFront();
			//Change position, size of circle and text of tooltip
			popUpName.attr("transform", "translate(" + xBrush(d.year) + "," + yBrush(d.position) + ")");
			var circleSize = parseInt(d3.selectAll(".focus."+d.name).selectAll(".line").style("stroke-width"));
			popUpName.select(".tooltipCircle").style("fill", color(d.name)).attr("r", circleSize);
			popUpName.select("text").text(d.position);
			break;
	}

}//mouseover

function mouseout(d) {
    focus.selectAll(".focus").style("opacity", 0.7);
	
	context.selectAll(".context").selectAll(".line")
		.style("opacity", null)
		.style("stroke", function(c) { return "url(#line-gradient-vars-" + c.name + ")"; });
    
	popUpName.attr("transform", "translate(-100,-100)");
}//mouseout

////////////////////////////////////////////////////////////// 
/////////////////////// Brushing ///////////////////////////// 
////////////////////////////////////////////////////////////// 

//Taken and adjusted from: http://bl.ocks.org/mbostock/6498580
var centering = false,
	alpha = 1,
    center,
	moveType;
	
var brush = d3.svg.brush()
	.x(xAll)
	.extent([d3.time.month.offset(endYear, -6), endYear])
    .on("brush", brushmove)
	.on("brushend", brushend);;

//Set up the brush
var gBrush = context.append("g")
	.attr("class", "brush")
	.call(brush);

gBrush.selectAll(".resize").append("line")
	.attr("y2", heightAll);

gBrush.selectAll(".resize").append("path")
	.attr("d", d3.svg.symbol().type("triangle-up").size(100))
	.attr("transform", function(d,i) { return i ? "translate(" + -7 + "," +  heightAll / 2 + ") rotate(-90)" : "translate(" + 7 + "," +  heightAll / 2 + ") rotate(90)"; });

gBrush.selectAll("rect")
	.attr("height", heightAll);

gBrush.select(".background")
	.on("mousedown.brush", brushcenter)
	.on("touchstart.brush", brushcenter);

gBrush.call(brush.event);
	
function brushmove() {
	var extent = brush.extent();
	
	//Reset the x-axis brush domain and redraw the lines, circles and axis
	xBrush.domain(brush.empty() ? xAll.domain() : brush.extent());
	
	//Adjust the paths
	focus.selectAll(".line").attr("d", function(d) { 
		switch (d.name) {
			case "Acumulada":
				return lineAcumulada(d.values); 
			case "Agua":
				return lineAgua(d.values); 
			default:
				return lineBrush(d.values); 
		}
	});

	//Adjust the paths
	inter.selectAll(".dot").attr("x", function(d) { 
		return xBrush(d.year);
	});

	//Update the x axis and grid
	focus.select(".x.axis").call(xAxisBrush);
	inter.select(".x.axis").call(xAxisBrush);
	//focus.select(".grid").call(xAxisGrid);
  
	//Reset the grey regions of the context chart
    d3.selectAll(".left").attr("offset", ((((xBrush.domain()[0] - startYear)/(1000 * 60 * 60 * 24))/yearRange.length)*100) + "%");
	d3.selectAll(".right").attr("offset", ((((xBrush.domain()[1] - startYear)/(1000 * 60 * 60 * 24))/yearRange.length)*100) + "%");

	//Remove the previous voronoi map
	voronoiGroup.selectAll("path").remove();
	//Create a new voronoi map including only the visible points
	voronoiGroup.selectAll("path")
		.data(voronoi(flatData.filter(function(d) { return d.year.getTime() >= xBrush.domain()[0] & d.year.getTime() <= xBrush.domain()[1]; })))
		.enter().append("path")
		.filter(function(d) { return d !== undefined; })
		.attr("d", function(d) { return "M" + d.join("L") + "Z"; })
		.datum(function(d) { return d.point; })
		.attr("class", "voronoiCells")
		// .style("stroke", "red")
		.on("click", function(d) {searchEvent(d.name);});

	//If the brush move is called because the viewer clicked or searched a name
	//the mouse events should be delayed, otherwise you never see the full line
	//that was clicked
	if (moveType === "still") {
		setTimeout(function() {
			voronoiGroup.selectAll(".voronoiCells")
				.on("mouseover", mouseover)
				.on("mouseout", mouseout);
		}, 2000);
	} else {
		voronoiGroup.selectAll(".voronoiCells")
			.on("mouseover", mouseover)
			.on("mouseout", mouseout);		
	}
		
}//brushmove

function brushend() {
  if (!d3.event.sourceEvent) return; // only transition after input
  d3.select(this).transition()
      .call(brush.extent(brush.extent().map(function(d) { return d3.round(d, 0); })))
      .call(brush.event);
}//brushend

function brushcenter() {
  var self = d3.select(window),
      target = d3.event.target,
      extent = brush.extent(),
	  size = extent[1] - extent[0],
	  domain = xAll.domain(),
      x0 = domain[0].getTime() + size / 2,
	  x1 = domain[1].getTime() - size / 2,
	  odd = Math.round(size * 1000) & 1;

  recenter(true);
  brushmove();

  if (d3.event.changedTouches) {
    self.on("touchmove.brush", brushmove).on("touchend.brush", brushend);
  } else {
    self.on("mousemove.brush", brushmove).on("mouseup.brush", brushend);
  }

  function brushmove() {
	d3.event.stopPropagation();
	center = d3.round(Math.max(x0, Math.min(x1, xAll.invert(d3.mouse(target)[0]).getTime() + odd * .05)), 1) - odd * .05;
	recenter(false);
  }

  function brushend() {
    brushmove();
    self.on(".brush", null);
  }
}//brushcenter

function recenter() {
  if (centering) return; // timer is active and already interpolating
  centering = true;
  d3.timer(function() {
    var extent = brush.extent(),
		size = extent[1] - extent[0],
		center1 = center * alpha + (extent[0] + extent[1]) / 2 * (1 - alpha);

    if (!(centering = Math.abs(center1 - center) > 1e-3)) center1 = center;

    gBrush
        .call(brush.extent([new Date(center1 - size / 2), new Date(center1 + size / 2)]))
        .call(brush.event);

    return !centering;
  });
}//recenter
 
////////////////////////////////////////////////////////////// 
////////////////////////// Buttons /////////////////////////// 
////////////////////////////////////////////////////////////// 

d3.select("#ytd").on("click", function(e) { gBrush.call(brush.extent([startYear, endYear])).call(brush.event); });
d3.select("#oneYear").on("click", function(e) { gBrush.call(brush.extent([new Date(endYear - (1000 * 60 * 60 * 24 * 365)), endYear])).call(brush.event); });
d3.select("#threeMonths").on("click", function(e) { gBrush.call(brush.extent([new Date(endYear - (1000 * 60 * 60 * 24 * 90)), endYear])).call(brush.event); });
d3.select("#threeMonths").on("click", function(e) { gBrush.call(brush.extent([new Date(endYear - (1000 * 60 * 60 * 24 * 90)), endYear])).call(brush.event); });
// d3.select("#pdf").on("click", function(e) { 
// 	canvas = document.getElementById('canvasId');
// 	svgHtml = document.getElementById('canvasFocus').innerHTML.trim();
// 	canvg(canvas,svgHtml);

// 	html2canvas(canvas, {
// 		onrendered: function(canvas) {         
// 			var imgData = canvas.toDataURL('image/png')  
// 			var doc = new jsPDF()
// 			doc.addImage(imgData, 'PNG', 10, 10)
// 			doc.save('pie.pdf')
// 		}
// 	})	
// 	});

////////////////////////////////////////////////////////////// 
/////////////////////////// Search /////////////////////////// 
////////////////////////////////////////////////////////////// 
//Function to fire when somebody searches for a name
var nameTimer;

function searchEvent(name) {
				
	//If the name is not equal to the default, find that name and highlight it - mouseover function
	if (name != "") {
	
		//Change the GIRLS / BOYS label to the chosen name for several seconds
		d3.select(".genderTitle").text(name)
		d3.select(".genderTitle").style("color", color(name));
		clearTimeout(nameTimer);
		nameTimer = setTimeout(function(e) {
			d3.select(".genderTitle").text("Pozo X");
			d3.select(".genderTitle").style("color", null);
		}, 3000);

		//Take all the years in the top 10 of the name and reset the brush 
		//to the time between the first and last occurrence
		var subset = nestedFlatData[namesByID[name]].values;
		var minYear = Math.max(startYear, d3.min(subset, function(d) { return d.year.getTime();}));
		var maxYear = Math.min(endYear, d3.max(subset, function(d) {return d.year.getTime();}));
		//Call the resetting of the brush
		moveType = "still"
		gBrush.call(brush.extent([new Date(minYear), new Date(maxYear)])).call(brush.event);
		
		//Wait a bit with making the lines transparent, otherwise the brush functions
		//will reset it again
		setTimeout(function(){
			popUpName.attr("transform", "translate(-100,-100)");
			
			//First set all opacities low and the chosen one back to 1
			focus.selectAll(".focus").style("opacity", 0.1);
			d3.selectAll(".focus."+name).style("opacity", 1);

			context.selectAll(".context").selectAll(".line").style("opacity", 0.1);	
			context.selectAll(".context."+name).selectAll(".line")
				.style("opacity", 1)
				.style("stroke", color(name));
		}, 100);
		
		//Reset the moving type to an arbitrary word
		setTimeout(function(){
			moveType = "nothing";
		}, 500);
	
	} else {
		d3.select(".genderTitle").text("Pozo X");
		//Reset all opacities and strokes
		focus.selectAll(".focus").style("opacity", 0.7);		
		context.selectAll(".context").selectAll(".line")
			.style("opacity", null)
			.style("stroke", function(c) { return "url(#line-gradient-vars-" + c.name + ")"; });	
	}//else
	
}//searchEvent

////////////////////////////////////////////////////////////// 
///////////////////// Helper functions /////////////////////// 
////////////////////////////////////////////////////////////// 
//Move selected element to the front
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

var loopTimer;
function stopTimer() {
	clearTimeout(loopTimer);
}//removeTimers

function startTimer() {
	loopTimer = setInterval(function() {
		var num = Math.round(Math.random()*allNames.length);
		changeName(allNames[num], allGenders[num]);
	}, 4000);
}//startTimer

//Focus the chart on a name
function changeName(name) { 
	console.log(name);
}//changeName

//Reset the focus range years
function changeYears() { 
	
	start = document.getElementById("searchFrom").value;
	end = document.getElementById("searchTo").value;

	console.log(start);
	console.log(end);

	if(d3.time.day.range(parseYear.parse(start), parseYear.parse(end)) > 0) {
		gBrush.call(brush.extent([start, end])).call(brush.event);
	} 		
}//changeYears

////////////////////////////////////////////////////////////// 
////////////////////////// Draw ////////////////////////////// 
////////////////////////////////////////////////////////////// 

function redraw() {
	
	var data;

	////////////////////////////////////////////////////////////// 
	//////////// Switch variables between genders //////////////// 
	////////////////////////////////////////////////////////////// 

	flatData = flatDataVars.filter(function(d) { return d.active == true });
	data = vars.filter(function(d) { return d.active == true });

	// maxPosition = maxPositionVars;
	nestedFlatData = d3.nest().key(function(d) { return d.name; }).entries(flatData);
	
	//Change id mapping
	namesByID = varNamesByID;
	//Reset the color domain
	color = colorVars;
	
	d3.select(".genderTitle").text("Pozo X");

	////////////////////////////////////////////////////////////// 
	///////////////////////// Context //////////////////////////// 
	////////////////////////////////////////////////////////////// 	

  	//Add the lines to context chart
	var contextWrapper = context.selectAll(".context")
		.data(data, function(d) { return d.name; });
	  
	//UPDATE
	contextWrapper.attr("class", function(d) {return "focus " + d.name ;});
	contextWrapper.selectAll(".line")
		.attr("d", function(d) { 
			switch (d.name) {
				case "Acumulada":
					return lineAllAcumulada(d.values); 
				case "Agua":
					return lineAllAgua(d.values); 
				default:
					return lineAll(d.values); 
			}
		})
		.style("stroke", function(d) {return "url(#line-gradient-vars-" + d.name + ")"; });	
	
	//ENTER 
	contextWrapper
		.enter().append("g")
		.attr("class", function(d) {return "context " + d.name ;})
		.append("path")
			.attr("class", "line")
			.attr("d", function(d) { 
				switch (d.name) {
					case "Acumulada":
						return lineAllAcumulada(d.values); 
					case "Agua":
						return lineAllAgua(d.values); 
					default:
						return lineAll(d.values); 
				}
			})
			.style("stroke", function(d) {return "url(#line-gradient-vars-" + d.name + ")"; })
			.style("stroke-width", 1.25)
			.attr("clip-path", "url(#clipContext)")
			.style("opacity", 0)
			.transition().duration(750).delay(500)
			.style("opacity", 1);

	//EXIT
	contextWrapper.exit()
		.transition().duration(750)
		.style("opacity", 0)
		.remove();			

	////////////////////////////////////////////////////////////// 
	////////////////////////// Focus ///////////////////////////// 
	////////////////////////////////////////////////////////////// 	
	//Add a g element per name
	var focusWrapper = focus.selectAll(".focus")
		.data(data, function(d) { return d.name; }); 
	 
	//UPDATE
	focusWrapper.attr("class", function(d) {return "focus " + d.name ;});
	focusWrapper.selectAll(".line")
		.attr("d", function(d) { 
			switch (d.name) {
				case "Acumulada":
					return lineAcumulada(d.values); 
				case "Agua":
					return lineAgua(d.values); 
				default:
					return lineBrush(d.values); 
			}
		})
		// .style("stroke-width", function(d) {return strokeWidth[maxPosition[namesByID[d.name]].values - 1]; })
		.style("stroke-width", 5)
		.style("stroke", function(d) { return color(d.name); });
	 
	//ENTER
	//Add the lines of the vars to focus chart 
	focusWrapper
		.enter().append("g")
		.attr("class", function(d) {return "focus " + d.name ;})
		.append("path")
			.attr("class", "line")
			.attr("clip-path", "url(#clip)")
			.style("pointer-events", "none")
			.style("stroke-linejoin", "round")
			.style("opacity", 0)
			.attr("d", function(d) { 
				switch (d.name) {
					case "Acumulada":
						return lineAcumulada(d.values); 
					case "Agua":
						return lineAgua(d.values); 
					default:
						return lineBrush(d.values); 
				}
			})
			// .style("stroke-width", function(d) {return strokeWidth[maxPosition[namesByID[d.name]].values - 1]; })
			.style("stroke-width", 5)
			.style("stroke", function(d) {return color(d.name); })
	
	
	//Small delay so the brush can run first		
	focusWrapper.selectAll(".line")	
			.transition().duration(750).delay(500)
			.style("opacity", 0.7);
	
	//EXIT
	focusWrapper.exit()
		.transition().duration(750)
		.style("opacity", 0)
		.remove(); 


	////////////////////////////////////////////////////////////// 
	////////////////////////// Inter ///////////////////////////// 
	////////////////////////////////////////////////////////////// 	
	//Add a g element per name
	var interWrapper = inter.selectAll(".inter")
		.data(Intervenciones);
	 
	//UPDATE
	interWrapper.selectAll(".dot")
		.attr("width", 10)
		.attr("height", 10)
		.attr("x", function(d) { return xBrush(d.year); })
		.attr("y", function(d) { return yInter(d.position); })
	 
	//ENTER
	//Add the lines of the vars to focus chart 
	interWrapper
		.enter()
		.append("rect")
			.attr("class", "dot")
			.attr("width", 10)
			.attr("height", 10)
			.attr("x", function(d) { return xBrush(d.year); })
			.attr("y", function(d) { return yInter(d.position); })
			.style("fill", "#0000FF")
			.on("mouseover", function(d) {		
				div.transition()		
					.duration(200)		
					.style("opacity", .9);		
				div	.html(parseDate(d.year) + "<br/><strong>Tipo:</strong> " + d.tipo + "<br/><strong>Equipo:</strong> " + d.equipo + "<br/><strong>Motivo:</strong> " + d.motivo + "<br/><strong>Obs:</strong> " + d.observaciones)	
					.style("left", (d3.event.pageX - 130) + "px")		
					.style("top", (d3.event.pageY - 90) + "px");	
				})					
			.on("mouseout", function(d) {		
				div.transition()		
					.duration(500)		
					.style("opacity", 0);	
			});;

	// Small delay so the brush can run first		
	interWrapper.selectAll(".dot")	
			.transition().duration(750).delay(500)
			.style("opacity", 0.7);
	
	// EXIT
	interWrapper.exit()
		.transition().duration(750)
		.style("opacity", 0)
		.remove(); 
		
	////////////////////////////////////////////////////////////// 
	///////////////////////// Voronoi //////////////////////////// 
	////////////////////////////////////////////////////////////// 	

	//Remove the previous voronoi map
	voronoiGroup.selectAll("path").remove();
	//Create a new voronoi map including only the visible points
	voronoiGroup.selectAll("path")
		.data(voronoi(flatData.filter(function(d) {return d.year.getTime() >= xBrush.domain()[0] & d.year.getTime() <= xBrush.domain()[1]; })))
		.enter().append("path")
		.filter(function(d) { return d !== undefined; })
		.attr("d", function(d) { return "M" + d.join("L") + "Z"; })
		.datum(function(d) { return d.point; })
		// .style("stroke", "red")
		.attr("class", "voronoiCells")
		.on("mouseover", mouseover)
		.on("mouseout", mouseout)
		.on("click", function(d) {searchEvent(d.name);});
	
	//Move the brush handles to the front
	d3.select(".brush").moveToFront();
	
}//redraw


$(document).ready(function(){
	
	$(function() {
		$('input[name="daterange"]').daterangepicker({
		    locale: {
				"format": "DD/MM/YYYY",
				"separator": " - ",
				"applyLabel": "Aplicar",
				"cancelLabel": "Cancelar",
				"fromLabel": "Desde",
				"toLabel": "Hasta",
				"customRangeLabel": "Custom",
				"weekLabel": "S",
				"daysOfWeek": [
					"Dom",
					"Lun",
					"Mar",
					"Mie",
					"Jue",
					"Vie",
					"Sab"
				],
				"monthNames": [
					"Enero",
					"Febrero",
					"Marzo",
					"Abril",
					"Mayo",
					"Junio",
					"Julio",
					"Agosto",
					"Septiembre",
					"Octubre",
					"Noviembre",
					"Diciembre"
				],
				"firstDay": 1
			},
		  opens: 'left',
		  buttonClasses: "btn btn-default",
		  startDate: startYear,
		  endDate: endYear
		}, function(start, end, label) {
		  gBrush.call(brush.extent([start, end])).call(brush.event);
		});
	  });
	
	
	////////////////////////////////////////////////////////////// 
	/////////////////////////// Start //////////////////////////// 
	////////////////////////////////////////////////////////////// 
	//Create the lines
	redraw();
});

});
