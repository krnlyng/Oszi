function getCanvas() { return document.getElementById("gridCanvas") }
function getCanvasContext() { return getCanvas().getContext("2d") }

function canvas_line(ctx, x1, y1, x2, y2)
{
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.closePath();  
	ctx.stroke();
}

function setCanvasStyle(color, clear)
{
	var context = getCanvasContext();
	
	if(color)
		context.strokeStyle = color;
	else
		context.strokeStyle = "#000000";
		
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
		canvas_line(ctx, x, 0, x, canvas.height);
		canvas_line(ctx, 0, y, canvas.width, y);
	}
}

var ajaxBusy=false;
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
			setCanvasStyle(null, true);
			draw_grid();
			var i=0,v=0,t='0px',l='0px';
			var str = xmlhttp.responseText;
			var content_all = str.split(";");
			for(i=0;i<content_all.length;i++) {
				v=parseInt(content_all[i], 10)+127;
				v1=parseInt(content_all[i+1], 10)+127;

				var ctx = getCanvasContext();
				setCanvasStyle("#11FF00")
				canvas_line(ctx, i, v, i+1, v1);
			}
			ajaxBusy=false;
			setTimeout('ajax(\''+url+'\')',500);
		}
	}
	xmlhttp.open('GET',url,true);
	xmlhttp.send();
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
		ajaxObj.open('GET',"set_"+value,true);
	else
		ajaxObj.open('GET',value,true);
	ajaxObj.send();
}




window.addEventListener("load", function(e){
	setServerParam("reset", "reset_preferences");
	document.getElementById("timescale").value = "1ms";
}, false);
function timescaleChanged(new_timescale)
{
	console.log("TIME/DIV changed to: " + new_timescale);
	setServerParam("time", new_timescale);
}

function voltsChanged(new_volts)
{
	console.log("VOLTS/DIV changed to: " + new_volts);
	setServerParam("volts", new_volts);
}

function couplingChanged(button_element)
{
	console.log("Toggle coupling");
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