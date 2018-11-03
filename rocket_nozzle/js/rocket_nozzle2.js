function init2() {
			var w =500//window.innerWidth;
			var h =500//window.innerHeight;
			var scene = new THREE.Scene();
			var camera = new THREE.PerspectiveCamera( 75, w/h, 0.1, 1000 );

			var renderer = new THREE.WebGLRenderer({ alpha: true });
			renderer.setSize( w, h );
			renderer.setClearColor ( new THREE.Color( 0, 0, 0 ), 0.0 )
			document.getElementById("wrap").appendChild( renderer.domElement );

			var geometry = new THREE.TorusGeometry( 50, 20, 60, 60 );
			//var geometry = new THREE.PlaneGeometry( 100, 100, 100,100 );
			//var geometry = new THREE.SphereGeometry( 100, 100, 100);
			var material = new THREE.MeshPhongMaterial( { color: 0x00fff0 } );
			var mesh = new THREE.Mesh( geometry, material );
			scene.add( mesh );
			
			var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
			scene.add( directionalLight );
			directionalLight.position.set(1,1,1)

			mesh.rotation.x =-45;
			camera.position.z = 200;
			var delta=0;
			var animate = function () {
			
				requestAnimationFrame( animate );

				mesh.rotation.x +=0.01;
				mesh.rotation.y +=0.01;
				
				delta += 0.1;

				renderer.render(scene, camera);
			};

			animate();
};
init2();