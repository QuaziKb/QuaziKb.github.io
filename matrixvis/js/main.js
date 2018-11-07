function main() {

var A_mtx = new QZMath.tableCreate(document.getElementById("A_mtx"),3,3);

//size of display area
var w =500
var h =300
//scale of displayed graphics (pixels/meter (meter = 1 3D unit) in orthographic view) ... kind of meaningless in perspective view
var scale = 100;

var ratio = w/h
var height = h/scale;
var width = w/scale;

var scene = new THREE.Scene();

//var camera = new THREE.PerspectiveCamera( 75, w/h, 0.1, 1000 );
var camera = new THREE.OrthographicCamera( width/-2, width/2, height/2, height/-2, 0.1 , 2000 );
camera.position.z = 1000;
			
var renderer = new THREE.WebGLRenderer({ alpha: true, antialias:true });
renderer.setSize( w, h );
renderer.setClearColor ( new THREE.Color( 0, 0, 0 ), 0.0 )
document.getElementById("wrap").appendChild( renderer.domElement );

//1px white line border
//renderer.domElement.style.border = "1px solid #FFFFFF"			

controls = new THREE.OrbitControls( camera, renderer.domElement );
// enable animation loop when using damping or autorotation
//controls.enableDamping = true;
//controls.dampingFactor = 0.5;
controls.enableZoom = false;
controls.enablePan=false;
/*
var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
scene.add( directionalLight );
directionalLight.position.set(3,4,5)

var ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 );
scene.add( ambientLight );
*/
//---------------------------------------------------------------------------------------intialize time/frame data
var frame=0;
var start_time_ms=performance.now();
var current_time_ms=start_time_ms;
var prev_time_ms=start_time_ms;
var current_time_ms=0;
var dt_ms=0;
var dt_s=0;
var t=0; //current time in ms with timescale effects accounted for
var dt_scale=1;
//---------------------------------------------------------------------------------------initialize stuff
var cube = new THREE.Object3D();
var geometry = new THREE.PlaneGeometry( 1, 1, 1 );
var faces = [];
for(var i = 0; i < 3; i++){
	for(var j = 0; j < 2; j++){
			var x = (i==0)*(j*2-1);
			var y = (i==1)*(j*2-1);
			var z = (i==2)*(j*2-1);
			//console.log((z+1)/2);
			var mat = new THREE.MeshBasicMaterial({color: new THREE.Color(0.2+Math.pow((x+1)/2,2)*0.2,0.2+Math.pow((y+1)/2,2)*0.2,0.2+Math.pow((z+1)/2,2)*0.2)})
			mat.side = THREE.DoubleSide;
			var mesh = new THREE.Mesh(geometry,mat);
			mesh.position.set(x*0.5,y*0.5,z*0.5);
			//mesh.position.set((x+1)/2,(y+1)/2,(z+1)/2);
			mesh.rotation.y=x*Math.PI/2;
			mesh.rotation.x=y*Math.PI/-2;
			if(z<-0.5){
				mesh.rotation.x=Math.PI;
			}
			mesh.face_normal = new THREE.Vector3(x,y,z);
			faces.push(mesh);
			cube.add(mesh)
	};
};


scene.add( cube );
cube.matrixAutoUpdate = false;
var axisL = new THREE.AxesHelper(1);
cube.add( axisL );
var axisW = new THREE.AxesHelper(1);
scene.add( axisW );
//---------------------------------------------------------------------------------------define main update loop
var update = function(){
	A_mtx.updateData();
	for(var i = 0; i < A_mtx.rows; i++){
	    for(var j = 0; j < A_mtx.columns; j++){
			cube.matrix.elements[i*4+j]=QZMath.lerp(cube.matrix.elements[i*4+j],A_mtx.e[j][i],0.1);
		};
	};
	for(var i = 0, L = faces.length; i < L; i++){
		//console.log(i);
		var face = faces[i];
		var v =	face.face_normal.clone();
		v.applyMatrix4(cube.matrix).normalize();
		face.material.color.setRGB(0.2+Math.pow((v.x+1)/2,2)*0.2,0.2+Math.pow((v.y+1)/2,2)*0.2,0.2+Math.pow((v.z+1)/2,2)*0.2)
	}
};
//---------------------------------------------------------------------------------------define common animation function
var animate = function () {

	//update time data
	frame++;
	current_time_ms=performance.now();
	dt_ms=current_time_ms-prev_time_ms;
	dt_s=dt_ms/1000;
	t=t+dt_s*dt_scale;
	
	controls.update();
	update();
	renderer.render(scene, camera);
	
	prev_time_ms=current_time_ms;
	
	requestAnimationFrame(animate);
};

//---------------------------------------------------------------------------------------run animation
animate();
};
main();