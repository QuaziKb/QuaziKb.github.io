function init() {
	
				
	//---------------------------------------------------------------------------------------1px white line border
	//renderer.domElement.style.border = "1px solid #FFFFFF"
	
	//---------------------------------------------------------------------------------------animated area size in pixels
	var w =600//window.innerWidth;
	var h =300//window.innerHeight;
	
	//---------------------------------------------------------------------------------------height = height of view area in "scene units", only meaningful for OrthographicCamera, 
	//---------------------------------------------------------------------------------------we assume a 1:1 ratio of "scene units" in the x and y direction (width/height = w/h)		
	var ratio = w/h
	var height = 4;
	var width = ratio*height;
	
	//---------------------------------------------------------------------------------------create scene and camera
	var scene = new THREE.Scene();
	//var camera = new THREE.PerspectiveCamera( 75, w/h, 0.1, 1000 );
	var camera = new THREE.OrthographicCamera( width/-2, width/2, height/2, height/-2, 0.1 , 2000 )
	camera.position.z = 10
	
	//---------------------------------------------------------------------------------------create renderer and set BG color/alpha, append it to the "wrap" div where everything useful is contained
	var renderer = new THREE.WebGLRenderer({ alpha: true });
	renderer.setSize( w, h );
	renderer.setClearColor ( new THREE.Color( 0, 0, 0 ), 0.0 )
	
	
	
	
	
	//---------------------------------------------------------------------------------------create camera controller
	// OrbitControls = new THREE.OrbitControls( camera, renderer.domElement );
	//---------------------------------------------------------------------------------------enable animation loop when using damping or autorotation
	//OrbitControls.enableDamping = true;
	//OrbitControls.dampingFactor = 0.5;
	//OrbitControls.enableZoom = false;
	// OrbitControls.enablePan=false;
	
	//---------------------------------------------------------------------------------------create lights
	var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
	scene.add( directionalLight );
	directionalLight.position.set(1,1,1)
	
	// var ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 );
	// scene.add( ambientLight );
	
	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		
	// var geometry = new THREE.TorusKnotGeometry( 0.5, 0.25, 100, 16 );
	// var material = new THREE.MeshPhongMaterial( { color: new THREE.Color(1,1,0) } );
	// var mesh = new THREE.Mesh(geometry,material)
	// scene.add( mesh );
	
	
	var txt = document.getElementById("lens_txt");
	
	//*************************************************** stuff for creating line objects
	
	var pathmaterial = new THREE.LineBasicMaterial( {
		color : new THREE.Color(0,0,0)
	} );
	
	var fillmaterial = new THREE.MeshBasicMaterial( { color: new THREE.Color(0.55,0.85,1) } );
	
	lens_surf_pts=50;
	var lens= new THREE.FilledOutlineShape(lens_surf_pts*2,fillmaterial,pathmaterial);
	scene.add(lens);
	lens.rotation.z = Math.PI/2
	
	
	var linegeometry = new THREE.Geometry();
	linegeometry.vertices.push(
		new THREE.Vector3( 0, 0, 0 ),
		new THREE.Vector3( 1, 0, 0 )
	);

	var linematerial = new THREE.LineBasicMaterial( {
		color : new THREE.Color(1,1,1)
	} );
	
	raylist = new Array();
	
	tray = function() {
		this.L1=new THREE.Line( linegeometry, linematerial );
		this.L2=new THREE.Line( linegeometry, linematerial );
		this.L3=new THREE.Line( linegeometry, linematerial );
		
		scene.add( this.L1 );
		scene.add( this.L2 );
		scene.add( this.L3 );
		this.L3.scale.x=1000;
		
		raylist.push(this);
		
	};

	for (var i = 0; i < 100; i++) {
	
		a= new tray();
		
	}
	
	a= new QZMath.createSlider("a",0,0,1,0.001);	
	b= new QZMath.createSlider("b",Math.PI/2,-1*Math.PI,Math.PI,0.001);
	
	rayx_slider = new QZMath.createSlider("x",0,-3,-2,0.001);
	rayy_slider = new QZMath.createSlider("y",0,-1,1,0.001);
	rayang_slider = new QZMath.createSlider("ang",0,-1*Math.PI/2,Math.PI/2,0.00001);
	
	document.getElementById("wrap").appendChild( renderer.domElement );
	
	var animate = function () {
		
		//update time data
		frame++;
		current_time_ms=performance.now();
		dt_ms=current_time_ms-prev_time_ms;
		dt_s=dt_ms/1000;
		t=t+dt_s*dt_scale;	
		
		//body (we dont handle internal reflection, for now)

		
		var thick = a.value;
		var beps=Math.max(0.00001,Math.abs(b.value))
		var starty=Math.abs(Math.sin(Math.PI/2-beps/2));
		var startx=1/Math.abs(Math.cos(Math.PI/2-beps/2));
		
		var circlex=starty*startx*Math.sign(b.value)-thick*0.5;
		var circley=0;
		var r = startx;
		
		var circlex2=starty*startx*Math.sign(b.value)*-1+thick*0.5;
		var circley2=0;
		var r2=startx;
		
		
		var arrayLength = raylist.length;
		for (var i = 0; i < arrayLength; i++) {
			var x =  rayx_slider.value;
			var y =  rayy_slider.value;
			var ang = rayang_slider.value+Math.PI/2*((i/arrayLength)-0.5);
			var xa = Math.cos(ang);
			var ya = Math.sin(ang);
		
			var intr_sqrt = Math.pow(2*x*xa - 2*xa*circlex + 2*y*ya - 2*ya*circley,2) - 4*(x*x - 2*x*circlex + y*y - 2*y*circley + circlex*circlex + circley*circley - r*r);
			var intr = 1000;
			raylist[i].L2.visible= false;
			raylist[i].L3.visible= false;
			if(intr_sqrt>0){
				intr =  (Math.sign(b.value)*-0.5*Math.sqrt(intr_sqrt) - x*xa + xa*circlex - y*ya + ya*circley);
				var y2 = (y+ya*intr);
				if(Math.abs(y2)>1){
					intr = 1000;
				}else{ // first ray intersection occured
					var x2 = (x+xa*intr);
					var nx = (x2-circlex)/r*Math.sign(b.value);
					var ny = (y2-circley)/r*Math.sign(b.value);
					
					var cross1 = nx*ya-ny*xa
					var n1DIVn2 =1/1.5;
					var n1DIVn2SQUARED=n1DIVn2*n1DIVn2;
					
					var BIGSQRT = Math.sqrt(1-n1DIVn2SQUARED*cross1*cross1);
					var xa2=n1DIVn2*ny*-1*cross1-nx*BIGSQRT;
					var ya2=n1DIVn2*nx*cross1-ny*BIGSQRT;
					
					var ang2=Math.atan2(ya2, xa2);
					raylist[i].L2.rotation.z=ang2;
					
					raylist[i].L2.visible = true;
					raylist[i].L2.position.x = x2;
					raylist[i].L2.position.y = y2;
				
					var intr_sqrt2 = Math.pow(2*x2*xa2 - 2*xa2*circlex2 + 2*y2*ya2 - 2*ya2*circley2,2) - 4*(x2*x2 - 2*x2*circlex2 + y2*y2 - 2*y2*circley2 + circlex2*circlex2 + circley2*circley2 - r2*r2);
					var intr2 = 1000;
					
					if(intr_sqrt2>0){
						intr2 =  (Math.sign(b.value)*0.5*Math.sqrt(intr_sqrt2) - x2*xa2 + xa2*circlex2- y2*ya2 + ya2*circley2);
						var y3 = (y2+ya2*intr2);
						if(Math.abs(y3)>1){
							intr2 = (Math.sign(ya2)-y2)/ya2;// some extra polish to detect where inner wall collision occurs (sign distinguishes upper and lower)
							
						}else{ // second ray intersection occured
						
							var x3 = (x2+xa2*intr2);
							var nx2 = (x3-circlex2)/r2*-1*Math.sign(b.value);
							var ny2 = (y3-circley2)/r2*-1*Math.sign(b.value);
							
							var cross1_2 = nx2*ya2-ny2*xa2
							var n1DIVn2_2 =1.5/1;
							var n1DIVn2SQUARED_2=n1DIVn2_2*n1DIVn2_2;
													
							var BIGSQRT_2 = Math.sqrt(1-n1DIVn2SQUARED_2*cross1_2*cross1_2);
							var xa3=n1DIVn2_2*ny2*-1*cross1_2-nx2*BIGSQRT_2;
							var ya3=n1DIVn2_2*nx2*cross1_2-ny2*BIGSQRT_2;
							
							var ang3=Math.atan2(ya3, xa3);
							raylist[i].L3.rotation.z=ang3;
							
							raylist[i].L3.visible = true;
							raylist[i].L3.position.x = x3;
							raylist[i].L3.position.y = y3;
				
						};
						
					}else{
						intr2 = (Math.sign(ya2)-y2)/ya2;// some extra polish to detect where inner wall collision occurs (sign distinguishes upper and lower)
					};
					raylist[i].L2.scale.x = intr2;
				};
			};
			
			raylist[i].L1.position.x = x;
			raylist[i].L1.position.y = y;
			raylist[i].L1.rotation.z= ang;
			
			raylist[i].L1.scale.x = intr;
		
		};
		
		for (var i = 0; i < lens_surf_pts; i++) {
			var p=i/(lens_surf_pts-1);
			
			lens.geometry.vertices[i].y=(Math.sin(Math.PI/2-beps/2+p*beps)*Math.sign(b.value)-starty*Math.sign(b.value))*startx+0.5*thick;
			lens.geometry.vertices[i].x=Math.cos(Math.PI/2-beps/2+p*beps)*startx;
			lens.geometry.vertices[i+lens_surf_pts].y=(Math.sin(Math.PI+Math.PI/2-beps/2+p*beps)*Math.sign(b.value)+starty*Math.sign(b.value))*startx-0.5*thick;
			lens.geometry.vertices[i+lens_surf_pts].x=Math.cos(Math.PI+Math.PI/2-beps/2+p*beps)*startx;
		};
		lens.geometry.vertices[lens.pt_count].copy(lens.geometry.vertices[0])
		
		lens.geometry.verticesNeedUpdate = true;
		lens.updateFillVertices();

		
		
		requestAnimationFrame( animate );
						
		// OrbitControls.update();
		renderer.render(scene, camera);
		
		//store current time for next frames dt measurement.
		prev_time_ms=current_time_ms;
	};
	
	//---------------------------------------------------------------------------------------intialize time/frame data
	frame=0;
	start_time_ms=performance.now();
	current_time_ms=start_time_ms;
	prev_time_ms=start_time_ms;
	current_time_ms=0;
	dt_ms=0;
	dt_s=0;
	t=0; //current time in ms with timescale effects accounted for
	dt_scale=1;
	//---------------------------------------------------------------------------------------run animation
	animate();
};
	
//---------------------------------------------------------------------------------------create the animated area at the current point in the HTML translation, activate everything
init();