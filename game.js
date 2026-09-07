let scene,camera,renderer,car,road,started=false;
let speed=0,score=0,nitro=0,spawnTimer=0,last=performance.now(),shake=0;
const keys={left:false,right:false,up:false,down:false};
const traffic=[];
const bestKey="streetRushBest";
let best=Number(localStorage.getItem(bestKey)||0);
document.querySelector("#best").textContent=best;

function mat(color,rough=.75,metal=0){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})}
function cube(w,h,d,color,x,y,z,parent=scene){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function init(){
 scene=new THREE.Scene();
 scene.background=new THREE.Color(0x86c5e5);
 scene.fog=new THREE.Fog(0x86c5e5,55,230);
 camera=new THREE.PerspectiveCamera(64,innerWidth/innerHeight,.1,500);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
 renderer.setSize(innerWidth,innerHeight);
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 document.querySelector("#game").appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xffffff,0x334455,2.2));
 const sun=new THREE.DirectionalLight(0xffffff,3.0);sun.position.set(-25,35,15);sun.castShadow=true;scene.add(sun);
 buildWorld();buildCar();resize();animate();
}
function buildWorld(){
 road=cube(14,.25,430,0x2f3238,0,0,-120);
 cube(7,.18,430,0x3e7a40,-10.5,-.05,-120);
 cube(7,.18,430,0x3e7a40,10.5,-.05,-120);
 for(let z=-5;z>-410;z-=12){
   cube(.13,.025,5,0xffffff,-2.33,.14,z);
   cube(.13,.025,5,0xffffff,2.33,.14,z);
   if(z%36===-5){
     cube(1.4,2.3,1.4,0x70452b,-11,1.15,z-8);
     cube(1.2,1.8,1.2,0x70452b,11,.9,z-4);
   }
 }
 for(let i=0;i<18;i++){
   const h=10+Math.random()*30;
   cube(18,h,13,0x55757a,(i-9)*24,h/2,-175-Math.random()*70);
 }
}
function buildCar(){
 car=new THREE.Group();car.position.set(0,.72,5);scene.add(car);
 cube(2.25,.65,4.05,0xd51e1e,0,0,0,car);
 const glass=mat(0x15232d,.18,.7);
 const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.62,.72,1.7),glass);
 cabin.position.set(0,.6,-.18);cabin.castShadow=true;car.add(cabin);
 for(const x of [-1.15,1.15])for(const z of [-1.25,1.25]){
   const w=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.3,22),mat(0x101010));
   w.rotation.z=Math.PI/2;w.position.set(x,.02,z);w.castShadow=true;car.add(w);
 }
}
function spawnTraffic(){
 const lanes=[-4.6,0,4.6],x=lanes[Math.floor(Math.random()*3)];
 const colors=[0x1769aa,0xffb000,0x7b36c9,0xeeeeee,0x1c9b64];
 const o=new THREE.Group();o.position.set(x,.65,-150-Math.random()*70);
 cube(2.0,.9,3.2,colors[Math.floor(Math.random()*colors.length)],0,0,0,o);
 const glass=mat(0x17232a,.2,.55);const c=new THREE.Mesh(new THREE.BoxGeometry(1.55,.55,1.45),glass);
 c.position.set(0,.62,-.2);c.castShadow=true;o.add(c);scene.add(o);traffic.push(o);
}
function removeTraffic(i){scene.remove(traffic[i]);traffic.splice(i,1)}
function reset(){
 traffic.forEach(x=>scene.remove(x));traffic.length=0;
 speed=0;score=0;nitro=0;spawnTimer=.7;shake=0;car.position.x=0;
}
function start(){reset();started=true;document.querySelector("#menu").classList.add("hidden");document.querySelector("#gameover").classList.add("hidden");ensureAudio();toast("GO!")}
function crash(){
 if(!started)return;started=false;shake=.5;beep(70,.3,"sawtooth");
 const s=Math.floor(score);if(s>best){best=s;localStorage.setItem(bestKey,best);document.querySelector("#best").textContent=best}
 document.querySelector("#finalScore").textContent=s;
 document.querySelector("#gameover").classList.remove("hidden");
}
function toast(t){const e=document.querySelector("#toast");e.textContent=t;e.style.opacity=1;setTimeout(()=>e.style.opacity=0,700)}
let audioCtx,gain,engineOsc;
function ensureAudio(){
 if(audioCtx)return;
 audioCtx=new (window.AudioContext||window.webkitAudioContext)();
 gain=audioCtx.createGain();gain.gain.value=.035;gain.connect(audioCtx.destination);
 engineOsc=audioCtx.createOscillator();engineOsc.type="sawtooth";engineOsc.frequency.value=70;engineOsc.connect(gain);engineOsc.start();
}
function beep(freq,dur,type="sine"){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.12,audioCtx.currentTime+.02);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}
function animate(now=performance.now()){
 requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;
 if(started){
   const target=keys.up?1.15:keys.down?-.15:.58;
   speed+=(target-speed)*dt*1.35;
   if(nitro>0){speed+=dt*1.8;nitro-=dt}
   speed=Math.max(0,Math.min(1.85,speed));
   const steer=7*(.45+speed);
   if(keys.left)car.position.x-=steer*dt;
   if(keys.right)car.position.x+=steer*dt;
   car.position.x=Math.max(-5.5,Math.min(5.5,car.position.x));
   car.rotation.z+=(keys.left?-0.13:keys.right?0.13:0-car.rotation.z)*dt*8;
   const dz=(72+speed*92)*dt;
   road.position.z+=dz;if(road.position.z>90)road.position.z=-120;
   traffic.forEach(o=>o.position.z+=dz);
   spawnTimer-=dt;
   if(spawnTimer<=0){spawnTraffic();spawnTimer=.75+Math.random()*1.2/(.75+speed)}
   for(let i=traffic.length-1;i>=0;i--){
     const o=traffic[i];
     if(o.position.z>16){removeTraffic(i);score+=12}
     else if(Math.abs(o.position.x-car.position.x)<1.75&&Math.abs(o.position.z-car.position.z)<2.55)crash();
   }
   score+=speed*dt*5;
   if(audioCtx)engineOsc.frequency.setTargetAtTime(65+speed*90,audioCtx.currentTime,.05);
   camera.position.x+=(car.position.x*.28-camera.position.x)*dt*5;
   camera.position.y=5.2+(Math.random()-.5)*shake;
   camera.position.z=9+(Math.random()-.5)*shake;
   camera.lookAt(car.position.x*.12,1,-30);
   shake=Math.max(0,shake-dt);
   document.querySelector("#speed").textContent=Math.round(speed*105);
   document.querySelector("#score").textContent=Math.floor(score);
 }
 renderer.render(scene,camera);
}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
addEventListener("resize",resize);
function bindHold(id,key){
 const e=document.querySelector(id);
 e.addEventListener("pointerdown",ev=>{ev.preventDefault();keys[key]=true});
 ["pointerup","pointercancel","pointerleave"].forEach(t=>e.addEventListener(t,()=>keys[key]=false));
}
bindHold("#leftBtn","left");bindHold("#rightBtn","right");
document.querySelector("#nitroBtn").addEventListener("pointerdown",()=>{if(started){nitro=2;beep(880,.12,"square");toast("NITRO!")}});

addEventListener("keydown",e=>{
 const k=e.key.toLowerCase();
 if(k==="a"||e.key==="ArrowLeft")keys.left=true;
 if(k==="d"||e.key==="ArrowRight")keys.right=true;
 if(k==="w"||e.key==="ArrowUp")keys.up=true;
 if(k==="s"||e.key==="ArrowDown")keys.down=true;
 if(k===" "&&started){nitro=2;beep(880,.12,"square")}
});
addEventListener("keyup",e=>{
 const k=e.key.toLowerCase();
 if(k==="a"||e.key==="ArrowLeft")keys.left=false;
 if(k==="d"||e.key==="ArrowRight")keys.right=false;
 if(k==="w"||e.key==="ArrowUp")keys.up=false;
 if(k==="s"||e.key==="ArrowDown")keys.down=false;
});
document.querySelector("#startBtn").onclick=start;
document.querySelector("#againBtn").onclick=start;
init();
