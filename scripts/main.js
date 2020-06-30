"use strict";
function Generate(){
  var habit_name = document.getElementById("habit_name").value;
  var habit_desc = document.getElementById("habit_description").value;
  var num_cells_input = document.getElementById("num_cells");
  var num_cells = GetNumberFromInput(num_cells_input, 2, 5000);

  var cell_size_input = document.getElementById("cell_size");
  var cell_size = GetNumberFromInput(cell_size_input, 5, 1000);

  var line_thickness_input = document.getElementById("line_thickness");
  var line_thickness = GetNumberFromInput(line_thickness_input, 1, 100);

  document.getElementById("display_title").innerHTML = habit_name;

  var desc_element = document.getElementById("display_description");
  desc_element.style.display = (habit_desc && habit_desc.trim()) ? "inline-block" : "none";
  desc_element.innerHTML = habit_desc;

  var dimensions = GetDimensions(num_cells, cell_size);
  var y_decimal = num_cells/dimensions.x;
  var remainder = y_decimal - Math.floor(y_decimal);
  if(remainder == 0){
    remainder = 1;
  }
  var y_adjust = remainder - 1;
  var width = dimensions.x * cell_size;
  var height = (dimensions.y + y_adjust) * cell_size;

  var bbox = {xl: 0, xr: width, yt: 0, yb: height}; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
  var sites = GetVoronoiSites(num_cells, cell_size, dimensions, height);

  var voronoi = new Voronoi();
  var voronoi_diagram = voronoi.compute(sites, bbox);
  var svgContainer = document.getElementById("svg_container");
  svgContainer.innerHTML = ""
  svgContainer.appendChild(GenerateSVG(voronoi_diagram, width, height, line_thickness));
  document.getElementById("print_button").style.display = "inline-block";
}

function GenerateSVG(voronoi_diagram, width, height, line_thickness){
  const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg1.setAttribute("width", width+6);
  svg1.setAttribute("height", height+6);

  var line_style_text = "stroke:rgb(0,0,0);stroke-width:" + line_thickness + ";"
  var rect_style_text = "stroke:rgb(0,0,0);stroke-width:" + line_thickness + ";fill-opacity:0;"
  for (var i = 0; i < voronoi_diagram.edges.length; i++) {
    var edge = voronoi_diagram.edges[i];
    var svg_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    svg_line.setAttribute("x1", edge.va.x+3);
    svg_line.setAttribute("y1", edge.va.y+3);
    svg_line.setAttribute("x2", edge.vb.x+3);
    svg_line.setAttribute("y2", edge.vb.y+3);
    svg_line.setAttribute("style", line_style_text);
    svg1.appendChild(svg_line);
  }
  var borderRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  borderRect.setAttribute("x", 2);
  borderRect.setAttribute("y", 2);
  borderRect.setAttribute("width", width+1);
  borderRect.setAttribute("height", height+1);
  borderRect.setAttribute("style", rect_style_text);
  svg1.appendChild(borderRect);

  return svg1;
}

function GetNumberFromInput(num_input, min, max){
  var the_value = num_input.value;
  if(the_value > max){
    the_value = max;
  } else if(the_value < min){
    the_value = min;
  }
  the_value = Math.round(the_value);
  num_input.value = the_value; //Ensure number input matches parsed value
  return the_value;
}

function GetDimensions(num_cells, cell_size){
  var x = Math.floor(Math.sqrt(num_cells));
  x = Math.floor(Math.min(1000, cell_size*x)/cell_size); //Ensure x doesn't make the chart too wide
  var y = Math.ceil(num_cells/x);
  return {x:x, y:y};
}

function GetVoronoiSites(num_cells, cell_size, dimensions, max_height){
  var half_cell_size = cell_size/2;
  var adjust_scale = cell_size/1.2;
  var half_adjust_scale = adjust_scale/2;
  var sites = [];

  var remainder = num_cells % dimensions.x;

  for (var i = 0; i < num_cells-remainder; i++) {
    var x_index = i % dimensions.x;
    var y_index = Math.floor(i/dimensions.x);
    var x_pos = half_cell_size + (x_index * cell_size);
    var y_pos = half_cell_size + (y_index * cell_size);
    x_pos += (Math.random()*adjust_scale) - half_adjust_scale;
    y_pos += (Math.random()*adjust_scale) - half_adjust_scale;
    sites.push({x: x_pos, y: y_pos});
  }

  var last_y_index = Math.floor((num_cells-1)/dimensions.x);
  var last_y_pos = half_cell_size + (last_y_index * cell_size);
  var last_x_cell_size = (dimensions.x * cell_size)/remainder;
  var half_last_x_cell_size = last_x_cell_size/2;
  for (var i = 0; i < remainder; i++) {
    var x_pos = half_last_x_cell_size + (i * last_x_cell_size);
    x_pos += (Math.random()*adjust_scale) - half_adjust_scale;
    var y_pos = last_y_pos + (Math.random()*adjust_scale) - half_adjust_scale;
    y_pos = Math.min(max_height, y_pos);
    sites.push({x: x_pos, y: y_pos});
  }
  return sites;
}