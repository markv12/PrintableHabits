"use strict";
function Generate(){
  var habit_name = document.getElementById("habit_name").value;
  var num_spaces_input = document.getElementById("num_spaces");
  var num_spaces = num_spaces_input.value;

  if(num_spaces > 5000){
    num_spaces = 5000;
  } else if(num_spaces < 2){
    num_spaces = 2;
  }
  num_spaces = Math.round(num_spaces);
  num_spaces_input.value = num_spaces; //Ensure number input matches parsed value

  document.getElementById("display_title").innerHTML = habit_name;
  var voronoi = new Voronoi();

  var width = 800;
  var height = 600;

  var bbox = {xl: 0, xr: width, yt: 0, yb: height}; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
  var sites = [];
  for (var i = 0; i < num_spaces; i++) {
    sites.push({x: Math.random()*width, y: Math.random()*height});
  }
  var voronoi_diagram = voronoi.compute(sites, bbox);
  console.log(voronoi_diagram);
  var svgContainer = document.getElementById("svg_container");
  svgContainer.innerHTML = ""
  svgContainer.appendChild(GenerateSVG(voronoi_diagram, width, height));
  document.getElementById("print_button").style.display = "inline-block";
}

function GenerateSVG(voronoi_diagram, width, height){
  const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg1.setAttribute("width", width+6);
  svg1.setAttribute("height", height+6);

  for (var i = 0; i < voronoi_diagram.edges.length; i++) {
    var edge = voronoi_diagram.edges[i];
    var svg_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    svg_line.setAttribute("x1", edge.va.x+3);
    svg_line.setAttribute("y1", edge.va.y+3);
    svg_line.setAttribute("x2", edge.vb.x+3);
    svg_line.setAttribute("y2", edge.vb.y+3);
    svg_line.setAttribute("style", "stroke:rgb(0,0,0);stroke-width:5");
    svg1.appendChild(svg_line);
  }
  var borderRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  borderRect.setAttribute("x", 2);
  borderRect.setAttribute("y", 2);
  borderRect.setAttribute("width", width+1);
  borderRect.setAttribute("height", height+1);
  borderRect.setAttribute("style", "stroke:rgb(0,0,0);stroke-width:5;fill-opacity:0;");
  svg1.appendChild(borderRect);

  return svg1;
}