#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
mat2 r(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float t(vec2 s,vec2 p,float z,float a){s=r(a)*(s-p);return step(0.,s.y)*step(-s.y,s.x)*step(s.x,s.y)*step(s.y,z);}
float q(vec2 s,vec2 p,float z){s-=p;return step(-z,s.x)*step(s.x,z)*step(-z,s.y)*step(s.y,z);}
void main(){vec2 s=fract(gl_FragCoord.xy/u_resolution.xy*6.);gl_FragColor=vec4(mix(vec3(1.),vec3(0.,.318,.729),min(t(s,vec2(.5,1.),.251,3.14159)+q(s,vec2(.5),0.25)+t(s,vec2(.5,.51),.51,3.14159),1.)),1.);}
