"use strict";

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

//create common 2D shader with all the standard attributes/uniforms
var vs_shader_list = {}
var fs_shader_list = {}

const uniforms_ENUM = {
"uniform3f":1, 
"uniform1f":2, 
"uniform1i":3,
"uniformMatrix3fv":4,
"uniform2f":5
}

class Shader2D {
    
    constructor(gl,vs_name,fs_name) {
        this.gl = gl;
        if(vs_shader_list[vs_name]  === undefined) vs_shader_list[vs_name] = createShader(gl, gl.VERTEX_SHADER, document.getElementById(vs_name).text)
        if(fs_shader_list[fs_name]  === undefined) fs_shader_list[fs_name] = createShader(gl, gl.FRAGMENT_SHADER, document.getElementById(fs_name).text)     
        this.program = createProgram(gl, vs_shader_list[vs_name], fs_shader_list[fs_name]);
        this.position_attr = gl.getAttribLocation(this.program, "a_position");
        this.texcoord_attr = gl.getAttribLocation(this.program, "a_texcoord");
        gl.enableVertexAttribArray(this.position_attr);
        gl.enableVertexAttribArray(this.texcoord_attr);
        this.uniforms = [];
        this.init_uniforms();
    }
    
    bind_buffers(position_buffer,texcoord_buffer) {
        {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, position_buffer);
            // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
            var size = 2;          // 2 components per iteration
            var type = this.gl.FLOAT;   // the data is 32bit floats
            var normalize = false; // don't normalize the data
            var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
            var offset = 0;        // start at the beginning of the buffer
            this.gl.vertexAttribPointer(this.position_attr, size, type, normalize, stride, offset);
        }
        {
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texcoord_buffer);
            var size = 2;          // 2 components per iteration
            var type = this.gl.FLOAT;   // the data is 32bit floats
            var normalize = false; // don't normalize the data
            var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
            var offset = 0;        // start at the beginning of the buffer
            this.gl.vertexAttribPointer(this.texcoord_attr, size, type, normalize, stride, offset);
        }        
    }
    init_uniforms(){       
        this.uniforms.push([this.gl.getUniformLocation(this.program,"slider3"),   uniforms_ENUM.uniform3f]);
        this.uniforms.push([this.gl.getUniformLocation(this.program,"t"),         uniforms_ENUM.uniform1f]);
        this.uniforms.push([this.gl.getUniformLocation(this.program,"u_texture"), uniforms_ENUM.uniform1i]);
        this.uniforms.push([this.gl.getUniformLocation(this.program,"u_matrix"),  uniforms_ENUM.uniformMatrix3fv]);
        this.uniforms.push([this.gl.getUniformLocation(this.program,"pix_sz"),  uniforms_ENUM.uniform2f]);
        this.uniforms.push([this.gl.getUniformLocation(this.program,"u_texture_prev"), uniforms_ENUM.uniform1i]);
    }
    copy_uniforms(uniforms_array){
        for (var i = 0; i < this.uniforms.length; i++) {
            var M = this.uniforms[i];
            var u = uniforms_array[i];
            switch(M[1]) {
            case uniforms_ENUM.uniform3f:
                this.gl.uniform3f(M[0], u[0], u[1], u[2]);
                break;
            case uniforms_ENUM.uniform2f:
                this.gl.uniform2f(M[0], u[0], u[1]);
                break;
            case uniforms_ENUM.uniform1f:
                this.gl.uniform1f(M[0], u);
                break;
            case uniforms_ENUM.uniform1i:
                this.gl.uniform1i(M[0], u);
                break;
            case uniforms_ENUM.uniformMatrix3fv:
                this.gl.uniformMatrix3fv(M[0], false, u);
                break;                   
            }            
        }
    }
}

function main() {
// Get A WebGL context
var canvas = document.getElementById("c");
var gl = canvas.getContext("webgl2");
if (!gl) {
  return;
}
const ext = gl.getExtension("EXT_color_buffer_float"); //need high precision rendering to textures
  if (!ext) {
    console.log("sorry, can't render to floating point textures");
    return;
  }

var wave_shd = new Shader2D(gl, "2d-vertex-shader", "2d-fragment-shader");
var basic_shd = new Shader2D(gl, "2d-vertex-shader", "2d-fragment-shader-basic");

// Create a buffer and put three 2d clip space points in it
var positionBuffer = gl.createBuffer();
// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
var positions = [
    -1.0,-1.0,
    -1.0, 1.0,
     1.0, 1.0,
     1.0, 1.0,
     1.0,-1.0,
    -1.0,-1.0
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
var texcoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
// Set Texcoords.
// Fill the buffer with texture coordinates for the F.
function setTexcoords(gl) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0, 0,
        0, 1,
        1, 1,
        1, 1,
        1, 0,
        0, 0,
       ]),
       gl.STATIC_DRAW);
}
setTexcoords(gl);

// Create a texture.
var texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

// Fill the texture with a 1x1 blue pixel.
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 255, 255]));
              
// Asynchronously load an image
var image = new Image();
image.src = "texture.png";
image.addEventListener('load', function() {
  // Now that the image has loaded make copy it to the texture.
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
});

// code above this line is initialization code.
wave_shd.bind_buffers(positionBuffer,texcoordBuffer)
basic_shd.bind_buffers(positionBuffer,texcoordBuffer)

// webglUtils.resizeCanvasToDisplaySize(gl.canvas);
gl.canvas.width= 512
gl.canvas.height= 512

// Tell WebGL how to convert from clip space to pixels
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

// Clear the canvas
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

// draw
var primitiveType = gl.TRIANGLES;
var offset = 0;
var count = 6;  

// setup

var slider_x = new QZMath.createSlider("x",0,-1,1,0.001);
var slider_y = new QZMath.createSlider("y",0,-1,1,0.001);
var slider_z = new QZMath.createSlider("z",0.2,0,1,0.001);	

//render to texture stuff (https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html)
// create to render to
const attachmentPoint = gl.COLOR_ATTACHMENT0;
const targetTextureWidth = 512;
const targetTextureHeight = 512;
const level = 0;
var current_fb = 0
var fb_count = 3
const targetTexture = [];
const fb = []; 
for (var i = 0; i < fb_count; i++) { //need a circular list of high precision framebuffers/textures to get velocities
    targetTexture.push(gl.createTexture());
    fb.push(gl.createFramebuffer());
    gl.bindTexture(gl.TEXTURE_2D, targetTexture[i]);
    {
    // define size and format of level 0
    
    /*const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;*/
    //https://stackoverflow.com/questions/50032813/webgl2-rendering-to-r32f-texture
    const internalFormat = gl.RGBA32F;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.FLOAT;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    targetTextureWidth, targetTextureHeight, border,
                    format, type, data);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                    targetTextureWidth, targetTextureHeight, border,
                    format, type, data);
    
    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb[i]);
    // attach the texture as the first color attachment
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture[i], level);
}

gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.activeTexture(gl.TEXTURE2);
gl.bindTexture(gl.TEXTURE_2D, texture);

var matrix_I = [1,0,0,
                0,1,0,
                0,0,1]
var matrix_slider = [1,0,0,
                     0,1,0,
                     0,0,1]
// render loop
var u = [];

var animate = function () {
	
	//update time data
	frame++;
	current_time_ms=performance.now();
	dt_ms=current_time_ms-prev_time_ms;
	dt_s=dt_ms/1000;
	t=t+dt_s*dt_scale;
	matrix_slider[0] = slider_z.value
    matrix_slider[4] = slider_z.value
    matrix_slider[6] = slider_x.value
    matrix_slider[7] = slider_y.value
    //gl.uniform3f(slider3_UniformLocation,slider_x.value,slider_y.value,slider_z.value);
    //gl.uniform1f(t_UniformLocation,t)
    u = [
            [slider_x.value,slider_y.value,slider_z.value],
            t,
            1,
            matrix_I,
            [1.0/512,1.0/512],
            2
        ];
    gl.useProgram(wave_shd.program);
    wave_shd.copy_uniforms(u);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb[current_fb]);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.drawArrays(primitiveType, offset, count);
    u[2] = 0;
    u[3] = matrix_slider;
    gl.useProgram(basic_shd.program);
    basic_shd.copy_uniforms(u);    
    gl.drawArrays(primitiveType, offset, count);
    
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // Clear the canvas
    gl.clearColor(0, 1, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, targetTexture[current_fb]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, targetTexture[(current_fb+2)%fb_count]);
    u[2] = 1;
    u[3] = matrix_I;
    gl.useProgram(wave_shd.program);
    wave_shd.copy_uniforms(u);
    gl.drawArrays(primitiveType, offset, count);
    u[2] = 0;
    u[3] = matrix_slider;
    gl.useProgram(basic_shd.program);
    basic_shd.copy_uniforms(u);    
    gl.drawArrays(primitiveType, offset, count);
    //gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, 512, 512, 0);
    
    current_fb = (current_fb+1)%fb_count
	
    
    
    prev_time_ms=current_time_ms;
	
	requestAnimationFrame(animate);
};

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
//---------------------------------------------------------------------------------------run animation
animate();
  
}

main();