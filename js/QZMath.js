//Basic functions that are nice to have, don't want to redefine these all the time

window.QZ_IE_Hack_updates= new Array();

QZMath = {};
QZKeys = {};
QZMouse = {};
QZTouch = {};
QZTouch.touches={};
QZTouch.hasTouch=false;
QZMotion = {}
QZMotion.hasOrn = false;
QZMotion.hasAcc = false;
QZMotion.orn = {};
QZMotion.acc = {};

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
	// touch stuff
	function onTouchStart( event ) {
		QZTouch.hasTouch=true;
		/*//support multiTouch
		for (var i = 0, L = event.touches.length; i < L; i++) {
			QZTouch.hasTouch=true;
		};*/
	};	
	window.addEventListener( 'touchstart', onTouchStart, false );
	//window.domElement.addEventListener( 'touchend', onTouchEnd, false );
	//window.domElement.addEventListener( 'touchmove', onTouchMove, false );
	
	//orientation/accel
	function handleOrientation(event){
		QZMotion.hasOrn = true;
		QZMotion.orn	= event;
	}
	function handleMotion(event){
			if( //... fires event with null values on some browsers...
			event.acceleration.x === null || 
			event.acceleration.y === null ||
			event.acceleration.z === null ||
			event.accelerationIncludingGravity.x === null ||
			event.accelerationIncludingGravity.y === null ||
			event.accelerationIncludingGravity.z === null 
			){
				QZMotion.hasAcc = false;
			}else{
				QZMotion.hasAcc = true;
				QZMotion.acc = event;
			}

	}
	window.addEventListener("devicemotion", handleMotion, true);
	window.addEventListener("deviceorientation", handleOrientation, true);
})();

//call this every render if you want a sane callback free keyboard detection system. Be sure to populate the _frames with the keycodes and buttons you want to time.
QZMath.updateMouseFrames = function(){
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


QZMath.createButton = function(name,infotxt,callback,owner="wrap"){
    this.name=name;
    // standardize a way of creating value editing sliders
	this.buttondiv = document.createElement("div");
	this.buttondiv.classList.add("btncontainer");
    
    this.btn = document.createElement("BUTTON");
    this.btn.innerHTML = name;
    this.btn.classList.add("btncontainer");
	this.btn.onclick = callback
    this.btntxt = document.createElement("div");
    this.btntxt.classList.add("slider_text")
	this.btntxt.innerHTML = infotxt;
    
	document.getElementById(owner).appendChild(this.buttondiv);
	this.buttondiv.appendChild(this.btn);
	this.buttondiv.appendChild(this.btntxt);
}

QZMath.createSlider = function(name,start_value,min_value,max_value,step_size,owner="wrap"){
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
	this.sliderdiv.classList.add("slidecontainer");
	
	this.slider = document.createElement("INPUT");
	this.slider.type = "range";
	this.slider.min = "0";
	this.slider.max = String(slider_max);
	this.slider.value = String(slider_start);
	
	this.slidertxt = document.createElement("div");
    this.slidertxt.classList.add("slider_text")
	this.slidertxt.innerHTML = "this is a test";
	
	document.getElementById(owner).appendChild(this.sliderdiv);
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

QZMath.tableCreate = function(element,rows,columns,disabled) {

	this.e=[]
	this.rows = rows;
	this.columns = columns;
    this.tbl  = document.createElement('table');
	this.input_elements = [];
    this.tbl.style.width  = '0px';
    this.tbl.style.height  = '0px';
	this.tbl.classList.add('borderless_table');
	this.tbl.style.align="center";

    for(var i = 0; i < rows; i++){
        var tr = this.tbl.insertRow();
		this.input_elements[i] = [];
		this.e[i]=[]
        for(var j = 0; j < columns; j++){
                var td = tr.insertCell();
				var x = document.createElement('input');
				x.disabled = (disabled === true);
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

QZMath.tableCreate.prototype.updateData = function(forceSymmetric = false){
		var values_changed = false;
	    for(var i = 0; i < this.rows; i++){
		    for(var j = 0; j < this.columns; j++){
				var input = this.input_elements[i][j];
				//only allow for decimal numbers
				if(input.last_value != input.value){
					values_changed = true;
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
					if(forceSymmetric && i != j){
						this.e[j][i]= value;
						var sym_input = this.input_elements[j][i];
						sym_input.value = input.value;
						sym_input.last_value = input.value;
					};
				};
				input.last_value = input.value;
			};
		};
		return values_changed;
};

QZMath.tableCreate.prototype.insertData = function(data){
	for(var i = 0; i < this.rows; i++){
		for(var j = 0; j < this.columns; j++){
			var dat_e = data[i][j];
			this.e[i][j] = dat_e;
			var input = this.input_elements[i][j];
			var str = dat_e.toString();
			var shift = 1;
			if(Math.abs(dat_e)<0.00001) str = "";
			if(str.charAt(0) === "-") shift = 0;
			input.value = str.substring(0,input.maxLength-shift);
			input.last_value = input.value;
		};
	};
};

QZMath.matrixTranspose = function(A){
	var B = [];
	var columns = A[0].length;
	var rows = A.length;
	for(var k = 0; k < columns; k++){
		B[k] = [];
		for(var i = 0; i < rows; i++){
			B[k][i] = A[i][k];
		};
	};
	return B;
};

QZMath.matrixMult = function(a,b){
  var aNumRows = a.length, aNumCols = a[0].length,
      bNumRows = b.length, bNumCols = b[0].length,
      m = new Array(aNumRows);  // initialize array of rows
  for (var r = 0; r < aNumRows; ++r) {
    m[r] = new Array(bNumCols); // initialize the current row
    for (var c = 0; c < bNumCols; ++c) {
      m[r][c] = 0;             // initialize the current cell
      for (var i = 0; i < aNumCols; ++i) {
        m[r][c] += a[r][i] * b[i][c];
      }
    }
  }
  return m;
};

QZMath.JacobiDiag2x2 = function(m){
var B = [
  [m[0][0], m[0][1]]
  [m[1][0], m[1][1]]
];

var a = m[0][0];
//seem to be able to solve edge cases by adding a very small value to the off diagonal (some kind of regularization?)
var b = m[0][1];
b += (b==0)*0.000000000000001;
var d = m[1][1];

//find submatrix eigenvalues
var part_1 = (a+d)/2;
var part_sqr = (a-d)/2;
var part_2 = Math.sqrt(b*b+part_sqr*part_sqr)

var e_plus = part_1+part_2;
//var e_minus = part_1-part_2;

var r1_0 = a-e_plus;
//var r1_1 = b;

var r1_norm = Math.sqrt(r1_0*r1_0+b*b)
//console.log(r1_norm)
var u1_0 = b/r1_norm;
var u1_1 = -r1_0/r1_norm;
//var u2_0 = -u1_1;
//var u2_1 = u1_0;

//eigenvectors

var U = [
	[u1_0,-u1_1],
	[u1_1,u1_0]
]

return U;
};

QZMath.JacobiDiag3x3 = function(m,iterations){
	//m is assumed a 2D array;
	//http://people.math.gatech.edu/~klounici6/2605/Lectures%20notes%20Carlen/chap3.pdf
	//initialize B and V;
	var B = [
	[m[0][0], m[0][1], m[0][2]],
	[m[1][0], m[1][1], m[1][2]],
	[m[2][0], m[2][1], m[2][2]]
	];
	
	var V = [
		[1,0,0],
		[0,1,0],
		[0,0,1]
	]
	
	for (var pass = 0; pass < iterations; pass++) {
		//console.log(B[0][1])
		//buffered entries we use
		var b00 = B[0][0];
		var b01 = B[0][1];
		var b02 = B[0][2];
		var b11 = B[1][1];
		var b12 = B[1][2];
		var b22 = B[2][2];
		//buffered entries;
		var v00 = V[0][0];
		var v01 = V[0][1];
		var v02 = V[0][2];
		var v10 = V[1][0];
		var v11 = V[1][1];
		var v12 = V[1][2];
		var v20 = V[2][0];
		var v21 = V[2][1];
		var v22 = V[2][2];
		
		//find off diagonal element with largest absolute value, i<k:
		var od_max = Math.abs(b01);
		var i=0;
		var k=1;
		var test = Math.abs(b02);
		if(test > od_max){
			od_max = test;
			i=0;
			k=2;
		};
		test = Math.abs(b12);
		if(test > od_max){
			i=1;
			k=2;
		};
		
		var a = B[i][i];
		var b = B[i][k];
		b += (b==0)*0.01;
		var d = B[k][k];
		
		//find submatrix eigenvalues
		var part_1 = (a+d)/2;
		var part_sqr = (a-d)/2;
		var part_2 = Math.sqrt(b*b+part_sqr*part_sqr)
		
		var e_plus = part_1+part_2;
		
		var r1_0 = a-e_plus;
		
		var r1_norm = Math.sqrt(r1_0*r1_0+b*b)
		
		var c = b/r1_norm;
		var s = -r1_0/r1_norm;
		//console.log(c,s,b01);
		//blobs calculated off wolfram alpha
		if(i===0&&k===1){
			//console.log('asdasd')
			//alert('01');
			//{{c,s,0},{-s,c,0},{0,0,1}}*{{q,w,u},{w,r,t},{u,t,y}}*{{c,-s,0},{s,c,0},{0,0,1}}
			B[0][0]=s*(b11*s + c*b01) + c*(c*b00 + s*b01);
			B[0][1]= c*(b11*s + c*b01) - s*(c*b00 + s*b01);
			B[0][2]= s*b12 + c*b02;
			B[1][0]=B[0][1];
			B[1][1]=  c*(c*b11 - s*b01) - s*(c*b01 - b00*s);
			B[1][2]=  c*b12 - s*b02;
			B[2][0]=B[0][2];
			B[2][1]= B[1][2];
			B[2][2]= b22;
			//{{q,w,r},{t,y,u},{m,o,p}}*{{c,-s,0},{s,c,0},{0,0,1}}
			V[0][0]=c*v00 + s*v01;
			V[0][1]=c*v01 - v00*s;
			V[0][2]=v02;
			V[1][0]=c*v10 + s*v11;
			V[1][1]=c*v11 - s*v10;
			V[1][2]=v12;
			V[2][0]=c*v20 + v21*s;
			V[2][1]=c*v21 - v20*s;
			V[2][2]=v22;
		}else if(i===0&&k===2){
			//alert('02');
			//{{c,0,s},{0,1,0},{-s,0,c}}*{{q,w,u},{w,r,t},{u,t,y}}*{{c,0,-s},{0,1,0},{s,0,c}}
			B[0][0]= c*(c*b00 + s*b02) + s*(c*b02 + s*b22);
			B[0][1]= s*b12 + c*b01;
			B[0][2]= c*(c*b02 + s*b22) - s*(c*b00 + s*b02);
			B[1][0]=B[0][1];
			B[1][1]= b11;
			B[1][2]= c*b12 - s*b01;
			B[2][0]=B[0][2];
			B[2][1]=B[1][2];
			B[2][2]= c*(c*b22 - s*b02) - s*(c*b02 - b00*s);
			//{{q,w,r},{t,y,u},{m,o,p}}*{{c,0,-s},{0,1,0},{s,0,c}}
			V[0][0]=c*v00 + v02*s;
			V[0][1]=v01;
			V[0][2]=c*v02 - v00*s;
			V[1][0]=c*v10 + s*v12;
			V[1][1]=v11;
			V[1][2]=c*v12 - s*v10;
			V[2][0]=c*v20 + v22*s;
			V[2][1]=v21;
			V[2][2]=c*v22 - v20*s;
		}else if(i===1&&k===2){
			//alert('12');
			//{{1,0,0},{0,c,s},{0,-s,c}}*{{q,w,u},{w,r,t},{u,t,y}}*{{1,0,0},{0,c,-s},{0,s,c}}
			B[0][0]= b00;
			B[0][1]= s*b02 + c*b01;
			B[0][2]= c*b02 - s*b01;
			B[1][0]=B[0][1];
			B[1][1]= c*(c*b11 + s*b12) + s*(c*b12 + s*b22);
			B[1][2]= c*(c*b12 + s*b22) - s*(c*b11 + s*b12);
			B[2][0]=B[0][2];
			B[2][1]=B[1][2];
			B[2][2]= c*(c*b22 - s*b12) - s*(c*b12 - b11*s);
			//{{q,w,r},{t,y,u},{m,o,p}}*{{1,0,0},{0,c,-s},{0,s,c}}
			V[0][0]=v00;
			V[0][1]=v02*s + c*v01;
			V[0][2]=c*v02 - s*v01;
			V[1][0]=v10;
			V[1][1]=s*v12 + c*v11;
			V[1][2]=c*v12 - s*v11;
			V[2][0]=v20;
			V[2][1]=c*v21 + v22*s;
			V[2][2]=c*v22 - v21*s;
		};
	};
	
		output=[];
		output[0]=B;
		output[1]=V;
		return output;
	//after all iterations calculate eigenvalues and from eigenvectors;
	
};
	

QZMath.findRotationPart = function(m,iterations){
//m is assumed a 2D array;
//http://people.math.gatech.edu/~klounici6/2605/Lectures%20notes%20Carlen/chap3.pdf
//initialize B and V;

var B = [ //m^Tm
[m[2][0]*m[2][0] + m[0][0]*m[0][0] + m[1][0]*m[1][0],m[2][0]*m[2][1] + m[0][0]*m[0][1] + m[1][0]*m[1][1],m[2][0]*m[2][2] + m[0][0]*m[0][2] + m[1][0]*m[1][2]],
[m[2][0]*m[2][1] + m[0][0]*m[0][1] + m[1][0]*m[1][1],m[2][1]*m[2][1] + m[0][1]*m[0][1] + m[1][1]*m[1][1],m[2][1]*m[2][2] + m[0][2]*m[0][1] + m[1][2]*m[1][1]],
[m[2][0]*m[2][2] + m[0][0]*m[0][2] + m[1][0]*m[1][2],m[2][1]*m[2][2] + m[0][2]*m[0][1] + m[1][2]*m[1][1],m[2][2]*m[2][2] + m[0][2]*m[0][2] + m[1][2]*m[1][2]]
];

var V = [
	[1,0,0],
	[0,1,0],
	[0,0,1]
];

for (var pass = 0; pass < iterations; pass++) {
	//console.log(B[0][1])
	//buffered entries we use
	var b00 = B[0][0];
	var b01 = B[0][1];
	var b02 = B[0][2];
	var b11 = B[1][1];
	var b12 = B[1][2];
	var b22 = B[2][2];
	//buffered entries;
	var v00 = V[0][0];
	var v01 = V[0][1];
	var v02 = V[0][2];
	var v10 = V[1][0];
	var v11 = V[1][1];
	var v12 = V[1][2];
	var v20 = V[2][0];
	var v21 = V[2][1];
	var v22 = V[2][2];
	
	//find off diagonal element with largest absolute value, i<k:
	var od_max = Math.abs(b01);
	var i=0;
	var k=1;
	var test = Math.abs(b02);
	if(test > od_max){
		od_max = test;
		i=0;
		k=2;
	};
	test = Math.abs(b12);
	if(test > od_max){
		i=1;
		k=2;
	};
	
	var a = B[i][i];
	var b = B[i][k];
	b += (b==0)*0.01;
	var d = B[k][k];
	
	//find submatrix eigenvalues
	var part_1 = (a+d)/2;
	var part_sqr = (a-d)/2;
	var part_2 = Math.sqrt(b*b+part_sqr*part_sqr)
	
	var e_plus = part_1+part_2;
	
	var r1_0 = a-e_plus;
	
	var r1_norm = Math.sqrt(r1_0*r1_0+b*b)
	
	var c = b/r1_norm;
	var s = -r1_0/r1_norm;
	//console.log(c,s,b01);
	//blobs calculated off wolfram alpha
	if(i===0&&k===1){
		//console.log('asdasd')
		//alert('01');
		//{{c,s,0},{-s,c,0},{0,0,1}}*{{q,w,u},{w,r,t},{u,t,y}}*{{c,-s,0},{s,c,0},{0,0,1}}
		B[0][0]=s*(b11*s + c*b01) + c*(c*b00 + s*b01);
		B[0][1]= c*(b11*s + c*b01) - s*(c*b00 + s*b01);
		B[0][2]= s*b12 + c*b02;
		B[1][0]=B[0][1];
		B[1][1]=  c*(c*b11 - s*b01) - s*(c*b01 - b00*s);
		B[1][2]=  c*b12 - s*b02;
		B[2][0]=B[0][2];
		B[2][1]= B[1][2];
		B[2][2]= b22;
		//{{q,w,r},{t,y,u},{m,o,p}}*{{c,-s,0},{s,c,0},{0,0,1}}
		V[0][0]=c*v00 + s*v01;
		V[0][1]=c*v01 - v00*s;
		V[0][2]=v02;
		V[1][0]=c*v10 + s*v11;
		V[1][1]=c*v11 - s*v10;
		V[1][2]=v12;
		V[2][0]=c*v20 + v21*s;
		V[2][1]=c*v21 - v20*s;
		V[2][2]=v22;
	}else if(i===0&&k===2){
		//alert('02');
		//{{c,0,s},{0,1,0},{-s,0,c}}*{{q,w,u},{w,r,t},{u,t,y}}*{{c,0,-s},{0,1,0},{s,0,c}}
		B[0][0]= c*(c*b00 + s*b02) + s*(c*b02 + s*b22);
		B[0][1]= s*b12 + c*b01;
		B[0][2]= c*(c*b02 + s*b22) - s*(c*b00 + s*b02);
		B[1][0]=B[0][1];
		B[1][1]= b11;
		B[1][2]= c*b12 - s*b01;
		B[2][0]=B[0][2];
		B[2][1]=B[1][2];
		B[2][2]= c*(c*b22 - s*b02) - s*(c*b02 - b00*s);
		//{{q,w,r},{t,y,u},{m,o,p}}*{{c,0,-s},{0,1,0},{s,0,c}}
		V[0][0]=c*v00 + v02*s;
		V[0][1]=v01;
		V[0][2]=c*v02 - v00*s;
		V[1][0]=c*v10 + s*v12;
		V[1][1]=v11;
		V[1][2]=c*v12 - s*v10;
		V[2][0]=c*v20 + v22*s;
		V[2][1]=v21;
		V[2][2]=c*v22 - v20*s;
	}else if(i===1&&k===2){
		//alert('12');
		//{{1,0,0},{0,c,s},{0,-s,c}}*{{q,w,u},{w,r,t},{u,t,y}}*{{1,0,0},{0,c,-s},{0,s,c}}
		B[0][0]= b00;
		B[0][1]= s*b02 + c*b01;
		B[0][2]= c*b02 - s*b01;
		B[1][0]=B[0][1];
		B[1][1]= c*(c*b11 + s*b12) + s*(c*b12 + s*b22);
		B[1][2]= c*(c*b12 + s*b22) - s*(c*b11 + s*b12);
		B[2][0]=B[0][2];
		B[2][1]=B[1][2];
		B[2][2]= c*(c*b22 - s*b12) - s*(c*b12 - b11*s);
		//{{q,w,r},{t,y,u},{m,o,p}}*{{1,0,0},{0,c,-s},{0,s,c}}
		V[0][0]=v00;
		V[0][1]=v02*s + c*v01;
		V[0][2]=c*v02 - s*v01;
		V[1][0]=v10;
		V[1][1]=s*v12 + c*v11;
		V[1][2]=c*v12 - s*v11;
		V[2][0]=v20;
		V[2][1]=c*v21 + v22*s;
		V[2][2]=c*v22 - v21*s;
	};
};
//inv square root of eigenvalues since we've diagonalized;
//(m*V*1/sqrt(B)*V^T)

//add some regularization just incase eigs are zero
var e_0 = 1/(Math.sqrt(B[0][0])+0.001);
var e_1 = 1/(Math.sqrt(B[1][1])+0.001);
var e_2 = 1/(Math.sqrt(B[2][2])+0.001);

//code inspired by "Meshless Deformations Based on Shape Matching"
//{{c_00,c_01,c_02},{c_10,c_11,c_12},{c_20,c_21,c_22}}*({{v_00,v_01,v_02},{v_10,v_11,v_12},{v_20,v_21,v_22}}*{{e_0,0,0},{0,e_1,0},{0,0,e_2}}*{{v_00,v_01,v_02},{v_10,v_11,v_12},{v_20,v_21,v_22}}^T)

var p0 = (e_0*V[0][0]*V[0][0] + e_1*V[0][1]*V[0][1] + e_2*V[0][2]*V[0][2]);
var p1 = (e_0*V[0][0]*V[1][0] + e_1*V[0][1]*V[1][1] + e_2*V[0][2]*V[1][2]);
var p2 = (e_0*V[0][0]*V[2][0] + e_1*V[0][1]*V[2][1] + e_2*V[0][2]*V[2][2]);
var p3 = (e_0*V[1][0]*V[1][0] + e_1*V[1][1]*V[1][1] + e_2*V[1][2]*V[1][2]);
var p4 = (e_0*V[1][0]*V[2][0] + e_1*V[1][1]*V[2][1] + e_2*V[1][2]*V[2][2]);
var p5 = (e_0*V[2][0]*V[2][0] + e_1*V[2][1]*V[2][1] + e_2*V[2][2]*V[2][2]);

//final rotation matrix where m was "Apq", e.g. the best fit rotation matrix;
B[0][0]=m[0][0]*p0 + m[0][1]*p1 + m[0][2]*p2;
B[0][1]=m[0][0]*p1 + m[0][1]*p3 + m[0][2]*p4;
B[0][2]=m[0][0]*p2 + m[0][1]*p4 + m[0][2]*p5;
B[1][0]=m[1][0]*p0 + m[1][1]*p1 + m[1][2]*p2;
B[1][1]=m[1][0]*p1 + m[1][1]*p3 + m[1][2]*p4;
B[1][2]=m[1][0]*p2 + m[1][1]*p4 + m[1][2]*p5;
B[2][0]=m[2][0]*p0 + m[2][1]*p1 + m[2][2]*p2;
B[2][1]=m[2][0]*p1 + m[2][1]*p3 + m[2][2]*p4;
B[2][2]=m[2][0]*p2 + m[2][1]*p4 + m[2][2]*p5;

return B;
};

/* //regexp uses look behind which is poorly supported....
QZMath.woflramCopyablePlainTestToJSMath = function(){
var str = "(c_0 (e_0 v_0^2 + e_1 v_1^2 + e_2 v_2^2) + c_1 (e_0 v_0 v_10 + e_1 v_1 v_11 + e_2 v_2 v_12) + c_2 (e_0 v_0 v_20 + e_1 v_1 v_21 + e_2 v_2 v_22) | c_0 (e_0 v_0 v_10 + e_1 v_1 v_11 + e_2 v_2 v_12) + c_1 (e_0 v_10^2 + e_1 v_11^2 + e_2 v_12^2) + c_2 (e_0 v_10 v_20 + e_1 v_11 v_21 + e_2 v_12 v_22) | c_0 (e_0 v_0 v_20 + e_1 v_1 v_21 + e_2 v_2 v_22) + c_1 (e_0 v_10 v_20 + e_1 v_11 v_21 + e_2 v_12 v_22) + c_2 (e_0 v_20^2 + e_1 v_21^2 + e_2 v_22^2) | c_10 (e_0 v_0^2 + e_1 v_1^2 + e_2 v_2^2) + c_11 (e_0 v_0 v_10 + e_1 v_1 v_11 + e_2 v_2 v_12) + c_12 (e_0 v_0 v_20 + e_1 v_1 v_21 + e_2 v_2 v_22) | c_10 (e_0 v_0 v_10 + e_1 v_1 v_11 + e_2 v_2 v_12) + c_11 (e_0 v_10^2 + e_1 v_11^2 + e_2 v_12^2) + c_12 (e_0 v_10 v_20 + e_1 v_11 v_21 + e_2 v_12 v_22) | c_10 (e_0 v_0 v_20 + e_1 v_1 v_21 + e_2 v_2 v_22) + c_11 (e_0 v_10 v_20 + e_1 v_11 v_21 + e_2 v_12 v_22) + c_12 (e_0 v_20^2 + e_1 v_21^2 + e_2 v_22^2)|c_20 (e_0 v_0^2 + e_1 v_1^2 + e_2 v_2^2) + c_21 (e_0 v_0 v_10 + e_1 v_1 v_11 + e_2 v_2 v_12) + c_22 (e_0 v_0 v_20 + e_1 v_1 v_21 + e_2 v_2 v_22) | c_20 (e_0 v_0 v_10 + e_1 v_1 v_11 + e_2 v_2 v_12) + c_21 (e_0 v_10^2 + e_1 v_11^2 + e_2 v_12^2) + c_22 (e_0 v_10 v_20 + e_1 v_11 v_21 + e_2 v_12 v_22) | c_20 (e_0 v_0 v_20 + e_1 v_1 v_21 + e_2 v_2 v_22) + c_21 (e_0 v_10 v_20 + e_1 v_11 v_21 + e_2 v_12 v_22) + c_22 (e_0 v_20^2 + e_1 v_21^2 + e_2 v_22^2))"
str = str.replace(/(?<=[^+\|])[\s](?=[^+\|])/g,'*');
str = str.replace(/v_20/g,'V[2][0]');
str = str.replace(/v_21/g,'V[2][1]');
str = str.replace(/v_22/g,'V[2][2]');
str = str.replace(/v_10/g,'V[1][0]');
str = str.replace(/v_11/g,'V[1][1]');
str = str.replace(/v_12/g,'V[1][2]');
str = str.replace(/v_0/g,'V[0][0]');
str = str.replace(/v_1/g,'V[0][1]');
str = str.replace(/v_2/g,'V[0][2]');
str = str.replace(/c_20/g,'m[2][0]');
str = str.replace(/c_21/g,'m[2][1]');
str = str.replace(/c_22/g,'m[2][2]');
str = str.replace(/c_10/g,'m[1][0]');
str = str.replace(/c_11/g,'m[1][1]');
str = str.replace(/c_12/g,'m[1][2]');
str = str.replace(/c_0/g,'m[0][0]');
str = str.replace(/c_1/g,'m[0][1]');
str = str.replace(/c_2/g,'m[0][2]');
console.log(str);
};
*/
	