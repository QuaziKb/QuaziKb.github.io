function init() {
			var w =500//window.innerWidth;
			var h =500//window.innerHeight;
			var scene = new THREE.Scene();
			var camera = new THREE.PerspectiveCamera( 75, w/h, 0.1, 1000 );

			var renderer = new THREE.WebGLRenderer({ alpha: true });
			renderer.setSize( w, h );
			renderer.setClearColor ( new THREE.Color( 0, 0, 0 ), 0.0 )
			document.getElementById("wrap").appendChild( renderer.domElement );

			var geometry = new THREE.TorusKnotGeometry( 50, 20, 120, 120 );
			//var geometry = new THREE.PlaneGeometry( 100, 100, 100,100 );
			//var geometry = new THREE.SphereGeometry( 100, 100, 100);
			
			var material = new THREE.MeshToonMaterial( { color: new THREE.Color(Math.random(),Math.random(),Math.random()), metalness: 0, roughness: 0.1 } );
			var mesh = new THREE.Mesh( geometry, material );
			scene.add( mesh );
			
			var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
			scene.add( directionalLight );
			directionalLight.position.set(1,1,1)

			mesh.rotation.x =-45;
			mesh.rotation.y =Math.random()*90;
			camera.position.z = 200;
			var delta=0;
			var animate = function () {
			
				requestAnimationFrame( animate );

				mesh.rotation.x +=0.01;
				mesh.rotation.y +=0.0;
				
				delta += 0.1;

				renderer.render(scene, camera);
			};

			animate();
};
init();