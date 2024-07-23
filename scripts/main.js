"use strict";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const svgNS = "http://www.w3.org/2000/svg";
const HABIT_DATA_KEY = 'habitData';

function InitializeData(){
  const habitDataString = localStorage.getItem(HABIT_DATA_KEY);
  if(habitDataString){
    const habitData = JSON.parse(habitDataString);
    document.getElementById("habit_name").value = habitData.habit_name;
    document.getElementById("habit_description").value = habitData.habit_desc;
    document.getElementById("num_cells").value = habitData.num_cells;
    document.getElementById("cell_size").value = habitData.cell_size;
    document.getElementById("line_thickness").value = habitData.line_thickness;
    document.getElementById("add_date_checkbox").checked = habitData.add_dates;
    document.getElementById("start_offset").value = habitData.start_offset;
    GenerateFromData(habitData);
  }
}


function Generate(){
  let habit_name = document.getElementById("habit_name").value;
  let habit_desc = document.getElementById("habit_description").value;
  let num_cells_input = document.getElementById("num_cells");
  let num_cells = GetNumberFromInput(num_cells_input, 2, 5000);

  let cell_size_input = document.getElementById("cell_size");
  let cell_size = GetNumberFromInput(cell_size_input, 5, 1000);

  let line_thickness_input = document.getElementById("line_thickness");
  let line_thickness = GetNumberFromInput(line_thickness_input, 1, 100);

  let add_dates = document.getElementById("add_date_checkbox").checked;
  let start_offset = parseFloat(document.getElementById("start_offset").value);
  
  let lastSeed = Math.random();

  const habitData = {
    habit_name,
    habit_desc,
    num_cells,
    cell_size,
    line_thickness,
    add_dates,
    start_offset,
    lastSeed,
  };

  const habitDataString = JSON.stringify(habitData);
  localStorage.setItem(HABIT_DATA_KEY, habitDataString);

  GenerateFromData(habitData);
}

function GenerateFromData(habitData){
  let habit_name = habitData.habit_name;
  let habit_desc = habitData.habit_desc;
  let num_cells = habitData.num_cells;
  let cell_size = habitData.cell_size;
  let line_thickness = habitData.line_thickness;
  let add_dates = habitData.add_dates;
  let start_offset = habitData.start_offset;
  let lastSeed = habitData.lastSeed;

  document.getElementById("display_title").innerHTML = habit_name;

  let desc_element = document.getElementById("display_description");
  desc_element.style.display = (habit_desc && habit_desc.trim()) ? "inline-block" : "none";
  desc_element.innerHTML = habit_desc;

  let dimensions = GetDimensions(num_cells, cell_size);
  let y_decimal = num_cells/dimensions.x;
  let remainder = y_decimal - Math.floor(y_decimal);
  if(remainder == 0){
    remainder = 1;
  }
  let y_adjust = remainder - 1;
  let width = dimensions.x * cell_size;
  let height = (dimensions.y + y_adjust) * cell_size;

  let bbox = {xl: 0, xr: width, yt: 0, yb: height}; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
  let voronoi_sites = GetVoronoiSites(num_cells, cell_size, dimensions, height, lastSeed);

  let voronoi = new Voronoi();
  let voronoi_diagram = voronoi.compute(voronoi_sites, bbox);
  let svgContainer = document.getElementById("svg_container");
  svgContainer.innerHTML = ""
  svgContainer.appendChild(GenerateSVG(voronoi_diagram, width, height, line_thickness, add_dates, cell_size, start_offset));
  document.getElementById("print_button").style.display = "inline-block";
}

function GenerateSVG(voronoi_diagram, width, height, line_thickness, add_dates, cell_size, start_offset){
  const svg1 = document.createElementNS(svgNS, "svg");
  svg1.setAttribute("width", width+6);
  svg1.setAttribute("height", height+6);

  let line_style_text = "stroke:rgb(0,0,0);stroke-width:" + line_thickness + ";"
  let rect_style_text = "stroke:rgb(0,0,0);stroke-width:" + line_thickness + ";fill-opacity:0;"
  for (let i = 0; i < voronoi_diagram.edges.length; i++) {
    let edge = voronoi_diagram.edges[i];
    let svg_line = document.createElementNS(svgNS, "line");
    svg_line.setAttribute("x1", edge.va.x+3);
    svg_line.setAttribute("y1", edge.va.y+3);
    svg_line.setAttribute("x2", edge.vb.x+3);
    svg_line.setAttribute("y2", edge.vb.y+3);
    svg_line.setAttribute("style", line_style_text);
    svg1.appendChild(svg_line);
  }
  let borderRect = document.createElementNS(svgNS, "rect");
  borderRect.setAttribute("x", 2);
  borderRect.setAttribute("y", 2);
  borderRect.setAttribute("width", width+1);
  borderRect.setAttribute("height", height+1);
  borderRect.setAttribute("style", rect_style_text);
  svg1.appendChild(borderRect);

  if(add_dates){
    const today = new Date();
    let sorted_cells = CenterAndSortCells(voronoi_diagram.cells, cell_size);
    for (let i = 0; i < sorted_cells.length; i++) {
      let d = today.addDays(i+start_offset);
      let cell = sorted_cells[i];
      let newText = document.createElementNS(svgNS,"text");
      newText.setAttributeNS(null,"x", cell.center_point.x);     
      newText.setAttributeNS(null,"y", cell.center_point.y); 
      newText.setAttributeNS(null, "text-anchor", "middle");
      newText.setAttributeNS(null,"font-size",cell_size/6);

      let line1 = document.createElementNS(svgNS, "tspan");
      line1.setAttributeNS(null,"x", cell.center_point.x);     
      let textNode1 = document.createTextNode(months[d.getMonth()]);
      line1.appendChild(textNode1);

      let line2 = document.createElementNS(svgNS, "tspan");
      line2.setAttributeNS(null,"dy", "1.1em");     
      line2.setAttributeNS(null,"x", cell.center_point.x);     
      let textNode2 = document.createTextNode(d.getDate());
      line2.appendChild(textNode2);

      newText.appendChild(line1);
      newText.appendChild(line2);
      svg1.appendChild(newText);
    }
  }

  return svg1;
}

function CenterAndSortCells(cells, cell_size){
  for (let i = 0; i < cells.length; i++) {
    let cell = cells[i];
    cell.center_point = GetCenterPointForCell(cell);
  }
  let line_height = cell_size*0.45;
  cells.sort(function(a, b) {
    let aCenter = a.center_point;
    let bCenter = b.center_point;
    let diffX =  aCenter.x - bCenter.x;
    let diffY =  aCenter.y - bCenter.y;
    if(Math.abs(diffY) < line_height){
      return diffX;
    } else{
      return diffY;
    }
  });
  return cells;
}

function GetNumberFromInput(num_input, min, max){
  let the_value = num_input.value;
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
  let x = Math.floor(Math.sqrt(num_cells));
  x = Math.floor(Math.min(1000, cell_size*x)/cell_size); //Ensure x doesn't make the chart too wide
  let y = Math.ceil(num_cells/x);
  return {x:x, y:y};
}

function GetVoronoiSites(num_cells, cell_size, dimensions, max_height, seed){
  let rng = new RNG(seed);
  let half_cell_size = cell_size/2;
  let adjust_scale = cell_size/1.2;
  let half_adjust_scale = adjust_scale/2;
  let sites = [];

  let remainder = num_cells % dimensions.x;

  for (let i = 0; i < num_cells-remainder; i++) {
    let x_index = i % dimensions.x;
    let y_index = Math.floor(i/dimensions.x);
    let x_pos = half_cell_size + (x_index * cell_size);
    let y_pos = half_cell_size + (y_index * cell_size);
    x_pos += (rng.NextFloat()*adjust_scale) - half_adjust_scale;
    y_pos += (rng.NextFloat()*adjust_scale) - half_adjust_scale;
    sites.push({x: x_pos, y: y_pos});
  }

  let last_y_index = Math.floor((num_cells-1)/dimensions.x);
  let last_y_pos = half_cell_size + (last_y_index * cell_size);
  let last_x_cell_size = (dimensions.x * cell_size)/remainder;
  let half_last_x_cell_size = last_x_cell_size/2;
  for (let i = 0; i < remainder; i++) {
    let x_pos = half_last_x_cell_size + (i * last_x_cell_size);
    x_pos += (rng.NextFloat()*adjust_scale) - half_adjust_scale;
    let y_pos = last_y_pos + (rng.NextFloat()*adjust_scale) - half_adjust_scale;
    y_pos = Math.min(max_height, y_pos);
    sites.push({x: x_pos, y: y_pos});
  }
  return sites;
}

function GetCenterPointForCell(cell){
  let vertex_count = cell.halfedges.length;
  let xTotal = 0;
  let yTotal = 0;
  let total_length = 0;
  for (let i = 0; i < cell.halfedges.length; i++) {
    let edge = cell.halfedges[i].edge;
    let edge_length = GetDistance(edge.va.x, edge.va.y, edge.vb.x, edge.vb.y);
    total_length += edge_length;
    xTotal += ((edge.va.x + edge.vb.x)/2)*(edge_length);
    yTotal += ((edge.va.y + edge.vb.y)/2)*(edge_length);
  }
  let x = (xTotal)/total_length;
  let y = (yTotal)/total_length;
  return {x: x, y: y};
}

function GetDistance(x1, y1, x2, y2){
    let y = x2 - x1;
    let x = y2 - y1;
    return Math.sqrt(x * x + y * y);
}

Date.prototype.addDays = function(days) {
  let date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
}