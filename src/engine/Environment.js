import * as THREE from 'three';

// Port of the original HTML's continuous sky palette, day/night blend,
// golden-hour scattering, sun corona and moon glow.
export const SKY_FRAGMENT = `
uniform float day; uniform vec3 sunDir; uniform vec3 moonDir; uniform float sat;
varying vec3 vWorld;
void main(){
 vec3 view=normalize(vWorld); float elevView=clamp(view.y,-0.15,1.0); float h=smoothstep(-0.05,1.0,elevView); float elev=sunDir.y;
 float daylight=smoothstep(-0.32,0.30,elev); float nightAmt=1.0-daylight;
 float golden=1.0-smoothstep(0.0,0.42,abs(elev)); golden=pow(golden,0.75)*clamp(daylight+0.22,0.0,1.0);
 float blueHour=(1.0-smoothstep(0.0,0.26,abs(elev+0.10)))*(1.0-daylight*0.45);
 vec3 nightH=vec3(0.015,0.025,0.065),nightM=vec3(0.008,0.014,0.045),nightZ=vec3(0.002,0.006,0.028);
 vec3 dayH=vec3(0.78,0.88,0.98),dayM=vec3(0.42,0.68,0.95),dayZ=vec3(0.08,0.28,0.78);
 vec3 setH=vec3(1.0,0.22,0.04),setL=vec3(1.0,0.48,0.12),setM=vec3(0.95,0.38,0.55),setZ=vec3(0.35,0.18,0.55);
 vec3 blueH=vec3(0.28,0.38,0.72),blueM=vec3(0.10,0.16,0.40),blueZ=vec3(0.03,0.05,0.16);
 vec3 n=mix(nightH,nightM,smoothstep(0.0,0.42,h)); n=mix(n,nightZ,smoothstep(0.32,1.0,h));
 vec3 d=mix(dayH,dayM,smoothstep(0.0,0.38,h)); d=mix(d,dayZ,smoothstep(0.28,1.0,h));
 vec3 s=mix(setH,setL,smoothstep(0.0,0.16,h)); s=mix(s,setM,smoothstep(0.10,0.40,h)); s=mix(s,setZ,smoothstep(0.32,0.92,h));
 vec3 b=mix(blueH,blueM,smoothstep(0.0,0.38,h)); b=mix(b,blueZ,smoothstep(0.28,1.0,h));
 vec3 skyDay=mix(d,s,clamp(golden*1.40,0.0,1.0)); vec3 trans=mix(skyDay,b,clamp(blueHour*0.95,0.0,1.0)); vec3 col=mix(n,trans,clamp(daylight+blueHour*0.40,0.0,1.0));
 float lum=dot(col,vec3(0.299,0.587,0.114)); col=mix(vec3(lum),col,sat);
 float horizon=exp(-max(view.y,0.0)*3.8); float scatter=(0.16+0.62*golden+0.22*blueHour)*horizon;
 vec3 scatterCol=mix(vec3(0.58,0.74,0.98),mix(vec3(1.0,0.42,0.14),vec3(0.85,0.32,0.52),blueHour),clamp(golden+blueHour,0.0,1.0)); col+=scatterCol*scatter*(0.45+0.55*daylight);
 float sd=max(dot(view,normalize(sunDir)),0.0); float core=pow(sd,1400.0)*4.5; float corona=pow(sd,120.0)*1.15; float glow=pow(sd,28.0)*0.55; float bloom=pow(sd,5.5)*0.28*(0.30+0.70*daylight); float warm=pow(sd,1.8)*golden*0.55; float veil=pow(sd,1.15)*golden*0.18;
 vec3 sunCol=mix(vec3(1.0,0.98,0.92),vec3(1.0,0.52,0.18),golden); vec3 glare=mix(vec3(1.0,0.90,0.70),vec3(1.0,0.38,0.12),golden); col+=sunCol*(core+corona+glow)+glare*(bloom+warm+veil);
 float md=max(dot(view,normalize(moonDir)),0.0); col+=vec3(0.58,0.68,0.98)*(pow(md,600.0)*0.85+pow(md,16.0)*0.12)*nightAmt;
 col*=0.90+0.10*smoothstep(0.0,0.55,h); gl_FragColor=vec4(max(col,vec3(0.0)),1.0);
}`;

export const MIRROR_FRAGMENT = `
uniform vec3 sunDir; uniform vec3 moonDir; uniform float sat; uniform vec3 groundColor; uniform vec3 fogColor; uniform float fogDensity; uniform vec3 cameraPos;
varying vec3 vWorldPos; varying vec3 vWorldNormal;
${SKY_FRAGMENT.substring(SKY_FRAGMENT.indexOf('void main()')).replace('void main(){','vec3 evalSky(vec3 view){').replace('vec3 view=normalize(vWorld);','view=normalize(view);').replace('gl_FragColor=vec4(max(col,vec3(0.0)),1.0);','return max(col,vec3(0.0));')}
void main(){ vec3 N=normalize(vWorldNormal); vec3 V=normalize(cameraPos-vWorldPos); if(dot(N,V)<0.0)N=-N; vec3 R=reflect(-V,N); vec3 sky=evalSky(R); float daylight=smoothstep(-0.32,0.30,sunDir.y); float down=1.0-smoothstep(-0.025,0.02,R.y); vec3 ground=groundColor*(0.70+0.55*daylight); vec3 col=mix(sky,ground,down); float contact=exp(-abs(R.y)*22.0); col=mix(col,fogColor,contact*clamp(fogDensity*55.0,0.0,0.05)); gl_FragColor=vec4(col,1.0); }
`;

export function createEnvironment(scene, state) {
  const uniforms={day:{value:state.day},sunDir:{value:new THREE.Vector3(0,1,0)},moonDir:{value:new THREE.Vector3(0,-1,0)},sat:{value:state.skySat}};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(4800,64,32),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms,vertexShader:'varying vec3 vWorld; void main(){vWorld=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:SKY_FRAGMENT}));
  sky.name='AtmosphereSky'; scene.add(sky);
  const groundMat=new THREE.MeshBasicMaterial({color:state.groundColor,side:THREE.DoubleSide});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),groundMat); ground.rotation.x=-Math.PI/2; ground.position.y=0; ground.name='SimpleGround'; ground.userData.solid=true; scene.add(ground);
  const cloudUniforms={uTime:{value:0},uSunPosition:{value:new THREE.Vector3()}};
  const cloud=new THREE.Mesh(new THREE.SphereGeometry(4850,48,28),new THREE.ShaderMaterial({side:THREE.BackSide,transparent:true,depthWrite:false,uniforms:cloudUniforms,vertexShader:'varying vec3 vWorld;void main(){vWorld=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`uniform float uTime;uniform vec3 uSunPosition;varying vec3 vWorld;float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}void main(){vec3 p=vWorld*2.55+vec3(uTime*.014,0.0,uTime*.009);float n=noise(p)+.55*noise(p*2.1)+.28*noise(p*4.2)+.12*noise(p*8.0);float d=smoothstep(.72,1.32,n);float horizon=smoothstep(.015,.32,vWorld.y);if(d<.02)discard;float sun=max(dot(normalize(vWorld),normalize(uSunPosition)),0.0);float golden=1.0-smoothstep(-.15,.25,abs(uSunPosition.y-.05));vec3 c=mix(vec3(.82,.85,.90),vec3(.96,.97,.99),clamp(d*1.4,0.0,1.0));c=mix(c,vec3(1.0,.88,.72),pow(sun,5.0)*golden*.45);c+=vec3(1.0,.7,.4)*pow(sun,12.0)*golden*.25;c=max(c,vec3(.75));gl_FragColor=vec4(c,d*.72*horizon);}`}));cloud.name='AtmosphericClouds';scene.add(cloud);
  const sun=new THREE.Mesh(new THREE.SphereGeometry(28,24,18),new THREE.MeshBasicMaterial({color:0xfff4c7,toneMapped:false})); sun.name='SunDisc';sun.renderOrder=2;scene.add(sun);
  const sunLight=new THREE.DirectionalLight(0xfff2df,1.2); scene.add(sunLight);
  const hemi=new THREE.HemisphereLight(0xffffff,0x514b42,0.8); scene.add(hemi);
  const fill=new THREE.DirectionalLight(0xffffff,0.35); scene.add(fill); const nightFillColor=new THREE.Color(0.45,0.55,0.85);
  const starsGeo=new THREE.BufferGeometry(); const pts=[]; for(let i=0;i<900;i++){const y=Math.random()*0.95+0.05, a=Math.random()*Math.PI*2, r=4800; pts.push(Math.cos(a)*Math.sqrt(1-y*y)*r,y*r,Math.sin(a)*Math.sqrt(1-y*y)*r);} starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xffffff,size:5,transparent:true,opacity:0,depthWrite:false})); scene.add(stars);
  const env={...state}; const environmentFogColor=new THREE.Color(0xA6C2EB); const sunDirection=new THREE.Vector3(); const fogColor=new THREE.Color(0xA6C2EB);
  function update(time=0){
    const elevation=Math.sin((env.day-.25)*Math.PI*2), az=env.angle; const cosE=Math.cos(Math.asin(THREE.MathUtils.clamp(elevation,-1,1)));
    const dir=sunDirection.set(Math.cos(az)*cosE,elevation,Math.sin(az)*cosE).normalize(); uniforms.day.value=env.day; uniforms.sunDir.value.copy(dir); uniforms.moonDir.value.copy(dir).negate(); uniforms.sat.value=env.skySat;
    sun.position.copy(dir).multiplyScalar(2100);cloudUniforms.uSunPosition.value.copy(dir);cloudUniforms.uTime.value=time; sun.visible=elevation>-.12; sunLight.position.copy(dir).multiplyScalar(2200);
    const daylight=THREE.MathUtils.smoothstep(elevation,-.28,.32), night=1-daylight, golden=1-THREE.MathUtils.smoothstep(Math.abs(elevation-.05),0,.22);
    sun.material.color.setRGB(1,.95-golden*.35,.72-golden*.45); sunLight.color.setRGB(1,.97-golden*.22,.88-golden*.38); sunLight.intensity=(.08+1.85*env.light)*daylight;
    fill.position.set(-dir.x*70,38,-dir.z*70);fill.color.setRGB(.72,.82,.95);fill.intensity=(.14+.48*daylight)*env.light;
    hemi.intensity=(.20+.78*env.light)*(.38+.62*daylight);hemi.color.setHSL(.58,.28+.08*daylight,.55+.28*daylight);hemi.groundColor.setHSL(.22,.22,.20+.16*daylight);
    if(night>.05){fill.intensity+=.18*night*env.light;hemi.intensity+=.14*night*env.light;fill.color.lerp(nightFillColor,night*.55);}
    if(daylight>.55)fogColor.setRGB(.65,.76,.92);else if(daylight>.12||golden>.3)fogColor.setRGB(.92,.48+.2*golden,.28+.12*daylight);else fogColor.setRGB(.05,.07,.13);
    if(!scene.fog)scene.fog=new THREE.FogExp2(fogColor,0.00008+env.fog*.00047);else{scene.fog.color.copy(fogColor);scene.fog.density=0.00008+env.fog*.00047;}environmentFogColor.copy(fogColor); stars.material.opacity=THREE.MathUtils.clamp((-.02-elevation)*2.1,0,.96);
    groundMat.color.set(env.groundColor).multiplyScalar(env.groundBrightness??1); return {dir,fogColor,groundMat,uniforms,sun,daylight};
  }
  return {sky,cloud,ground,groundMat,sun,sunLight,hemi,fill,stars,uniforms,update,state:env,get sceneFogColor(){return environmentFogColor;}};
}

export function makeEnvironmentMirror(camera, env, environment) {
  const mat=new THREE.ShaderMaterial({side:THREE.DoubleSide,depthWrite:true,uniforms:{sunDir:{value:new THREE.Vector3(0,1,0)},moonDir:{value:new THREE.Vector3(0,-1,0)},sat:{value:env.skySat},groundColor:{value:new THREE.Color(env.groundColor)},fogColor:{value:new THREE.Color(0xA6C2EB)},fogDensity:{value:.0002},cameraPos:{value:new THREE.Vector3()}},vertexShader:'varying vec3 vWorldPos; varying vec3 vWorldNormal; void main(){vec4 wp=modelMatrix*vec4(position,1.0);vWorldPos=wp.xyz;vWorldNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*wp;}',fragmentShader:MIRROR_FRAGMENT});
  mat.userData.updateMirror=(camera,env,environment)=>{const u=mat.uniforms;u.cameraPos.value.copy(camera.position);u.sunDir.value.copy(environment.uniforms.sunDir.value);u.moonDir.value.copy(environment.uniforms.moonDir.value);u.sat.value=env.skySat;u.groundColor.value.set(env.groundColor).multiplyScalar(env.groundBrightness??1);u.fogColor.value.copy(environment.sceneFogColor||new THREE.Color(0xA6C2EB));u.fogDensity.value=.00008+env.fog*.00047;};
  return mat;
}
