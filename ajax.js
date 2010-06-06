/*
Oszi web based digital storage oscilloscope client.
Copyright (C) 2010  Daniel Gröber, Franz Haider

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>. 
*/

function getCanvas() { return document.getElementById("gridCanvas") }
function getCanvasContext() { return getCanvas().getContext("2d") }

function canvas_line(ctx, x1, y1, x2, y2)
{
	if(isNaN(x1) || isNaN(x2) || isNaN(y1) || isNaN(y2)) debugger;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.closePath();  
	ctx.stroke();
}

function setCanvasStyle(color, clear)
{
	var context = getCanvasContext();
	
	context.font = "bold 10px Courier, Courier New";
	
	if(color)
	{
		context.strokeStyle = color;
		context.fillStyle = color;
	}
	else
	{
		context.strokeStyle = "#000000";
		context.fillStyle = "#000000";
	}
		
	if(clear)
		clearCanvas();
}

function clearCanvas()
{
	var context = getCanvasContext();
	context.clearRect(0, 0, getCanvas().width, getCanvas().height);
	context.fillStyle = "#0b610b";
	context.fillRect(0, 0, getCanvas().width, getCanvas().height);
}

function draw_grid()
{
	var canvas = getCanvas()
	var ctx = getCanvasContext();
	
	var x_div = canvas.width / 10;
	var y_div = canvas.height / 10;
	
	for(var i=0; i <= 10 ;i++)
	{
		var x = i*x_div;
		var y = i*y_div;
		setCanvasStyle(null,false);
		canvas_line(ctx, x, 0, x, canvas.height);
		if(i == 5)
		{
			setCanvasStyle("#BBBBBB",false);
		}
		canvas_line(ctx, 0, y, canvas.width, y);
	}
}

function pos_pair(x, y)
{
	this.x = x;
	this.y = y;
}

var ajaxBusy=false;
var positionCache = new Array();
function ajax(url) {
	if(ajaxBusy) {
		return;
	}
	ajaxBusy=true;
	var xmlhttp;
		if (window.XMLHttpRequest)
		{// code for IE7+, Firefox, Chrome, Opera, Safari
			xmlhttp=new XMLHttpRequest();
		}
		else
		{// code for IE6, IE5
			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
		}
	xmlhttp.onreadystatechange =
	function()
	{
		if(xmlhttp.readyState==4 && xmlhttp.status==200) {
			var i=0,v=0,t='0px',l='0px';
			var str = xmlhttp.responseText;
			var content_all = str.split(";");
				
			for(i=0;i<content_all.length;i++)
			{
				v=parseInt(content_all[i], 10)+127;
				
				if(!positionCache[i])
					positionCache[i] = new pos_pair(i, v);
				else
				{
					positionCache[i].x = i;
					positionCache[i].y = v;
				}
			}
			
			render_canvas();
			
			ajaxBusy=false;
			setTimeout('ajax(\''+url+'\')',500);
		}
	}
	xmlhttp.open('GET',url,true);
	xmlhttp.send();
}

var renderHooks = new Array();
function render_canvas()
{
	render_signal();
	for(var i=0; i < renderHooks.length ;i++)
	{
		renderHooks[i]();
	}
}

function render_signal()
{
	setCanvasStyle(null, true);
	draw_grid();
	
	var ctx = getCanvasContext();
	setCanvasStyle("#11FF00")
	
	var cacheLength = positionCache.length-1;
	for(i=0; i < cacheLength ;i++)
	{
		canvas_line(ctx, positionCache[i].x, positionCache[i].y, positionCache[i+1].x, positionCache[i+1].y);
	}
}

function setServerParam(param, value)
{
	var ajaxObj;
	if (window.XMLHttpRequest)
	{// code for IE7+, Firefox, Chrome, Opera, Safari
		ajaxObj=new XMLHttpRequest();
	}
	else
	{// code for IE6, IE5
		ajaxObj=new ActiveXObject("Microsoft.XMLHTTP");
	}
	if(param!="reset")
		ajaxObj.open('GET',"set_" + param + "_" + value,true);
	else
		ajaxObj.open('GET',value,true);
	ajaxObj.send();
}




window.addEventListener("load", function(e){
	setServerParam("reset", "reset_preferences");
	document.getElementById("timescale").value = "1ms";
	all_loaded();
}, false);

var timeScale = "1ms"
function timescaleChanged(new_timescale)
{
	//console.log("TIME/DIV changed to: " + new_timescale);
	timeScale = new_timescale;
	setServerParam("time", new_timescale);
}

var voltsScale = "500mV"
function voltsChanged(new_volts)
{
	//console.log("VOLTS/DIV changed to: " + new_volts);
	voltsScale = new_volts;
	setServerParam("volts", new_volts);
}

function couplingChanged(button_element)
{
	//console.log("Toggle coupling");
	var current_coupling = button_element.value;
	var new_coupling;
	
	if(current_coupling == "AC")
	{
		new_coupling = "DC";
		setServerParam("coupling", "dc");
	}
	else
	{
		new_coupling = "AC";
		setServerParam("coupling", "ac");
	}
	
	button_element.value = new_coupling;
}

function all_loaded()
{
getCanvas().addEventListener("mousemove", function(e){
	mouseEvent(e.clientX-20, e.clientY-20);
}, false);
getCanvas().addEventListener("click", function(e){
	cursor_state_changed(e.clientX-20, e.clientY-20, e);

}, false);
}

function hori_line(pos_y) { canvas_line(getCanvasContext(), 0, pos_y, getCanvas().width, pos_y); }
function vert_line(pos_x) { canvas_line(getCanvasContext(), pos_x, 0, pos_x, getCanvas().height); }

function scale_pair(scale_dec, scale_str, rawNumber, realValue)
{
	this.scale_dec = scale_dec;
	this.scale_str = scale_str;
	this.rawNumber = rawNumber;
	this.realValue = realValue;
}

function scaleStuff(str_value)
{
	scaleRegex = new RegExp("([^muVs]*)([mu]?)([Vs])")
	match = scaleRegex.exec(str_value);
	var number = match[1];
	var scalePostfix_str = match[2];
	
	var scalePostfix = 1;
	if(scalePostfix_str == "m")
		scalePostfix = 1e-3;
	else if(scalePostfix_str == "u")
		scalePostfix = 1e-6;
	
	var realValue = number * scalePostfix;
	
	return new scale_pair(scalePostfix, scalePostfix_str + match[3], number, realValue);
}

var cursorType = 0;
var cursorState = 0;
var cursor1Pos = 100;
var cursor2Pos = 200;
var trigger_level = 0;
function cursor_type_changed(new_type)
{
	cursorType = new_type;
	if(cursorType == 1)
	{
		cursor1Pos = getCanvas().height/4;
		cursor2Pos = 3*(getCanvas().height/4);
	}else if(cursorType == 2)
	{
		cursor1Pos = getCanvas().width/4;
		cursor2Pos = 3*(getCanvas().width/4);
	}
	else if(cursorType == 3)
	{
		cursor1Pos = getCanvas().height/2 + trigger_level;
	}
}

var alreadyClicked = false;

function cursor_state_changed(clickPosX, clickPosY, event)
{
	if(event.type == "click")
	{
		if(alreadyClicked)
		{
			if(cursorType == 3)
			{
				setServerParam("trigger",128 - clickPosY);
				trigger_level = 128 - clickPosY;
			}
			cursorState = 0;
			alreadyClicked = false;
			return;
		}
		else alreadyClicked = true;
	}

	if(cursorType != 3)
	{
		xDist1 = Math.abs(cursor1Pos - clickPosX);
		xDist2 = Math.abs(cursor2Pos - clickPosX);
		yDist1 = Math.abs(cursor1Pos - clickPosY);
		yDist2 = Math.abs(cursor2Pos - clickPosY);
	}
	
	if(cursorType == 1) // Voltage
	{
		if(yDist1 < yDist2){
			cursorState = 1;
		}else{
			cursorState = 2;
		}
	}else if(cursorType == 2) // Time
	{
		if(xDist1 < xDist2)
			cursorState = 1;
		else
			cursorState = 2;
	}
	else if(cursorType == 3)
	{
		cursorState = 1;
	}
}

var render_cursors = function()
{
	if(cursorType == 1)
	{
		// Voltage
		hori_line(cursor1Pos);
		hori_line(cursor2Pos);
	}
	else if(cursorType == 2)
	{
		// Time
		vert_line(cursor1Pos);
		vert_line(cursor2Pos);
	}
	else if(cursorType == 3)
	{
		setCanvasStyle("#FF0000",false);
		hori_line(cursor1Pos);
	}
}
renderHooks.push(render_cursors);

function mouseEvent(x, y)
{
	if(cursorType == 1){ // Voltage			
		if(cursorState == 1) cursor1Pos = y;
		if(cursorState == 2) cursor2Pos = y;
	}else if(cursorType == 2) // Time
	{
		if(cursorState == 1) cursor1Pos = x;
		if(cursorState == 2) cursor2Pos = x;
	}
	else if(cursorType == 3)
	{
		if(cursorState == 1) cursor1Pos = y;
	}
	
	render_canvas();
}

var render_cursors_text = function()
{
	var cWidth = getCanvas().width;
	
	var canvasHeight = getCanvas().height;
	var halfCanvasHeight = canvasHeight / 2;
	
	var canvasWidth = getCanvas().width;
	var halfCanvasWidth = canvasWidth/2;
	
	if(cursorType == 1)
	{
		// Voltage
		
		var voltsPerDiv = scaleStuff(voltsScale).rawNumber;
		
		var cursor1Val = -1 * (((cursor1Pos-halfCanvasHeight)/canvasHeight) * voltsPerDiv * 10).toFixed(2);
		var text = cursor1Val + scaleStuff(voltsScale).scale_str;
		var textWidth = getCanvasContext().measureText(text).width;
		getCanvasContext().fillText(text, cWidth-textWidth,cursor1Pos-5);
		
		var cursor2Val = -1 * (((cursor2Pos-halfCanvasHeight)/canvasHeight) * voltsPerDiv * 10).toFixed(2);
		var text = cursor2Val + scaleStuff(voltsScale).scale_str;
		var textWidth = getCanvasContext().measureText(text).width;
		getCanvasContext().fillText(text, cWidth-textWidth,cursor2Pos-5);
		
		var deltaV = (cursor1Val - cursor2Val).toFixed(1);
		var text = deltaV + scaleStuff(voltsScale).scale_str;
		var textWidth = getCanvasContext().measureText(text).width;
		getCanvasContext().fillText("Delta: " + text, textWidth-10, 11);
	}else if(cursorType == 2)
	{
		// Time
		
		var timePerDiv = scaleStuff(timeScale).rawNumber;
		
		var cursor1Val = ((cursor1Pos/canvasWidth) * timePerDiv * 10).toFixed(2);
		var text = cursor1Val + scaleStuff(timeScale).scale_str;
		getCanvasContext().fillText(text, cursor1Pos, 10);
		
		var cursor2Val = ((cursor2Pos/canvasWidth) * timePerDiv * 10).toFixed(2);
		var text = cursor2Val + scaleStuff(timeScale).scale_str;
		getCanvasContext().fillText(text, cursor2Pos, 10);
	
	
		var deltaT = (cursor2Val - cursor1Val).toFixed(1);
		var text = deltaT + scaleStuff(timeScale).scale_str;
		var textWidth = getCanvasContext().measureText(text).width;
		getCanvasContext().fillText("Delta: " + text, 80, 11);
	}
	else if (cursorType == 3)
	{
		var voltsPerDiv = scaleStuff(voltsScale).rawNumber;
		
		var cursor1Val = -1 * (((cursor1Pos-halfCanvasHeight)/canvasHeight) * voltsPerDiv * 10).toFixed(2);
		var text = cursor1Val + scaleStuff(voltsScale).scale_str;
		var textWidth = getCanvasContext().measureText(text).width;
		getCanvasContext().fillText(text, cWidth-textWidth,cursor1Pos-5);
	}
}
renderHooks.push(render_cursors_text);