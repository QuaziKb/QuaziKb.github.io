'use strict';

import '../../js/three148.js';
import {
	OrbitControls
}
from '../../js/OrbitControls148.js';


function make_zero_texture(width, height) {
	const size = width * height;
	const data = new Float32Array(4 * size);

	var rgba = [0.0, 0.0, 0.0, 0.0];
	for (let i = 0; i < size; i++) {

		const stride = i * 4;

		data[stride + 0] = rgba[0];
		data[stride + 1] = rgba[1];
		data[stride + 2] = rgba[2];
		data[stride + 3] = rgba[3];
	}
	const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
	texture.needsUpdate = true;
	return texture;
}

function make_init_texture(width, height) {
	const size = width * height;
	const data = new Float32Array(4 * size);

	var rgba = [0, 0, 0, 0];
	var box_size = 0.0;
	for (let i = 0; i < size; i++) {

		const stride = i * 4;

		if (i % 2 === 0) {
			rgba = [
				THREE.MathUtils.randFloatSpread(box_size),
				THREE.MathUtils.randFloatSpread(box_size),
				THREE.MathUtils.randFloatSpread(box_size),
				THREE.MathUtils.randFloatSpread(box_size),
			];
		} else {
			for (let j = 0; j < 4; j++) {
				rgba[j] += THREE.MathUtils.randFloatSpread(0.0)
			}
		}
		data[stride + 0] = rgba[0];
		data[stride + 1] = rgba[1];
		data[stride + 2] = rgba[2];
		data[stride + 3] = rgba[3];
	}

	const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
	texture.needsUpdate = true;
	return texture;
}

function make_render_target(data_texture_w, data_texture_h) {
	const rtWidth = data_texture_w;
	const rtHeight = data_texture_h;
	//want RGBA32F internalFormat for high precision in computations
	const renderTargetA = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
		});
	const renderTargetB = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
		});

	const rtFov = 75;
	const rtAspect = rtWidth / rtHeight;
	const rtNear = 0.1;
	const rtFar = 5;
	const rtCamera = new THREE.PerspectiveCamera(rtFov, rtAspect, rtNear, rtFar);
	rtCamera.position.z = 2;

	const rtScene = new THREE.Scene();

	var rtMaterial = new THREE.ShaderMaterial({
			vertexShader: document.getElementById('vertex-shader-renderTarget').textContent,
			fragmentShader: document.getElementById('fragment-shader-renderTarget').textContent,
			depthWrite: false,
			depthTest: false,
			uniforms: {
				pix_sz: {
					value: new THREE.Vector2()
				},
				texture_in: {
					type: 't',
					value: make_init_texture(rtWidth, rtHeight)
				}
			}
		});

	var quad = new THREE.Mesh(
			new THREE.PlaneGeometry(2, 2),
			rtMaterial);
	rtMaterial.uniforms.pix_sz.value = [1.0 / rtWidth, 1.0 / rtHeight];
	rtScene.add(quad);

	return [renderTargetA, renderTargetB, rtScene, rtCamera, rtMaterial]
};

function main() {
	var w = 800;
	var h = 800;
	var renderer = new THREE.WebGLRenderer({
			alpha: true
		});
	renderer.setSize(w, h);
	renderer.setClearColor(new THREE.Color(0, 0, 0), 0.0)
	document.getElementById("wrap").appendChild(renderer.domElement);

	var dpx_per_particle = 2; //data pixels per particle (in the render target texture)
	var sqrt_N_particles = Math.floor(Math.pow(2, 12));
	if ((sqrt_N_particles % dpx_per_particle) !== 0) {
		throw "sqrt_N_particles must be multiple of dpx_per_particle!";
	}
	var data_texture_w = sqrt_N_particles;
	var data_texture_h = sqrt_N_particles;
	var particles_per_row = Math.floor(data_texture_w / dpx_per_particle);
	var N_particles = particles_per_row * data_texture_h;
	// N_particles is this weird function because we need to use multiple pixels per particle
	console.log("Particle Count: " + N_particles);

	var rtData = make_render_target(data_texture_w, data_texture_h);
	var renderTarget_list = [rtData[0], rtData[1]];
	var renderTarget_i = 0;
	var rtScene = rtData[2];
	var rtCamera = rtData[3];
	var rtMaterial = rtData[4];

	const fov = 75;
	const aspect = w / h; // the canvas default
	const near = 0.1;
	const far = 100;
	const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
	camera.position.z = 2;
	var controls = new OrbitControls(camera, renderer.domElement);
	// enable animation loop when using damping or rotation
	//controls.enableDamping = true;
	//controls.dampingFactor = 0.5;
	//controls.enableZoom = false;
	controls.enablePan = false;

	const scene = new THREE.Scene(); {
		const color = 0xFFFFFF;
		const intensity = 1;
		const light = new THREE.DirectionalLight(color, intensity);
		light.position.set(-1, 2, 4);
		scene.add(light);
	}
	//////////////////////////////
	const geometry = new THREE.BoxGeometry(1, 1, 1);
	const material = new THREE.MeshPhongMaterial({
			map: null,
		});
	const cube = new THREE.Mesh(geometry, material);
	//scene.add(cube);
	
    //////////////////////////////
	// Construct the particle related stuff (point cloud, mesh, shaders, etc.)
    const vertices = [];
	const vert_ids = [];
	for (let i = 0; i < N_particles; i++) {
		//fill in some dummy positions, we don't actually use these except for testing.
		const x = Math.random();
		const y = Math.random();
		const z = Math.random();
		vertices.push(x, y, z);

		//pre compute the lookup location for this vertex in the data texture
		const v_d0_y = (Math.floor((i * dpx_per_particle) / data_texture_w));
		const v_d0_x = (i % particles_per_row) * dpx_per_particle + 1;
		vert_ids.push(v_d0_x, v_d0_y, i);
	}
	const particle_geom = new THREE.BufferGeometry();
	particle_geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
	particle_geom.setAttribute('v_id', new THREE.Int32BufferAttribute(vert_ids, 3));
	var pointsShader = THREE.ShaderLib.points;
	var uniforms = THREE.UniformsUtils.clone(pointsShader.uniforms);

	uniforms['texture_in'] = {
		type: 't',
		value: renderTarget_list[renderTarget_i].texture
	};

	uniforms['dpx_per_particle'] = {
		value: dpx_per_particle
	};

	var particle_material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: document.getElementById('vertex-shader-particles').textContent,
			fragmentShader: document.getElementById('fragment-shader-particles').textContent,
		});
	particle_material.uniforms.size.value = 2.0;
	const particle_mesh = new THREE.Points(particle_geom, particle_material);
	scene.add(particle_mesh);

	//////////////////////////////

	//////////////////////////////
	// stuff for rendering trails
	var scene_rt = new THREE.WebGLRenderTarget(w, h, {
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.LinearFilter,
			minFilter: THREE.LinearFilter,
		});
    
	const finaldisp_scene = new THREE.Scene();
	var finaldisp_material = new THREE.ShaderMaterial({
			vertexShader: document.getElementById('vertex-shader-renderTarget').textContent,
			fragmentShader: document.getElementById('fragment-shader-finaldisp').textContent,
			depthWrite: false,
			depthTest: false,
			uniforms: {
				texture_in: {
					type: 't',
					value: make_zero_texture(w, h)
				},
                texture_prev: {
					type: 't',
					value: make_zero_texture(w, h)
				}
			}
		});

	var quad = new THREE.Mesh(
			new THREE.PlaneGeometry(2, 2),
			finaldisp_material);
	finaldisp_scene.add(quad);
    
	var finaldisp_rt_list = [];
	var finaldisp_rt_i = 0;
	for (let i = 0; i < 2; i++) {
		finaldisp_rt_list.push(
			new THREE.WebGLRenderTarget(w, h, {
				format: THREE.RGBAFormat,
				type: THREE.FloatType,
				magFilter: THREE.LinearFilter,
				minFilter: THREE.LinearFilter,
			}));
	};
	//////////////////////////////

	var renderTarget = null;
	var finaldisp_rt = null;
	var tick = 0;
	function render(time) {
		time *= 0.000001;
		controls.update();
		// run feedback loop on cycling render targets to prevent feedback loop error/warning
		renderTarget = renderTarget_list[renderTarget_i];
		if (tick > 0) {
			rtMaterial.uniforms.texture_in.value = renderTarget_list[1 - renderTarget_i].texture;
		}
		renderer.setRenderTarget(renderTarget);
		renderer.render(rtScene, rtCamera);
		renderer.setRenderTarget(null);
		renderTarget_i = 1 - renderTarget_i;

		// debug the values in the render target texture.
		//const pixelBuffer = new Uint8Array(4 * 1 * 1);
		//renderer.readRenderTargetPixels(renderTarget, 0, 0, 1, 1, pixelBuffer);
		//console.log(pixelBuffer);

		// rotate the cube in the scene
		cube.rotation.x = time;
		cube.rotation.y = time * 1.1;
		cube.material.map = renderTarget.texture;

		// render the scene to the scene render target

		renderer.setRenderTarget(scene_rt);
		renderer.render(scene, camera);
		renderer.setRenderTarget(null);
        
        // run feedback loop on cycling render targets to prevent feedback loop error/warning
		finaldisp_rt = finaldisp_rt_list[finaldisp_rt_i];
        finaldisp_material.uniforms.texture_in.value = scene_rt.texture
        if(tick==0){
            finaldisp_material.uniforms.texture_prev.value = scene_rt.texture;
        }else{
            finaldisp_material.uniforms.texture_prev.value = finaldisp_rt_list[1 - finaldisp_rt_i].texture;
        }
        renderer.setRenderTarget(finaldisp_rt);
		renderer.render(finaldisp_scene, rtCamera);
		renderer.setRenderTarget(null);
		finaldisp_rt_i = 1 - finaldisp_rt_i;
        
        // display the scene on a full screen quad

		renderer.render(finaldisp_scene, rtCamera);
		tick += 1;

		requestAnimationFrame(render);
	}

	requestAnimationFrame(render);
}

main();
