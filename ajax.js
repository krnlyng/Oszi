var ajaxBusy=false;
function ajax(a) {
    if(ajaxBusy) {
        return;
    }
    ajaxBusy=true;
    var d;
    try {
        d=new XMLHttpRequest();
    } catch(e) {
        d=new ActiveXObject('Microsoft.XMLHTTP')
    }
    var f=function() {
        if(d.readyState==4) {
            var i=0,v=0,t='0px',l='0px';
            var str = d.responseText;
	    var content_all = str.split(";");
            for(i=0;i<content_all.length;i++) {
                v=parseInt(content_all[i])+127;
/*              for(i=0;i<d.responseText.length;i++)
              {
		v = (127 - d.responseText.charCodeAt(i));*/
                t=(v)+'px';
                l=(i)+'px';
                if(!document.getElementById(i)) {
                    var n=document.createElement('div');
                    document.getElementById('graf').appendChild(n);
                    n.id=i;
                    n.style.top=t;
                    n.style.left=l;
					n.className = "dot";
                } else {
                    document.getElementById(i).style.top=t;
                    document.getElementById(i).style.left=l;
                }
            }
            ajaxBusy=false;
            setTimeout('ajax(\''+a+'\')',0);
        }
    }
    d.open('GET',a,true);
    d.onreadystatechange=f;
    d.send(null);
}

