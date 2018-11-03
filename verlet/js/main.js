var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

function VerletWorld(scene){
	this.geometry = new THREE.SphereGeometry( 1, 100, 100);
	this.geometry_plane = new THREE.PlaneGeometry(1000,1000, 1, 1);
	this.geometry_spring = new THREE.CylinderGeometry(1, 1, 1, 100, 1, true);
	this.geometry_spring.rotateX(Math.PI/2);
	
	this.gravity = new THREE.Vector3(0,-1,0);
	
	this.scene = scene;
	this.pt_list = [];
	this.pt_count = 0;
	this.plane_list = [];
	this.plane_count = 0;
	this.spring_list = [];
	this.spring_count = 0;
	this.selectable_mesh_list = [];
	this.selectable_mesh_count = 0;
};
VerletWorld.prototype.addVerletPt = function(pt) {
	pt.material = new THREE.MeshPhongMaterial( { color: new THREE.Color(1,1,1) } );
	pt.mesh = new THREE.Mesh(this.geometry,pt.material);
	pt.mesh.scale.set(pt.radius,pt.radius,pt.radius);
	pt.mesh.pt_ref = pt;
	pt.mesh.castShadow=true;
	pt.mesh.receiveShadow =true;
	this.scene.add(pt.mesh);
	this.pt_list.push(pt);
	this.selectable_mesh_list.push(pt.mesh);
	this.selectable_mesh_count++;
	this.pt_count++;
};
VerletWorld.prototype.addVerletSolidPlane = function(plane) {
	plane.mesh = new THREE.Mesh(this.geometry_plane,plane.material);
	plane.mesh.position.copy(plane.p);
	plane.mesh.receiveShadow =true;
	var v = new THREE.Vector3().copy(plane.p);
	plane.mesh.lookAt(v.add(plane.n));
	this.scene.add(plane.mesh);
	this.plane_list.push(plane);
	this.plane_count++;
};
VerletWorld.prototype.addVerletSpring = function(spring) {
	spring.material = new THREE.MeshPhongMaterial( { color: new THREE.Color(1,1,1) } );
	spring.mesh = new THREE.Mesh(this.geometry_spring,spring.material);
	spring.mesh.castShadow=true;
	spring.mesh.receiveShadow =true;
	
	var radius = Math.min(spring.pt0.radius,spring.pt1.radius)*0.5
	spring.mesh.scale.set(radius,radius,spring.L);
	this.scene.add(spring.mesh);
	
	this.spring_list.push(spring);
	this.spring_count++;
};
VerletWorld.prototype.step = function() {
	for (var i = 0; i < this.pt_count; i++) {
		var pt = this.pt_list[i];
		pt.p_scratch.copy(pt.p);
		
		pt.p.x = pt.p.x +(pt.p.x-pt.p_prev.x)+this.gravity.x;
		pt.p.y = pt.p.y +(pt.p.y-pt.p_prev.y)+this.gravity.y;
		pt.p.z = pt.p.z +(pt.p.z-pt.p_prev.z)+this.gravity.z;
		
		pt.p_prev.copy(pt.p_scratch);
	};

	for (var i = 0; i < this.spring_count; i++) {
		var spring = this.spring_list[i];
		spring.resolve();
	};
	for (var i = 0; i < this.plane_count; i++) {
		var plane = this.plane_list[i];
		plane.resolve();
	};
	//update spring graphics
	for (var i = 0; i < this.spring_count; i++) {
		var spring = this.spring_list[i];
		spring.mesh.position.copy(spring.pt0.p).add(spring.pt1.p).divideScalar(2);
		var len = spring.diff.subVectors(spring.pt0.p,spring.pt1.p).length();
		spring.mesh.scale.z=len;
		spring.mesh.lookAt(spring.pt1.p);
	};	
	//update pt graphics
	for (var i = 0; i < this.pt_count; i++) {
		var pt = this.pt_list[i];
		pt.mesh.position.copy(pt.p);
	};
};
function VerletPt (radius,mass,world) {
	this.radius = radius;
	this.mass = mass;
	// position of the verlet point
	this.p = new THREE.Vector3(0,0,0);
	// previous position of the verlet point
	this.p_prev = new THREE.Vector3(0,0,0);
	//scratch buffer used for temporarily storing a Vector3
	this.p_scratch = new THREE.Vector3(0,0,0);
	world.addVerletPt(this);
	this.world = world;
}	
VerletPt.prototype.setPosition = function(position) {
	this.p.copy(position);
	this.p_prev.copy(position);
	this.mesh.position.copy(position);
};
function VerletSolidPlane(position,normal,color,world){
	this.material = new THREE.MeshPhongMaterial( { color: color } );
	this.p = new THREE.Vector3().copy(position);
	this.n = new THREE.Vector3().copy(normal);
	this.n = this.n.normalize();
	this.d = new THREE.Vector3(0,0,0);
	world.addVerletSolidPlane(this);
	this.world = world;
};
VerletSolidPlane.prototype.resolve = function() {
	for (var i = 0; i < this.world.pt_count; i++) {
			var pt = this.world.pt_list[i];
			
			//get signed distance from plane;
			this.d.x = pt.p.x-this.p.x;
			this.d.y = pt.p.y-this.p.y;
			this.d.z = pt.p.z-this.p.z;
			var signed_d = this.n.dot(this.d)-pt.radius; //if the signed distance between surface of sphere and plane;
			//console.log(signed_d);
			if(signed_d<0){ //if less than zero, we're penetrating the surface and need to project out to resolve constraint;
				pt.p.x = pt.p.x-this.n.x*signed_d;
				pt.p.y = pt.p.y-this.n.y*signed_d;
				pt.p.z = pt.p.z-this.n.z*signed_d;
			};			
	};
};
function VerletSpring(pt0,pt1,L,world){
	this.L=L;
	this.pt0 = pt0;
	this.pt1 = pt1;
	this.diff = new THREE.Vector3();
	this.n = new THREE.Vector3();
	this.w0 = pt1.mass/(pt0.mass+pt1.mass);
	this.w1 = pt0.mass/(pt0.mass+pt1.mass);
	world.addVerletSpring(this);
	this.world = world;
	this.k=0.25;
};
VerletSpring.prototype.resolve = function() {
	this.diff.subVectors(this.pt1.p,this.pt0.p);
	var d = this.diff.length();
	if(d<0.0001){
		this.n.set(0,0,1);
	}else{
		this.n.copy(this.diff).divideScalar(d);
	};
	var delta = (d-this.L)*this.k;
	this.pt0.p.addScaledVector(this.n,delta*this.w0);
	this.pt1.p.addScaledVector(this.n,-delta*this.w1);
}

function main() {
//size of display area
var w =600
var h =600
//scale of displayed graphics (pixels/meter (meter = 1 3D unit) in orthographic view) ... kind of meaningless in perspective view
var scale = 1;

var ratio = w/h
var height = h/scale;
var width = w/scale;

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera( 75, w/h, 0.1, 10000 );
//camera.updateProjectionMatrix();
//camera.projectionMatrixInverse = new THREE.Matrix4();
//camera.projectionMatrixInverse.getInverse(camera.projectionMatrix);

//var camera = new THREE.OrthographicCamera( width/-2, width/2, height/2, height/-2, 0.1 , 2000 );
camera.position.z = 1000;
			
var renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize( w, h );
renderer.setClearColor ( new THREE.Color( 0, 0, 0 ), 0.0 )
renderer.shadowMapEnabled = true;
renderer.shadowMapSoft = true;
renderer.shadowMapType = THREE.PCFSoftShadowMap;
document.getElementById("wrap").appendChild( renderer.domElement );

function onMouseMove( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	var rect = renderer.domElement.getBoundingClientRect();

	mouse.x = ( (event.clientX- rect.left) / (rect.right-rect.left) )*2-1;
	mouse.y = (( (event.clientY- rect.top) / (rect.bottom-rect.top) )*-2+1);

}
window.addEventListener( 'mousemove', onMouseMove);

//1px white line border
//renderer.domElement.style.border = "1px solid #FFFFFF"			

controls = new THREE.OrbitControls( camera, renderer.domElement );
// enable animation loop when using damping or autorotation
//controls.enableDamping = true;
//controls.dampingFactor = 0.5;
//controls.enableZoom = false;
controls.enablePan=true;

var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.6 );
directionalLight.position.set(3*120,5*120,4*120)
directionalLight.lookAt(new THREE.Vector3(0,0,0));
directionalLight.castShadow=true;
directionalLight.shadow.mapSize.width = 512;  // default
directionalLight.shadow.mapSize.height = 512; // default
directionalLight.shadow.camera.near = 0.01;    // default
directionalLight.shadow.camera.far = 2000;     // default
directionalLight.shadow.camera.left = -700;     // default
directionalLight.shadow.camera.right = 700;     // default
directionalLight.shadow.camera.top = -900;     // default
directionalLight.shadow.camera.bottom = 900;     // default
directionalLight.shadow.bias = -0.005;
//var helper = new THREE.CameraHelper( directionalLight.shadow.camera );
//scene.add( helper );
scene.add( directionalLight );

var pointLight = new THREE.PointLight( 0xffffff, 0.3 , 0, 2);
scene.add( pointLight );
var ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 );
scene.add( ambientLight );

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
var v_world = new VerletWorld(scene);
/*var v0 = new VerletPt(32,1,v_world);
var v1 = new VerletPt(32,1,v_world);
var v2 = new VerletPt(32,1,v_world);
var s1 = new VerletSpring(v0,v1,150,v_world);
var s2 = new VerletSpring(v1,v2,150,v_world);
var s2 = new VerletSpring(v2,v0,150,v_world);
for*/
var v0 = new VerletPt(32,1,v_world);
var v1 = new VerletPt(32,1,v_world);
var si = new VerletSpring(v0,v1,128,v_world);
for (var i = 0; i < 10; i++) {
	var vi = new VerletPt(16+Math.random()*32,1,v_world);
	vi.setPosition(new THREE.Vector3(i*150,0,0))
	if(Math.random()>0.5){
	var si = new VerletSpring(v1,vi,64+Math.random()*80,v_world);
	}
	if(Math.random()>0.5){
		var si = new VerletSpring(vi,v0,64+Math.random()*80,v_world);
	}
	v0 = v1;
	v1 = vi;
}
var plane0 = new VerletSolidPlane(new THREE.Vector3(0,-500,0), new THREE.Vector3(0,1,0),new THREE.Color(1,1,1),v_world);
var plane1 = new VerletSolidPlane(new THREE.Vector3(500,0,0), new THREE.Vector3(-1,0,0),new THREE.Color(1,1,1),v_world);
var plane2 = new VerletSolidPlane(new THREE.Vector3(-500,0,0), new THREE.Vector3(1,0,0),new THREE.Color(1,1,1),v_world);
var plane3 = new VerletSolidPlane(new THREE.Vector3(0,500,0), new THREE.Vector3(0,-1,0),new THREE.Color(1,1,1),v_world);
var plane4 = new VerletSolidPlane(new THREE.Vector3(0,0,500), new THREE.Vector3(0,0,-1),new THREE.Color(1,1,1),v_world);
var plane5 = new VerletSolidPlane(new THREE.Vector3(0,0,-500), new THREE.Vector3(0,0,1),new THREE.Color(1,1,1),v_world);

	g = new THREE.SphereGeometry( 10, 100, 100);
	m = new THREE.MeshPhongMaterial( { color: new THREE.Color(1,0,0) } );

	mouse_mesh = new THREE.Mesh(g,m);
	mouse_mesh.visible = false;
	scene.add(mouse_mesh);
var cursor_last_pt = new THREE.Vector3(0,0,0);
var diff = new THREE.Vector3(0,0,0);
var cursor_selected_offset = new THREE.Vector3(0,0,0);
var selected_VerletPt = null; 
//---------------------------------------------------------------------------------------define main update loop
var update = function(){

	//hide cursor on touch screen
	if(QZMouse_frames[0] > 0 || QZMouse_frames[1] > 0 || QZMouse_frames[2] > 0) 	mouse_mesh.visible = true;
	if(QZTouch.hasTouch) 	mouse_mesh.visible = false;
	
	QZMath.updateKeyAndMouseFrames();
	for (var i = 0; i < v_world.selectable_mesh_count; i++) {
		var mesh = v_world.selectable_mesh_list[i];
		mesh.material.color.set( 0xffffff );
	}
	
	if(QZMouse_frames[0] <= 0){
		if(selected_VerletPt !== null){
			selected_VerletPt = null;
		};
	};
	// update the picking ray with the camera and mouse position
	raycaster.setFromCamera( mouse, camera );
	var intersects = raycaster.intersectObjects( v_world.selectable_mesh_list );
	// calculate objects intersecting the picking ray
	if(intersects.length > 0){
		//var t =1-QZMath.clamp(QZMouse_frames[0]/10,0,1);
		//intersects[ 0 ].object.material.color.setRGB(1,t,t);
		if(QZMouse_frames[0] <= 1){
			cursor_last_pt =  intersects[0].point;
		};
		if(QZMouse_frames[0] === 1){
			selected_VerletPt = intersects[ 0 ].object.pt_ref;
			cursor_selected_offset.subVectors(cursor_last_pt,selected_VerletPt.p);
		};
	};
	diff.subVectors(camera.position,cursor_last_pt);
	var mouse3D = raycaster.ray.origin.clone().addScaledVector( raycaster.ray.direction,diff.length());
	
	if(selected_VerletPt !== null){
		var t =1-QZMath.clamp(QZMouse_frames[0]/10,0,1);
		selected_VerletPt.mesh.material.color.setRGB(1,t,t);
		selected_VerletPt.p_prev.x =  QZMath.lerp(selected_VerletPt.p.x,selected_VerletPt.p_prev.x-(mouse3D.x-(selected_VerletPt.p.x+cursor_selected_offset.x))*0.1,0.8);
		selected_VerletPt.p_prev.y =  QZMath.lerp(selected_VerletPt.p.y,selected_VerletPt.p_prev.y-(mouse3D.y-(selected_VerletPt.p.y+cursor_selected_offset.y))*0.1,0.8);
		selected_VerletPt.p_prev.z =  QZMath.lerp(selected_VerletPt.p.z,selected_VerletPt.p_prev.z-(mouse3D.z-(selected_VerletPt.p.z+cursor_selected_offset.z))*0.1,0.8);
		
	}
	v1.p_prev.x =  QZMath.lerp(v1.p.x,v1.p_prev.x-(Math.cos(current_time_ms*Math.PI/2500)*100-(v1.p.x+cursor_selected_offset.x))*0.1,0.8);
	v1.p_prev.y =  QZMath.lerp(v1.p.y,v1.p_prev.y-(300+Math.cos(current_time_ms*Math.PI/1000)*200-(v1.p.y+cursor_selected_offset.y))*0.1,0.8);
	v1.p_prev.z =  QZMath.lerp(v1.p.z,v1.p_prev.z-(Math.sin(current_time_ms*Math.PI/2500)*100-(v1.p.z+cursor_selected_offset.z))*0.1,0.8);
	/*var e = camera.matrixWorld.elements;
	var cam_x = new THREE.Vector3(e[ 0 ],e[ 1 ],e[ 2 ]);
	var cam_y = new THREE.Vector3(e[ 4 ],e[ 5 ],e[ 6 ]);
	var cam_z = new THREE.Vector3(- e[ 8 ],- e[ 9 ],- e[ 10 ]);*/
	//camera.updateMatrixWorld();
	//console.log(camera.matrixWorld.elements[0]);
	
	mouse_mesh.position.copy(mouse3D);
	v_world.step();
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