function main() {

var A_mtx = new QZMath.tableCreate(document.getElementById("A_mtx"),3,3);

//size of display area
var w =720
var h =720
//scale of displayed graphics (pixels/meter (meter = 1 3D unit) in orthographic view) ... kind of meaningless in perspective view
var scale = 100;

var ratio = w/h
var height = h/scale;
var width = w/scale;

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera( 75, w/h, 0.1, 1000 );
//var camera = new THREE.OrthographicCamera( width/-2, width/2, height/2, height/-2, 0.1 , 2000 );
camera.position.z = 3;
			
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

var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
scene.add( directionalLight );
directionalLight.position.set(1,0.25,2)

var ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 );
scene.add( ambientLight );
			
var geometry = new THREE.BoxGeometry( 1, 0.1, 0.1 );
var material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
var pbox = new THREE.Mesh( geometry, material );
var imaterial = new THREE.MeshPhongMaterial( { color: new THREE.Color(1,0,0) } );
var ibox = new THREE.Mesh( geometry, imaterial );
var parent = new THREE.Object3D();
var child = new THREE.Object3D();
var inter = new THREE.Object3D();

var parent_t = new THREE.Object3D();
var child_t = new THREE.Object3D();

pbox.position.x = 0.5;
ibox.position.x = 0.5;
inter.add(ibox);
inter.position.z+=1;
parent.add(pbox.clone());
child.add(pbox.clone());
parent_t.add(pbox.clone());
child_t.add(pbox.clone());

scene.add( inter );

scene.add( child );
scene.add( parent );

scene.add( child_t );
scene.add( parent_t );

var axisW = new THREE.AxesHelper(1);
scene.add( axisW );
parent.rotation.y=1.7;
parent.rotation.x=-1;
parent_t.rotation.y=-1.2;
parent_t.rotation.x=-0.5;
var arrowHelper = new THREE.ArrowHelper( new THREE.Vector3(1,1,1), new THREE.Vector3(0,0,0), 1, new THREE.Color(1,0,0) );
scene.add( arrowHelper );
//---------------------------------------------------------------------------------------define main update loop

var q_inter = new THREE.Quaternion();
var q1diff = new THREE.Quaternion();
var q0diff = new THREE.Quaternion();
var Dq = new THREE.Quaternion();
var Dq_axis = new THREE.Vector3();
var Dq_angle = 0;

var animate_t = 0;
var update = function(){
	child.quaternion.copy(parent.quaternion)
	A_mtx.updateData();
	
	animate_t = ((frame%400)/400);
	child_t.quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI/2+Math.sin(animate_t*Math.PI*2)*Math.PI/2 );
	child_t.quaternion.multiplyQuaternions(parent_t.quaternion,child_t.quaternion);
	//local position
	child.position.set(1,0,0);
	child.position.applyQuaternion(parent.quaternion);
	
	child_t.position.set(1,0,0);
	child_t.position.applyQuaternion(parent_t.quaternion);
	inter.position.copy(child.position);
	//local mode
	//quaternion

	q_inter.copy(parent_t.quaternion);
	var dot = parent_t.quaternion.dot(child_t.quaternion);
	if(dot<0){
		child_t.quaternion.set(
			child_t.quaternion.x*-1,
			child_t.quaternion.y*-1,
			child_t.quaternion.z*-1,
			child_t.quaternion.w*-1
		);
	}
	q_inter.inverse();
	q1diff.multiplyQuaternions(q_inter,child_t.quaternion);
	
	q_inter.copy(parent.quaternion);
	var dot = parent_t.quaternion.dot(child.quaternion);
	if(dot<0){
		child_t.quaternion.set(
			child.quaternion.x*-1,
			child.quaternion.y*-1,
			child.quaternion.z*-1,
			child.quaternion.w*-1
		);
	}
	q_inter.inverse();
	q0diff.multiplyQuaternions(q_inter,child.quaternion);
	
	q_inter.copy(q0diff);
	var dot = q0diff.dot(q1diff);
	if(dot<0){
		child_t.quaternion.set(
			q1diff.quaternion.x*-1,
			q1diff.quaternion.y*-1,
			q1diff.quaternion.z*-1,
			q1diff.quaternion.w*-1
		);
	}
	q_inter.inverse();
	Dq.multiplyQuaternions(q1diff,q_inter);
	Dq.multiplyQuaternions(parent.quaternion,Dq);
	q_inter.copy(parent.quaternion);
	q_inter.inverse();
	Dq.multiplyQuaternions(Dq,q_inter);
	
	var axis_factor = 1.0-Dq.w*Dq.w;
    Dq_axis.set(0,0,0);
    if(axis_factor>0.00000001) { //correct for singularity or possibly negative values
        //axis factor normalizes the axis then scales by angle/h (angular rotation rate)
        Dq_angle = 2 * Math.acos(Dq.w);
        axis_factor = 1/(Math.sqrt(axis_factor));
        Dq_axis.set(
        		Dq.x*axis_factor,
        		Dq.y*axis_factor,
        		Dq.z*axis_factor
        		);
    }
	arrowHelper.setDirection(Dq_axis);
	arrowHelper.setLength(Dq_angle);
	inter.quaternion.multiplyQuaternions(parent.quaternion,q1diff);
	
	//global mode
	//quaternion
	
	/*
	q_inter.copy(parent_t.quaternion);
	var dot = parent_t.quaternion.dot(child_t.quaternion);
	if(dot<0){
		child_t.quaternion.set(
			child_t.quaternion.x*-1,
			child_t.quaternion.y*-1,
			child_t.quaternion.z*-1,
			child_t.quaternion.w*-1
		);
	}
	q_inter.inverse();
	q_inter.multiply(child_t.quaternion,parent.quaternion);
	
	inter.quaternion.multiplyQuaternions(q_inter,parent.quaternion);*/
	
	/*for(var i = 0; i < A_mtx.rows; i++){
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
	}*/
	
	
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