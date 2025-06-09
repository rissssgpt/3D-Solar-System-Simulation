// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Container and renderer setup
const container = document.getElementById('scene-container');
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setClearColor(0x000000);
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 1, 100);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Camera position
camera.position.set(0, 50, 100);
camera.lookAt(0, 0, 0);

// Orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Solar system parameters
const planets = [
    { name: 'Mercury', color: 0x8B8B8B, size: 0.5, orbitRadius: 15, speed: 0.01 },
    { name: 'Venus', color: 0xE6C229, size: 0.8, orbitRadius: 20, speed: 0.008 },
    { name: 'Earth', color: 0x6B93D6, size: 0.9, orbitRadius: 25, speed: 0.007 },
    { name: 'Mars', color: 0x993D00, size: 0.7, orbitRadius: 30, speed: 0.006 },
    { name: 'Jupiter', color: 0xB07F35, size: 1.5, orbitRadius: 40, speed: 0.004 },
    { name: 'Saturn', color: 0xD1C7AC, size: 1.3, orbitRadius: 50, speed: 0.003, hasRing: true },
    { name: 'Uranus', color: 0x4FD0E7, size: 1.1, orbitRadius: 60, speed: 0.002 },
    { name: 'Neptune', color: 0x4B70DD, size: 1.0, orbitRadius: 70, speed: 0.001 }
];

// Create the Sun
const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Create planets
const planetObjects = [];
const orbitObjects = [];

planets.forEach((planet, index) => {
    // Create planet
    const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: planet.color });
    const planetMesh = new THREE.Mesh(geometry, material);
    
    // Position planet in orbit
    planetMesh.position.x = planet.orbitRadius;
    
    // Create orbit path
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
    const points = [];
    const orbitSegments = 64;
    
    for (let i = 0; i <= orbitSegments; i++) {
        const theta = (i / orbitSegments) * Math.PI * 2;
        points.push(new THREE.Vector3(
            planet.orbitRadius * Math.cos(theta),
            0,
            planet.orbitRadius * Math.sin(theta)
        ));
    }
    
    orbitGeometry.setFromPoints(points);
    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
    
    // Add to scene
    scene.add(planetMesh);
    scene.add(orbit);
    
    // Store references
    planetObjects.push({
        mesh: planetMesh,
        angle: Math.random() * Math.PI * 2,
        speed: planet.speed,
        orbitRadius: planet.orbitRadius
    });
    
    orbitObjects.push(orbit);
    
    // Create Saturn's ring if applicable
    if (planet.hasRing) {
        const ringGeometry = new THREE.RingGeometry(planet.size + 0.3, planet.size + 0.8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xD1C7AC, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        planetMesh.add(ring);
    }
});

// Add stars background
function addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true
    });
    
    const starsVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

addStars();

// Create speed controls UI
function createSpeedControls() {
    const controlsContainer = document.getElementById('speed-controls');
    
    planetObjects.forEach((planet, index) => {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'planet-control';
        
        const label = document.createElement('label');
        label.textContent = planets[index].name;
        label.htmlFor = `speed-${index}`;
        
        const input = document.createElement('input');
        input.type = 'range';
        input.id = `speed-${index}`;
        input.min = '0';
        input.max = '0.02';
        input.step = '0.001';
        input.value = planet.speed;
        
        const valueSpan = document.createElement('span');
        valueSpan.id = `value-${index}`;
        valueSpan.textContent = planet.speed.toFixed(3);
        
        input.addEventListener('input', (e) => {
            const newSpeed = parseFloat(e.target.value);
            planetObjects[index].speed = newSpeed;
            valueSpan.textContent = newSpeed.toFixed(3);
        });
        
        controlDiv.appendChild(label);
        controlDiv.appendChild(input);
        controlDiv.appendChild(valueSpan);
        
        controlsContainer.appendChild(controlDiv);
    });
}

createSpeedControls();

// Pause/Resume button
const pauseButton = document.getElementById('pause-resume');
let isPaused = false;

pauseButton.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    if (!isPaused) {
        const delta = clock.getDelta();
        
        // Rotate planets around the Sun
        planetObjects.forEach(planet => {
            planet.angle += planet.speed * delta * 10;
            planet.mesh.position.x = planet.orbitRadius * Math.cos(planet.angle);
            planet.mesh.position.z = planet.orbitRadius * Math.sin(planet.angle);
        });
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

animate();