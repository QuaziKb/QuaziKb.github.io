uniform vec2 pix_sz;
uniform sampler2D texture_in;

varying vec2 vUv;
const float max_t = 5000.0;

// "Hash Functions for GPU Rendering"
// https://www.shadertoy.com/view/XlGcRh

uvec3 pcg3d(uvec3 v) {

    v = v * 1664525u + 1013904223u;

    v.x += v.y*v.z;
    v.y += v.z*v.x;
    v.z += v.x*v.y;

    v ^= v >> 16u;

    v.x += v.y*v.z;
    v.y += v.z*v.x;
    v.z += v.x*v.y;

    return v;
}

vec3 random3d(vec3 v){
    // v should be filled with positive integers
    return vec3(pcg3d(uvec3(v.xy/pix_sz, v.z))) * (1.0/float(0xffffffffu));
}

void main() {
    int column = int(vUv.x/pix_sz.x);
    int cell = column%2;
    if(cell == 0){
        vec4 d0 = texture2D(texture_in, vUv);
        vec4 d1 = texture2D(texture_in, vUv+vec2(pix_sz.x, 0.0));
        
        //unpack data from d samples
        vec3 old_x = d0.xyz;
        vec3 curr_x = d1.xyz;
        float curr_t = d1.w;
        
        //shift the current particle position "curr_x" into the "old_x" slot 
        //since that cell will update this tick.
        
        if(curr_t > max_t){
            curr_x = vec3(0.0, 0.0, 0.0);
            //curr_x = (curr_x-old_x);
        }
        vec4 new_d0 = vec4(curr_x, d0.w);
        gl_FragColor = new_d0;
    }else{
        vec4 d0 = texture2D(texture_in, vUv-vec2(pix_sz.x, 0.0));
        vec4 d1 = texture2D(texture_in, vUv);
        
        //unpack data from d samples
        vec3 old_x = d0.xyz;
        vec3 curr_x = d1.xyz;
        float curr_t = d1.w;
        
        vec3 rng = random3d(vec3(vUv, d1.w))*2.0-1.0;
        vec3 force = -0.0001*curr_x*length(curr_x)+rng/length(rng)*0.0001;
        //vec3 force = (rng*2.0-1.0)*0.01;
        vec3 new_x = curr_x+(curr_x-old_x)*1.0+force;
        
        float new_t = curr_t + 1.0;
        if(curr_t > max_t){
            new_t = 0.0;
            new_x = vec3(0.0, 0.0, 0.0);
        }

        vec4 new_d1 = vec4(new_x, new_t);
        gl_FragColor = new_d1;
    }
    
}