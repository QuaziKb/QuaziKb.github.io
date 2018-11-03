function init() {

			
//---------------------------------------------------------------------------------------1px white line border
//renderer.domElement.style.border = "1px solid #FFFFFF"

//---------------------------------------------------------------------------------------animated area size in pixels
var w =600//window.innerWidth;
var h =300//window.innerHeight;

//---------------------------------------------------------------------------------------height = height of view area in "scene units", only meaningful for OrthographicCamera, 
//---------------------------------------------------------------------------------------we assume a 1:1 ratio of "scene units" in the x and y direction (width/height = w/h)		
var ratio = w/h
var height = 10;
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
document.getElementById("wrap").appendChild( renderer.domElement );




//---------------------------------------------------------------------------------------create camera controller
OrbitControls = new THREE.OrbitControls( camera, renderer.domElement );
//---------------------------------------------------------------------------------------enable animation loop when using damping or autorotation
//OrbitControls.enableDamping = true;
//OrbitControls.dampingFactor = 0.5;
//OrbitControls.enableZoom = false;
OrbitControls.enablePan=false;

//---------------------------------------------------------------------------------------create lights
var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
scene.add( directionalLight );
directionalLight.position.set(1,1,1)

var ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 );
scene.add( ambientLight );

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	
var geometry = new THREE.TorusKnotGeometry( 1, 0.5, 100, 16 );
var material = new THREE.MeshPhongMaterial( { color: new THREE.Color(1,1,1) } );
var mesh = new THREE.Mesh(geometry,material)
scene.add( mesh );

var animate = function () {
	
	//update time data
	frame++;
	current_time_ms=performance.now();
	dt_ms=current_time_ms-prev_time_ms;
	dt_s=dt_ms/1000;
	t=t+dt_s*dt_scale;
	
	mesh.rotation.y=t;
	
	requestAnimationFrame( animate );
					
	OrbitControls.update();
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