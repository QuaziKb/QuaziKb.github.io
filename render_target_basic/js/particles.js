'use strict';

/* global THREE */

function make_render_target() {
	const rtWidth = 512;
	const rtHeight = 512;
	const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);

	const rtFov = 75;
	const rtAspect = rtWidth / rtHeight;
	const rtNear = 0.1;
	const rtFar = 5;
	const rtCamera = new THREE.PerspectiveCamera(rtFov, rtAspect, rtNear, rtFar);
	rtCamera.position.z = 2;

	const rtScene = new THREE.Scene();

	var quad = new THREE.Mesh(
			new THREE.PlaneGeometry(2, 2),
			new THREE.ShaderMaterial({
				vertexShader: document.getElementById('vertex-shader').textContent,
				fragmentShader: document.getElementById('fragment-shader').textContent,
				depthWrite: false,
				depthTest: false,
				uniforms: {
					pix_sz: {
						value: new THREE.Vector2()
					}
				}
			}));
	quad.material.uniforms.pix_sz.value = [1.0 / rtWidth, 1.0 / rtHeight];
	rtScene.add(quad);

	return [renderTarget, rtScene, rtCamera]
};

function main() {
	var w = 600;
	var h = 300;
	var renderer = new THREE.WebGLRenderer({
			alpha: true
		});
	renderer.setSize(w, h);
	renderer.setClearColor(new THREE.Color(0, 0, 0), 0.0)
	document.getElementById("wrap").appendChild(renderer.domElement);

	var rtData = make_render_target();
	var renderTarget = rtData[0];
	var rtScene = rtData[1];
	var rtCamera = rtData[2];

	const fov = 75;
	const aspect = 2; // the canvas default
	const near = 0.1;
	const far = 5;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.z = 2;

	const scene = new THREE.Scene(); {
		const color = 0xFFFFFF;
		const intensity = 1;
		const light = new THREE.DirectionalLight(color, intensity);
		light.position.set(-1, 2, 4);
		scene.add(light);
	}

	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshPhongMaterial({
			map: renderTarget.texture,
		});
	const cube = new THREE.Mesh(geometry, material);
	scene.add(cube);

	function render(time) {
		time *= 0.001;

		// draw render target scene to render target
		renderer.setRenderTarget(renderTarget);
		renderer.render(rtScene, rtCamera);
		renderer.setRenderTarget(null);

		// rotate the cube in the scene
		cube.rotation.x = time;
		cube.rotation.y = time * 1.1;

		// render the scene to the canvas
		renderer.render(scene, camera);

		requestAnimationFrame(render);
	}

	requestAnimationFrame(render);
}

main();
