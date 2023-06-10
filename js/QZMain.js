'use strict';
import './QZMath.js';
import './three148.js';
import {
	OrbitControls
}
from './OrbitControls148.js';

var QZ = {};

QZ.loadFiles = async function (file_dict) {
	// batches loading files from server
	var keys = Object.keys(file_dict);
	var urls = Object.values(file_dict);

	var responses = [];
	urls.forEach(function (url, i) {
		responses.push(fetch(url).then(response => response.text()));
	});

	const data = await Promise.all(responses);

	var output = {};
	keys.forEach(function (key, i) {
		output[key] = data[i];
	});

	return output;
}

var feedback_buffer_vertex_shader = `
    uniform sampler2D texture_in;
                
    varying vec2 vUv;
    
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }`;

QZ.FeedbackBuffer = class {
	// manages multiple render targets to use them for GPU compute
	constructor(width, height, fragment_shader, vertex_shader = null) {
		this.width = width;
		this.height = height;

		// TODO: shouldn't this be orthographic ???
		// doesn't really matter because vertex shader is hijacked?
		const rtFov = 75;
		const rtAspect = this.width / this.height;
		const rtNear = 0.1;
		const rtFar = 5;

		//camera that exists solely to photograph a quad (or write mesh based shapes into the quad)
		this.quad_camera = new THREE.PerspectiveCamera(rtFov, rtAspect, rtNear, rtFar);
		this.quad_camera.position.z = 2;

		// 2 because we need to double buffer.
		this.render_target_list = [
			this.construct_render_target(this.width, this.height),
			this.construct_render_target(this.width, this.height),
		];
		// from buffer swap tracking purposes
		this.render_target_i = 0;
		// track if this is the first pass by checking if this is null
		this.render_target = null;

		this.quad_scene = new THREE.Scene();

		this.shader = new THREE.ShaderMaterial({
				vertexShader: vertex_shader === null ? feedback_buffer_vertex_shader : vertex_shader,
				fragmentShader: fragment_shader,
				depthWrite: false,
				depthTest: false,
				uniforms: {
					pix_sz: {
						value: new THREE.Vector2()
					},
					texture_in: {
						type: 't',
						value: this.make_init_texture(this.width, this.height)
					}
				}
			});

		//this could even be a big triangle because thats better apparently?
		var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.shader);
		this.shader.uniforms.pix_sz.value = [1.0 / this.width, 1.0 / this.height];

		this.quad_scene.add(quad);
	}

	construct_render_target(width, height) {
		//want RGBA32F internalFormat for high precision in computations
		return new THREE.WebGLRenderTarget(width, height, {
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
		});
	}

	make_zero_texture(width, height) {
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

	make_init_texture(width, height) {
		const size = width * height;
		const data = new Float32Array(4 * size);

		var rgba = [0, 0, 0, 0];
		var box_size = 0.0;
		for (let i = 0; i < size; i++) {

			const stride = i * 4;

			rgba = [
				THREE.MathUtils.randFloatSpread(box_size),
				THREE.MathUtils.randFloatSpread(box_size),
				THREE.MathUtils.randFloatSpread(box_size),
				THREE.MathUtils.randFloatSpread(box_size),
			];
			data[stride + 0] = rgba[0];
			data[stride + 1] = rgba[1];
			data[stride + 2] = rgba[2];
			data[stride + 3] = rgba[3];
		}

		const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
		texture.needsUpdate = true;
		return texture;
	}

	process(renderer) {
		// Feedback loop on swapping render targets to prevent error/warning.

		if (this.renderTarget !== null) {
			// provide the previous iteration's texture as input
			this.shader.uniforms.texture_in.value = this.render_target_list[1 - this.render_target_i].texture;
		}
		this.render_target = this.render_target_list[this.render_target_i];

		renderer.setRenderTarget(this.render_target);
		renderer.render(this.quad_scene, this.quad_camera);
		renderer.setRenderTarget(null);

		//we're done, indicate buffer for next iteration
		this.render_target_i = 1 - this.render_target_i;
	}
}

QZ.Canvas3D = class {
	constructor(element_id, width, height, feedback_buffer_list = [], aspect = null, fov = 75, near = 0.1, far = 100.0, controls = 'orbit', test_scene = true) {
		if (aspect === null) {
			aspect = width / height;
		}
		this.feedback_buffer_list = feedback_buffer_list;

		this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		this.camera.position.z = 2;
		this.scene = new THREE.Scene();

		this.renderer = new THREE.WebGLRenderer({
				alpha: true
			});
		this.renderer.setSize(width, height);
		this.renderer.setClearColor(new THREE.Color(0, 0, 0), 0.0)
		document.getElementById(element_id).appendChild(this.renderer.domElement);
		if (controls === 'orbit') {
			this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		} else {
			this.controls = null;
		}
		if (test_scene) {
			this.createTestScene();
		}
		this.render();
	}
	// Method
	createTestScene() {
		this.renderer.setClearColor(new THREE.Color(0, 0, 0), 0.5)
		const color = 0xFFFFFF;
		const intensity = 1;
		const light = new THREE.DirectionalLight(color, intensity);
		light.position.set(-1, 2, 4);
		this.scene.add(light);

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		this.test_material = new THREE.MeshPhongMaterial({
				map: null
			});
		const cube = new THREE.Mesh(geometry, this.test_material);
		cube.rotation.x = Math.PI * 0.25;
		cube.rotation.y = Math.PI * 0.25;
		this.scene.add(cube);
	}
	render() {
		this.renderer.render(this.scene, this.camera);
	}
	update() {
		if (this.controls !== null) {
			this.controls.update()
		}

		const renderer = this.renderer;
		this.feedback_buffer_list.forEach(function (feedback_buffer, i) {
			feedback_buffer.process(renderer);
		});
		this.test_material.map = this.feedback_buffer_list[0].render_target.texture;
		this.test_material.needsUpdate = true;

		this.render();
	}
};

export default QZ;
