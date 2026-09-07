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
{name:'MOUNTAIN PASS',sky:0x78919d,ground:0x31483d,road:0x2a2d30,fog:0x78919d,accent:0x66776d}];
const weathers=['CLEAR','NIGHT','RAIN'];
const carsDef=[
{name:'PHANTOM',price:0,color:0x2c7bd1,acc:1,handling:1,nitro:1,top:1},
{name:'VOLT',price:350,color:0xd54449,acc:1.15,handling:1.06,nitro:1.05,top:1.08},
{name:'APEX',price:900,color:0x9655d0,acc:1.08,handling:1.22,nitro:1.22,top:1.15},
{name:'TORQUE',price:1600,color:0x3f9860,acc:1.3,handling:.98,nitro:1.16,top:1.2},
{name:'NOVA',price:2800,color:0xd28c32,acc:1.38,handling:1.16,nitro:1.3,top:1.28},{name:'ECLIPSE',price:4200,color:0x20242b,acc:1.22,handling:1.34,nitro:1.4,top:1.34},{name:'RAPTOR',price:5200,color:0x5b5f64,acc:1.48,handling:1.05,nitro:1.18,top:1.42},{name:'ZENITH',price:6800,color:0x36a7a0,acc:1.32,handling:1.42,nitro:1.38,top:1.38},{name:'VIPER',price:8500,color:0xa83d6c,acc:1.52,handling:1.18,nitro:1.5,top:1.48},{name:'TITAN',price:10500,color:0x7b6b52,acc:1.42,handling:.92,nitro:1.25,top:1.45},{name:'STRATOS',price:12500,color:0x2f8bd1,acc:1.58,handling:1.3,nitro:1.48,top:1.55},{name:'FURY',price:14500,color:0xc64a2f,acc:1.7,handling:1.08,nitro:1.55,top:1.62},{name:'SPECTER',price:17000,color:0x30333a,acc:1.62,handling:1.5,nitro:1.62,top:1.68},{name:'APOLLO',price:19500,color:0xf0c34a,acc:1.76,handling:1.34,nitro:1.7,top:1.72},{name:'DRIFT-X',price:22000,color:0x8b45c5,acc:1.45,handling:1.78,nitro:1.58,top:1.6},{name:'BOLT',price:25000,color:0x39b9b0,acc:1.82,handling:1.28,nitro:1.75,top:1.8},{name:'MONARCH',price:29000,color:0x6c7180,acc:1.7,handling:1.58,nitro:1.78,top:1.78},{name:'HAVOC',price:33000,color:0xa73a50,acc:1.9,handling:1.18,nitro:1.82,top:1.86},{name:'AURORA',price:38000,color:0x89b8c8,acc:1.84,handling:1.66,nitro:1.88,top:1.9}];
const missions=[['Drive for 60 seconds',60,'time',250],['Get 10 near misses',10,'near',350],['Score 5,000 points',5000,'score',500],['Drift for 15 seconds',15,'drift',650],['Reach 2,500 score in one run',2500,'score2',800],['Finish 3 races',3,'races',900],['Collect 25 coins',25,'coins',700]];
let save=load(),selected=save.car,mapId=save.map,weather=save.weather,quality=save.quality,mode='QUICK RACE',gyroOn=!!save.settings?.gyro,steerX=0,steerValue=0,steerTarget=0;

function defaults(){return {coins:500,best:0,car:0,map:0,weather:0,quality:3,owned:[0],missions:[0,0,0,0,0,0,0],claimed:[false,false,false,false,false,false,false],plays:0,username:'Racer',xp:0,level:1,streak:0,lastDaily:'',totalDistance:0,races:0,wins:0,crashes:0,nearTotal:0,driftTotal:0,custom:{paint:0,wheels:0,spoiler:0,engine:0},settings:{abs:true,tc:true,gyro:false,vibration:true,volume:1,fps:60,battery:false,autoGraphics:false,steering:1},friends:[],damage:0,gear:1,career:0,achievements:[],dailySeed:'',dailyTarget:1800,replay:[],multiplayer:{room:'',connected:false},season:{points:0,tier:1},tire:'SPORTS',fuel:100,stats:{distance:0,slipstream:0,events:0,coinsCollected:0},controlLayout:'default',coinsCollected:0,cloudEnabled:false,manualGear:false,cameraMode:0,careerStage:0,tireWear:0,controls:'classic'}}

function load(){try{let raw=localStorage.getItem(SAVE);let migrated=false;if(!raw){raw=localStorage.getItem(LEGACY_SAVE);migrated=!!raw}const o=raw?JSON.parse(raw):{};const d=defaults();const x=Object.assign(d,o);x.custom=Object.assign(d.custom,o.custom||{});x.settings=Object.assign(d.settings,o.settings||{});x.stats=Object.assign(d.stats,o.stats||{});x.season=Object.assign(d.season,o.season||{});x.multiplayer=Object.assign(d.multiplayer,o.multiplayer||{});if(!Array.isArray(x.owned)||!x.owned.includes(0))x.owned=[0];x.missions=Array.isArray(x.missions)?x.missions.slice(0,7):d.missions;x.claimed=Array.isArray(x.claimed)?x.claimed.slice(0,7):d.claimed;while(x.missions.length<7)x.missions.push(0);while(x.claimed.length<7)x.claimed.push(false);x.settings=Object.assign(d.settings,x.settings||{});x.tire=x.tire||'SPORTS';x.cameraMode=Number.isFinite(x.cameraMode)?x.cameraMode:0;x.manualGear=!!x.manualGear;x.careerStage=Number.isFinite(x.careerStage)?x.careerStage:0;if(migrated)localStorage.setItem(SAVE,JSON.stringify(x));return x}catch(e){return defaults()}}

function persist(){localStorage.setItem(SAVE,JSON.stringify(save));updateTop()}

function updateTop(){if($('coins'))$('coins').textContent=Math.floor(save.coins).toLocaleString();if($('best'))$('best').textContent=Math.floor(save.best).toLocaleString()}

function mat(c,r=.55,m=.12){return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m})}

function add(g,p,parent=scene){const x=new THREE.Mesh(g,p);x.castShadow=true;x.receiveShadow=true;parent.add(x);return x}

function box(w,h,d,c,pos,parent=scene){const x=add(new THREE.BoxGeometry(w,h,d),mat(c),parent);x.position.set(...pos);return x}

function init(){scene=new THREE.Scene();worldGroup=new THREE.Group();scene.add(worldGroup);camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,900);renderer=new THREE.WebGLRenderer({antialias:quality>=2,powerPreference:'high-performance'});applyQuality();$('game').appendChild(renderer.domElement);scene.add(new THREE.HemisphereLight(0xdff5ff,0x253629,1.25));sun=new THREE.DirectionalLight(0xffefd0,2.4);sun.position.set(-55,95,45);sun.castShadow=true;scene.add(sun);moon=new THREE.DirectionalLight(0x7696ff,.2);moon.position.set(35,70,-40);scene.add(moon);makeWorld();makePlayer();spawnTraffic();bind();clock=new THREE.Clock();dailyCheck();updateTop();updateQualityLabel();requestAnimationFrame(loop)}

function applyQuality(){const ratio=quality===0?.8:quality===1?1:quality===2?Math.min(devicePixelRatio,1.5):Math.min(devicePixelRatio,2);renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=quality>=1;renderer.shadowMap.type=THREE.PCFSoftShadowMap;if(sun)sun.shadow.mapSize.set(quality>=3?2048:quality>=2?1024:512,quality>=3?2048:quality>=2?1024:512)}

function clearWorld(){scenery.forEach(o=>worldGroup.remove(o));scenery=[];coins3.forEach(o=>worldGroup.remove(o));coins3=[];rain.forEach(o=>worldGroup.remove(o));rain=[];particles.forEach(o=>worldGroup.remove(o));particles=[];if(road)worldGroup.remove(road)}

function makeWorld(){clearWorld();const m=maps[mapId];scene.background.set(m.sky);scene.fog=new THREE.Fog(m.fog,50,330);box(650,.1,1200,m.ground,[0,-.1,-350],worldGroup);road=box(14,.14,1200,m.road,[0,0,-350],worldGroup);
for(let z=0;z>-1140;z-=8){box(.12,.025,3.2,0xd9d8c7,[-2.25,.08,z],worldGroup);box(.12,.025,3.2,0xd9d8c7,[2.25,.08,z],worldGroup)}
for(const x of[-7.15,7.15]){box(.16,.55,1140,0x777d80,[x,.3,-350],worldGroup);for(let z=0;z>-1140;z-=12){box(.22,.8,.12,0xbfc4c5,[x,0.7,z],worldGroup)}}
for(let i=0;i<150;i++){const z=-18-i*7.5-Math.random()*12,side=Math.random()<.5?-1:1,x=side*(11+Math.random()*42);if(mapId===1&&i%3!==1)building(x,z);else if(i%7===0)building(x,z);else tree(x,z,.65+Math.random()*1.15);if(i%9===0)lamp(side*7,z);if(i%13===0)sign(side*9,z)}
for(let i=0;i<34;i++){const mountain=add(new THREE.ConeGeometry(16+Math.random()*24,45+Math.random()*65,8),mat(mapId===2?0x43595b:0x506e70),worldGroup);mountain.position.set((i%2?1:-1)*(32+Math.random()*62),25,-90-i*38);scenery.push(mountain)}
for(let i=0;i<35;i++){const c=add(new THREE.TorusGeometry(.18,.055,8,16),mat(0xffcc36,.25,.8),worldGroup);c.position.set(lanes[i%3],.28,-35-i*28);coins3.push(c)}
for(let i=0;i<18;i++)cloud((i%3-1)*55+Math.random()*20,-100-i*65,1+Math.random()*1.8);if(weather===2)makeRain();applyWeather()}
function tree(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);box(.45*s,2.2*s,.45*s,0x68482d,[0,s,0],g);const t=add(new THREE.ConeGeometry(1.8*s,4.6*s,9),mat(0x255d36),g);t.position.y=3*s;const t2=add(new THREE.ConeGeometry(1.35*s,3.2*s,9),mat(0x347146),g);t2.position.y=4.8*s;scenery.push(g)}
function building(x,z){const g=new THREE.Group();g.position.set(x,0,z);const h=8+Math.random()*18,w=4+Math.random()*5;box(w,h,6+Math.random()*4,mapId===1?0x242c3a:0x555f66,[0,h/2,0],g);for(let y=2;y<h-1;y+=2)for(let xx=-w/2+1;xx<w/2;xx+=2)box(.8,.8,.07,mapId===1?0x78bfff:0x90b7c3,[xx,y,-3.05],g);scenery.push(g)}
function lamp(x,z){const g=new THREE.Group();g.position.set(x,0,z);box(.12,5,.12,0x20262a,[0,2.5,0],g);box(1.3,.1,.1,0x20262a,[x<0?.62:-.62,5,0],g);box(.42,.18,.34,weather!==0||mapId===1?0x9fd8ff:0xffefad,[x<0?1.12:-1.12,4.82,0],g);scenery.push(g)}
function sign(x,z){const g=new THREE.Group();g.position.set(x,0,z);box(.12,2.4,.12,0x60656a,[0,1.2,0],g);box(1.8,1.05,.1,mapId===1?0x343c50:0x41524a,[0,2.4,0],g);scenery.push(g)}
function cloud(x,z,s){const g=new THREE.Group();g.position.set(x,28+Math.random()*15,z);for(let i=0;i<4;i++){const c=add(new THREE.SphereGeometry((1.8+Math.random()*1.4)*s,12,10),new THREE.MeshStandardMaterial({color:0xffffff,roughness:1}),g);c.position.x=(i-1.5)*2*s;c.position.y=Math.random()*1.2*s}scenery.push(g)}
function coupe(color,parent){box(2.45,.55,4.35,color,[0,.32,0],parent);box(2.18,.18,2.2,0x10161e,[0,.75,.05],parent);box(1.65,.34,1.72,0x7591a0,[0,.98,.05],parent);box(1.0,.1,.08,0xeaf7ff,[0,.44,-2.2],parent);for(const x of[-.7,.7]){box(.46,.15,.08,0xffffff,[x,.48,-2.19],parent);box(.48,.13,.08,0xff2937,[x,.45,2.2],parent)}for(const x of[-1.25,1.25])for(const z of[-1.4,1.4]){const w=add(new THREE.CylinderGeometry(.38,.38,.28,24),mat(0x0b0e12,.4,.1),parent);w.rotation.z=Math.PI/2;w.position.set(x,.06,z)}}
function makePlayer(){if(player)worldGroup.remove(player);player=new THREE.Group();player.position.set(0,.56,5);worldGroup.add(player);coupe(carsDef[selected].color,player);box(1.95,.1,.36,0x0d1218,[0,.74,1.95],player);player.userData.wheels=[];player.userData.spoiler=makeSpoiler(player,!!save.custom?.spoiler);player.userData.flame=boostFlame(player);player.userData.damage=damage}
function makeSpoiler(parent,on){const g=new THREE.Group();g.visible=on;box(1.7,.12,.25,0x171a20,[0,.95,1.9],g);box(.12,.45,.12,0x171a20,[-.7,.78,1.88],g);box(.12,.45,.12,0x171a20,[.7,.78,1.88],g);parent.add(g);return g}
function boostFlame(parent){const g=new THREE.Group();const f=add(new THREE.ConeGeometry(.22,.9,12),mat(0xffa52b,.35,.05),g);f.rotation.x=-Math.PI/2;f.position.z=2.55;g.visible=false;parent.add(g);return g}
function spawnTraffic(){traffic.forEach(c=>worldGroup.remove(c));traffic=[];for(let i=0;i<(quality>=2?24:16);i++)makeTraffic(i)}
function makeTraffic(i){const g=new THREE.Group();g.position.set(lanes[i%3],.56,-55-i*37-Math.random()*70);coupe([0xb33a3d,0xd8d8d5,0x3f6597,0x9b772e,0x454a50,0x8a4d87][i%6],g);g.scale.set(.87,.87,.87);g.userData.relative=.48+Math.random()*.48;g.userData.near=false;g.userData.lane=i%3;g.userData.hitCooldown=0;worldGroup.add(g);traffic.push(g)}
function makeRain(){const n=quality>=3?1200:quality>=2?750:420,geo=new THREE.BufferGeometry(),a=[];for(let i=0;i<n;i++)a.push((Math.random()-.5)*190,Math.random()*80,Math.random()*-500);geo.setAttribute('position',new THREE.Float32BufferAttribute(a,3));const p=new THREE.Points(geo,new THREE.PointsMaterial({color:0xbddcff,size:quality>=2?.11:.08,transparent:true,opacity:.62}));worldGroup.add(p);rain.push(p)}
function applyWeather(){const night=weather===1;wetGrip=weather===2?.82:1;if(road)road.material.roughness=weather===2?.24:.62;if(road)road.material.metalness=weather===2?.38:.08;scene.background.set(night?(mapId===1?0x050817:0x10182a):maps[mapId].sky);scene.fog.color.set(night?(mapId===1?0x050817:0x10182a):maps[mapId].fog);sun.intensity=night?.35:2.4;moon.intensity=night?1.0:.18;sun.color.set(night?0x7897ff:0xffefd0);if(player)player.userData.flame.visible=false}
function reset(){damage=0;rpm=1000;gear=1;dayClock=0;fuel=100;engineTemp=70;tireHeat=30;tireWear=0;roadEvent='NONE';roadEventTimer=0;eventCooldown=2;checkpointCount=0;slipstream=0;save.coinsCollected=0;raceSeed=Math.floor(Math.random()*1e9);replayData=[];replayPlaying=false;replayIndex=0;speed=0;score=0;nitro=100;lap=1;distance=0;time=0;nearMiss=0;steerValue=0;steerTarget=0;nearCooldown=0;driftTime=0;shake=0;submitted=false;lastScore=0;player.position.set(0,.56,5);key.l=key.r=key.b=key.n=key.d=0;makeWorld();makePlayer();spawnTraffic();createGhost();updateHUD()}
function countdown(){if(counting)return;counting=true;active=false;$('countdown').classList.remove('hidden');const seq=['3','2','1','GO!'];let i=0;const tick=()=>{if(!counting)return;$('countText').textContent=seq[i];$('countText').style.animation='none';void $('countText').offsetWidth;$('countText').style.animation='pop .65s ease';tone(i===3?850:450,.13);i++;if(i<seq.length)countTimer=setTimeout(tick,650);else countTimer=setTimeout(()=>{$('countdown').classList.add('hidden');counting=false;active=true;save.races=(save.races||0)+1;persist();},650)};tick()}
function start(){if(counting||replayPlaying)return;audio();if(mode==='CAREER MODE')careerStage=save.careerStage||0;if(ctx&&ctx.state==='suspended')ctx.resume();reset();paused=false;$('menu').classList.add('hidden');$('result').classList.add('hidden');$('pauseScreen').classList.add('hidden');save.plays++;persist();countdown()}
function finish(crash=false){if(!active&&!counting)return;active=false;counting=false;if(countTimer)clearTimeout(countTimer);$('countdown').classList.add('hidden');const s=Math.floor(score);lastScore=s;save.replay=replayData.slice(-900);save.damage=damage;save.tireWear=Math.max(save.tireWear||0,tireWear);save.totalDistance=(save.totalDistance||0);if(!crash&&mode==='CAREER MODE')save.careerStage=(save.careerStage||0)+1;save.best=Math.max(save.best,s);const reward=Math.max(25,Math.floor(s/45))+(crash?0:150);save.coins+=reward;save.missions[0]=Math.max(save.missions[0],Math.min(60,Math.floor(time)));save.missions[1]=Math.max(save.missions[1],Math.min(10,nearMiss));save.missions[2]=Math.max(save.missions[2],Math.min(5000,s));save.missions[3]=Math.max(save.missions[3],Math.min(15,Math.floor(driftTime)));save.missions[4]=Math.max(save.missions[4],Math.min(2500,s));save.missions[5]=Math.max(save.missions[5],save.races||0);save.missions[6]=Math.max(save.missions[6]||0,Math.min(25,save.coinsCollected||0));save.xp=(save.xp||0)+Math.floor(s/40)+(crash?10:80);save.level=1+Math.floor((save.xp||0)/1000);save.season=save.season||{points:0,tier:1};save.season.points+=(crash?5:Math.max(10,Math.floor(s/100)));save.season.tier=1+Math.floor(save.season.points/500);save.stats=save.stats||{};save.stats.distance=(save.stats.distance||0)+distance;save.stats.slipstream=(save.stats.slipstream||0)+slipstream;if(crash){}else save.wins=(save.wins||0)+1;persist();$('resultTitle').textContent=crash?'CRASH!':'FINISH!';$('resultText').textContent=`Score: ${s.toLocaleString()} • Reward: +${reward} coins • Lap: ${Math.min(lap,3)}/3 • Best: ${save.best.toLocaleString()}`;$('uploadStatus').textContent='';$('submitScore').disabled=false;$('submitScore').textContent='SUBMIT TO LEADERBOARD';$('result').classList.remove('hidden');tone(crash?70:900,.25);if(crash&&navigator.vibrate)navigator.vibrate([80,40,120])}
  function updateOnlineHub(){const box=$('onlineHubList');if(!box)return;const season=save.season||{points:0,tier:1};box.innerHTML=`<div class="option"><span>SEASON</span><b>TIER ${season.tier}</b></div><div class="option"><span>SEASON POINTS</span><b>${season.points}</b></div><div class="option"><span>ROOM</span><b>${roomCode||'NONE'}</b></div><div class="option"><span>FRIENDS</span><b>${(save.friends||[]).length}</b></div><div class="option"><span>GHOST RACING</span><b>${save.replay?.length?'READY':'NO GHOST'}</b></div><div class="option"><span>NETWORK</span><b>${navigator.onLine?'ONLINE':'OFFLINE'}</b></div>`}
function createGhost(){if(!save.replay||!save.replay.length){ghost=null;ghostVisible=false;return}if(ghost)worldGroup.remove(ghost);ghost=new THREE.Group();coupe(carsDef[selected].color,ghost);ghost.scale.set(.9,.9,.9);ghost.visible=false;worldGroup.add(ghost);ghostVisible=true;ghostIndex=0}
function updateGhost(dt){if(!ghost||!ghostVisible||!save.replay?.length)return;const frame=save.replay[ghostIndex];if(!frame){ghost.visible=false;return}ghost.visible=true;ghost.position.set(frame.x,.56,frame.z);ghost.rotation.y=frame.r||0;ghostIndex++;if(ghostIndex>=save.replay.length)ghostIndex=0}
function saveReplayFrame(){if(!active||replayPlaying)return;if(replayData.length>900)replayData.shift();replayData.push({x:Number(player.position.x.toFixed(2)),z:Number(player.position.z.toFixed(2)),r:Number(player.rotation.y.toFixed(3)),s:Number(speed.toFixed(1))})}
function startReplay(){if(!save.replay?.length){toast('NO REPLAY SAVED');return}replayPlaying=true;active=false;replayIndex=0;if(!ghost){createGhost()}if(ghost)ghost.visible=true;toast('REPLAY STARTED')}
function stopReplay(){replayPlaying=false;if(ghost)ghost.visible=false;toast('REPLAY STOPPED')}
function updateReplay(dt){if(!replayPlaying||!save.replay?.length)return;const f=save.replay[replayIndex];if(!f){stopReplay();return}if(ghost){ghost.position.set(f.x,.56,f.z);ghost.rotation.y=f.r||0;ghost.visible=true}replayIndex++;if(replayIndex>=save.replay.length)stopReplay()}
function handleGamepad(){if(gamepadIndex===null)return;const gp=navigator.getGamepads?.()[gamepadIndex];if(!gp)return;const ax=gp.axes?.[0]||0;steerTarget=Math.abs(ax)>.12?ax:0;if(gp.buttons?.[7]?.pressed)key.n=1;else key.n=0;if(gp.buttons?.[0]?.pressed)key.b=1;else key.b=0;if(gp.buttons?.[1]?.pressed)key.d=1;else key.d=0}
function updateTraffic(dt){for(const v of traffic){v.userData.hitCooldown=Math.max(0,(v.userData.hitCooldown||0)-dt);v.position.z+=speed*dt*v.userData.relative;const laneChange=Math.sin((time+v.position.z*.02+iSafe(v.id))*0.7);if(Math.abs(v.position.z-player.position.z)<65&&Math.random()<dt*.08){const next=Math.max(0,Math.min(2,v.userData.lane+(Math.random()<.5?-1:1)));v.userData.lane=next}const target=lanes[v.userData.lane];v.position.x+=(target-v.position.x)*Math.min(1,dt*1.8);if(v.position.z>player.position.z+35){v.position.z=player.position.z-480-Math.random()*180;v.userData.lane=Math.floor(Math.random()*3);v.position.x=lanes[v.userData.lane];v.userData.near=false}if(v.position.z<player.position.z+7&&v.position.z>player.position.z-10&&Math.abs(v.position.x-player.position.x)<2.05){if(v.userData.hitCooldown<=0){damage=Math.min(100,damage+14);speed*=.55;shake=.35;v.userData.hitCooldown=1.2;spark(player.position.x,player.position.z,8);toast('TRAFFIC HIT');if(damage>=100){finish(true);return}}}else if(v.position.z<player.position.z+8&&v.position.z>player.position.z-5&&Math.abs(v.position.x-player.position.x)>2&&Math.abs(v.position.x-player.position.x)<4.8&&!v.userData.near){nearMiss++;save.nearTotal=(save.nearTotal||0)+1;score+=80;v.userData.near=true;toast('NEAR MISS +80');tone(760,.06)}if(v.position.z>player.position.z+12)v.userData.near=false}}
function iSafe(){return 0}
function updateCoins(dt){for(const c of coins3){c.rotation.y+=dt*4;c.rotation.x+=dt*1.5;c.position.y=.3+Math.sin(time*5+c.position.z)*.08;if(c.position.z>player.position.z+8){c.position.z=player.position.z-420-Math.random()*180;c.position.x=lanes[Math.floor(Math.random()*3)]}if(Math.abs(c.position.z-player.position.z)<2.8&&Math.abs(c.position.x-player.position.x)<1.8)collectCoin(c)}}
function updateRain(dt){for(const p of rain){const a=p.geometry.attributes.position.array;for(let i=1;i<a.length;i+=3){a[i]-=55*dt;if(a[i]<0){a[i]=70+Math.random()*15;a[i-1]=(Math.random()-.5)*190;a[i+1]=Math.random()*-500}}p.geometry.attributes.position.needsUpdate=true}}
function updateParticles(dt){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.userData.life-=dt;p.position.addScaledVector(p.userData.v,dt);p.userData.v.y-=4*dt;if(p.userData.life<=0){worldGroup.remove(p);particles.splice(i,1)}}}
function updateRoadEvent(dt){if(eventCooldown>0)eventCooldown-=dt;if(roadEventTimer>0){roadEventTimer-=dt;if(roadEventTimer<=0){roadEvent='NONE';hideEvent()}}if(Math.random()<dt*.025)spawnRoadEvent();if(roadEvent==='SPEED TRAP'&&speed>145)score+=dt*35;if(roadEvent==='CHECKPOINT'&&Math.abs(player.position.z%120)<2){checkpointCount++;score+=250;toast('CHECKPOINT +250')}}
function updateVehicle(dt){const car=carsDef[selected];const steer=(steerValue||0)*car.handling*tireMultiplier();player.position.x+=steer*dt*(4.8+speed*.045);player.position.x=Math.max(-5.3,Math.min(5.3,player.position.x));const accelerating=!key.b;const braking=!!key.b;let target=accelerating?car.top*118:Math.max(0,speed-18);if(key.n&&nitro>0&&fuel>0){target+=42*car.nitro;nitro=Math.max(0,nitro-30*dt);player.userData.flame.visible=true}else{player.userData.flame.visible=false;nitro=Math.min(100,nitro+7*dt)}if(braking)target=Math.max(0,speed-55);const grip=wetGrip*Math.max(.7,1-tireWear*.004);speed+=(target-speed)*dt*(accelerating?.75:1.8)*grip;if(key.d&&speed>35){speed*=1+dt*.035;driftTime+=dt;score+=dt*45;player.rotation.y+=(steerValue||0)*dt*.7} else player.rotation.y+=(0-player.rotation.y)*dt*5;distance+=speed*dt*.018;time+=dt;score+=speed*dt*.12;fuel=Math.max(0,fuel-dt*(.012+speed*.0007));engineTemp+=(speed>100?dt*2.2:-dt*1.1);engineTemp=Math.max(60,Math.min(125,engineTemp));tireHeat+=(speed>85?dt*3:-dt*1.7);tireHeat=Math.max(25,Math.min(110,tireHeat));tireWear=Math.min(100,tireWear+dt*(speed>100?.018:.004));rpm=900+(speed/Math.max(1,car.top*118))*6200;gear=manualGear?gear:Math.max(1,Math.min(6,Math.floor(speed/34)+1));if(engineTemp>115){speed*=.985;toast('ENGINE HOT')}if(fuel<=0){speed=Math.max(0,speed-dt*30);if(speed<2)finish(false)}if(distance>1000){lap++;distance=0;if(lap>3)finish(false)}}
function updateCamera(dt){if(!player)return;let desired=new THREE.Vector3();let target=new THREE.Vector3();if(cameraMode===1){desired.set(0,2.1,4.8);target.set(player.position.x,1,player.position.z-18)}else if(cameraMode===2){desired.set(0,1.25,.15);target.set(player.position.x,1,player.position.z-28)}else{desired.set(0,4.1,10.5);target.set(player.position.x,1,player.position.z-22)}desired.applyMatrix4(player.matrixWorld);camera.position.lerp(desired,Math.min(1,dt*5));target.applyMatrix4(player.matrixWorld);camera.lookAt(target);if(shake>0){camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake;shake=Math.max(0,shake-dt*.9)}}
function updateDayNight(dt){dayClock+=dt*.018;if(weather===0){const phase=(dayClock%1);const night=phase>.72||phase<.12;sun.intensity=night?.45:2.4;moon.intensity=night?1:.15;sun.position.x=Math.cos(phase*Math.PI*2)*70;sun.position.z=Math.sin(phase*Math.PI*2)*50}}
function updateHUD(){if($('speed'))$('speed').textContent=Math.round(speed);if($('score'))$('score').textContent=Math.floor(score).toLocaleString();if($('nitro'))$('nitro').style.width=Math.max(0,nitro)+'%';if($('fuel'))$('fuel').style.width=Math.max(0,fuel)+'%';if($('temp'))$('temp').textContent=Math.round(engineTemp)+'°';if($('tireHeat'))$('tireHeat').textContent=Math.round(tireHeat)+'°';if($('wear'))$('wear').textContent=Math.round(tireWear)+'%';if($('gear'))$('gear').textContent=manualGear?'M'+gear:'D'+gear;if($('lap'))$('lap').textContent=Math.min(lap,3)+'/3';if($('near'))$('near').textContent=nearMiss;if($('surface'))$('surface').textContent=surface;if($('modeLabel'))$('modeLabel').textContent=mode;if($('season'))$('season').textContent=`T${save.season?.tier||1}`;if($('damage'))$('damage').style.width=Math.max(0,100-damage)+'%';updateMinimap()}
  function collectCoin(c){
  if(!c.visible)return;
  c.visible=false;
  save.coins++;
  save.coinsCollected=(save.coinsCollected||0)+1;
  score+=100;
  tone(980,.07);
  if(navigator.vibrate&&save.settings?.vibration)navigator.vibrate(18);
  persist();
}

function spark(x,z,n=7){
  for(let i=0;i<n;i++){
    const p=add(
      new THREE.SphereGeometry(.055,6,6),
      mat(0xffd45a,.3,.4),
      worldGroup
    );
    p.position.set(x+(Math.random()-.5)*1.2,.5,z+(Math.random()-.5)*1.2);
    p.userData.life=.25+Math.random()*.3;
    p.userData.v=new THREE.Vector3(
      (Math.random()-.5)*5,
      1+Math.random()*4,
      (Math.random()-.5)*5
    );
    particles.push(p);
  }
}

function tireMultiplier(){
  let x=1;
  if(save.tire==='SPORTS')x=1;
  if(save.tire==='GRIP')x=1.08;
  if(save.tire==='DRIFT')x=1.12;
  x*=Math.max(.72,1-tireHeat*.0018);
  x*=Math.max(.72,1-tireWear*.0035);
  return x;
}

function spawnRoadEvent(){
  if(roadEvent!=='NONE'||eventCooldown>0)return;
  const events=['CONSTRUCTION','TOLL','ACCIDENT','CHECKPOINT','SPEED TRAP','POLICE'];
  roadEvent=events[Math.floor(Math.random()*events.length)];
  roadEventTimer=12+Math.random()*8;
  eventCooldown=18;
  save.stats=save.stats||{};
  save.stats.events=(save.stats.events||0)+1;
  showEvent(roadEvent);
  tone(520,.1);
}

function showEvent(name){
  const e=$('event');
  if(!e)return;
  e.textContent='⚠ '+name;
  e.classList.remove('hidden');
}

function hideEvent(){
  const e=$('event');
  if(e)e.classList.add('hidden');
}

function toast(t){
  const e=$('toast');
  if(!e)return;
  e.textContent=t;
  e.classList.add('show');
  clearTimeout(e._timer);
  e._timer=setTimeout(()=>e.classList.remove('show'),1400);
}

function audio(){
  try{
    if(!ctx){
      ctx=new (window.AudioContext||window.webkitAudioContext)();
    }
    if(ctx.state==='suspended')ctx.resume();
  }catch(e){}
}

function tone(freq,duration){
  try{
    audio();
    if(!ctx)return;
    const o=ctx.createOscillator();
    const g=ctx.createGain();
    o.frequency.value=freq;
    o.type='sine';
    g.gain.setValueAtTime(.035,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime+duration);
  }catch(e){}
}

function setSteer(v){
  steerTarget=Math.max(-1,Math.min(1,v));
}

function updateSteering(dt){
  const smooth=save.settings?.steering===0?12:
               save.settings?.steering===2?22:17;
  steerValue+=(steerTarget-steerValue)*Math.min(1,dt*smooth);
}

function updateMinimap(){
  const c=$('minimap');
  if(!c||!player)return;
  const x=c.getContext('2d');
  const w=c.width,h=c.height;
  x.clearRect(0,0,w,h);
  x.strokeStyle='rgba(255,255,255,.18)';
  x.lineWidth=7;
  x.beginPath();
  x.moveTo(w/2,0);
  x.lineTo(w/2,h);
  x.stroke();

  x.strokeStyle='rgba(255,220,100,.7)';
  x.lineWidth=2;
  for(let i=0;i<traffic.length;i++){
    const v=traffic[i];
    const dz=v.position.z-player.position.z;
    if(Math.abs(dz)>170)continue;
    const yy=h/2-dz*.9;
    if(yy<4||yy>h-4)continue;
    x.fillStyle='#e85b5b';
    x.beginPath();
    x.arc(w/2+(v.position.x-player.position.x)*8,yy,3,0,Math.PI*2);
    x.fill();
  }

  x.fillStyle='#55d7ff';
  x.beginPath();
  x.arc(w/2,Math.round(h*.72),5,0,Math.PI*2);
  x.fill();
}

function updateSurface(){
  const z=Math.abs(Math.floor(player.position.z));
  if(roadEvent==='CONSTRUCTION'&&z%3===0)surface='GRAVEL';
  else if(weather===2)surface='WET ASPHALT';
  else surface='ASPHALT';
}

function updateProgress(){
  const pct=Math.min(100,Math.floor((distance/1000)*100));
  const p=$('progress');
  if(p)p.style.width=pct+'%';
}

function manualShift(dir){
  if(!manualGear)return;
  gear=Math.max(1,Math.min(6,gear+dir));
  tone(dir>0?720:420,.06);
}

function cycleCamera(){
  cameraMode=(cameraMode+1)%3;
  save.cameraMode=cameraMode;
  persist();
  const names=['CHASE CAMERA','HOOD CAMERA','COCKPIT CAMERA'];
  toast(names[cameraMode]);
}

function togglePhoto(){
  photoMode=!photoMode;
  toast(photoMode?'PHOTO MODE ON':'PHOTO MODE OFF');
  if(photoMode){
    active=false;
    if($('photoHint'))$('photoHint').classList.remove('hidden');
  }else{
    active=true;
    if($('photoHint'))$('photoHint').classList.add('hidden');
  }
}

function repairPit(){
  if(pitCooldown>0)return;
  if(save.coins<100){
    toast('NEED 100 COINS');
    return;
  }
  save.coins-=100;
  damage=0;
  fuel=100;
  engineTemp=70;
  tireHeat=30;
  tireWear=Math.max(0,tireWear-25);
  pitCooldown=3;
  persist();
  toast('PIT SERVICE COMPLETE');
}

function claimMission(i){
  if(!missions[i])return;
  if((save.missions[i]||0)>=missions[i][1]&&!save.claimed[i]){
    save.claimed[i]=true;
    save.coins+=missions[i][3];
    save.xp=(save.xp||0)+missions[i][3];
    persist();
    toast('MISSION COMPLETE +'+missions[i][3]+' COINS');
    updateMenu();
  }
}

function missionProgress(i){
  return Math.min(
    missions[i][1],
    Math.floor(save.missions?.[i]||0)
  );
}

function updateMenu(){
  updateTop();

  if($('playerName'))
    $('playerName').textContent=save.username||'Racer';

  if($('level'))
    $('level').textContent='LV '+(save.level||1);

  if($('xp'))
    $('xp').textContent=(save.xp||0).toLocaleString()+' XP';

  if($('garageCoins'))
    $('garageCoins').textContent=Math.floor(save.coins).toLocaleString();

  const missionBox=$('missions');
  if(missionBox){
    missionBox.innerHTML='';
    missions.forEach((m,i)=>{
      const row=document.createElement('div');
      row.className='mission';
      const value=missionProgress(i);
      const done=value>=m[1];
      row.innerHTML=
        '<span>'+m[0]+'</span>'+
        '<b>'+value+'/'+m[1]+'</b>'+
        (done&&!save.claimed[i]?
          '<button data-mission="'+i+'">CLAIM</button>':
          save.claimed[i]?
          '<small>CLAIMED</small>':'');
      missionBox.appendChild(row);
    });
    missionBox.querySelectorAll('[data-mission]').forEach(b=>{
      b.onclick=()=>claimMission(Number(b.dataset.mission));
    });
  }

  updateOnlineHub();
}

function setMode(m){
  mode=m;
  toast(m);
  updateHUD();
}

function setMap(i){
  mapId=Math.max(0,Math.min(maps.length-1,i));
  save.map=mapId;
  makeWorld();
  persist();
  toast(maps[mapId].name);
}

function setWeather(i){
  weather=Math.max(0,Math.min(2,i));
  save.weather=weather;
  applyWeather();
  persist();
  toast(weathers[weather]);
}

function setQuality(q){
  quality=Math.max(0,Math.min(3,q));
  save.quality=quality;
  if(renderer)applyQuality();
  persist();
  updateQualityLabel();
}

function updateQualityLabel(){
  const e=$('qualityLabel');
  if(e)e.textContent=['LOW','MEDIUM','HIGH','ULTRA'][quality]||'HIGH';
}

function setTire(t){
  save.tire=t;
  persist();
  toast('TIRES: '+t);
}

function setUsername(name){
  name=String(name||'Racer')
    .replace(/[^\w\s-]/g,'')
    .trim()
    .slice(0,20);
  if(!name)name='Racer';
  save.username=name;
  persist();
  toast('NAME SAVED');
}

async function submitScore(){
  const button=$('submitScore');
  const status=$('uploadStatus');
  if(button)button.disabled=true;
  if(status)status.textContent='Uploading...';

  try{
    const username=(save.username||'Racer').trim().slice(0,20);
    const payload={
      Username:username,
      Score:Math.floor(lastScore)
    };

    const res=await fetch(
      SUPABASE_URL+'/rest/v1/leaderboard',
      {
        method:'POST',
        headers:{
          apikey:SUPABASE_KEY,
          Authorization:'Bearer '+SUPABASE_KEY,
          'Content-Type':'application/json',
          Prefer:'return=minimal'
        },
        body:JSON.stringify(payload)
      }
    );

    if(!res.ok)throw new Error('Upload failed');

    if(status)status.textContent='Score submitted successfully!';
    if(button)button.textContent='SUBMITTED ✓';
    tone(1000,.12);
  }catch(e){
    if(status)status.textContent='Could not submit. Check internet/database settings.';
    if(button){
      button.disabled=false;
      button.textContent='TRY AGAIN';
    }
  }
}

async function loadLeaderboard(){
  const box=$('leaderboard');
  if(!box)return;

  box.innerHTML='<div class="loading">Loading leaderboard...</div>';

  try{
    const url=
      SUPABASE_URL+
      '/rest/v1/leaderboard?select=Username,Score,created_at&order=Score.desc&limit=50';

    const res=await fetch(url,{
      headers:{
        apikey:SUPABASE_KEY,
        Authorization:'Bearer '+SUPABASE_KEY
      }
    });

    if(!res.ok)throw new Error('Leaderboard error');

    const rows=await res.json();

    if(!rows.length){
      box.innerHTML='<div class="loading">No scores yet.</div>';
      return;
    }

    box.innerHTML=rows.map((r,i)=>
      `<div class="leader-row">
        <span>#${i+1}</span>
        <b>${escapeHTML(r.Username||'Racer')}</b>
        <strong>${Number(r.Score||0).toLocaleString()}</strong>
      </div>`
    ).join('');
  }catch(e){
    box.innerHTML=
      '<div class="loading">Leaderboard unavailable. Check internet connection.</div>';
  }
}

function escapeHTML(s){
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
    }
