	function createSlider(name,start_value,min_value,max_value,step_size){
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
		this.sliderdiv.style.background = QZMath.getRandomHTMLColor();
		
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
	