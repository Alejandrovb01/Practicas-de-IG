// Author: Alejandro van Baumberghen Quintana
// Title: Vair plane (heraldry)

#ifdef GL_ES
precision mediump float;
#endif
#define PI 3.14159265359
#define PI2 PI*2.

uniform vec2 u_resolution;

float scale = 6.0;


mat2 rotate2d(float angle) {
    return mat2(cos(angle), -sin(angle),
                sin(angle), cos(angle));
}

float right_triangle(vec2 st, vec2 pos, float size, float angle) {
    st = st - pos;   
    st = rotate2d(angle) * st;
    
    // Límites del triángulo
    float bottom = step(0.0, st.y);
    float left = step(-st.y, st.x);
    float right = step(st.x, st.y);
    float top = step(st.y, size);
    
    return bottom * left * right * top;
}

float square(vec2 st, vec2 pos, float size) {
    st = st - pos;
    
    float left = step(-size, st.x);
    float right = step(st.x, size);
    float bottom = step(-size, st.y);
    float top = step(st.y, size);
    
    return left * right * bottom * top;
}

float vair(vec2 st) {   
    float top_triangle = right_triangle(st, vec2(0.500,1.0001), 0.251, PI/1.0);
    float middle_square = square(st, vec2(0.500,0.500), 0.25);
    float bottom_triangle = right_triangle(st, vec2(0.500,0.510), 0.510, PI/1.0);
    
    return top_triangle + middle_square + bottom_triangle;
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
    
    vec3 azure = vec3(0.0, 0.318, 0.729);
    vec3 argent = vec3(1.0, 1.0, 1.0);
    
    color = mix(azure, argent, min(vair(grid_st), 1.0));
    
    gl_FragColor = vec4(color, 1.0);
}
