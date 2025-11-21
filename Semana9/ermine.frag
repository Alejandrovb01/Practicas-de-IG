// Author: Alejandro van Baumberghen Quintana
// Title: Ermine (heraldry)

#ifdef GL_ES
precision mediump float;
#endif
#define PI 3.14159265359
#define PI2 PI*2.

uniform vec2 u_resolution;

float scale = 6.0;

float isosceles_triangle(vec2 st, vec2 pos, float width, float height) {
    st = st - pos;

    float bottom = step(0.0, st.y);  
    float top = step(st.y, height);
    float slope = width / height;
    float left = step(-width * 0.5 + st.y * slope * 0.5, st.x);
    float right = step(st.x, width * 0.5 - st.y * slope * 0.5);
    
    return bottom * top * left * right;
}


float circle(vec2 st, vec2 pos, float radius) {
    vec2 dist = st - pos;
    return 1.0 - step(radius, length(dist));
}

float ermine(vec2 st, vec2 pos, float size) {
    st = st - pos;
    
    float radius = size * 0.12;
    
    float spot_top = circle(st, vec2(0.0, size * 0.4), radius);
    float spot_left = circle(st, vec2(-size * 0.2, size * 0.160), radius);
    float spot_right = circle(st, vec2(size * 0.2, size * 0.160), radius);
    
    float tail = isosceles_triangle(
        st, 
        vec2(0.0, -size * 0.650),
        size * 0.420,               
        size * 0.750               
    );
     
    float ermine_spot = spot_top + spot_left + spot_right + tail;
    
    return min(ermine_spot, 1.0);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    vec3 color = vec3(0.0);
    
    vec2 grid_st = st * scale;
    
    float row = floor(grid_st.y);
    
    if (mod(row, 2.0) == 1.0) {
        grid_st.x += 0.5;
    }
    
    grid_st = fract(grid_st);
    
    float ermine = ermine(grid_st, vec2(0.5, 0.5), 0.6);
        
    vec3 gules = vec3(0.600, 0.000, 0.000);
    vec3 sable = vec3(0.0, 0.0, 0.0);
    
    color = mix(gules, sable, ermine);
    
    gl_FragColor = vec4(color, 1.0);
}
