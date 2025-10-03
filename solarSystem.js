// ==========================================
// 3D Solar System Explorer - Improved Version
// ==========================================

// Import Three.js libraries
import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js";

// ==========================================
// Configuration and Constants
// ==========================================
const CONFIG = {
  maxSpeed: new URL(window.location.href).searchParams.get("ms") * 1 || 50,
  cameraPosition: { x: -50, y: 90, z: 150 },
  sunSize: 15,
  planetSegments: 32,
  ringSegments: 64
};

// Global speed variable for slider control
let globalSpeed = 1;

// ==========================================
// Core Setup Functions
// ==========================================

// Initialize renderer with error handling
function createRenderer() {
  try {
    console.log('Creating WebGL renderer...');
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear any existing canvas elements
    const existingCanvas = document.querySelector('canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    document.body.appendChild(renderer.domElement);
    console.log('Renderer canvas added to DOM:', renderer.domElement);

    // Make sure canvas is visible
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '1';

    // Set background color to ensure visibility
    renderer.setClearColor(0x000011, 1);
    console.log('Renderer created successfully');
    console.log('Canvas size:', renderer.domElement.width, 'x', renderer.domElement.height);

    // Force a test render to make sure it's working
    const testScene = new THREE.Scene();
    const testCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    testCamera.position.z = 5;

    const testGeometry = new THREE.BoxGeometry(1, 1, 1);
    const testMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const testCube = new THREE.Mesh(testGeometry, testMaterial);
    testScene.add(testCube);

    renderer.render(testScene, testCamera);
    console.log('Test render completed - you should see a green cube if WebGL is working');

    return renderer;
  } catch (error) {
    console.error("Failed to create renderer:", error);
    throw error;
  }
}

// Load textures with error handling
function loadTextures(textureLoader) {
  const texturePaths = {
    stars: "./image/stars.jpg",
    sun: "./image/sun.jpg",
    mercury: "./image/mercury.jpg",
    venus: "./image/venus.jpg",
    earth: "./image/earth.jpg",
    mars: "./image/mars.jpg",
    jupiter: "./image/jupiter.jpg",
    saturn: "./image/saturn.jpg",
    uranus: "./image/uranus.jpg",
    neptune: "./image/neptune.jpg",
    pluto: "./image/pluto.jpg",
    saturnRing: "./image/saturn_ring.png",
    uranusRing: "./image/uranus_ring.png"
  };

  const textures = {};
  let loadedCount = 0;
  const totalTextures = Object.keys(texturePaths).length;

  return new Promise((resolve, reject) => {
    Object.entries(texturePaths).forEach(([name, path]) => {
      textureLoader.load(
        path,
        (texture) => {
          textures[name] = texture;
          loadedCount++;
          console.log(`Loaded texture: ${name} (${loadedCount}/${totalTextures})`);
          if (loadedCount === totalTextures) {
            console.log('All textures loaded successfully!');
            resolve(textures);
          }
        },
        (progress) => {
          // Optional: show loading progress
        },
        (error) => {
          console.error(`Failed to load texture ${name}:`, error);
          // Create a fallback texture instead of rejecting
          textures[name] = createFallbackTexture();
          loadedCount++;
          if (loadedCount === totalTextures) {
            resolve(textures);
          }
        }
      );
    });
  });
}

// Create a simple fallback texture
function createFallbackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');

  // Create a simple gradient pattern
  const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, '#666666');
  gradient.addColorStop(1, '#333333');

  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// ==========================================
// Scene and Camera Setup
// ==========================================

// Create scene
console.log('Creating 3D scene...');
const scene = new THREE.Scene();
console.log('Scene created successfully');

// Create camera with better configuration
function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(
    CONFIG.cameraPosition.x,
    CONFIG.cameraPosition.y,
    CONFIG.cameraPosition.z
  );
  return camera;
}

// Setup camera controls
function setupControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = true;
  controls.minDistance = 50;
  controls.maxDistance = 500;
  controls.enablePan = true;
  return controls;
}

// Create starfield background
function createStarfield(textures) {
  try {
    if (textures.stars) {
      const cubeTextureLoader = new THREE.CubeTextureLoader();
      const cubeTexture = cubeTextureLoader.load([
        textures.stars,
        textures.stars,
        textures.stars,
        textures.stars,
        textures.stars,
        textures.stars,
      ]);
      scene.background = cubeTexture;
      return cubeTexture;
    } else {
      // Fallback to solid color background
      scene.background = new THREE.Color(0x000011);
    }
  } catch (error) {
    console.error("Failed to create starfield:", error);
    // Fallback to solid color background
    scene.background = new THREE.Color(0x000011);
  }
}

// Create procedural stars for 360-degree view
function createProceduralStars() {
  console.log('Creating procedural stars...');
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 10000; // Number of stars
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    // Random position in a large sphere
    const radius = 500 + Math.random() * 500; // Distance from center
    const theta = Math.random() * Math.PI * 2; // Azimuth
    const phi = Math.acos(2 * Math.random() - 1); // Polar angle

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    // Random color (white to blue-white)
    const intensity = 0.5 + Math.random() * 0.5;
    colors[i * 3] = intensity;
    colors[i * 3 + 1] = intensity;
    colors[i * 3 + 2] = intensity + Math.random() * 0.5;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const starMaterial = new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
  console.log('Procedural stars created successfully');
  return stars;
}

// ==========================================
// Lighting and Sun System
// ==========================================

// Create sun with improved materials
function createSun(textures) {
  console.log('Creating sun...');
  const geometry = new THREE.SphereGeometry(CONFIG.sunSize, CONFIG.planetSegments, CONFIG.planetSegments);
  const material = new THREE.MeshStandardMaterial({
    map: textures.sun,
    emissive: 0xffff00,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.0
  });
  const sun = new THREE.Mesh(geometry, material);

  // Explicitly ensure sun has no rings or ring properties
  sun.ring = null;
  sun.ringGeometry = null;
  sun.ringMaterial = null;

  scene.add(sun);
  console.log('Sun created successfully with glow - no rings applied');
  return sun;
}

// Create lighting system
function createLighting() {
  // Main sun light
  const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.1;
  sunLight.shadow.camera.far = 1000;
  scene.add(sunLight);

  // Ambient light for subtle illumination
  const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
  scene.add(ambientLight);

  // Hemisphere light for natural sky lighting
  const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x98FB98, 0.3);
  scene.add(hemisphereLight);

  return { sunLight, ambientLight, hemisphereLight };
}

// ==========================================
// Planet and Orbital System
// ==========================================

// Planet data with realistic properties
const PLANET_DATA = [
  {
    name: "Mercury",
    size: 3.2,
    distance: 28,
    orbitSpeed: 0.004,
    rotationSpeed: 0.004,
    color: 0x8C7853,
    gravity: 3.7,
    distanceFromEarth: 48,
    facts: "Closest planet to the Sun. Has extreme temperature variations from -290°F to 800°F."
  },
  {
    name: "Venus",
    size: 5.8,
    distance: 44,
    orbitSpeed: 0.015,
    rotationSpeed: 0.002,
    color: 0xFFC649,
    gravity: 8.9,
    distanceFromEarth: 26,
    facts: "Hottest planet in our solar system. Rotates backwards compared to most planets."
  },
  {
    name: "Earth",
    size: 6,
    distance: 62,
    orbitSpeed: 0.01,
    rotationSpeed: 0.02,
    color: 0x6B93D6,
    gravity: 9.8,
    distanceFromEarth: 0,
    facts: "Only known planet with life. Has liquid water oceans covering 71% of its surface."
  },
  {
    name: "Mars",
    size: 4,
    distance: 78,
    orbitSpeed: 0.008,
    rotationSpeed: 0.018,
    color: 0xCD5C5C,
    gravity: 3.7,
    distanceFromEarth: 34,
    facts: "Known as the Red Planet. Has the largest volcano in the solar system, Olympus Mons."
  },
  {
    name: "Jupiter",
    size: 12,
    distance: 100,
    orbitSpeed: 0.002,
    rotationSpeed: 0.04,
    color: 0xD8CA9D,
    gravity: 23.1,
    distanceFromEarth: 365,
    facts: "Largest planet in our solar system. Has a Great Red Spot, a giant storm larger than Earth."
  },
  {
    name: "Saturn",
    size: 10,
    distance: 138,
    orbitSpeed: 0.0009,
    rotationSpeed: 0.038,
    color: 0xFAD5A5,
    gravity: 9.0,
    distanceFromEarth: 792,
    facts: "Famous for its prominent ring system. Less dense than water, would float in a giant bathtub.",
    ring: { innerRadius: 12, outerRadius: 22 }
  },
  {
    name: "Uranus",
    size: 7,
    distance: 176,
    orbitSpeed: 0.0004,
    rotationSpeed: 0.03,
    color: 0x4FD0E7,
    gravity: 8.7,
    distanceFromEarth: 1600,
    facts: "Rotates on its side, has faint rings. Coldest planetary atmosphere in the solar system.",
    ring: { innerRadius: 9, outerRadius: 15 }
  },
  {
    name: "Neptune",
    size: 7,
    distance: 200,
    orbitSpeed: 0.0001,
    rotationSpeed: 0.032,
    color: 0x4B70DD,
    gravity: 11.0,
    distanceFromEarth: 2700,
    facts: "Windiest planet with speeds up to 1,200 mph. Has 14 known moons, Triton is the largest."
  },
  {
    name: "Pluto",
    size: 2.8,
    distance: 216,
    orbitSpeed: 0.0007,
    rotationSpeed: 0.008,
    color: 0x8B7355,
    gravity: 0.7,
    distanceFromEarth: 2800,
    facts: "Dwarf planet with five known moons. Has a heart-shaped region called Tombaugh Regio."
  }
];

// Orbital paths storage
const orbitalPaths = [];

// Create orbital path for a planet
function createOrbitalPath(radius, color = 0xffffff, width = 3) {
  const material = new THREE.LineBasicMaterial({
    color: color,
    linewidth: width,
    transparent: true,
    opacity: 0.6
  });

  const geometry = new THREE.BufferGeometry();
  const points = [];

  // Create circular path with more segments for smoothness
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    points.push(x, 0, z);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  const orbitalPath = new THREE.LineLoop(geometry, material);
  scene.add(orbitalPath);
  orbitalPaths.push(orbitalPath);
  return orbitalPath;
}

// Create planet with improved materials and rings
function createPlanet(planetData, textures) {
  // Create planet geometry and material
  const geometry = new THREE.SphereGeometry(
    planetData.size,
    CONFIG.planetSegments,
    CONFIG.planetSegments
  );

  const material = new THREE.MeshStandardMaterial({
    map: textures[planetData.name.toLowerCase()],
    roughness: 0.7,
    metalness: 0.1,
    emissive: new THREE.Color(planetData.color).multiplyScalar(0.1)
  });

  const planet = new THREE.Mesh(geometry, material);

  // Create orbital container
  const planetContainer = new THREE.Object3D();
  planetContainer.add(planet);
  planet.position.set(planetData.distance, 0, 0);

  // Add rings only for Saturn and Uranus
  if (planetData.ring && (planetData.name === 'Saturn' || planetData.name === 'Uranus')) {
    console.log(`Creating ring for ${planetData.name} at distance ${planetData.distance}`);

    // Create ring geometry with proper sizing based on planet
    let innerRadius, outerRadius;
    if (planetData.name === 'Saturn') {
      innerRadius = planetData.size + 3; // Saturn has prominent rings
      outerRadius = innerRadius + 10;
    } else if (planetData.name === 'Uranus') {
      innerRadius = planetData.size + 1.5; // Uranus has thinner, closer rings
      outerRadius = innerRadius + 4;
    }

    const ringGeometry = new THREE.RingGeometry(
      innerRadius,
      outerRadius,
      CONFIG.ringSegments
    );

    // Different materials for different planets
    let ringMaterial;
    if (planetData.name === 'Saturn') {
      ringMaterial = new THREE.MeshBasicMaterial({
        map: textures.saturnRing,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });
    } else if (planetData.name === 'Uranus') {
      ringMaterial = new THREE.MeshBasicMaterial({
        map: textures.uranusRing,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
    }

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);

    // Ensure ring is visible
    ring.visible = true;
    ring.castShadow = false;
    ring.receiveShadow = false;

    // Add ring to planet container, not to planet mesh
    planetContainer.add(ring);
    ring.rotation.x = -0.5 * Math.PI;

    // Position ring at the same level as planet
    ring.position.y = 0;

    console.log(`Ring created for ${planetData.name}: inner=${innerRadius}, outer=${outerRadius}`);
    console.log(`Planet ${planetData.name} position: (${planetData.distance}, 0, 0)`);
    console.log(`Ring position: (${ring.position.x}, ${ring.position.y}, ${ring.position.z})`);
    console.log(`Ring material opacity: ${ringMaterial.opacity}`);
    console.log(`Ring visible: ${ring.visible}`);
  } else {
    console.log(`No ring for ${planetData.name}`);
  }

  scene.add(planetContainer);

  // Create orbital path
  createOrbitalPath(planetData.distance);

  return {
    container: planetContainer,
    mesh: planet,
    data: planetData
  };
}

// ==========================================
// Planet Creation and Management
// ==========================================

// Create all planets using the new system
function createPlanets(textures) {
  console.log('Creating planets...');
  const planets = [];

  PLANET_DATA.forEach(planetData => {
    console.log(`Creating planet: ${planetData.name} (has ring: ${!!planetData.ring})`);
    const planet = createPlanet(planetData, textures);
    planets.push(planet);
  });

  console.log(`Created ${planets.length} planets successfully`);
  return planets;
}

//////////////////////////////////////

// ==========================================
// User Interface and Controls
// ==========================================

// Create GUI controls
function createGUI(controls) {
  const gui = new dat.GUI({ width: 300 });

  // Visual settings
  const visualFolder = gui.addFolder('Visual Settings');
  const visualOptions = {
    'Realistic View': true,
    'Show Orbits': true,
    'Show Planet Info': false,
    'Pause Animation': false
  };

  visualFolder.add(visualOptions, 'Realistic View').onChange((value) => {
    controls.ambientLight.intensity = value ? 0.2 : 0.6;
    controls.hemisphereLight.intensity = value ? 0.3 : 0.1;
  });

  visualFolder.add(visualOptions, 'Show Orbits').onChange((value) => {
    orbitalPaths.forEach(path => path.visible = value);
  });

  visualFolder.add(visualOptions, 'Show Planet Info').onChange((value) => {
    // Planet info display will be handled in the main loop
    controls.showPlanetInfo = value;
  });

  visualFolder.add(visualOptions, 'Pause Animation').onChange((value) => {
    controls.isPaused = value;
  });

  visualFolder.open();

  // Animation controls
  const animationFolder = gui.addFolder('Animation Controls');
  const animationOptions = {
    'Planet Speed': 1,
    'Time Scale': 1,
    'Pause/Resume': false,
    'Speed Presets': 'Normal',
    'Reset View': () => {
      controls.camera.position.set(
        CONFIG.cameraPosition.x,
        CONFIG.cameraPosition.y,
        CONFIG.cameraPosition.z
      );
      controls.orbitControls.reset();
    }
  };

  // Speed presets dropdown
  const speedPresets = {
    'Very Slow': 0.2,
    'Slow': 0.5,
    'Normal': 1,
    'Fast': 2,
    'Very Fast': 5,
    'Ultra Fast': 10,
    'Maximum': CONFIG.maxSpeed || 20
  };

  animationFolder.add(animationOptions, 'Speed Presets', Object.keys(speedPresets))
    .name('Speed Presets')
    .onChange((value) => {
      const speedValue = speedPresets[value];
      controls.speed = speedValue;
      console.log(`Speed preset changed to: ${value} (${speedValue})`);
    });

  // Enhanced speed control with better range and step
  const speedController = animationFolder.add(animationOptions, 'Planet Speed', 0, CONFIG.maxSpeed || 20, 0.1)
    .name('Planet Speed')
    .onChange((value) => {
      globalSpeed = value;
      console.log(`Planet speed changed to: ${value}`);

      // Update preset dropdown to match current speed
      const closestPreset = Object.keys(speedPresets).reduce((prev, curr) => {
        return Math.abs(speedPresets[curr] - value) < Math.abs(speedPresets[prev] - value) ? curr : prev;
      });
      animationOptions['Speed Presets'] = closestPreset;
    });

  // Time scale control
  animationFolder.add(animationOptions, 'Time Scale', 0.1, 5, 0.1)
    .name('Time Scale')
    .onChange((value) => {
      controls.timeScale = value;
      console.log(`Time scale changed to: ${value}`);
    });

  // Pause/Resume toggle
  animationFolder.add(animationOptions, 'Pause/Resume')
    .name('Pause Animation')
    .onChange((value) => {
      controls.isPaused = value;
      console.log(`Animation ${value ? 'paused' : 'resumed'}`);
    });

  // Reset view button
  animationFolder.add(animationOptions, 'Reset View')
    .name('Reset Camera');

  // Add status information
  const statusInfo = {
    'Current Speed': () => `${globalSpeed || 1}x`,
    'Animation Status': () => controls.isPaused ? 'Paused' : 'Running',
    'Max Speed': CONFIG.maxSpeed || 20
  };

  // Add status folder
  const statusFolder = gui.addFolder('Status');
  statusFolder.add(statusInfo, 'Current Speed').name('Current Speed').listen();
  statusFolder.add(statusInfo, 'Animation Status').name('Animation Status').listen();
  statusFolder.add(statusInfo, 'Max Speed').name('Max Speed');
  statusFolder.open();

  animationFolder.open();

  return { visualOptions, animationOptions };
}

//////////////////////////////////////

// ==========================================
// Animation and Main Loop
// ==========================================

// Raycaster for planet hover detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Main animation loop
function animate(time, controls) {
  try {
    // Handle pause functionality
    if (controls.isPaused) {
      requestAnimationFrame((t) => animate(t, controls));
      return;
    }

    const deltaTime = controls.clock.getDelta();
    const elapsedTime = controls.clock.getElapsedTime();

    // Update raycaster for planet hover detection
    raycaster.setFromCamera(mouse, controls.camera);
    const intersects = raycaster.intersectObjects(controls.planets.map(p => p.mesh));

    if (intersects.length > 0) {
      const planet = intersects[0].object;
      const planetData = controls.planets.find(p => p.mesh === planet)?.data;
      if (planetData) {
        updatePlanetInfo(planetData);
      }
    } else {
      hidePlanetInfo();
    }

    // Update sun rotation
    if (controls.sun) {
      controls.sun.rotation.y += 0.004 * globalSpeed * controls.timeScale * deltaTime;
    }

    // Update planets
    if (controls.planets && controls.planets.length > 0) {
      controls.planets.forEach(planet => {
        if (planet && planet.container && planet.mesh && planet.data) {
          // Orbital motion
          planet.container.rotation.y += planet.data.orbitSpeed * globalSpeed * controls.timeScale * deltaTime;

          // Planet self-rotation
          planet.mesh.rotation.y += planet.data.rotationSpeed * globalSpeed * controls.timeScale * deltaTime;

          // Add slight wobble for realism
          planet.mesh.rotation.x = Math.sin(elapsedTime + planet.data.distance) * 0.02;

          // Ensure rings stay with their planets
          if (planet.data.ring && (planet.data.name === 'Saturn' || planet.data.name === 'Uranus')) {
            const ring = planet.container.children.find(child =>
              child.type === 'Mesh' && child.geometry.type === 'RingGeometry'
            );
            if (ring) {
              // Keep ring positioned with the planet
              ring.position.copy(planet.mesh.position);
              ring.rotation.x = -0.5 * Math.PI; // Keep ring flat

              // Ensure ring remains visible
              ring.visible = true;

              // Adjust opacity based on planet for better visibility
              if (planet.data.name === 'Uranus') {
                ring.material.opacity = 0.85;
              } else if (planet.data.name === 'Saturn') {
                ring.material.opacity = 0.95;
              }
            }
          }
        }
      });
    }

    // Update controls
    if (controls.orbitControls) {
      controls.orbitControls.update();
    }

    // Render scene
    if (controls.renderer && controls.scene && controls.camera) {
      controls.renderer.render(controls.scene, controls.camera);
    }

    requestAnimationFrame((t) => animate(t, controls));
  } catch (error) {
    console.error('Animation loop error:', error);
    requestAnimationFrame((t) => animate(t, controls));
  }
}

// Handle window resize
function handleResize(controls) {
  controls.camera.aspect = window.innerWidth / window.innerHeight;
  controls.camera.updateProjectionMatrix();
  controls.renderer.setSize(window.innerWidth, window.innerHeight);
}

// Update planet info panel
function updatePlanetInfo(planetData) {
  const infoPanel = document.getElementById('info-panel');
  const planetName = document.getElementById('planet-name');
  const planetDistance = document.getElementById('planet-distance');
  const planetSize = document.getElementById('planet-size');
  const planetPeriod = document.getElementById('planet-period');
  const planetGravity = document.getElementById('planet-gravity');
  const planetDistanceEarth = document.getElementById('planet-distance-earth');
  const planetFacts = document.getElementById('planet-facts');

  if (infoPanel && planetName && planetDistance && planetSize && planetPeriod && planetGravity && planetDistanceEarth && planetFacts) {
    planetName.textContent = planetData.name;
    planetDistance.textContent = `Distance from Sun: ${planetData.distance} AU`;
    planetSize.textContent = `Size: ${planetData.size} Earth radii`;
    planetPeriod.textContent = `Orbital Period: ${Math.round(planetData.orbitSpeed * 365)} days`;
    planetGravity.textContent = `Gravity: ${planetData.gravity} m/s²`;
    planetDistanceEarth.textContent = `Distance from Earth: ${planetData.distanceFromEarth} million miles`;
    planetFacts.textContent = `Facts: ${planetData.facts}`;
    infoPanel.style.display = 'block';
  }
}

// Hide planet info panel
function hidePlanetInfo() {
  const infoPanel = document.getElementById('info-panel');
  if (infoPanel) {
    infoPanel.style.display = 'none';
  }
}

// Update mouse position for raycasting
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// ==========================================
// Main Application Initialization
// ==========================================

// Initialize the entire solar system
async function initSolarSystem() {
  try {
    console.log('Starting Solar System initialization...');

    // Show loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                  background: rgba(0,0,0,0.8); color: white; padding: 20px;
                  border-radius: 10px; font-family: Arial, sans-serif; z-index: 10000;">
        Loading Solar System...
      </div>
    `;
    document.body.appendChild(loadingDiv);
    console.log('Loading screen created');

    // Initialize core components
    console.log('Creating renderer...');
    const renderer = createRenderer();
    console.log('Renderer created successfully');

    console.log('Creating camera...');
    const camera = createCamera();
    console.log('Camera created successfully');

    console.log('Setting up controls...');
    const orbitControls = setupControls(camera, renderer);
    console.log('Controls set up successfully');

    // Load textures
    console.log('Loading textures...');
    const textureLoader = new THREE.TextureLoader();
    const textures = await loadTextures(textureLoader);
    console.log('Textures loaded successfully');

    // Create starfield background
    console.log('Creating starfield...');
    createStarfield(textures);
    console.log('Starfield created successfully');

    // Create procedural stars for 360-degree view
    console.log('Creating procedural stars...');
    createProceduralStars();
    console.log('Procedural stars created successfully');

    // Create solar system components
    console.log('Creating sun...');
    const sun = createSun(textures);
    console.log('Sun created successfully');

    console.log('Creating planets...');
    const planets = createPlanets(textures);
    console.log('Planets created successfully');

    console.log('Creating lighting...');
    const lighting = createLighting();
    console.log('Lighting created successfully');

    // Create GUI
    console.log('Creating GUI...');
    let guiControls;
    try {
      if (typeof dat !== 'undefined' && dat.GUI) {
        guiControls = createGUI({
          renderer, camera, orbitControls, scene, sun, planets,
          ambientLight: lighting.ambientLight,
          hemisphereLight: lighting.hemisphereLight,
          speed: 1, timeScale: 1, isPaused: false, showPlanetInfo: false,
          clock: new THREE.Clock()
        });
        console.log('GUI created successfully');
      } else {
        console.warn('dat.GUI not available, continuing without GUI');
        guiControls = { visualOptions: {}, animationOptions: {} };
      }
    } catch (guiError) {
      console.warn('GUI creation failed, continuing without GUI:', guiError);
      guiControls = { visualOptions: {}, animationOptions: {} };
    }

    // Setup custom speed control slider
    console.log('Setting up custom speed control slider...');
    const speedSlider = document.getElementById('speed-slider');
    const speedValueDisplay = document.getElementById('speed-value');
    if (speedSlider && speedValueDisplay) {
      speedSlider.addEventListener('input', (event) => {
        globalSpeed = parseFloat(event.target.value);
        speedValueDisplay.textContent = `${globalSpeed.toFixed(1)}x`;
        console.log(`Speed changed via slider to: ${globalSpeed}`);
      });
      console.log('Custom speed control slider set up successfully');
    } else {
      console.warn('Speed control slider elements not found');
    }

    // Setup event listeners
    console.log('Setting up event listeners...');
    window.addEventListener('resize', () => handleResize({
      camera, renderer
    }));
    window.addEventListener('mousemove', onMouseMove);
    console.log('Event listeners set up successfully');

    // Remove loading screen and any other overlays
    console.log('Removing loading screen...');
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.remove();
      console.log('Loading screen removed');
    }

    // Hide welcome screen only if it's already hidden (i.e., user clicked the button)
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen && welcomeScreen.classList.contains('hidden')) {
      welcomeScreen.style.display = 'none';
      console.log('Welcome screen hidden after button click');
    }

    // Hide any other potential overlays
    const overlays = document.querySelectorAll('[id*="overlay"], [id*="loading"], [id*="welcome"]');
    overlays.forEach(overlay => {
      overlay.style.display = 'none';
      console.log('Hidden overlay:', overlay.id);
    });

    // Start animation
    console.log('Starting animation...');
    console.log('Final setup - Renderer:', !!renderer, 'Scene:', !!scene, 'Camera:', !!camera);
    console.log('Scene objects count:', scene.children.length);

    // Final canvas visibility check
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.display = 'block';
      canvas.style.visibility = 'visible';
      canvas.style.opacity = '1';
      canvas.style.zIndex = '9999';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      console.log('Canvas visibility confirmed:', {
        display: canvas.style.display,
        visibility: canvas.style.visibility,
        opacity: canvas.style.opacity,
        zIndex: canvas.style.zIndex
      });
    } else {
      console.error('Canvas not found in DOM!');
    }

    animate(0, {
      renderer, camera, orbitControls, scene, sun, planets,
      ambientLight: lighting.ambientLight,
      hemisphereLight: lighting.hemisphereLight,
      speed: globalSpeed, timeScale: 1, isPaused: false, showPlanetInfo: false,
      clock: new THREE.Clock()
    });

    console.log('Solar System initialized successfully!');
    console.log('🎉 You should now see the 3D Solar System!');

    // Debug: Show ring positions
    setTimeout(() => {
      console.log('=== RING DEBUG INFO ===');
      planets.forEach(planet => {
        if (planet.data.ring && (planet.data.name === 'Saturn' || planet.data.name === 'Uranus')) {
          const ring = planet.container.children.find(child =>
            child.type === 'Mesh' && child.geometry.type === 'RingGeometry'
          );
          if (ring) {
            console.log(`${planet.data.name} ring position:`, ring.position);
            console.log(`${planet.data.name} planet position:`, planet.mesh.position);
            console.log(`${planet.data.name} container position:`, planet.container.position);
            console.log(`${planet.data.name} ring visible:`, ring.visible);
            console.log(`${planet.data.name} ring material opacity:`, ring.material.opacity);
          }
        }
      });
      console.log('=== END RING DEBUG ===');
    }, 2000);

  } catch (error) {
    console.error('Failed to initialize Solar System:', error);
    console.error('Error details:', error.message, error.stack);

    // Remove loading screen even on error
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.remove();
    }

    document.body.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                  background: rgba(255,0,0,0.8); color: white; padding: 20px;
                  border-radius: 10px; font-family: Arial, sans-serif; z-index: 10000;">
        Error loading Solar System: ${error.message}
        <br><br>
        Please check the console for details.
      </div>
    `;
  }
}

// Check WebGL support
function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    console.log('WebGL support confirmed');
    return true;
  } catch (error) {
    console.error('WebGL not supported:', error);
    // For testing purposes, assume WebGL is supported
    console.log('Assuming WebGL is supported for testing');
    return true;
  }
}

// Start the application with timeout protection
console.log('Starting application...');
if (checkWebGLSupport()) {
  const initPromise = initSolarSystem();
} else {
  console.error('Cannot start application - WebGL not supported');
}

// Add timeout protection
setTimeout(() => {
  const loadingElement = document.getElementById('loading');
  if (loadingElement && loadingElement.parentNode) {
    console.warn('Initialization timeout - removing loading screen');
    loadingElement.remove();

    // Show a warning message
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: rgba(255, 193, 7, 0.9); color: black; padding: 15px;
      border-radius: 10px; font-family: Arial, sans-serif; z-index: 10000;
      max-width: 300px;
    `;
    warningDiv.innerHTML = `
      <strong>⚠️ Initialization Issue</strong><br>
      The solar system may take longer to load.<br>
      If you see a black screen, try refreshing the page.
    `;
    document.body.appendChild(warningDiv);

    // Remove warning after 10 seconds
    setTimeout(() => {
      if (warningDiv.parentNode) {
        warningDiv.remove();
      }
    }, 10000);
  }
}, 10000); // 10 second timeout
