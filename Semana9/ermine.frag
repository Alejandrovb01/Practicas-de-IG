#ifdef GL_ES
precision mediump float;
#endif
uniform vec2 u_resolution;
mat2 r(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float t(vec2 s,vec2 p,float w,float h,float a){s=r(a)*(s-p);float b=step(0.,s.y)*step(s.y,h),l=w/h;return b*step(-w*.5+s.y*l*.5,s.x)*step(s.x,w*.5-s.y*l*.5);}
float c(vec2 s,vec2 p,float d){return 1.-step(d,length(s-p));}
void main(){vec2 s=gl_FragCoord.xy/u_resolution.xy*9.;float f=floor(s.y);s.x+=mod(f,2.)*.5;s=fract(s);float z=.6;s-=vec2(.5);float d=z*.05;gl_FragColor=vec4(mix(vec3(.6,0.,0.),vec3(0.),min(c(s,vec2(0.,z*.4),d)+c(s,vec2(-z*.16,z*.24),d)+c(s,vec2(z*.16,z*.24),d)+t(s,vec2(0.,-z*.386),z*.308,z*.422,179.072)+t(s,vec2(.088,-z*.274),z*1.092,z*.198,1.85)+t(s,vec2(-.088,-z*.274),z*1.092,z*.198,-1.85),1.)),1.);}
