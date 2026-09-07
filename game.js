// --- Game Engine Variables ---
let scene, camera, renderer;
let playerCar, road;
let obstacles = [];
let roadHazards = [];
let speed = 0.8;
let score = 0;
let isGameOver = false;

// Dynamic Lane System (6 Lanes)
const LANES = [-10, -6, -2, 2, 6, 10];
let currentLaneIndex = 2; // Middle lane

// Cockpit & Weather State
let isCockpitView = false;
let isWiperOn = false;

// Audio System (Synthesized Music using Web Audio API)
let audioCtx, oscillator, gainNode;

function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05050a, 0.015);

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 20, 10);
    scene.add(dirLight);

    // 5. Build World Elements
    createRoad();
    createPlayerCar();

    // 6. Camera Initial Position
    updateCameraPosition();

    // 7. Event Listeners
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('resize', onWindowResize);
    setupUIControls();

    // 8. Start Game Loop
    animate();
}

// --- Road Creation ---
function createRoad() {
    const geometry = new THREE.PlaneGeometry(26, 1000);
    const material = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.2, metalness: 0.5 });
    road = new THREE.Mesh(geometry, material);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);
}

// --- Player Car Creation ---
function createPlayerCar() {
    const carGroup = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(2, 1, 4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00ffcc, metalness: 0.8, roughness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    carGroup.add(body);

    // Headlights
    const lightGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const leftLight = new THREE.Mesh(lightGeo, lightMat);
    leftLight.position.set(-0.7, 0.6, -2);
    const rightLight = leftLight.clone();
    rightLight.position.x = 0.7;
    
    carGroup.add(leftLight);
    carGroup.add(rightLight);

    playerCar = carGroup;
    playerCar.position.set(LANES[currentLaneIndex], 0, 0);
    scene.add(playerCar);
}

// --- Camera Controller ---
function updateCameraPosition() {
    if (isCockpitView) {
        camera.position.set(playerCar.position.x, playerCar.position.y + 0.8, playerCar.position.z - 0.2);
        camera.lookAt(playerCar.position.x, playerCar.position.y + 0.8, playerCar.position.z - 10);
    } else {
        camera.position.set(playerCar.position.x, playerCar.position.y + 3, playerCar.position.z + 8);
        camera.lookAt(playerCar.position.x, playerCar.position.y + 1, playerCar.position.z - 5);
    }
}

// --- AI Traffic & Hazard Spawner ---
function spawnObstacle() {
    if (Math.random() < 0.05) {
        const lane = LANES[Math.floor(Math.random() * LANES.length)];
        const geo = new THREE.BoxGeometry(2, 1.2, 4);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff0055 });
        const obstacle = new THREE.Mesh(geo, mat);
        
        obstacle.position.set(lane, 0.6, -200);
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
}

// --- Dynamic Web Audio Synth (Music Player) ---
function toggleAudio(type) {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (type === 'off') {
        if (oscillator) oscillator.stop();
        return;
    }

    if (oscillator) oscillator.stop();
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.type = type === 'synth' ? 'sawtooth' : 'square';
    oscillator.frequency.setValueAtTime(110, audioCtx.currentTime); // A2 Note
    
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
}

// --- Input Handling ---
function handleKeyPress(e) {
    if (isGameOver) return;

    if ((e.key === 'ArrowLeft' || e.key === 'a') && currentLaneIndex > 0) {
        currentLaneIndex--;
    } else if ((e.key === 'ArrowRight' || e.key === 'd') && currentLaneIndex < LANES.length - 1) {
        currentLaneIndex++;
    }
}

// --- UI Logic & Listeners ---
function setupUIControls() {
    const camBtn = document.getElementById('cam-toggle-btn');
    const wiperBtn = document.getElementById('wiper-btn');
    const cockpitOverlay = document.getElementById('cockpit-overlay');
    const radioSelect = document.getElementById('radio-station');
    const restartBtn = document.getElementById('restart-btn');

    // Camera Switch Button
    camBtn.addEventListener('click', () => {
        isCockpitView = !isCockpitView;
        if (isCockpitView) {
            camBtn.innerText = "📷 Camera: Cockpit (1st)";
            wiperBtn.style.display = "inline-block";
            cockpitOverlay.style.display = "block";
        } else {
            camBtn.innerText = "📷 Camera: Third-Person";
            wiperBtn.style.display = "none";
            cockpitOverlay.style.display = "none";
        }
        updateCameraPosition();
    });

    // Wiper Button
    wiperBtn.addEventListener('click', () => {
        isWiperOn = !isWiperOn;
        const blade = document.getElementById('wiper-blade');
        if (isWiperOn) {
            wiperBtn.innerText = "🌧️ Wiper: ON";
            blade.classList.add('wiper-active');
        } else {
            wiperBtn.innerText = "🌧️ Wiper: OFF";
            blade.classList.remove('wiper-active');
        }
    });

    // Radio
    radioSelect.addEventListener('change', (e) => {
        toggleAudio(e.target.value);
    });

    // Restart
    restartBtn.addEventListener('click', () => {
        location.reload();
    });
}

// --- Main Animation Loop ---
function animate() {
    if (isGameOver) return;

    requestAnimationFrame(animate);

    // Smooth Car Movement between lanes
    playerCar.position.x += (LANES[currentLaneIndex] - playerCar.position.x) * 0.15;
    updateCameraPosition();

    // Road Infinite Scroll
    road.position.z += speed;
    if (road.position.z > 50) road.position.z = 0;

    // Spawn & Move Obstacles
    spawnObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].position.z += speed * 1.5;

        // Collision Detection
        const distance = playerCar.position.distanceTo(obstacles[i].position);
        if (distance < 2.2) {
            triggerGameOver();
        }

        // Cleanup passed obstacles
        if (obstacles[i].position.z > 20) {
            scene.remove(obstacles[i]);
            obstacles.splice(i, 1);
            score += 10;
            document.getElementById('score-display').innerText = `Score: ${score}`;
        }
    }

    // UI Updates
    document.getElementById('speed-display').innerHTML = `${Math.floor(speed * 160)} <span>KM/H</span>`;

    renderer.render(scene, camera);
}

function triggerGameOver() {
    isGameOver = true;
    document.getElementById('final-score').innerText = `Final Score: ${score}`;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize Game on Load
window.onload = init;
  
