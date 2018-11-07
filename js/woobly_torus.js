			var w =500//window.innerWidth;
			var h =500//window.innerHeight;
			var scene = new THREE.Scene();
			var camera = new THREE.PerspectiveCamera( 75, w/h, 0.1, 1000 );

			var renderer = new THREE.WebGLRenderer({ alpha: true });
			renderer.setSize( w, h );
			renderer.setClearColor ( new THREE.Color( 0, 0, 0 ), 0.0 )
			document.getElementById("wrap").appendChild( renderer.domElement );
			controls = new THREE.OrbitControls( camera, renderer.domElement );
			// enable animation loop when using damping or autorotation
			//controls.enableDamping = true;
			//controls.dampingFactor = 0.5;
			controls.enableZoom = false;
			controls.enablePan=true;
/////////////////////// copy paste test code
    defines = {}; // <=============================== added
    //defines[ "USE_MAP" ] = ""; // <=============================== added

			var uniforms = THREE.UniformsUtils.clone(THREE.ShaderLib.phong.uniforms);
			uniforms.map.value = undefined;//texture;
			uniforms.delta={};
			uniforms.delta.value = 0.0;
			uniforms.shininess.value=100.0;
			
			var parameters = {
				fragmentShader: document.getElementById('fragmentShader').textContent,//THREE.ShaderLib.phong.fragmentShader,
				vertexShader: document.getElementById('vertexShader').textContent,//THREE.ShaderLib.phong.vertexShader,
				defines: defines,
				uniforms: uniforms,
				lights: true,
				fog: false,
				side: THREE.DoubleSide,
				blending: THREE.NormalBlending,
				transparent: (uniforms.opacity.value < 1.0)
			};
		console.log(THREE.ShaderLib.phong.vertexShader)
/////////////////////////
        mat = new THREE.ShaderMaterial(parameters);
			
			
/*			
			var customUniforms = {
				delta: {value: 0}
			};
			var material = new THREE.ShaderMaterial({
				uniforms: customUniforms,
				vertexShader: document.getElementById('vertexShader').textContent,
				fragmentShader: document.getElementById('fragmentShader').textContent
			});
*/			
			var geometry = new THREE.TorusGeometry( 50, 20, 60, 60 );
			//var geometry = new THREE.PlaneGeometry( 100, 100, 100,100 );
			//var geometry = new THREE.SphereGeometry( 100, 100, 100);
			//var material = new THREE.MeshPhongMaterial( { color: 0x00fff0 } );
			var mesh = new THREE.Mesh( geometry, mat );
			scene.add( mesh );
			
			var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
			scene.add( directionalLight );
			directionalLight.position.set(1,1,1)

			//attribute

			mesh.rotation.x =-45;
			camera.position.z = 200;
			var delta=0;
			var animate = function () {
				mesh.material.uniforms.diffuse.value = new THREE.Color(1,1,1)
			
				requestAnimationFrame( animate );

				mesh.rotation.x +=0.0;
				mesh.rotation.y +=0.0;
				
				delta += 0.1;
				//uniform
				mesh.material.uniforms.delta.value = delta;
				controls.update();
				//attribute


				renderer.render(scene, camera);
			};

			animate();