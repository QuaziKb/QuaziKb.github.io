function main() {

var mouse = new THREE.Vector2(0,0);
function onMouseMove( event ) {

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	var rect = renderer.domElement.getBoundingClientRect();

	mouse.x = ( (event.clientX- rect.left) / (rect.right-rect.left) )*2-1;
	mouse.y = (( (event.clientY- rect.top) / (rect.bottom-rect.top) )*-2+1);

}
window.addEventListener( 'mousemove', onMouseMove);

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

var camera = new THREE.PerspectiveCamera( 75, w/h, 1, 100 );
//var camera = new THREE.OrthographicCamera( width/-2, width/2, height/2, height/-2, 0.1 , 2000 );
camera.position.z = 6;
			
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
			
var main_radius = Math.PI;
var sph_geometry = new THREE.SphereGeometry( main_radius, 32, 32 );
var circ_geometry = new THREE.CircleGeometry( main_radius, 32 );
var material = new THREE.MeshPhongMaterial( { color: new THREE.Color(1,1,1) } );

var cube_geometry = (new THREE.BoxGeometry( 3, 1, 0.5 )).translate(1.5,0,0);
var stick_geometry = (new THREE.BoxGeometry( 0.1, 0.1, 1 )).translate(0,0,0.5);
material.opacity = 0.2;
material.blending = THREE.CustomBlending;
material.transparent = true;
material.side = THREE.FrontSide;
material.depthWrite = false;
var material2 = material.clone();
material2.side = THREE.BackSide;
var material3 = material.clone();
material3.depthWrite = true;
material3.opacity = 0.4;
material3.side = THREE.DoubleSide;
var q0cube = new THREE.Mesh(cube_geometry, material);
var q1cube = q0cube.clone();
var v1cube = q0cube.clone();
var mainSph = new THREE.Mesh(sph_geometry, material);
var mainCirc = new THREE.Mesh(circ_geometry, material3);
var bmainSph = new THREE.Mesh(sph_geometry, material2 );
var imaterial = new THREE.MeshPhongMaterial( { color: new THREE.Color(1,1,1) } );
var q0sph = new THREE.Mesh( sph_geometry, imaterial );
q0sph.scale.set(0.05,0.05,0.05);
var q1sph = q0sph.clone();
q1sph.material = q1sph.material.clone();
q1sph.material.color = new THREE.Color(0,1,0);
var SLERPsph = q0sph.clone();
SLERPsph.material = q1sph.material;
SLERPsph.scale.set(0.01,0.01,0.01)
var axisW = new THREE.AxesHelper(1);
scene.add( axisW );
//scene.add( bmainSph );
//scene.add( mainCirc );
mainCirc.rotation.x = Math.PI/2;
//scene.add( mainSph );

var q0sphstick = new THREE.Mesh( stick_geometry, q0sph.material );
var q1sphstick = new THREE.Mesh( stick_geometry, q1sph.material );
scene.add( q0sphstick );
scene.add( q1sphstick );
scene.add( q0sph );
scene.add( q1sph );

var w1sph = q0sph.clone();
w1sph.material = w1sph.material.clone();
w1sph.material.color = new THREE.Color(1,0,0);
var w1sphstick = new THREE.Mesh( stick_geometry, w1sph.material );
scene.add( w1sph );
scene.add( w1sphstick );


scene.add( q0cube );
q1cube.material = q1cube.material.clone();
q1cube.material.color = new THREE.Color(0,1,0);
scene.add( q1cube );

v1cube.material = v1cube.material.clone();
v1cube.material.color = new THREE.Color(1,0,0);
scene.add( v1cube );


//SLERPsph_arr = [];
//for (i = 0; i < 100; i++) {
//  SLERPsph_arr[i] = SLERPsph.clone();
//  scene.add( SLERPsph_arr[i] );
//}

//var arrowHelper = new THREE.ArrowHelper( new THREE.Vector3(1,1,1), new THREE.Vector3(0,0,0), 1, new THREE.Color(1,0,0) );
//scene.add( arrowHelper );
//---------------------------------------------------------------------------------------define main update loop
var qtemp = new THREE.Quaternion();
var q0 = new THREE.Quaternion();
var q1 = new THREE.Quaternion();
var q0_prev = new THREE.Quaternion();
var q1_prev = new THREE.Quaternion();
var q0_omega = new THREE.Vector3();
var q1_omega = new THREE.Vector3();

var qDelta = new THREE.Vector3();
var qD = new THREE.Quaternion();
var Smtx = new THREE.Matrix4();
var v1axis = new THREE.Vector3();
var v1angle = 0;

var ToAngVel = function (q_prev,q_next,vec,dt) {
    var q = new THREE.Quaternion();
    q.copy(q_prev);
    if(q_prev.dot(q_next)<0){
        q.set(-q.x,-q.y,-q.z,-q.w)
    }
    q.inverse();
    q.multiplyQuaternions(q,q_next);
    var axis = new THREE.Vector3();
    var angle = 2 * Math.acos(q.w)/dt;
    var angvel = new THREE.Vector3();
    var s = Math.sqrt(1-q.w*q.w); // assuming quaternion normalised then w is less than or eq 1, so term always positive.
    if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
    // if s close to zero then direction of axis not important
        angvel.x = angle * q.x; // if it is important that axis is normalised then replace with x=1; y=z=0;
        angvel.y = angle * q.y;
        angvel.z = angle * q.z;
        
        axis.x = 1;
        axis.y = 0;
        axis.z = 0;
    } else {
        angvel.x = angle * q.x / s; // normalise axis
        angvel.y = angle * q.y / s;
        angvel.z = angle * q.z / s;
        
        axis.x = q.x / s;
        axis.y = q.y / s;
        axis.z = q.z / s;
    }   
    vec.copy(angvel);
    return [axis,angle]
}

var ToAxisAnglePos = function (q,obj) {
    var axis = new THREE.Vector3();
    var angle = 2 * Math.acos(q.w);
    var s = Math.sqrt(1-q.w*q.w); // assuming quaternion normalised then w is less than or eq 1, so term always positive.
    if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
    // if s close to zero then direction of axis not important
        axis.x = angle * q.x; // if it is important that axis is normalised then replace with x=1; y=z=0;
        axis.y = angle * q.y;
        axis.z = angle * q.z;
    } else {
        axis.x = angle * q.x / s; // normalise axis
        axis.y = angle * q.y / s;
        axis.z = angle * q.z / s;
    }   
    obj.position.copy(axis);
    return;
}

var mySlerp = function (qin, qb, t ) {

        var qa = qin.clone();

		if ( t === 0 ) return qa;
		if ( t === 1 ) return qa.copy(qb);

		var x = qa.x, y = qa.y, z = qa.z, w = qa.w;

		// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

		var cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;

	//	if ( cosHalfTheta < 0 ) {
    //
	//		qa.w = - qb.w;
	//		qa.x = - qb.x;
	//		qa.y = - qb.y;
	//		qa.z = - qb.z;
    //
	//		cosHalfTheta = - cosHalfTheta;
    //
	//	} else {

			qa.copy( qb );

	//	}

		if ( cosHalfTheta >= 1.0 ) {

			qa.w = w;
			qa.x = x;
			qa.y = y;
			qa.z = z;

			return qa;

		}

		var sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

		if ( sqrSinHalfTheta <= Number.EPSILON ) {

			var s = 1 - t;
			qa.w = s * w + t * qa.w;
			qa.x = s * x + t * qa.x;
			qa.y = s * y + t * qa.y;
			qa.z = s * z + t * qa.z;

			qa.normalize();

			return qa;

		}

		var sinHalfTheta = Math.sqrt( sqrSinHalfTheta );
		var halfTheta = Math.atan2( sinHalfTheta, cosHalfTheta );
		var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
			ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

		qa.w = ( w * ratioA + qa.w * ratioB );
		qa.x = ( x * ratioA + qa.x * ratioB );
		qa.y = ( y * ratioA + qa.y * ratioB );
		qa.z = ( z * ratioA + qa.z * ratioB );

		return qa;

	}


var setS = function (q, Sout) {
    
    //copied from forbes book (might be wrong??)
    Sout.set(
     2*q.w, -2*q.z,2*q.y,-2*q.x,
     2*q.z, 2*q.w, -2*q.x,-2*q.y,
    -2*q.y,2*q.x, 2*q.w,-2*q.z,    
    0,0,0,0);
    
}

var setSconjugate = function (q, Sout) {
    
    //copied from forbes book (might be wrong??)
    Sout.set(
    -2*q.w, 2*q.z,-2*q.y, 2*q.x,
    -2*q.z,-2*q.w, 2*q.x, 2*q.y,
     2*q.y,-2*q.x,-2*q.w, 2*q.z,    
    0,0,0,0);
    
}

var animate_t = 0;


var alpha = 1;
var beta = 0.01;
var t_blend = 0;
var q_bfac = new THREE.Quaternion();
var period = 800;
var tscale = 2
var blend_T_index = 0;
var blend_S_index = 1;
var axis_S0 = new THREE.Vector3(1, 0, 0 );
var angle_S0 = 0;
var q_start_S = new THREE.Quaternion();

var update = function(){
	animate_t = ((frame%period)/period);
    

    
    
    var dt = 1/60
    var ax0 = new THREE.Vector3(1, 0, 0 );
    ax0.normalize();
    var ax1 = new THREE.Vector3( 0, 1, 0 );//new THREE.Vector3( 0, 1, 0 );//*Math.sin(animate_t*Math.PI*2)
    ax1.normalize();
    q0_prev.copy(q0);
    q1_prev.copy(q1);
    q0.setFromAxisAngle( ax0, 0.1+(Math.sin(animate_t*tscale*Math.PI*2)+1)*Math.PI*0.5); //Math.sin(animate_t*Math.PI*2)*Math.PI
    q1.setFromAxisAngle( ax1, 0.1+(Math.sin(animate_t*tscale*Math.PI*2)+1)*Math.PI*0.5);
    
    data0 = ToAngVel(q0_prev,q0,q0_omega,dt)
    data1 = ToAngVel(q1_prev,q1,q1_omega,dt)
    
    //blend setup
    t_blend = t_blend+dt;
    if(animate_t < 0.5){
        if(blend_T_index != 1){
            blend_T_index = 1;
            blend_S_index = 0;
            axis_S0.copy(data0[0]);
            angle_S0 = data0[1];
            t_blend = 0;
            q_start_S.copy(q0);
        }        
    }else{
        if(blend_T_index != 0){
            blend_T_index = 0;
            blend_S_index = 1;
            axis_S0.copy(data1[0]);
            angle_S0 = data1[1];
            t_blend = 0;
            q_start_S.copy(q1);
        }
    }
    a_fac = (1+alpha*t_blend)*Math.exp(-alpha*t_blend);
    b_fac = (1-Math.exp(-beta*t_blend))/(beta);
    q_bfac.setFromAxisAngle(axis_S0,angle_S0*b_fac);
    q_bfac.multiply(q_start_S);
    if(blend_T_index == 0){
        v1cube.setRotationFromQuaternion(mySlerp(q0,q_bfac,a_fac));
    }
    if(blend_T_index == 1){
        v1cube.setRotationFromQuaternion(mySlerp(q1,q_bfac,a_fac));
    }
    
    //if(frame%2 === 0){
    //    q0.conjugate();
    //}
    //if(frame%4 >= 2){
    //    q1.conjugate();   
    //}
    q0cube.setRotationFromQuaternion(q0);
    q1cube.setRotationFromQuaternion(q1);
    q0sph.position.copy(q0_omega)
    q1sph.position.copy(q1_omega)
    q0sphstick.lookAt(q0sph.position)
    q0sphstick.scale.z = q0sph.position.length()
    q1sphstick.lookAt(q1sph.position)
    q1sphstick.scale.z = q1sph.position.length()

/*
    ToAxisAnglePos(q0,q0sph);
    ToAxisAnglePos(q1,q1sph);
    q0sphstick.lookAt(q0sph.position)
    q0sphstick.scale.z = q0sph.position.length()
    q1sphstick.lookAt(q1sph.position)
    q1sphstick.scale.z = q1sph.position.length()
    
    
    qDelta.x = q1.x-q0.x;
    qDelta.y = q1.y-q0.y; 
    qDelta.z = q1.z-q0.z; 
    qDelta.w = q1.w-q0.w;
    if(frame%2 == 0){
        setS(q0,Smtx);
    }else{
        //setS(q0,Smtx);
        setS(q0,Smtx);
    }
    qDelta.applyMatrix4(Smtx);
    w1sph.position.set(qDelta.x,qDelta.y,qDelta.z)
    w1sphstick.lookAt(w1sph.position)
    w1sphstick.scale.z = w1sph.position.length()
    
    //for (i = 0; i < SLERPsph_arr.length; i++) {
    //    slerp_t = (i/(SLERPsph_arr.length))
    //    console.log(SLERPsph_arr.length);
    //    qtemp = mySlerp( q0, q1, slerp_t );
    //    ToAxisAnglePos(qtemp,SLERPsph_arr[i]);
    //}
    
    q0cube.setRotationFromQuaternion(q0);
    q1cube.setRotationFromQuaternion(q1);
    
    v1axis.copy(w1sph.position);
    v1angle = w1sph.position.length();
    if(v1angle>0.01){
    v1axis.normalize();
        //qD.setFromAxisAngle(new THREE.Vector3(0,1,0),(Math.sin(animate_t*Math.PI*2)+1)*Math.PI*0.5);
        qD.setFromAxisAngle(v1axis,v1angle);
        qD.multiply(q0); //qD*q0 -> we apply q0 first (initial config) then qD is the multiplication with the rotation from angvel in parent space (world)
        v1cube.setRotationFromQuaternion(qD);
    }else{
        v1cube.setRotationFromQuaternion(qD);
    }
    
    
	//child_t.quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI/2+Math.sin(animate_t*Math.PI*2)*Math.PI/2 );
	//child_t.quaternion.multiplyQuaternions(parent_t.quaternion,child_t.quaternion);
	//local position	
    
    */
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