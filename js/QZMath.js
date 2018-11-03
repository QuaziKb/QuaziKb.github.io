//Basic functions that are nice to have, don't want to redefine these all the time

window.QZ_IE_Hack_updates= new Array();

QZMath = {};
QZKeys = {};
QZMouse = {};

QZKey_frames = {};
QZMouse_frames = {0:0,1:0,2:0};

//setup callbacks for mouse/keyboard up/down detectors;
(function(){
	function onMouseDown( event ) {
		QZMouse[event.button] =true;
	};
	function onMouseUp( event ) {
		if(event.button in QZMouse){
			delete QZMouse[event.button];
		};	
	};
	function onKeyDown( event ) {
		QZKeys[event.keyCode] =true;
	};
	function onKeyUp( event ) {
		if(event.keyCode in QZKeys){
			delete QZKeys[event.keyCode];
			//alert(event.keyCode + " deleted");
		};
	};
	window.addEventListener( 'mousedown', onMouseDown, false );
	window.addEventListener( 'mouseup', onMouseUp, false );
	window.addEventListener( 'keydown', onKeyDown, false );
	window.addEventListener( 'keyup', onKeyUp, false );
})();

//call this every render if you want a sane callback free keyboard detection system. Be sure to populate the _frames with the keycodes and buttons you want to time.
QZMath.updateKeyAndMouseFrames = function(){
	for (var key in QZKey_frames) {
		if(key in QZKey_frames){
			if(QZKey_frames[key] < 0){
				QZKey_frames[key] = 0;
			};
			QZKey_frames[key] += 1;
		}else{
			if(QZKey_frames[key] > 0){
				QZKey_frames[key] = -1;
			}else{
				QZKey_frames[key] = 0;
			};
		};
	};
	for (var key in QZMouse_frames) {
		if(key in QZMouse){
			if(QZMouse_frames[key] < 0){
				QZMouse_frames[key] = 0;
			};
			QZMouse_frames[key] += 1;
		}else{
			if(QZMouse_frames[key] > 0){
				QZMouse_frames[key] = -1;
			}else{
				QZMouse_frames[key] = 0;
			};
		};
	};
};

QZMath.round = function(value, decimals) {
  return value.toFixed(decimals);
};

//linear interpolation function
QZMath.lerp = function (a, b, t) {
    return a+(b-a)*t;
};

QZMath.clamp = function(num,min, max) {
  return Math.min(Math.max(num, min), max);
};

QZMath.getRandomHTMLColor = function() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
};

QZMath.FixedDecimals = function(value, decimals) {
	return value.toFixed(decimals);
};

QZMath.createSlider = function(name,start_value,min_value,max_value,step_size){
	this.name=name;
	this.value = QZMath.clamp(start_value,min_value,max_value);
	this.start_value = this.value;
	this.min_value = min_value;
	this.max_value = max_value;
	this.step_size = step_size;
	
	
	//determine number of decimal places to show automatically (we'll show up to e.g. 5 if needed)
	this.decimal_places = 0;
	var maxdec = 5;
	for (var i = maxdec-1; i >= 0; i--) {
		var test_value = Math.abs(step_size)*Math.pow(10,i);
		var floor_test = Math.floor(test_value);
		if(test_value-floor_test>Math.pow(10,maxdec*-1-1)){
			this.decimal_places = i+1;
			break;
		};
	};
	
	var slider_max=Math.ceil((this.max_value-this.min_value)/this.step_size);
	var slider_start=Math.round((this.start_value-this.min_value)/this.step_size);
	
	// standardize a way of creating value editing sliders
	this.sliderdiv = document.createElement("div");
	this.sliderdiv.id = "cent_text";
	
	this.slider = document.createElement("INPUT");
	this.slider.type = "range";
	this.slider.min = "0";
	this.slider.max = String(slider_max);
	this.slider.value = String(slider_start);
	
	this.slidertxt = document.createElement("div");
	this.slidertxt.innerHTML = "this is a test";
	
	document.getElementById("wrap").appendChild(this.sliderdiv);
	this.sliderdiv.appendChild(this.slider);
	this.sliderdiv.appendChild(this.slidertxt);
	
	//////////////////////////////
	var this_scoped=this; // need to make JS understand this isn't referring to contents of oninput
	
	this.slider.oninput = function() {
		this_scoped.value = Math.min(this_scoped.slider.value* this_scoped.step_size+this_scoped.min_value,this_scoped.max_value);
		this_scoped.slidertxt.innerHTML="\n" +this_scoped.name+" = "+QZMath.FixedDecimals(this_scoped.value,this_scoped.decimal_places);
	};
	this.slider.oninput();
	
	// for IE to work properly...
	
	if(typeof window.QZ_IE_slider_hack == 'undefined'){
		window.QZ_IE_slider_hack = {};
		window.QZ_IE_slider_hack.index = 0;
	};
	
	window.QZ_IE_slider_hack.index++
	window.QZ_IE_slider_hack["s"+window.QZ_IE_slider_hack.index+"_onchange"] = this.slider.oninput;
	
	this.slider.setAttribute("onchange","window.QZ_IE_slider_hack.s"+window.QZ_IE_slider_hack.index+"_onchange()");
};

QZMath.tableCreate = function(element,rows,columns) {
	this.e=[]
	this.rows = rows;
	this.columns = columns;
    this.tbl  = document.createElement('table');
	this.input_elements = [];
    this.tbl.style.width  = '200px';
    this.tbl.style.height  = '200px';
	this.tbl.classList.add('borderless_table');
	this.tbl.style.align="center";

    for(var i = 0; i < rows; i++){
        var tr = this.tbl.insertRow();
		this.input_elements[i] = [];
		this.e[i]=[]
        for(var j = 0; j < columns; j++){
                var td = tr.insertCell();
				var x = document.createElement('input');
				x.type='text';
				x.classList.add('mtx_input');
				x.maxLength=5;
				x.value=(i==j)*1;
				td.style['text-align']='center';
                td.appendChild(x);
				
				this.input_elements[i][j] = x;
				x.last_value = null;
                //td.style.border = '1px solid black';         
        }
    }
	this.updateData();
    element.appendChild(this.tbl);
}

QZMath.tableCreate.prototype.updateData = function(){
	    for(var i = 0; i < this.rows; i++){
		    for(var j = 0; j < this.columns; j++){
				var input = this.input_elements[i][j];
				//only allow for decimal numbers
				if(input.last_value != input.value){
					//only run regex when necessary, but call this every frame to live correct problems...
					// works in chrome...ie maybe not
					var first = input.value.charAt(0);
					var str;
					if(first === "-"){
						str = input.value.slice(1).replace(/[^\d\.]/g, '').replace(/^\.*/, '').replace(/(\.\d*)(.*)/, '$1');
						input.value = "-"+str;
					}
					else if(first === "."){
						str = input.value.slice(1).replace(/[^\d\.]/g, '').replace(/^\.*/, '').replace(/(\.\d*)(.*)/, '$1');
						input.value = "0."+str;
					}else if(first === "0"){
						var second = input.value.charAt(1);
						if(second !== "."){
							str = input.value.slice(1).replace(/[^\d\.]/g, '').replace(/^\.*/, '').replace(/(\.\d*)(.*)/, '$1');
							input.value = str;
						}
					}else{
						input.value = input.value.replace(/[^\d\.]/g, '').replace(/^\.*/, '').replace(/(\.\d*)(.*)/, '$1');;
					}
					var value = parseFloat(input.value);
					if(isNaN(value)){
						value=0;
					};
					this.e[i][j]= value;
				};
				input.last_value = input.value;
			};
		};
};
	