function init() {
			var w =600//window.innerWidth;
			var h =300//window.innerHeight;
			
			var ratio = w/h
			var height = 20;
			var width = ratio*height;
			
			var scene = new THREE.Scene();
			//var camera = new THREE.PerspectiveCamera( 75, w/h, 0.1, 1000 );
			var camera = new THREE.OrthographicCamera( width/-2, width/2, height/2, height/-2, 0.1 , 2000 )
			//camera.position.z = 20;
			camera.position.y = 1000;
						
			var renderer = new THREE.WebGLRenderer({ alpha: true });
			renderer.setSize( w, h );
			renderer.setClearColor ( new THREE.Color( 0, 0, 0 ), 0.0 )
			document.getElementById("wrap").appendChild( renderer.domElement );
			
			//1px white line border
			//renderer.domElement.style.border = "1px solid #FFFFFF"


			
			
			controls = new THREE.OrbitControls( camera, renderer.domElement );
			// enable animation loop when using damping or autorotation
			//controls.enableDamping = true;
			//controls.dampingFactor = 0.5;
			//controls.enableZoom = false;
			controls.enablePan=false;
			
			/*
			var cubegeom = new THREE.BoxGeometry( 10,10,10 );
			var cubemat = new THREE.MeshPhongMaterial( { color: new THREE.Color(0,1,0) } );
			var testCube = new THREE.Mesh( cubegeom, cubemat );
			scene.add(testCube);
			*/
			
			var geometry = new THREE.SphereGeometry( 1, 100, 100);
			var material = new THREE.MeshPhongMaterial( { color: new THREE.Color(1,1,1) } );
			

			
			// ring
			var curve = new THREE.EllipseCurve(
				0,  0,            // ax, aY
				1, 1,           // xRadius, yRadius
				0,  2 * Math.PI,  // aStartAngle, aEndAngle
				false,            // aClockwise
				0                 // aRotation
			);			
			var path = new THREE.Path( curve.getPoints( 200 ) );
			var pathgeometry = path.createPointsGeometry( 200 );
			pathgeometry.computeLineDistances();
			/*var dashedpathmaterial = new THREE.LineDashedMaterial( {
				color: 0xffffff,
				linewidth: 1,
				scale: 1,
				dashSize: 0.2,
				gapSize: 0.2,
			} );*/
			
			var pathmaterialcg = new THREE.LineBasicMaterial( {
				color: 0xaaaaaa
			} );
			var pathmaterial = new THREE.LineBasicMaterial( {
				color: 0xffffff
			} );

						//center of gravity (CG)
			var CG_material = new THREE.MeshBasicMaterial( { color: new THREE.Color(1,1,1) } );
			var CG = new THREE.Mesh( geometry, CG_material );
			scene.add( CG );
			CG.scale.set(0.2,0.2,0.2)
			CG.ellipse = new THREE.Line( pathgeometry, pathmaterialcg );
			CG.ellipse.rotation.x = Math.PI/2;
			scene.add( CG.ellipse );
			
			
			var linegeometry = new THREE.Geometry();
			linegeometry.vertices.push(
				new THREE.Vector3( 0, 0, 0 ),
				new THREE.Vector3( 1, 0, 0 )
			);

			var line = new THREE.Line( linegeometry, pathmaterial );
			scene.add( line );
			var density = 1;
			// general object holding the orbit mass
			function OrbitMass (mass) {
				this.mass = mass;
				this.object = new THREE.Mesh( geometry, material );
				
				//size sphere based on constant density and spherical volume
				var radius = Math.pow(3*mass/(4*Math.PI*density), 1/3);
				
				this.object.scale.set(radius,radius,radius)
				scene.add( this.object );
				
				this.ellipse = new THREE.Line( pathgeometry, pathmaterial );
				this.ellipse.rotation.x = Math.PI/2;
				scene.add( this.ellipse );
			};

			//orbiting masses
			var m1 = new OrbitMass(5);
			var m2 = new OrbitMass(5);
			
			var G = 1;
			var mu = (m1.mass+m2.mass)*G
			var e = 0.8;
			var h = 8;
			// T is period and is actually dependent on mu and h, for now fix it at 60 for testing
			//var T = 60;
			var n = (mu*mu/(h*h*h))*Math.pow(1-e*e,3/2);
			// newtons method solver to find eccentric anomaly
			function E_from_newtonsMethod(t) {
				var precision = 0.001;
				var prevGuess = 0;
				// ensure Me is in 0 to 2pi range with the floor
				var Me = n*t-Math.floor((n*t)/(2*Math.PI))*2*Math.PI;
				var guess
				if(Me < Math.PI){
						guess=Me+e/2;
				}else{
						guess=Me-e/2;
				};
				
				var i = 0;
				while(i<1000){
					i++;
			
					if (Math.abs(prevGuess - guess) > precision) {
						prevGuess = guess;
						guess = guess - ((guess-e*Math.sin(guess)-Me) / (1-e*Math.cos(guess)));
						continue;
					} else {
						break;
					}
				};
				return guess;
			}
			
			//position weighting of objects based on mass


			var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
			scene.add( directionalLight );
			directionalLight.position.set(1,1,1)
			
			var ambientLight = new THREE.AmbientLight( 0xffffff, 0.3 );
			scene.add( ambientLight );

			var eslider = document.getElementById("eslider");
			var m1slider = document.getElementById("m1slider");
			
			var radios = document.getElementsByName('bodyfocus');
			var radio_value = "CG";
			
			var hslider = document.getElementById("hslider");
			
			function round(value, decimals) {
			  return value.toFixed(decimals);
			}

			var eslidertxt = document.getElementById("eslider_txt");
			eslider.oninput = function() {
				eslidertxt.innerHTML="\n" +"e = "+round(eslider.value/100,2);
			}
			
			var x_cg_to_1=(m2.mass/(m1.mass+m2.mass))*-1;
			var x_cg_to_2=(m1.mass/(m1.mass+m2.mass));
			var x_cg_to_1_goal;
			var x_cg_to_2_goal;			
			
			var rate_value="CG";
			var m1slidertxt = document.getElementById("m1slider_txt");
			m1slider.oninput = function() {
				m1slidertxt.innerHTML="\n" +"m<sub>1</sub> = "+round(m1slider.value/100,2)+" , m<sub>2</sub> = "+round((1-m1slider.value/100),2);
				
				m1.mass=10*m1slider.value/100;
				m2.mass=10*(1-m1slider.value/100);
				if(rate_value==="CG"){
					x_cg_to_1=(m2.mass/(m1.mass+m2.mass))*-1;
					x_cg_to_2=(m1.mass/(m1.mass+m2.mass));
				};
			}
			
			var hslidertxt = document.getElementById("hslider_txt");
			hslider.oninput = function() {
				n = (mu*mu/(h*h*h))*Math.pow(1-e*e,3/2);
				hslidertxt.innerHTML="\n" +"h = "+round((hslider.value/100)*10,2);
			}
			
			eslider.oninput();
			m1slider.oninput();
			hslider.oninput();
			var radius1;
			var radius2;
			var t=0;
			var nlast=n;
			var massratio;
			
			var animate = function () {
			
				requestAnimationFrame( animate );
				

				for(var i = 0; i < radios.length; i++){
					if(radios[i].checked){
						rate_value = radios[i].value;
					}
				}
				
				//console.log(rate_value)
				controls.update();
				e=eslider.value/100;
				h=(hslider.value/100)*10;
				m1.mass=10*m1slider.value/100;
				m2.mass=10*(1-m1slider.value/100);
				
				radius1 = Math.max(Math.pow(3*m1.mass/(4*Math.PI*density), 1/3),0.2);
				m1.object.scale.set(radius1,radius1,radius1);
				radius2 = Math.max(Math.pow(3*m2.mass/(4*Math.PI*density), 1/3),0.2);
				m2.object.scale.set(radius2,radius2,radius2);
				mu = (m1.mass+m2.mass)*G;
				nlast=n;
				n = (mu*mu/(h*h*h))*Math.pow(1-e*e,3/2);
				//this step fixes the offset shift caused by changing n
				t=((nlast*t)/n);
				
				switch(rate_value){
					case "CG":
						x_cg_to_1_goal=(m2.mass/(m1.mass+m2.mass))*-1;
						x_cg_to_2_goal=(m1.mass/(m1.mass+m2.mass));
						break;
					case "m1":
						x_cg_to_1_goal=0;
						x_cg_to_2_goal=1;
						break;
					case "m2":
						x_cg_to_1_goal=-1;
						x_cg_to_2_goal=0;
						break;
				};
				
				// smoothly change between centered views
				x_cg_to_1=QZMath.lerp(x_cg_to_1,x_cg_to_1_goal,0.1);
				x_cg_to_2=QZMath.lerp(x_cg_to_2,x_cg_to_2_goal,0.1);
				
				t += 0.5;
				// calculate position from time
				E=E_from_newtonsMethod(t);
				theta=2*Math.atan(Math.tan(E/2)*(Math.sqrt((1+e)/(1-e))));
				r = h*h/(mu*(1+e*Math.cos(theta)));
				
				xc = Math.cos(theta);
				yc = Math.sin(theta);
				
				a=h*h/(mu*(1-e*e));
				b=a*Math.sqrt(1-e*e);
				massratio=m2.mass/(m1.mass+m2.mass);
				cgratio=QZMath.lerp(x_cg_to_1,x_cg_to_2,massratio)
				
				m1.ellipse.scale.set(a*x_cg_to_1,b*x_cg_to_1,1);
				m1.ellipse.position.set(-1*a*x_cg_to_1*e,0,0);
				m2.ellipse.scale.set(a*x_cg_to_2,b*x_cg_to_2,1);
				m2.ellipse.position.set(-1*a*x_cg_to_2*e,0,0);
				
				CG.ellipse.scale.set(a*cgratio,b*cgratio,1);
				CG.ellipse.position.set(-1*a*cgratio*e,0,0);
				
				
				m1.object.position.set(xc*x_cg_to_1*r,0,yc*x_cg_to_1*r);
				m2.object.position.set(xc*x_cg_to_2*r,0,yc*x_cg_to_2*r);
				
				
				CG.position.set(xc*cgratio*r,0,yc*cgratio*r);
				
				
				line.position.copy(m1.object.position)
				line.scale.set(r,1,1)
				line.rotation.y=-1*theta;
				
				renderer.render(scene, camera);
			};

			animate();
};
init();