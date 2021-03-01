var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

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
var fov = 75;
var camera = new THREE.PerspectiveCamera( fov, w/h, 1, 10000 );
camera.up.set(0,0,1);
//camera.updateProjectionMatrix();
//camera.projectionMatrixInverse = new THREE.Matrix4();
//camera.projectionMatrixInverse.getInverse(camera.projectionMatrix);

//var camera = new THREE.OrthographicCamera( width/-2, width/2, height/2, height/-2, 0.1 , 2000 );
var zoomy = 0.1;
camera.position.x = -1.5;
camera.position.y = 1.5;
camera.position.z = (0.5/Math.tan((fov * Math.PI/180)/2))+0.5;
camera.position.multiplyScalar(zoomy);
//console.log(camera.position.z)
			
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
controls.minDistance = 2;
controls.maxDistance = 2;
controls.maxPolarAngle = Math.PI/2;
// enable animation loop when using damping or autorotation
//controls.enableDamping = true;
//controls.dampingFactor = 0.2;
//controls.enableZoom = false;
controls.enablePan=true;

var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.6 );
var directionalLight_offset = new THREE.Vector3(3*10,5*10,4*10);
directionalLight.position.copy(directionalLight_offset);
directionalLight.castShadow=true;
directionalLight.shadow.mapSize.width = 512;  // default
directionalLight.shadow.mapSize.height = 512; // default
directionalLight.shadow.camera.near = 0.01;    // default
directionalLight.shadow.camera.far = 100;     // default
directionalLight.shadow.camera.left = -2.5;     // default
directionalLight.shadow.camera.right = 2.5;     // default
directionalLight.shadow.camera.top = -2.5;     // default
directionalLight.shadow.camera.bottom = 2.5;     // default
directionalLight.shadow.bias = -0.001;
//var helper = new THREE.CameraHelper( directionalLight.shadow.camera );
//scene.add( helper );
scene.add( directionalLight );

var pointLight = new THREE.PointLight( 0xff00ff, 0.3 , 0, 2);
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
var eslider = document.getElementById("eslider");
var eslidertxt = document.getElementById("eslider_txt");
function round(value, decimals) {
	return value.toFixed(decimals);
}
eslider.oninput = function() {
	eslidertxt.innerHTML="\n" +"playback speed : "+round(eslider.value/100,2)+ " x";
}
eslider.oninput();
//----------------------------------------------------------------------------------------
var geometry_plane = new THREE.PlaneGeometry(100,100, 1, 1);
var geometry_sphere = new THREE.SphereGeometry( 1, 30, 30);

var t_cx = 128;
var t_cy = 128;
var t_data = new Uint8Array(4 * t_cx * t_cy);
for ( var i = 0; i < t_cx; i ++ ) {
    for ( var j = 0; j < t_cy; j ++ ) {

        var id = j*t_cx*4 + i*4;

        //let r = i / (t_cx-1);
        //let g = j / (t_cx-1);
        //let b = (1-r)*(1-g);
		var intensity = 0.88+0.12*((Math.floor(i/64)+Math.floor(j/64))%2);

		var r = intensity;
		var g = intensity;
		var b = intensity;

        t_data[id + 0] = r * 255;
        t_data[id + 1] = g * 255;
        t_data[id + 2] = b * 255;
        t_data[id + 3] = 255;
    }
}
var texture = new THREE.DataTexture( t_data, t_cx, t_cy, THREE.RGBAFormat );
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(100,100);
texture.generateMipmaps = true;
texture.minFilter = THREE.LinearMipmapLinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.needsUpdate = true;
texture.anisotropy = 4;

var white_material = new THREE.MeshPhongMaterial( { color: new THREE.Color(1,1,1) } );
white_material.map = texture;
var blue_material = new THREE.MeshPhongMaterial( { color: new THREE.Color(0.5,0.5,1) } );
blue_material.emissive.setRGB(0,0,1);
blue_material.emissiveIntensity = 0.3;
var sphere_mesh = new THREE.Mesh(geometry_sphere,white_material);
sphere_mesh.castShadow=true;
sphere_mesh.receiveShadow=true;

var plane_mesh = new THREE.Mesh(geometry_plane,white_material);
plane_mesh.castShadow=false;
plane_mesh.receiveShadow=true;
//var axesHelper = new THREE.AxesHelper( 5 );
//scene.add( axesHelper );

scene.add(plane_mesh);
//scene.add(sphere_mesh);

/////////////////////////// parse XMLDocument
function CapsuleBufferGeometry( radiusTop, radiusBottom, height, radialSegments, heightSegments, capsTopSegments, capsBottomSegments, thetaStart, thetaLength ) {

//MIT License (for this function)
//
//Copyright (c) 2019 maximeq
//
//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in all
//copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
//SOFTWARE.

	THREE.BufferGeometry.call( this );

	this.type = 'CapsuleBufferGeometry';

	this.parameters = {
		radiusTop: radiusTop,
		radiusBottom: radiusBottom,
		height: height,
		radialSegments: radialSegments,
		heightSegments: heightSegments,
		thetaStart: thetaStart,
		thetaLength: thetaLength
	};

	var scope = this;

	radiusTop = radiusTop !== undefined ? radiusTop : 1;
	radiusBottom = radiusBottom !== undefined ? radiusBottom : 1;
	height = height !== undefined ? height : 2;

	radialSegments = Math.floor( radialSegments ) || 8;
	heightSegments = Math.floor( heightSegments ) || 1;
    capsTopSegments = Math.floor( capsTopSegments ) || 2;
    capsBottomSegments = Math.floor( capsBottomSegments ) || 2;

	thetaStart = thetaStart !== undefined ? thetaStart : 0.0;
	thetaLength = thetaLength !== undefined ? thetaLength : 2.0 * Math.PI;

    // Alpha is the angle such that Math.PI/2 - alpha is the cone part angle.
    var alpha = Math.acos((radiusBottom-radiusTop)/height);
    var eqRadii = (radiusTop-radiusBottom === 0);

	var vertexCount = calculateVertexCount();
	var indexCount = calculateIndexCount();

	// buffers
	var indices = new THREE.BufferAttribute( new ( indexCount > 65535 ? Uint32Array : Uint16Array )( indexCount ), 1 );
	var vertices = new THREE.BufferAttribute( new Float32Array( vertexCount * 3 ), 3 );
	var normals = new THREE.BufferAttribute( new Float32Array( vertexCount * 3 ), 3 );
	var uvs = new THREE.BufferAttribute( new Float32Array( vertexCount * 2 ), 2 );

	// helper variables

	var index = 0,
	    indexOffset = 0,
	    indexArray = [],
	    halfHeight = height / 2;

	// generate geometry

	generateTorso();

	// build geometry

	this.setIndex( indices );
	this.addAttribute( 'position', vertices );
	this.addAttribute( 'normal', normals );
	this.addAttribute( 'uv', uvs );

	// helper functions

    function calculateVertexCount(){
        var count = ( radialSegments + 1 ) * ( heightSegments + 1 + capsBottomSegments + capsTopSegments);
        return count;
    }

	function calculateIndexCount() {
		var count = radialSegments * (heightSegments + capsBottomSegments + capsTopSegments) * 2 * 3;
		return count;
	}

	function generateTorso() {

		var x, y;
		var normal = new THREE.Vector3();
		var vertex = new THREE.Vector3();

        var cosAlpha = Math.cos(alpha);
        var sinAlpha = Math.sin(alpha);

        var cone_length =
            new THREE.Vector2(
                radiusTop*sinAlpha,
                halfHeight+radiusTop*cosAlpha
                ).sub(new THREE.Vector2(
                    radiusBottom*sinAlpha,
                    -halfHeight+radiusBottom*cosAlpha
                )
            ).length();

        // Total length for v texture coord
        var vl = radiusTop*alpha
                 + cone_length
                 + radiusBottom*(Math.PI/2-alpha);

		var groupCount = 0;

		// generate vertices, normals and uvs

        var v = 0;
        for( y = 0; y <= capsTopSegments; y++ ) {

            var indexRow = [];

            var a = Math.PI/2 - alpha*(y / capsTopSegments);

            v += radiusTop*alpha/capsTopSegments;

            var cosA = Math.cos(a);
            var sinA = Math.sin(a);

            // calculate the radius of the current row
			var radius = cosA*radiusTop;

            for ( x = 0; x <= radialSegments; x ++ ) {

				var u = x / radialSegments;

				var theta = u * thetaLength + thetaStart;

				var sinTheta = Math.sin( theta );
				var cosTheta = Math.cos( theta );

				// vertex
				vertex.x = radius * sinTheta;
				vertex.y = halfHeight + sinA*radiusTop;
				vertex.z = radius * cosTheta;
				vertices.setXYZ( index, vertex.x, vertex.y, vertex.z );

				// normal
				normal.set( cosA*sinTheta, sinA, cosA*cosTheta );
				normals.setXYZ( index, normal.x, normal.y, normal.z );

				// uv
				uvs.setXY( index, u, 1 - v/vl );

				// save index of vertex in respective row
				indexRow.push( index );

				// increase index
				index ++;

			}

            // now save vertices of the row in our index array
			indexArray.push( indexRow );

        }

        var cone_height = height + cosAlpha*radiusTop - cosAlpha*radiusBottom;
        var slope = sinAlpha * ( radiusBottom - radiusTop ) / cone_height;
		for ( y = 1; y <= heightSegments; y++ ) {

			var indexRow = [];

			v += cone_length/heightSegments;

			// calculate the radius of the current row
			var radius = sinAlpha * ( y * ( radiusBottom - radiusTop ) / heightSegments + radiusTop);

			for ( x = 0; x <= radialSegments; x ++ ) {

				var u = x / radialSegments;

				var theta = u * thetaLength + thetaStart;

				var sinTheta = Math.sin( theta );
				var cosTheta = Math.cos( theta );

				// vertex
				vertex.x = radius * sinTheta;
				vertex.y = halfHeight + cosAlpha*radiusTop - y * cone_height / heightSegments;
				vertex.z = radius * cosTheta;
				vertices.setXYZ( index, vertex.x, vertex.y, vertex.z );

				// normal
				normal.set( sinTheta, slope, cosTheta ).normalize();
				normals.setXYZ( index, normal.x, normal.y, normal.z );

				// uv
				uvs.setXY( index, u, 1 - v/vl );

				// save index of vertex in respective row
				indexRow.push( index );

				// increase index
				index ++;

			}

			// now save vertices of the row in our index array
			indexArray.push( indexRow );

		}

        for( y = 1; y <= capsBottomSegments; y++ ) {

            var indexRow = [];

            var a = (Math.PI/2 - alpha) - (Math.PI - alpha)*( y / capsBottomSegments);

            v += radiusBottom*alpha/capsBottomSegments;

            var cosA = Math.cos(a);
            var sinA = Math.sin(a);

            // calculate the radius of the current row
			var radius = cosA*radiusBottom;

            for ( x = 0; x <= radialSegments; x ++ ) {

				var u = x / radialSegments;

				var theta = u * thetaLength + thetaStart;

				var sinTheta = Math.sin( theta );
				var cosTheta = Math.cos( theta );

				// vertex
				vertex.x = radius * sinTheta;
				vertex.y = -halfHeight + sinA*radiusBottom;;
				vertex.z = radius * cosTheta;
				vertices.setXYZ( index, vertex.x, vertex.y, vertex.z );

				// normal
				normal.set( cosA*sinTheta, sinA, cosA*cosTheta );
				normals.setXYZ( index, normal.x, normal.y, normal.z );

				// uv
				uvs.setXY( index, u, 1 - v/vl );

				// save index of vertex in respective row
				indexRow.push( index );

				// increase index
				index ++;

			}

            // now save vertices of the row in our index array
			indexArray.push( indexRow );

        }

		// generate indices

		for ( x = 0; x < radialSegments; x ++ ) {

			for ( y = 0; y < capsTopSegments + heightSegments + capsBottomSegments; y ++ ) {

				// we use the index array to access the correct indices
				var i1 = indexArray[ y ][ x ];
				var i2 = indexArray[ y + 1 ][ x ];
				var i3 = indexArray[ y + 1 ][ x + 1 ];
				var i4 = indexArray[ y ][ x + 1 ];

				// face one
				indices.setX( indexOffset, i1 ); indexOffset ++;
				indices.setX( indexOffset, i2 ); indexOffset ++;
				indices.setX( indexOffset, i4 ); indexOffset ++;

				// face two
				indices.setX( indexOffset, i2 ); indexOffset ++;
				indices.setX( indexOffset, i3 ); indexOffset ++;
				indices.setX( indexOffset, i4 ); indexOffset ++;

			}

		}

	}

}

CapsuleBufferGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
CapsuleBufferGeometry.prototype.constructor = CapsuleBufferGeometry;

function xmlParse(srcDOM,depth,lastPos,outputArr) {
	let children = srcDOM.children;	
	for (let child of children) {
		
		if(child.nodeName === "body"){

			let name = child.getAttribute('name');
			
			let attrPos = child.getAttribute('pos');
			let posSplit = attrPos.split(' ');
			let body_pos = new THREE.Vector3(parseFloat(posSplit[0]), parseFloat(posSplit[1]), parseFloat(posSplit[2]));
			if(depth === 0){
				body_pos.set(0,1,0);
			}
			let attrQuat = child.getAttribute('quat');
			let body_quat = new THREE.Quaternion();
			if(attrQuat){
				let quatSplit = attrQuat.split(' ');
				body_quat.set(parseFloat(quatSplit[1]), parseFloat(quatSplit[2]), parseFloat(quatSplit[3]),parseFloat(quatSplit[0]));
			}
			
			//console.log(name);
			//console.log(depth);
			
			var newPos = new THREE.Vector3();
			newPos.addVectors(lastPos,body_pos);			
			var bodyChildren = child.children;
			for (let geom of bodyChildren) {
				if(geom.nodeName === "geom"){
					let attrType = geom.getAttribute('type');
					
					let attrSize = geom.getAttribute('size');
					let sizeSplit = attrSize.split(' ');
					let geom_size = new THREE.Vector3(parseFloat(sizeSplit[0]), parseFloat(sizeSplit[1]), parseFloat(sizeSplit[2]));
					if(attrType === "capsule"){
						let attrFromto = geom.getAttribute('fromto');
						let fromtoSplit = attrFromto.split(' ');
						let geom_from = new THREE.Vector3(parseFloat(fromtoSplit[0]), parseFloat(fromtoSplit[1]), parseFloat(fromtoSplit[2]));
						let geom_to = new THREE.Vector3(parseFloat(fromtoSplit[3]), parseFloat(fromtoSplit[4]), parseFloat(fromtoSplit[5]));
					
						let capsule_axis = new THREE.Vector3().copy(geom_to).sub(geom_from);
						let capsule_length = capsule_axis.length();
						let capsule_center = new THREE.Vector3().addVectors(geom_from,geom_to).divideScalar(2);
						//console.log(capsule_center);
						
						let geometry_capsule = new CapsuleBufferGeometry( geom_size.x, geom_size.x, capsule_length, 32, 1, 8, 8);
						geometry_capsule.rotateX(Math.PI/2);
						let final_mesh = new THREE.Mesh(geometry_capsule,blue_material);
						final_mesh.castShadow=true;
						final_mesh.receiveShadow=true;
						final_mesh.up.set(0,0,1);
						final_mesh.lookAt(capsule_axis);
						final_mesh.position.copy(newPos);
						final_mesh.position.add(capsule_center);
						scene.add(final_mesh);
						//var axesHelper = new THREE.AxesHelper( 0.5 );
						//final_mesh.add( axesHelper );
						outputArr.push(final_mesh);
					
					}else if(attrType === "box"){
						let attrGPos = geom.getAttribute('pos');
						let posGSplit = attrGPos.split(' ');
						let geom_pos = new THREE.Vector3(parseFloat(posGSplit[0]), parseFloat(posGSplit[1]), parseFloat(posGSplit[2]));
			
						let attrGQuat = geom.getAttribute('quat');
						let quatGSplit = attrGQuat.split(' ');
						let geom_quat = new THREE.Quaternion(parseFloat(quatGSplit[1]), parseFloat(quatGSplit[2]), parseFloat(quatGSplit[3]),parseFloat(quatGSplit[0]));					
					
						let geometry_box = new THREE.BoxGeometry( geom_size.x*2, geom_size.y*2, geom_size.z*2);
						let final_mesh = new THREE.Mesh(geometry_box,blue_material);
						final_mesh.castShadow=true;
						final_mesh.receiveShadow=true;
						final_mesh.position.copy(newPos);
						final_mesh.position.add(geom_pos);
						final_mesh.quaternion.copy(geom_quat);
						scene.add(final_mesh);
						outputArr.push(final_mesh);
						//var axesHelper = new THREE.AxesHelper( 0.5 );
						//final_mesh.add( axesHelper );
					}
				}					
			}
			xmlParse(child,depth+1,newPos.clone(),outputArr);
		}
	}
	
	return;
}

var parser, xmlDoc;
var text = '<body name="Hips" pos="0 0 2" quat="1 0 0 0"><geom fromto="0.0004250701174422114 0.0707953546967311 0.012748062141569592 0.0004250702618029257 0.07079535571548874 0.01274805546186187" size="0.166435" name="Hips_g" type="capsule" density="505.011205"/>    <body name="LeftUpLeg" pos="0.09062951 -0.026476039 0.0">    <geom fromto="0.00527335372672386 0.011610688638719198 0.02576703183749481 -0.02263828092488738 -0.31302944843024966 0.03243209634506419" size="0.087997" name="LeftUpLeg_g" type="capsule" density="846.386124"/>        <body name="LeftLeg" pos="0.0 -0.39863715 0.0">        <geom fromto="-0.008479254750885528 -0.040726930500432766 -0.007253627811545013 -0.004506715468083526 -0.32449308132338645 0.0020178612598938544" size="0.060363" name="LeftLeg_g" type="capsule" density="952.454943"/>            <body name="LeftFoot" pos="0.0 -0.4433346 0.0">            <geom pos="0.0 -0.05 0.005" quat="0.985 -0.174 0.0 0.0" size="0.060000 0.120 0.05000" name="LeftFoot_0_g" type="box" density="985.000000"/>                        				<body name="LeftToeBase" pos="-0.0 -0.14979962 0.0">                <geom fromto="-0.035 -0.045 0.027 0.035 -0.045 0.027" size="0.045000" name="LeftToeBase_0_g" type="capsule" density="985.000000"/>                        				</body>            </body>        </body>    </body>    <body name="RightUpLeg" pos="-0.09062951 -0.026476039 0.0">    <geom fromto="0.010116630639538276 0.013458948708113979 0.02371735979281044 0.012566831880559971 -0.3122395560179648 0.035083164143032496" size="0.087997" name="RightUpLeg_g" type="capsule" density="826.686283"/>        <body name="RightLeg" pos="0.0 -0.39863715 -0.0">        <geom fromto="-0.0022146324265144668 -0.03859750538780498 -0.005411345955906814 -0.001327629565514177 -0.322285723113122 0.006637647588930248" size="0.060363" name="RightLeg_g" type="capsule" density="952.454943"/>            <body name="RightFoot" pos="0.0 -0.4433346 -0.0">            <geom pos="0.0 -0.05 0.005" quat="0.985 -0.174 0.0 0.0" size="0.060000 0.120 0.05000" name="RightFoot_0_g" type="box" density="985.000000"/>                        				<body name="RightToeBase" pos="0.0 -0.14979962 -0.0">                <geom fromto="-0.035 -0.045 0.027 0.035 -0.045 0.027" size="0.045000" name="RightToeBase_0_g" type="capsule" density="985.000000"/>                        				</body>            </body>        </body>    </body>    <body name="Spine" pos="-0.0012293101 0.03531626 -0.01019359">    <geom fromto="0.0007404600189531528 0.0690213073017761 0.03198193498548371 0.0006796504118371097 0.03826495677935933 0.030141790806000882" size="0.143536" name="Spine_g" type="capsule" density="381.126621"/>        <body name="Spine1" pos="0.0024792498 0.12755117 -0.01020874">        <geom fromto="-0.0019255753682694589 0.04571713153367992 0.04575853216609509 -0.0019287508172569248 0.04520612893934244 0.045793985972494025" size="0.140686" name="Spine1_g" type="capsule" density="432.456659"/>            <body name="Spine2" pos="0.00292587 0.0910618 -0.00696138">            <geom fromto="-0.004445679308707337 0.06438416779042051 0.028982143565981913 -0.004494629507765366 0.059891079825705074 0.030838253289832217" size="0.152815" name="Spine2_g" type="capsule" density="536.476898"/>                <body name="Spine3" pos="0.00212109 0.091037646 -0.00727791">                <geom fromto="-0.006084630941406673 0.07341164553014977 0.00809118807255372 -0.006015587034078729 0.07935613087245717 0.006052004473470797" size="0.153123" name="Spine3_g" type="capsule" density="564.982793"/>                    <body name="Neck" pos="0.0025797999 0.23615083 -0.03450871">                    <geom fromto="-0.006224372036837171 0.02832136658673695 -0.0010592139731639718 -0.006224372091437509 0.028321365883134334 -0.0010592136745527449" size="0.072724" name="Neck_g" type="capsule" density="649.023953"/>                        <body name="Head" pos="-0.0 0.12164327 0.0">                        <geom fromto="-0.0018288563844615214 0.10419002454766137 0.030634297596759123 -0.005448893388281065 0.015902290393751895 0.046490361755389335" size="0.089084" name="Head_g" type="capsule" density="977.730525"/>                        </body>                    </body>                    <body name="LeftShoulder" pos="0.03204658 0.18091875 -0.03455843">                    <geom fromto="0.09120718600798775 -0.027463470418494732 0.007299292290626105 0.028346986456021735 -0.005485880616729207 -0.016046374471391477" size="0.101054" name="LeftShoulder_g" type="capsule" density="666.275751"/>                        <body name="LeftArm" pos="0.1442337 -0.0 -0.0">                        <geom fromto="0.23354820436174625 -0.06485273297404753 0.005684667344732493 0.01964289025268681 0.0035481263245235894 0.0069551543511074156" size="0.057425" name="LeftArm_g" type="capsule" density="886.546392"/>                            <body name="LeftForeArm" pos="0.29251575 -0.047959898 -0.0">                            <geom fromto="0.19521409322330768 0.0035975829627603513 0.004037714980183132 0.01863672084175295 -0.0072660983042719795 9.584958829432624e-05" size="0.047629" name="LeftForeArm_g" type="capsule" density="964.628532"/>                                <body name="LeftHand" pos="0.2332559 -0.0 0.0">                                <geom fromto="0.11695264748164583 -0.080784444792466 0.05096475976729432 0.05818064649478896 -0.010078176283059638 0.03196552413200585" size="0.047818" name="LeftHand_g" type="capsule" density="975.044452"/>                                </body>                            </body>                        </body>                    </body>                    <body name="RightShoulder" pos="-0.02688698 0.18091875 -0.03445899">                    <geom fromto="-0.0809803348125741 -0.030426208089621702 0.004899883524239711 -0.018948741186872828 -0.005514254294774283 -0.01770355053795713" size="0.101054" name="RightShoulder_g" type="capsule" density="607.962154"/>                        <body name="RightArm" pos="-0.13870992 0.0 0.0">                        <geom fromto="-0.231016575817473 -0.06702303362558633 0.007079711404496647 -0.016126238157669445 -0.0018161519559813156 0.004634229008601602" size="0.057425" name="RightArm_g" type="capsule" density="886.546392"/>                            <body name="RightForeArm" pos="-0.3024542 -0.04782331 -0.0">                            <geom fromto="-0.18422145930824116 -4.7116672669499374e-05 0.0022882634050353226 -0.007621248190285255 -0.011020354069336694 0.004541836670846638" size="0.047629" name="RightForeArm_g" type="capsule" density="964.628532"/>                                <body name="RightHand" pos="-0.23859312 -0.0 -0.0">                                <geom fromto="0.11171957070732497 0.06406709466854553 0.04718091413314213 0.04493981276828345 0.0025316658407062145 0.023340860181036843" size="0.047818" name="RightHand_g" type="capsule" density="975.044452"/>                                </body>                            </body>                        </body>                    </body>                </body>            </body>        </body>    </body></body>';

parser = new DOMParser();
xmlDoc = parser.parseFromString(text,"text/xml");

var BotMeshList = [];
xmlParse(xmlDoc,0,new THREE.Vector3(),BotMeshList)
console.log(BotMeshList);

//---------------------------------------------------------------------------------------define main update loop
var num_bodies = BotMeshList.length;
var num_indices_per_body = 7;
var num_indices_per_frame = num_indices_per_body*num_bodies*2;
var playback_frame = 0;
var playback_frame_next = 1;
var playback_frame_count = playback_array.length/(num_indices_per_frame); //*7 for pos+quat, *2 because redundant data i should remove...
var playback_recorded_FPS = 60;
var playback_FPS = 60;
var playback_time = 0;
var playback_time_length = playback_frame_count/playback_recorded_FPS;
var playhead_index = 0;
console.log(playback_frame_count);
var followCamPosition = new THREE.Vector3();

//for fixed framerate...
var lerpFactor = 0;
var posNow = new THREE.Vector3();
var posNext = new THREE.Vector3();
var quatNow = new THREE.Quaternion();
var quatNext = new THREE.Quaternion();

var update = function(){

	//hide cursor on touch screen
	//if(QZMouse_frames[0] > 0 || QZMouse_frames[1] > 0 || QZMouse_frames[2] > 0) 	mouse_mesh.visible = true;
	//if(QZTouch.hasTouch) 	mouse_mesh.visible = false;
	
	QZMath.updateMouseFrames();
	
	if(QZMotion.hasAcc){
		var grav = QZMotion.acc.accelerationIncludingGravity;
		//v_world.gravity.set(grav.x/5,grav.y/5,grav.z/5);
		//v_world.gravity.applyQuaternion(camera.quaternion.clone())
	}else{
		//v_world.gravity.set(0,-1,0);
	}
	
	followCamPosition.set(0,0,0);
	for (i = 0; i < num_bodies; i++) {		// loop to playback recording
		var botMesh = BotMeshList[i];
		playhead_index = playback_frame*num_indices_per_frame+i*num_indices_per_body;
		playhead_index_next = (playback_frame_next)*num_indices_per_frame+i*num_indices_per_body;
		
		//botMesh.position.set(playback_array[playhead_index],playback_array[playhead_index+1],playback_array[playhead_index+2]);
		//botMesh.quaternion.set(playback_array[playhead_index+3],playback_array[playhead_index+4],playback_array[playhead_index+5],playback_array[playhead_index+6]);
		
		posNow.set(playback_array[playhead_index],playback_array[playhead_index+1],playback_array[playhead_index+2]);
		quatNow.set(playback_array[playhead_index+3],playback_array[playhead_index+4],playback_array[playhead_index+5],playback_array[playhead_index+6]);
		posNext.set(playback_array[playhead_index_next],playback_array[playhead_index_next+1],playback_array[playhead_index_next+2]);
		quatNext.set(playback_array[playhead_index_next+3],playback_array[playhead_index_next+4],playback_array[playhead_index_next+5],playback_array[playhead_index_next+6]);
			
		botMesh.position.lerpVectors(posNow,posNext,lerpFactor);
		botMesh.quaternion.copy(quatNow);
		botMesh.quaternion.slerp(quatNext,lerpFactor);
		
		followCamPosition.add(botMesh.position);
	
	}
	followCamPosition.divideScalar(num_bodies);
	followCamPosition.z = 0.65;
	{
			var Target = followCamPosition.clone().sub(controls.target);
			//var prevOffset = controls.object.position.clone().add(prevTarget);
			controls.target.copy(followCamPosition);
			controls.object.position.add(Target);
			directionalLight.position.addVectors(followCamPosition,directionalLight_offset);
			directionalLight.target = botMesh;
			pointLight.position.copy(followCamPosition).sub(directionalLight_offset);
			
			//controls.target.copy(camera_offset);
	}
	
	playback_time = playback_time+dt_s*dt_scale;
	if(playback_time>playback_time_length || playback_time<0){
		playback_time = playback_time-Math.floor(playback_time/playback_time_length)*playback_time_length;
	}
	playback_frame = Math.floor(playback_time*playback_recorded_FPS);
	playback_frame_next = (playback_frame+1)%playback_frame_count;
	lerpFactor = (playback_time-(playback_frame/playback_recorded_FPS))*playback_recorded_FPS;
};
//---------------------------------------------------------------------------------------define common animation function
var animate = function () {
	dt_scale = eslider.value/100;
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