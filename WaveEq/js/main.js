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
"uniform2f":5,
"uniform4f":6
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
        this.uniforms_list = [];
        this.uniforms = {};
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
    add_uniform(name){
        this.uniforms[name] = this.gl.getUniformLocation(this.program,name);
    }
    init_uniforms(){       
        this.uniforms_list.push([this.gl.getUniformLocation(this.program,"slider4"),   uniforms_ENUM.uniform4f]);
        this.uniforms_list.push([this.gl.getUniformLocation(this.program,"t"),         uniforms_ENUM.uniform1f]);
        this.uniforms_list.push([this.gl.getUniformLocation(this.program,"u_texture"), uniforms_ENUM.uniform1i]);
        this.uniforms_list.push([this.gl.getUniformLocation(this.program,"u_matrix"),  uniforms_ENUM.uniformMatrix3fv]);
        this.uniforms_list.push([this.gl.getUniformLocation(this.program,"pix_sz"),  uniforms_ENUM.uniform2f]);
        this.uniforms_list.push([this.gl.getUniformLocation(this.program,"u_texture_prev"), uniforms_ENUM.uniform1i]);
        this.uniforms_list.push([this.gl.getUniformLocation(this.program,"cfloats"),   uniforms_ENUM.uniform4f]);
    }
    copy_uniforms(uniforms_array){
        for (var i = 0; i < this.uniforms_list.length; i++) {
            var M = this.uniforms_list[i];
            var u = uniforms_array[i];
            switch(M[1]) {
            case uniforms_ENUM.uniform4f:
                this.gl.uniform4f(M[0], u[0], u[1], u[2], u[3]);
                break;
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
wave_shd.add_uniform("u_texture_bg");
var basic_shd = new Shader2D(gl, "2d-vertex-shader", "2d-fragment-shader-basic");
var laser_shd = new Shader2D(gl, "2d-vertex-shader", "2d-fragment-shader-laser");
var wave_show_shd = new Shader2D(gl, "2d-vertex-shader", "2d-fragment-shader-wave");
wave_show_shd.add_uniform("u_texture_bg");
var wave_show_shd_avg = new Shader2D(gl, "2d-vertex-shader", "2d-fragment-shader-wave-avg");

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
var textureEmpty = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, textureEmpty);
// Fill the texture with a 1x1 blue pixel.
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 0, 0, 0]));
              
var texture = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 255, 255, 255]));
var texture1 = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture1);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 255, 255, 255]));
var texture2 = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture2);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 255, 255, 255]));   
var texture3 = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture3);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 255, 255, 255]));      
var texture4 = gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture4);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([0, 255, 255, 255]));      
              
// code above this line is initialization code.
wave_shd.bind_buffers(positionBuffer,texcoordBuffer)
basic_shd.bind_buffers(positionBuffer,texcoordBuffer)
laser_shd.bind_buffers(positionBuffer,texcoordBuffer)
wave_show_shd.bind_buffers(positionBuffer,texcoordBuffer)

// webglUtils.resizeCanvasToDisplaySize(gl.canvas);
gl.canvas.width= 1028
gl.canvas.height= 1028

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
var owner_idA = "slidersA";
var owner_idB = "slidersB";
var refreshFlag = false;
var refreshCB = function(){
    refreshFlag = true;
}
var env_mode = new QZMath.createSlider("medium shape",0,0,4,1,owner_idA);
// Asynchronously load images
if(true){
    var image = new Image();
    image.src = "texture0.png";
    image.addEventListener('load', function() {
    // Now that the image has loaded make copy it to the texture.
    //var active = gl.ACTIVE_TEXTURE;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    env_mode.slider.value = 0;
    env_mode.slider.oninput();
    //gl.activeTexture(active);
    //gl.activeTexture(gl.TEXTURE1);
    //gl.bindTexture(gl.TEXTURE_2D, texture);
    //gl.activeTexture(gl.TEXTURE2);
    //gl.bindTexture(gl.TEXTURE_2D, texture);
    });
    var image1 = new Image();
    image1.src = "texture1.png";
    image1.addEventListener('load', function() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    env_mode.slider.value = 1;
    env_mode.slider.oninput();
    });
    var image2 = new Image();
    image2.src = "texture2.png";
    image2.addEventListener('load', function() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    env_mode.slider.value = 2;
    env_mode.slider.oninput();
    });
    var image3 = new Image();
    image3.src = "texture3.png";
    image3.addEventListener('load', function() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture3);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image3);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    env_mode.slider.value = 3;
    env_mode.slider.oninput();
    });
    var image4 = new Image();
    image4.src = "texture4.png";
    image4.addEventListener('load', function() {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture4);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image4);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    env_mode.slider.value = 4;
    env_mode.slider.oninput();
    });
}



var refreshbtn = new QZMath.createButton("reset",'(reinitialize sim)',refreshCB,owner_idA)
var slider_steps_per_frame = new QZMath.createSlider("steps per frame",4,1,60,1,owner_idA);
var slider_x = new QZMath.createSlider("source x target",-0.75,-1,1,0.001,owner_idA);
var slider_y = new QZMath.createSlider("source y target",-0.363,-1,1,0.001,owner_idA);
var slider_z = new QZMath.createSlider("source size",0.2,0,1.5,0.001,owner_idA);	
var source_mode = new QZMath.createSlider("source mode",2,0,3,1,owner_idA);
var travel_speed = new QZMath.createSlider("source speed, >1 is ftl",0.5,0.1,10,0.001,owner_idA);
	
var slider_g = new QZMath.createSlider("velocity damping",1,0.5,1,0.00001,owner_idA);	
var slider_b = new QZMath.createSlider("nm/pixel",50.625,0.00001,150,0.00001,owner_idB);	
var slider_a = new QZMath.createSlider("light wavelength (nm)",540,280,800,0.001,owner_idB);	
var slider_intensity = new QZMath.createSlider("light intensity",0.80,0,1,0.001,owner_idB);
var white_intensity = new QZMath.createSlider("white intensity",1.0,0,1,0.001,owner_idB);
var filter_constant = new QZMath.createSlider("averaging filter constant",0.01,0.01,1,0.001,owner_idB);
var disp_constant = new QZMath.createSlider("dispersion constant",0.55,0.01,1,0.001,owner_idB);
var media_wavespd_constant = new QZMath.createSlider("medium wavespeed fraction",0.7,0.0,1,0.001,owner_idB);
var slider_r = new QZMath.createSlider("wave speed",1,0,1,0.001,owner_idB);	

//render to texture stuff (https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html)
// create to render to
var prev_env_mode = env_mode.value;
const attachmentPoint = gl.COLOR_ATTACHMENT0;
const targetTextureWidth = gl.canvas.width;
const targetTextureHeight = gl.canvas.height;
const level = 0;
var current_fb = 0
var current_fb_avg = 0
var fb_count = 3
const targetTexture = [];
const fb = []; 
for (var i = 0; i < fb_count+2; i++) { //need a circular list of high precision framebuffers/textures to get velocities
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT );
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb[i]);
    // attach the texture as the first color attachment
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture[i], level);
}

gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, textureEmpty);
gl.activeTexture(gl.TEXTURE2);
gl.bindTexture(gl.TEXTURE_2D, textureEmpty);
gl.activeTexture(gl.TEXTURE3);
gl.bindTexture(gl.TEXTURE_2D, textureEmpty);

var matrix_I = [1,0,0,
                0,1,0,
                0,0,1]
var matrix_slider = [1,0,0,
                     0,1,0,
                     0,0,1]
// render loop
var spd = 0;
var u = [];
var f=0;
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
function clamp(n,min, max) {
  return Math.min(Math.max(n, min), max);
};
matrix_slider[6]=slider_x.value
matrix_slider[7]=slider_y.value
var grid_nm_per_cell = 50.625
var c_cell_per_dt = 0.5*slider_r.value;
var wave_pump_height = 0.0;
var animate = function () {
    
    //do stuff to change settings/resest before sim runs
    if(prev_env_mode !== env_mode.value){
        prev_env_mode = env_mode.value;
        gl.activeTexture(gl.TEXTURE0);
        if(env_mode.value==0){
            gl.bindTexture(gl.TEXTURE_2D, texture);
        }else if(env_mode.value==1){
            gl.bindTexture(gl.TEXTURE_2D, texture1);           
        }else if(env_mode.value==2){
            gl.bindTexture(gl.TEXTURE_2D, texture2);           
        }else if(env_mode.value==3){
            gl.bindTexture(gl.TEXTURE_2D, texture3);           
        }else if(env_mode.value==4){
            gl.bindTexture(gl.TEXTURE_2D, texture4);           
        }
    }
    
    if(refreshFlag){
        for (var i = 0; i < fb_count+2; i++) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb[i]);                
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb[current_fb]);
        refreshFlag = false
    }
    
    grid_nm_per_cell = slider_b.value;
	//update time data
    for (var i = 0; i < slider_steps_per_frame.value; i++) {
        frame++;
        current_time_ms=performance.now();
        dt_ms=current_time_ms-prev_time_ms;
        dt_s=dt_ms/1000;
        //console.log(dt_s)
        t=t+dt_s*dt_scale;
        
        
        f+=2.0*Math.PI*(c_cell_per_dt*grid_nm_per_cell/slider_a.value)*dt_scale
        
        wave_pump_height = QZMath.lerp(Math.sin(f),(Math.random()*2.0-1.0),white_intensity.value)*slider_intensity.value;
        
        matrix_slider[0] = slider_z.value*0.5;
        matrix_slider[4] = slider_z.value;
        //superliminal speeds are bad
        spd = travel_speed.value
        matrix_slider[6] = matrix_slider[6]+spd*clamp((slider_x.value-matrix_slider[6])*gl.canvas.width,-1.0,1.0)/gl.canvas.width
        matrix_slider[7] = matrix_slider[7]+spd*clamp((slider_y.value-matrix_slider[7])*gl.canvas.height,-1.0,1.0)/gl.canvas.height
        //gl.uniform3f(slider3_UniformLocation,slider_x.value,slider_y.value,slider_z.value);
        //gl.uniform1f(t_UniformLocation,t)
        u = [
                [slider_r.value,slider_g.value,slider_b.value,slider_a.value],
                wave_pump_height,
                1,
                matrix_I,
                [1.0/gl.canvas.width,1.0/gl.canvas.height],
                2,
                [filter_constant.value,disp_constant.value,1.0-media_wavespd_constant.value,0.0]
            ];
        gl.useProgram(wave_shd.program);
        wave_shd.copy_uniforms(u);
        gl.uniform1i(wave_shd.uniforms.u_texture_bg, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb[current_fb]);
        gl.drawArrays(primitiveType, offset, count);
        if(source_mode.value===0){
            u[2] = 1;
            u[3] = matrix_slider;
            gl.useProgram(basic_shd.program);
            basic_shd.copy_uniforms(u);
            gl.drawArrays(primitiveType, offset, count);
        }else if(source_mode.value===2){
            u[2] = 1;
            matrix_slider[0] = 0.01;
            u[3] = matrix_slider;
            gl.useProgram(laser_shd.program); 
            laser_shd.copy_uniforms(u);
            gl.drawArrays(primitiveType, offset, count);
        }
        //gl.enable(gl.BLEND);
        //gl.blendEquation( gl.FUNC_ADD );
        //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        //gl.drawArrays(primitiveType, offset, count);
        //gl.disable(gl.BLEND);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, targetTexture[current_fb]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, targetTexture[(current_fb+2)%fb_count]);        
        current_fb = (current_fb+1)%fb_count 
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb[fb_count+current_fb_avg]);
    // Clear the canvas
    //gl.clearColor(0, 1, 0, 1);
    //gl.clear(gl.COLOR_BUFFER_BIT);
    //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    u[2] = 1;
    u[3] = matrix_I;
    gl.useProgram(wave_show_shd.program);
    gl.uniform1i(wave_show_shd.uniforms.u_texture_bg, 3);
    wave_show_shd.copy_uniforms(u);
    gl.drawArrays(primitiveType, offset, count);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, targetTexture[fb_count+current_fb_avg]); 
    current_fb_avg = 1-current_fb_avg;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    u[3] = matrix_I;
    u[2] = 3;
    gl.useProgram(wave_show_shd_avg.program);
    wave_show_shd_avg.copy_uniforms(u);
    gl.drawArrays(primitiveType, offset, count);
    //u[2] = 1;
    //u[3] = matrix_slider;
   // gl.useProgram(basic_shd.program);
   // basic_shd.copy_uniforms(u);
    //gl.enable(gl.BLEND);
    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    //gl.drawArrays(primitiveType, offset, count);
    //gl.disable(gl.BLEND);
    //gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, 512, 512, 0);
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