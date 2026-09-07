(()=>{
'use strict';
const $=id=>document.getElementById(id), SAVE='srV10Save', LEGACY_SAVE='srV9Save';
const SUPABASE_URL='https://embhistfirdolaqdtcaj.supabase.co';
const SUPABASE_KEY='sb_publishable_HwiaYkm3e4z4sye0Xu1F_A_fHqUGQ_G';

let scene,camera,renderer,player,road,clock,sun,moon,engine,ctx,worldGroup;
let scenery=[],traffic=[],coins3=[],rain=[],particles=[];
let active=false,paused=false,counting=false,countTimer=null,submitted=false;
let speed=0,score=0,nitro=100,lap=1,distance=0,time=0,nearMiss=0,nearCooldown=0,driftTime=0,shake=0,lastScore=0,damage=0,rpm=1000,gear=1,wetGrip=1,photoMode=false,replayData=[],replayPlaying=false,replayIndex=0,dayClock=0,fuel=100,engineTemp=70,tireHeat=30,tireWear=0,roadEvent='NONE',roadEventTimer=0,eventCooldown=0,ghost=null,ghostIndex=0,gamepadIndex=null,installPrompt=null,roomChannel=null,roomCode='',raceSeed=0,checkpointCount=0,slipstream=0,cameraMode=0,manualGear=false,autoSaveTimer=0,careerStage=0,ghostVisible=false,surface='ASPHALT',pitCooldown=0;

const key={l:0,r:0,b:0,n:0,d:0};
const lanes=[-4.2,0,4.2];

const maps=[
{name:'COAST HIGHWAY',sky:0x8fc9e8,ground:0x284f37,road:0x252b31,fog:0x8fc9e8,accent:0x5f9871},
{name:'NEON CITY',sky:0x090e20,ground:0x111722,road:0x1d2229,fog:0x090e20,accent:0x5962b9},
{name:'MOUNTAIN PASS',sky:0x78919d,ground:0x31483d,road:0x2a2d30,fog:0x78919d,accent:0x66776d}
];

const weathers=['CLEAR','NIGHT','RAIN'];

const carsDef=[
{name:'PHANTOM',price:0,color:0x2c7bd1,acc:1,handling:1,nitro:1,top:1},
{name:'VOLT',price:350,color:0xd54449,acc:1.15,handling:1.06,nitro:1.05,top:1.08},
{name:'APEX',price:900,color:0x9655d0,acc:1.08,handling:1.22,nitro:1.22,top:1.15},
{name:'TORQUE',price:1600,color:0x3f9860,acc:1.3,handling:.98,nitro:1.16,top:1.2},
{name:'NOVA',price:2800,color:0xd28c32,acc:1.38,handling:1.16,nitro:1.3,top:1.28},
{name:'ECLIPSE',price:4200,color:0x20242b,acc:1.22,handling:1.34,nitro:1.4,top:1.34},
{name:'RAPTOR',price:5200,color:0x5b5f64,acc:1.48,handling:1.05,nitro:1.18,top:1.42},
{name:'ZENITH',price:6800,color:0x36a7a0,acc:1.32,handling:1.42,nitro:1.38,top:1.38},
{name:'VIPER',price:8500,color:0xa83d6c,acc:1.52,handling:1.18,nitro:1.5,top:1.48},
{name:'TITAN',price:10500,color:0x7b6b52,acc:1.42,handling:.92,nitro:1.25,top:1.45},
{name:'STRATOS',price:12500,color:0x2f8bd1,acc:1.58,handling:1.3,nitro:1.48,top:1.55},
{name:'FURY',price:14500,color:0xc64a2f,acc:1.7,handling:1.08,nitro:1.55,top:1.62},
{name:'SPECTER',price:17000,color:0x30333a,acc:1.62,handling:1.5,nitro:1.62,top:1.68},
{name:'APOLLO',price:19500,color:0xf0c34a,acc:1.76,handling:1.34,nitro:1.7,top:1.72},
{name:'DRIFT-X',price:22000,color:0x8b45c5,acc:1.45,handling:1.78,nitro:1.58,top:1.6},
{name:'BOLT',price:25000,color:0x39b9b0,acc:1.82,handling:1.28,nitro:1.75,top:1.8},
{name:'MONARCH',price:29000,color:0x6c7180,acc:1.7,handling:1.58,nitro:1.78,top:1.78},
{name:'HAVOC',price:33000,color:0xa73a50,acc:1.9,handling:1.18,nitro:1.82,top:1.86},
{name:'AURORA',price:38000,color:0x89b8c8,acc:1.84,handling:1.66,nitro:1.88,top:1.9}
];

const missions=[
['Drive for 60 seconds',60,'time',250],
['Get 10 near misses',10,'near',350],
['Score 5,000 points',5000,'score',500],
['Drift for 15 seconds',15,'drift',650],
['Reach 2,500 score in one run',2500,'score2',800],
['Finish 3 races',3,'races',900],
['Collect 25 coins',25,'coins',700]
];

let save=load(),selected=save.car,mapId=save.map,weather=save.weather,quality=save.quality,mode='QUICK RACE',gyroOn=!!save.settings?.gyro,steerX=0;

function defaults(){
return {
coins:500,best:0,car:0,map:0,weather:0,quality:3,owned:[0],
missions:[0,0,0,0,0,0,0],
claimed:[false,false,false,false,false,false,false],
plays:0,username:'Racer',xp:0,level:1,streak:0,lastDaily:'',
totalDistance:0,races:0,wins:0,crashes:0,nearTotal:0,driftTotal:0,
custom:{paint:0,wheels:0,spoiler:0,engine:0},
settings:{abs:true,tc:true,gyro:false,vibration:true,volume:1,fps:60,battery:false,autoGraphics:false},
friends:[],damage:0,gear:1,career:0,achievements:[],dailySeed:'',
dailyTarget:1800,replay:[],multiplayer:{room:'',connected:false},
season:{points:0,tier:1},tire:'SPORTS',fuel:100,
stats:{distance:0,slipstream:0,events:0,coinsCollected:0},
controlLayout:'default',coinsCollected:0,cloudEnabled:false,
manualGear:false,cameraMode:0,careerStage:0,tireWear:0,controls:'classic'
}
}

function load(){
try{
let raw=localStorage.getItem(SAVE),migrated=false;
if(!raw){raw=localStorage.getItem(LEGACY_SAVE);migrated=!!raw}
const o=raw?JSON.parse(raw):{},d=defaults(),x=Object.assign(d,o);
x.custom=Object.assign(d.custom,o.custom||{});
x.settings=Object.assign(d.settings,o.settings||{});
x.stats=Object.assign(d.stats,o.stats||{});
x.season=Object.assign(d.season,o.season||{});
x.multiplayer=Object.assign(d.multiplayer,o.multiplayer||{});
if(!Array.isArray(x.owned)||!x.owned.includes(0))x.owned=[0];
x.missions=Array.isArray(x.missions)?x.missions.slice(0,7):d.missions;
x.claimed=Array.isArray(x.claimed)?x.claimed.slice(0,7):d.claimed;
while(x.missions.length<7)x.missions.push(0);
while(x.claimed.length<7)x.claimed.push(false);
x.settings=Object.assign(d.settings,x.settings||{});
x.tire=x.tire||'SPORTS';
x.cameraMode=Number.isFinite(x.cameraMode)?x.cameraMode:0;
x.manualGear=!!x.manualGear;
x.careerStage=Number.isFinite(x.careerStage)?x.careerStage:0;
if(migrated)localStorage.setItem(SAVE,JSON.stringify(x));
return x
}catch(e){return defaults()}
}

function persist(){
localStorage.setItem(SAVE,JSON.stringify(save));
updateTop()
}

function updateTop(){
if($('coins'))$('coins').textContent=Math.floor(save.coins).toLocaleString();
if($('best'))$('best').textContent=Math.floor(save.best).toLocaleString()
}

function mat(c,r=.55,m=.12){
return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m})
}

function add(g,p,parent=scene){
const x=new THREE.Mesh(g,p);
x.castShadow=true;
x.receiveShadow=true;
parent.add(x);
return x
}

function box(w,h,d,c,pos,parent=scene){
const x=add(new THREE.BoxGeometry(w,h,d),mat(c),parent);
x.position.set(...pos);
return x
}

function init(){
scene=new THREE.Scene();
worldGroup=new THREE.Group();
scene.add(worldGroup);

camera=new THREE.PerspectiveCamera(
62,innerWidth/innerHeight,.1,900
);

renderer=new THREE.WebGLRenderer({
antialias:quality>=2,
powerPreference:'high-performance'
});

applyQuality();
$('game').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(
0xdff5ff,0x253629,1.25
));

sun=new THREE.DirectionalLight(0xffefd0,2.4);
sun.position.set(-55,95,45);
sun.castShadow=true;
scene.add(sun);

moon=new THREE.DirectionalLight(0x7696ff,.2);
moon.position.set(35,70,-40);
scene.add(moon);

makeWorld();
makePlayer();
spawnTraffic();
bind();

clock=new THREE.Clock();
dailyCheck();
updateTop();
updateQualityLabel();
requestAnimationFrame(loop)
}

function applyQuality(){
const ratio=
quality===0?.8:
quality===1?1:
quality===2?Math.min(devicePixelRatio,1.5):
Math.min(devicePixelRatio,2);

renderer.setPixelRatio(ratio);
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=quality>=1;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;

if(sun)
sun.shadow.mapSize.set(
quality>=3?2048:quality>=2?1024:512,
quality>=3?2048:quality>=2?1024:512
)
}

function clearWorld(){
scenery.forEach(o=>worldGroup.remove(o));
scenery=[];

coins3.forEach(o=>worldGroup.remove(o));
coins3=[];

rain.forEach(o=>worldGroup.remove(o));
rain=[];

particles.forEach(o=>worldGroup.remove(o));
particles=[];

if(road)worldGroup.remove(road)
}

function makeWorld(){
clearWorld();

const m=maps[mapId];

scene.background.set(m.sky);
scene.fog=new THREE.Fog(m.fog,50,330);

box(650,.1,1200,m.ground,[0,-.1,-350],worldGroup);
road=box(14,.14,1200,m.road,[0,0,-350],worldGroup);

for(let z=0;z>-1140;z-=8){
box(.12,.025,3.2,0xd9d8c7,[-2.25,.08,z],worldGroup);
box(.12,.025,3.2,0xd9d8c7,[2.25,.08,z],worldGroup)
}

for(const x of[-7.15,7.15]){
box(.16,.55,1140,0x777d80,[x,.3,-350],worldGroup);

for(let z=0;z>-1140;z-=12)
box(.22,.8,.12,0xbfc4c5,[x,.7,z],worldGroup)
}

for(let i=0;i<150;i++){
const z=-18-i*7.5-Math.random()*12;
const side=Math.random()<.5?-1:1;
const x=side*(11+Math.random()*42);

if(mapId===1&&i%3!==1)
building(x,z);
else if(i%7===0)
building(x,z);
else
tree(x,z,.65+Math.random()*1.15);

if(i%9===0)lamp(side*7,z);
if(i%13===0)sign(side*9,z)
}

for(let i=0;i<34;i++){
const mountain=add(
new THREE.ConeGeometry(
16+Math.random()*24,
45+Math.random()*65,
8
),
mat(mapId===2?0x43595b:0x506e70),
worldGroup
);

mountain.position.set(
(i%2?1:-1)*(32+Math.random()*62),
25,
-90-i*38
);

scenery.push(mountain)
}

for(let i=0;i<35;i++){
const c=add(
new THREE.TorusGeometry(.18,.055,8,16),
mat(0xffcc36,.25,.8),
worldGroup
);

c.position.set(
lanes[i%3],
.28,
-35-i*28
);

coins3.push(c)
}

for(let i=0;i<18;i++)
cloud(
(i%3-1)*55+Math.random()*20,
-100-i*65,
1+Math.random()*1.8
);

if(weather===2)makeRain();
applyWeather()
}

function tree(x,z,s){
const g=new THREE.Group();
g.position.set(x,0,z);

box(.45*s,2.2*s,.45*s,0x68482d,[0,s,0],g);

const t=add(
new THREE.ConeGeometry(1.8*s,4.6*s,9),
mat(0x255d36),
g
);

t.position.y=3*s;

const t2=add(
new THREE.ConeGeometry(1.35*s,3.2*s,9),
mat(0x347146),
g
);

t2.position.y=4.8*s;

scenery.push(g)
}

function building(x,z){
const g=new THREE.Group();
g.position.set(x,0,z);

const h=8+Math.random()*18;
const w=4+Math.random()*5;

box(
w,h,6+Math.random()*4,
mapId===1?0x242c3a:0x555f66,
[0,h/2,0],
g
);

for(let y=2;y<h-1;y+=2)
for(let xx=-w/2+1;xx<w/2;xx+=2)
box(
.8,.8,.07,
mapId===1?0x78bfff:0x90b7c3,
[xx,y,-3.05],
g
);

scenery.push(g)
}

function lamp(x,z){
const g=new THREE.Group();
g.position.set(x,0,z);

box(.12,5,.12,0x20262a,[0,2.5,0],g);

box(
1.3,.1,.1,
0x20262a,
[x<0?.62:-.62,5,0],
g
);

box(
.42,.18,.34,
weather!==0||mapId===1?0x9fd8ff:0xffefad,
[x<0?
