(()=>{
const $=x=>document.getElementById(x);

let scene,camera,renderer,player,road,clock;
let scenery=[],cars=[];

let active=false;
let paused=false;

let speed=0;
let score=0;
let nitro=100;
let lap=1;
let distance=0;
let time=0;
let quality=2;

const key={
  l:0,
  r:0,
  b:0,
  n:0
};

const lanes=[-4.25,0,4.25];

const best=()=>+(localStorage.srV3Best||0);

const mat=(c,r=.8,m=.05)=>
new THREE.MeshStandardMaterial({
  color:c,
  roughness:r,
  metalness:m
});

function add(g,p,parent=scene){
  let x=new THREE.Mesh(g,p);
  x.castShadow=true;
  x.receiveShadow=true;
  parent.add(x);
  return x;
}

function box(w,h,d,c,pos,parent=scene){
  let x=add(
    new THREE.BoxGeometry(w,h,d),
    mat(c),
    parent
  );

  x.position.set(...pos);
  return x;
}

function audio(){

  if(window.ctx)return;

  window.ctx=
    new(window.AudioContext||window.webkitAudioContext)();

  let o=ctx.createOscillator();
  let g=ctx.createGain();

  o.type='sawtooth';
  g.gain.value=.018;

  o.connect(g);
  g.connect(ctx.destination);

  o.start();

  window.engine=o;
}

function tone(f,d){

  if(!window.ctx)return;

  let o=ctx.createOscillator();
  let g=ctx.createGain();

  o.frequency.value=f;

  g.gain.setValueAtTime(
    .001,
    ctx.currentTime
  );

  g.gain.exponentialRampToValueAtTime(
    .09,
    ctx.currentTime+.02
  );

  g.gain.exponentialRampToValueAtTime(
    .001,
    ctx.currentTime+d
  );

  o.connect(g);
  g.connect(ctx.destination);

  o.start();

  o.stop(ctx.currentTime+d);
}

function init(){

  scene=new THREE.Scene();

  scene.background=
    new THREE.Color(0x8eb4c8);

  scene.fog=
    new THREE.Fog(
      0x8eb4c8,
      60,
      290
    );

  camera=
    new THREE.PerspectiveCamera(
      60,
      innerWidth/innerHeight,
      .1,
      600
    );

  renderer=
    new THREE.WebGLRenderer({
      antialias:true,
      powerPreference:'high-performance'
    });

  renderer.setPixelRatio(
    Math.min(devicePixelRatio,1.7)
  );

  renderer.setSize(
    innerWidth,
    innerHeight
  );

  renderer.shadowMap.enabled=true;

  renderer.shadowMap.type=
    THREE.PCFSoftShadowMap;

  $('game').appendChild(
    renderer.domElement
  );

  scene.add(
    new THREE.HemisphereLight(
      0xdff5ff,
      0x40513d,
      1.25
    )
  );

  let sun=
    new THREE.DirectionalLight(
      0xfff0d0,
      2.2
    );

  sun.position.set(
    -50,
    90,
    35
  );

  sun.castShadow=true;

  sun.shadow.mapSize.set(
    1024,
    1024
  );

  scene.add(sun);

  makeWorld();
  makePlayer();

  for(let i=0;i<18;i++){
    makeTraffic(i);
  }

  bind();

  clock=new THREE.Clock();

  requestAnimationFrame(loop);
}

function makeWorld(){

  box(
    600,
    .1,
    1000,
    0x315338,
    [0,-.1,-300]
  );

  road=box(
    14,
    .12,
    1000,
    0x292e34,
    [0,0,-300]
  );

  for(let z=0;z>-980;z-=12){

    box(
      .14,
      .03,
      5,
      0xf5f0cf,
      [-2.25,.08,z]
    );

    box(
      .14,
      .03,
      5,
      0xf5f0cf,
      [2.25,.08,z]
    );
  }

  for(let i=0;i<90;i++){

    let z=
      -15-
      i*10-
      Math.random()*12;

    let side=
      Math.random()<.5?-1:1;

    let x=
      side*
      (10+Math.random()*25);

    if(i%5===0)
      building(x,z);
    else
      tree(
        x,
        z,
        .7+Math.random()*.7
      );

    if(i%8===0)
      lamp(side*7,z);
  }

  for(let i=0;i<18;i++){

    let m=
      add(
        new THREE.ConeGeometry(
          15+Math.random()*18,
          40+Math.random()*28,
          7
        ),
        mat(0x536e70)
      );

    m.position.set(
      (i%2?1:-1)*
      (28+Math.random()*45),
      20,
      -100-i*35
    );

    scenery.push(m);

    scene.add(m);
  }
}

function tree(x,z,s){

  let g=new THREE.Group();

  g.position.set(x,0,z);

  box(
    .35*s,
    2*s,
    .35*s,
    0x65452b,
    [0,s,0],
    g
  );

  let t=
    add(
      new THREE.ConeGeometry(
        1.7*s,
        4*s,
        8
      ),
      mat(0x285a35),
      g
    );

  t.position.y=3*s;

  scene.add(g);

  scenery.push(g);
}

function building(x,z){

  let g=new THREE.Group();

  g.position.set(x,0,z);

  box(
    5,
    8+Math.random()*8,
    6,
    0x56616a,
    [0,4,0],
    g
  );

  for(let y=2;y<12;y+=2){

    for(let x=-1.5;x<2;x+=3){

      box(
        .8,
        .8,
        .08,
        0x91b7c7,
        [x,y,-3.05],
        g
      );
    }
  }

  scene.add(g);

  scenery.push(g);
}

function lamp(x,z){

  let g=new THREE.Group();

  g.position.set(x,0,z);

  box(
    .13,
    4,
    .13,
    0x20252a,
    [0,2,0],
    g
  );

  box(
    1.2,
    .1,
    .1,
    0x20252a,
    [x<0?.55:-.55,4,0],
    g
  );

  box(
    .35,
    .16,
    .3,
    0xffefaa,
    [x<0?1:-1,3.85,0],
    g
  );

  scene.add(g);

  scenery.push(g);
}

function makePlayer(){

  player=new THREE.Group();

  player.position.set(
    0,
    .55,
    5
  );

  scene.add(player);

  /* BODY */

  box(
    2.35,
    .58,
    4.25,
    0x245d86,
    [0,.3,0],
    player
  );

  /* ROOF */

  box(
    2.05,
    .13,
    2.2,
    0x1c2730,
    [0,.72,.1],
    player
  );

  /* GLASS */

  box(
    1.55,
    .28,
    1.7,
    0x7e9dab,
    [0,.94,.1],
    player
  );

  /* FRONT */

  box(
    1.1,
    .08,
    .1,
    0xdcecff,
    [0,.43,-2.16],
    player
  );

  /* HEADLIGHTS */

  box(
    .42,
    .16,
    .08,
    0xffffff,
    [-.68,.48,-2.17],
    player
  );

  box(
    .42,
    .16,
    .08,
    0xffffff,
    [.68,.48,-2.17],
    player
  );

  /* TAIL LIGHTS */

  box(
    .45,
    .13,
    .08,
    0xff2530,
    [-.72,.45,2.17],
    player
  );

  box(
    .45,
    .13,
    .08,
    0xff2530,
    [.72,.45,2.17],
    player
  );

  /* WHEELS */

  for(let x of[-1.2,1.2]){

    for(let z of[-1.35,1.35]){

      let w=
        add(
          new THREE.CylinderGeometry(
            .37,
            .37,
            .26,
            20
          ),
          mat(0x101216),
          player
        );

      w.rotation.z=Math.PI/2;

      w.position.set(
        x,
        .05,
        z
      );
    }
  }

  /* SPOILER */

  let spoiler=
    box(
      1.9,
      .1,
      .35,
      0x111820,
      [0,.7,1.95],
      player
    );

  spoiler.rotation.x=-.08;
}

function makeTraffic(i){

  let g=new THREE.Group();

  g.position.set(
    lanes[i%3],
    .55,
    -45-i*38-Math.random()*45
  );

  let c=[
    0xb83d38,
    0xd5d5d5,
    0x3d6792,
    0x9e7c28,
    0x3d4146
  ][i%5];

  box(
    2,
    .62,
    3.7,
    c,
    [0,.3,0],
    g
  );

  box(
    1.55,
    .5,
    1.55,
    0x202832,
    [0,.75,.1],
    g
  );

  for(let x of[-1.02,1.02]){

    for(let z of[-1.15,1.15]){

      let w=
        add(
          new THREE.CylinderGeometry(
            .3,
            .3,
            .22,
            16
          ),
          mat(0x111),
          g
        );

      w.rotation.z=Math.PI/2;

      w.position.set(
        x,
        .05,
        z
      );
    }
  }

  g.userData.relative=
    .65+Math.random()*.3;

  scene.add(g);

  cars.push(g);
}

function reset(){

  cars.forEach(c=>
    scene.remove(c)
  );

  cars=[];

  for(let i=0;i<18;i++)
    makeTraffic(i);

  speed=0;
  score=0;
  nitro=100;
  lap=1;
  distance=0;
  time=0;

  player.position.x=0;
}

function start(){

  audio();

  if(ctx.state==='suspended')
    ctx.resume();

  reset();

  active=true;
  paused=false;

  $('menu').classList.add('hidden');
  $('result').classList.add('hidden');
  $('pauseScreen').classList.add('hidden');

  tone(500,.12);

  toast('GO!');
}

function finish(crash=false){

  active=false;

  let s=Math.floor(score);

  if(s>best())
    localStorage.srV3Best=s;

  $('resultTitle').textContent=
    crash?'CRASH!':'FINISH!';

  $('resultText').textContent=
    `Score: ${s.toLocaleString()} • Lap: ${Math.min(lap,3)}/3 • Best: ${best().toLocaleString()}`;

  $('result').classList.remove('hidden');

  if(crash){

    tone(70,.3);

    if(navigator.vibrate)
      navigator.vibrate([
        80,
        40,
        120
      ]);

  }else{

    tone(800,.18);
  }
}

function update(dt){

  if(!active||paused)
    return;

  time+=dt;

  let steer=
    (key.l?-1:0)+
    (key.r?1:0);

  let boost=
    key.n&&nitro>0;

  let brake=key.b;

  let target=
    boost?
    1.95:
    brake?
    .18:
    1.18;

  speed+=
    (target-speed)*
    dt*
    (boost?3:1.7);

  speed=Math.max(
    0,
    Math.min(2.0,speed)
  );

  if(boost)
    nitro=Math.max(
      0,
      nitro-36*dt
    );
  else
    nitro=Math.min(
      100,
      nitro+7*dt
    );

  /* STEERING */

  player.position.x+=
    steer*
    dt*
    (4.2+speed*2.5);

  player.position.x=
    Math.max(
      -5.25,
      Math.min(
        5.25,
        player.position.x
      )
    );

  player.rotation.z+=
    (steer*.2-player.rotation.z)*
    dt*8;

  player.rotation.y+=
    (steer*.07-player.rotation.y)*
    dt*5;

  /* WORLD MOVEMENT */

  let move=
    (65+speed*110)*dt;

  road.position.z+=move;

  if(road.position.z>100)
    road.position.z=-300;

  for(let o of scenery){

    o.position.z+=move;

    if(o.position.z>45)
      o.position.z-=1030;
  }

  /* TRAFFIC */

  for(let c of cars){

    c.position.z+=
      move*
      (1-c.userData.relative*.35);

    if(c.position.z>25){

      c.position.z=
        -620-
        Math.random()*260;

      c.position.x=
        lanes[
          Math.floor(
            Math.random()*3
          )
        ];

      score+=25;
    }

    /* COLLISION */

    if(
      Math.abs(
        c.position.x-
        player.position.x
      )<1.55&&
      Math.abs(
        c.position.z-
        player.position.z
      )<2.45
    ){

      finish(true);
      return;
    }
  }

  /* LAP */

  distance+=
    speed*
    dt*
    16;

  score+=
    speed*
    dt*
    10;

  if(distance>=850){

    distance=0;

    lap++;

    tone(700,.12);

    toast(
      `CHECKPOINT • LAP ${Math.min(lap,3)}`
    );

    if(lap>3){

      finish(false);

      return;
    }
  }

  /* ENGINE */

  if(engine)

    engine.frequency.setTargetAtTime(
      55+speed*90,
      ctx.currentTime,
      .05
    );

  /* CAMERA */

  camera.position.x+=
    (
      player.position.x*.34-
      camera.position.x
    )*
    dt*5;

  camera.position.y+=
    (
      4.2-
      camera.position.y
    )*
    dt*4;

  camera.position.z+=
    (
      10.5-
      camera.position.z
    )*
    dt*4;

  camera.lookAt(
    player.position.x*.15,
    1,
    -18
  );

  /* HUD */

  $('speed').textContent=
    Math.round(speed*110);

  $('rpm').textContent=
    (1+speed*5.2).toFixed(1);

  $('score').textContent=
    Math.floor(score).toLocaleString();

  $('lap').textContent=
    `${Math.min(lap,3)}/3`;

  $('nitro').textContent=
    Math.round(nitro)+'%';
}

function toast(t){

  let e=$('toast');

  e.textContent=t;

  e.style.opacity=1;

  clearTimeout(
    window.toastTimer
  );

  window.toastTimer=
    setTimeout(
      ()=>e.style.opacity=0,
      900
    );
}

function hold(id,k){

  let e=$(id);

  e.onpointerdown=v=>{
    v.preventDefault();
    key[k]=1;
  };

  e.onpointerup=()=>
    key[k]=0;

  e.onpointercancel=()=>
    key[k]=0;

  e.onpointerleave=()=>
    key[k]=0;
}

function bind(){

  hold('left','l');
  hold('right','r');
  hold('brake','b');
  hold('boost','n');

  $('start').onclick=start;

  $('again').onclick=start;

  $('resume').onclick=()=>{
    paused=false;
    $('pauseScreen')
      .classList
      .add('hidden');
  };

  $('restart').onclick=start;

  $('pause').onclick=()=>{

    if(active){

      paused=true;

      $('pauseScreen')
        .classList
        .remove('hidden');
    }
  };

  $('home').onclick=()=>{

    active=false;

    $('result')
      .classList
      .add('hidden');

    $('menu')
      .classList
      .remove('hidden');
  };

  $('quality').onclick=()=>{

    quality=(quality+1)%3;

    $('quality').textContent=
      'GRAPHICS: '+
      ['LOW','MEDIUM','HIGH'][quality];

    toast(
      'Reload page to apply'
    );
  };

  /* KEYBOARD */

  addEventListener(
    'keydown',
    e=>{

      if(
        e.key==='ArrowLeft'||
        e.key.toLowerCase()==='a'
      )
        key.l=1;

      if(
        e.key==='ArrowRight'||
        e.key.toLowerCase()==='d'
      )
        key.r=1;

      if(
        e.key==='ArrowDown'||
        e.key.toLowerCase()==='s'
      )
        key.b=1;

      if(e.code==='Space')
        key.n=1;

      if(
        e.key==='Escape'&&
        active
      )
        $('pause').click();
    }
  );

  addEventListener(
    'keyup',
    e=>{

      if(
        e.key==='ArrowLeft'||
        e.key.toLowerCase()==='a'
      )
        key.l=0;

      if(
        e.key==='ArrowRight'||
        e.key.toLowerCase()==='d'
      )
        key.r=0;

      if(
        e.key==='ArrowDown'||
        e.key.toLowerCase()==='s'
      )
        key.b=0;

      if(e.code==='Space')
        key.n=0;
    }
  );

  addEventListener(
    'resize',
    ()=>{
      camera.aspect=
        innerWidth/innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        innerWidth,
        innerHeight
      );
    }
  );
}

function loop(){

  requestAnimationFrame(loop);

  let dt=
    Math.min(
      clock.getDelta(),
      .035
    );

  update(dt);

  renderer.render(
    scene,
    camera
  );
}

init();

})();
