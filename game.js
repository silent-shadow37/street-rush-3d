// --- Game Variables ---
let scene, camera, renderer;
let playerCar, road;
let obstacles = [];
let speed = 0.8;
let score = 0;
let isGameOver = false;

// 6 Lane Mechanics
const LANES = [-10, -6, -2, 2, 6, 10];
let currentLaneIndex = 2; // Middle lane

// Cockpit & Weather State
let isCockpitView = false;
let isWiperOn = false;

// Web Audio Radio System
let audioCtx, oscillator, gainNode;

function init() {
    const container = document.getElementById('game-container');
    container.innerHTML = ''; // Clear existing elements

    // 1. Three.js Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05050a, 0.015);

    // 2. Camera Setup
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // 3. WebGL Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(0, 20, 10);
    scene.add(dirLight);

    // 5. Build Environment
    createRoad();
    createPlayerCar();

    // 6. Camera Positioning
    updateCameraPosition();

    // 7. Event Listeners
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('resize', onWindowResize);
    setupUIControls();
    setupTouchControls();

    // 8. Start Game Loop
    animate();
}

// --- Road Mesh ---
function createRoad() {
    const geometry = new THREE.PlaneGeometry(26, 1000);
    const material = new THREE.MeshStandardMaterial({ color: 0x111115, roughness: 0.3, metalness: 0.4 });
    road = new THREE.Mesh(geometry, material);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);
}

// --- Player Mesh ---
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

// --- Dynamic Camera Position ---
function updateCameraPosition() {
    if (isCockpitView) {
        camera.position.set(playerCar.position.x, playerCar.position.y + 0.8, playerCar.position.z - 0.2);
        camera.lookAt(playerCar.position.x, playerCar.position.y + 0.8, playerCar.position.z - 10);
    } else {
        camera.position.set(playerCar.position.x, playerCar.position.y + 3, playerCar.position.z + 8);
        camera.lookAt(playerCar.position.x, playerCar.position.y + 1, playerCar.position.z - 5);
    }
}

// --- Obstacle Spawner ---
function spawnObstacle() {
    if (Math.random() < 0.04) {
        const lane = LANES[Math.floor(Math.random() * LANES.length)];
        const geo = new THREE.BoxGeometry(2, 1.2, 4);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff0055 });
        const obstacle = new THREE.Mesh(geo, mat);
        
        obstacle.position.set(lane, 0.6, -200);
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
}

// --- Web Audio Synth Player ---
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
    oscillator.frequency.setValueAtTime(type === 'synth' ? 110 : 130, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
}

// --- Steering Control Logic ---
function moveLeft() {
    if (currentLaneIndex > 0 && !isGameOver) currentLaneIndex--;
}

function moveRight() {
    if (currentLaneIndex < LANES.length - 1 && !isGameOver) currentLaneIndex++;
}

function handleKeyPress(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft();
    if (e.key === 'ArrowRight' || e.key === 'd') moveRight();
}

function setupTouchControls() {
    document.getElementById('btn-left').addEventListener('click', moveLeft);
    document.getElementById('btn-right').addEventListener('click', moveRight);
}

// --- UI Interaction Handlers ---
function setupUIControls() {
    const camBtn = document.getElementById('cam-toggle-btn');
    const wiperBtn = document.getElementById('wiper-btn');
    const cockpitOverlay = document.getElementById('cockpit-overlay');
    const radioSelect = document.getElementById('radio-station');
    const restartBtn = document.getElementById('restart-btn');

    camBtn.addEventListener('click', () => {
        isCockpitView = !isCockpitView;
        if (isCockpitView) {
            camBtn.innerText = "📷 Cam: 1st";
            wiperBtn.style.display = "inline-block";
            cockpitOverlay.style.display = "block";
        } else {
            camBtn.innerText = "📷 Cam: 3rd";
            wiperBtn.style.display = "none";
            cockpitOverlay.style.display = "none";
        }
        updateCameraPosition();
    });

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

    radioSelect.addEventListener('change', (e) => {
        toggleAudio(e.target.value);
    });

    restartBtn.addEventListener('click', () => {
        location.reload();
    });
}

// --- Main Render Loop ---
function animate() {
    if (isGameOver) return;

    requestAnimationFrame(animate);

    // Smooth movement transition
    playerCar.position.x += (LANES[currentLaneIndex] - playerCar.position.x) * 0.2;
    updateCameraPosition();

    // Road Infinite Motion
    road.position.z += speed;
    if (road.position.z > 50) road.position.z = 0;

    // Obstacles Management
    spawnObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].position.z += speed * 1.5;

        // Collision Check
        const distance = playerCar.position.distanceTo(obstacles[i].position);
        if (distance < 2.2) {
            triggerGameOver();
        }

        // Passed Obstacles Score Update
        if (obstacles[i].position.z > 20) {
            scene.remove(obstacles[i]);
            obstacles.splice(i, 1);
            score += 10;
            document.getElementById('score-display').innerText = `Score: ${score}`;
        }
    }

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

// Start Game automatically when DOM is ready
window.addEventListener('DOMContentLoaded', init);
        
