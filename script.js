
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const ritData = [
    { id: 1, name: "Cámara de acceso", desc: "Ubicada en BNUP (Bien Nacional de Uso Público). Punto de entrada de los proveedores externos de telecomunicaciones al predio.", pos: [18, -1.5, 0], category: 'external', color: '#6c757d' },
    { id: 2, name: "Canalización externa", desc: "Tubería subterránea que transporta los cables desde la calle hasta el límite del predio del condominio.", pos: [14, -1.5, 0], category: 'external', color: '#ff4d00' },
    { id: 3, name: "Cámara de paso", desc: "Punto de registro y tiro al ingreso del condominio. Permite acceso para mantenimiento y empalmes.", pos: [8, -1.5, 0], category: 'external', color: '#6c757d' },
    { id: 4, name: "Canalización de enlace", desc: "Ducto principal que conecta la entrada externa con las salas técnicas SOTI/SOTS del edificio.", pos: [4, -1.2, 0], category: 'trunk', color: '#ff4d00' },
    { id: 5, name: "Sala SOTI / SOTS", desc: "Salas de Operaciones de Telecomunicaciones. SOTI ubicada en sótano, SOTS en azotea. Centro neurálgico de la RIT.", pos: [0, -1.05, 0], category: 'trunk', color: '#ff4d00' },
    { id: 6, name: "Canalización troncal", desc: "Shaft vertical que recorre todos los pisos del edificio. Es la columna vertebral de toda la RIT.", pos: [0, 8, 0], category: 'trunk', color: '#ff4d00' },
    { id: 7, name: "Cajas de distribución (BUDI)", desc: "Building Distribution Box. Punto de derivación en cada piso para conexión hacia los departamentos.", pos: [0.8, 7, 1.2], category: 'distribution', color: '#6c757d' },
    // CORREGIDO: Ajuste de posición de ID 8 para coincidir con el centro geométrico de la antena
    { id: 8, name: "Captación de señal", desc: "Antenas satelitales y sistemas de recepción ubicados en la azotea del edificio.", pos: [0, 16, 0], category: 'trunk', color: '#ffffff' },
    { id: 9, name: "Canalización lateral", desc: "Tubería horizontal que va desde el shaft troncal hasta la CTR de cada departamento.", pos: [2.5, 7, 1], category: 'lateral', color: '#00b4d8' },
    { id: 10, name: "Caja Terminación (CTR)", desc: "Caja terminal domiciliaria con 2 pelos de fibra óptica. Se ubica generalmente sobre la puerta interior del departamento.", pos: [4.8, 7.5, 1], category: 'lateral', color: '#ffffff' },
    { id: 11, name: "Canalización interna", desc: "Ductos dentro de los muros del hogar que llevan la fibra hacia los distintos puntos de servicio.", pos: [6.15, 7, 2], category: 'internal', color: '#00b4d8' },
    { id: 12, name: "Tomas de usuario", desc: "Rosetas finales donde el usuario conecta sus equipos de TV, Internet y Telefonía.", pos: [7.5, 6.5, 3], category: 'internal', color: '#ffc107' }
];

// --- SCENE SETUP (DAY MODE) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f2f5);
scene.fog = new THREE.Fog(0xf0f2f5, 30, 90);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.getElementById('container').appendChild(renderer.domElement);

// CSS2D Renderer for labels
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
document.getElementById('container').appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(35, 20, 35);
controls.target.set(0, 6, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI * 0.85;
controls.minDistance = 10;
controls.maxDistance = 60;

// --- LIGHTING (DAY MODE) ---
const ambient = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffee, 1.8);
sun.position.set(20, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.bias = -0.0001;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 100;
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
scene.add(sun);

const fillLight = new THREE.DirectionalLight(0xddeeff, 0.5);
fillLight.position.set(-10, 10, -10);
scene.add(fillLight);

// --- MATERIALS (DAY MODE) ---
const materials = {
    glass: new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.4,
        roughness: 0.05,
        metalness: 0.2,
        transmission: 0.6,
        thickness: 0.5,
        clearcoat: 1.0
    }),
    concrete: new THREE.MeshStandardMaterial({
        color: 0xf8f9fa,
        roughness: 0.6,
        metalness: 0.1
    }),
    floor: new THREE.MeshStandardMaterial({
        color: 0xe9ecef,
        roughness: 0.8,
        metalness: 0.1
    }),
    ground: new THREE.MeshStandardMaterial({
        color: 0xe3e6e8,
        roughness: 1,
        metalness: 0
    }),
    street: new THREE.MeshStandardMaterial({
        color: 0x343a40,
        roughness: 0.8,
        metalness: 0
    }),
    wall: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
        roughness: 0.8,
        side: THREE.DoubleSide
    })
};

// --- GROUND AND ENVIRONMENT ---
const groundGroup = new THREE.Group();

const groundGeo = new THREE.PlaneGeometry(100, 100);
const ground = new THREE.Mesh(groundGeo, materials.ground);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2;
ground.receiveShadow = true;
groundGroup.add(ground);

const streetGeo = new THREE.PlaneGeometry(8, 100);
const street = new THREE.Mesh(streetGeo, materials.street);
street.rotation.x = -Math.PI / 2;
street.position.set(22, -1.95, 0);
street.receiveShadow = true;
groundGroup.add(street);

const lineGeo = new THREE.PlaneGeometry(0.2, 3);
const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
for (let i = -40; i < 40; i += 8) {
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(22, -1.9, i);
    groundGroup.add(line);
}

const gridHelper = new THREE.GridHelper(100, 50, 0xadb5bd, 0xcfd4da);
gridHelper.position.y = -1.99;
groundGroup.add(gridHelper);

const boundaryGeo = new THREE.PlaneGeometry(0.15, 60);
const boundaryMat = new THREE.MeshBasicMaterial({ color: 0xff4d00, transparent: true, opacity: 0.7 });
const boundary = new THREE.Mesh(boundaryGeo, boundaryMat);
boundary.rotation.x = -Math.PI / 2;
boundary.position.set(10, -1.9, 0);
groundGroup.add(boundary);

scene.add(groundGroup);

// --- BUILDING ---
const buildingGroup = new THREE.Group();
const FLOORS = 5;
const FLOOR_HEIGHT = 3;
const BUILDING_WIDTH = 16; 
const BUILDING_DEPTH = 10;

for (let i = 0; i < FLOORS; i++) {
    const slabGeo = new THREE.BoxGeometry(BUILDING_WIDTH, 0.3, BUILDING_DEPTH);
    const slab = new THREE.Mesh(slabGeo, materials.floor);
    slab.position.y = i * FLOOR_HEIGHT;
    slab.castShadow = true;
    slab.receiveShadow = true;
    buildingGroup.add(slab);

    const columnGeo = new THREE.BoxGeometry(0.5, FLOOR_HEIGHT - 0.3, 0.5);
    const columnPositions = [
        [-BUILDING_WIDTH/2 + 0.5, BUILDING_DEPTH/2 - 0.5],
        [BUILDING_WIDTH/2 - 0.5, BUILDING_DEPTH/2 - 0.5],
        [-BUILDING_WIDTH/2 + 0.5, -BUILDING_DEPTH/2 + 0.5],
        [BUILDING_WIDTH/2 - 0.5, -BUILDING_DEPTH/2 + 0.5],
        [0, BUILDING_DEPTH/2 - 0.5],
        [0, -BUILDING_DEPTH/2 + 0.5]
    ];
    
    columnPositions.forEach(([x, z]) => {
        const column = new THREE.Mesh(columnGeo, materials.concrete);
        column.position.set(x, i * FLOOR_HEIGHT + FLOOR_HEIGHT/2, z);
        column.castShadow = true;
        buildingGroup.add(column);
    });

    if (i > 0) {
        for (let w = 0; w < 4; w++) {
            const windowGeo = new THREE.PlaneGeometry(2, 2);
            const windowMesh = new THREE.Mesh(windowGeo, materials.glass);
            windowMesh.position.set(-4.5 + w * 3, i * FLOOR_HEIGHT + 1.5, BUILDING_DEPTH/2 + 0.01);
            buildingGroup.add(windowMesh);
        }
        for (let w = 0; w < 4; w++) {
            const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), materials.glass);
            windowMesh.position.set(-4.5 + w * 3, i * FLOOR_HEIGHT + 1.5, -BUILDING_DEPTH/2 - 0.01);
            windowMesh.rotation.y = Math.PI;
            buildingGroup.add(windowMesh);
        }
    }
}

const roofGeo = new THREE.BoxGeometry(BUILDING_WIDTH + 1, 0.5, BUILDING_DEPTH + 1);
const roof = new THREE.Mesh(roofGeo, materials.concrete);
roof.position.y = FLOORS * FLOOR_HEIGHT + 0.25;
roof.castShadow = true;
buildingGroup.add(roof);

const basementGeo = new THREE.BoxGeometry(BUILDING_WIDTH - 0.5, 2, BUILDING_DEPTH - 0.5);
const basementMat = new THREE.MeshStandardMaterial({ 
    color: 0x495057, 
    transparent: true, 
    opacity: 0.3,
    roughness: 0.8 
});
const basement = new THREE.Mesh(basementGeo, basementMat);
basement.position.y = -1;
buildingGroup.add(basement);

scene.add(buildingGroup);

// --- RIT ELEMENTS ---
const meshMap = {};
const labelMap = {};
const glowMeshes = [];
let showLabels = false;

// Create CSS2D label
function createLabel(id, name, position) {
    const div = document.createElement('div');
    div.style.cssText = `
        background: linear-gradient(135deg, rgba(255, 77, 0, 0.95), rgba(255, 100, 0, 0.9));
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        font-family: 'Roboto', sans-serif;
        white-space: nowrap;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.2);
        display: none;
    `;
    div.innerHTML = `<span style="font-weight:700; margin-right:5px;">${id}</span>${name}`;
    
    const label = new CSS2DObject(div);
    label.position.set(position[0], position[1] + 2, position[2]);
    label.visible = false;
    
    return label;
}

// --- FIBER CABLE FUNCTION (Returns Curve) ---
function createFiberCable(points, color = 0x00b4d8) {
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 64, 0.04, 8, false);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.3,
        metalness: 0.5
    });
    return { mesh: new THREE.Mesh(geometry, material), curve: curve };
}

// 1. Cámara de acceso
const camGeo = new THREE.BoxGeometry(1.8, 1.4, 1.8);
const camMat = new THREE.MeshStandardMaterial({ color: 0x6c757d, roughness: 0.6, metalness: 0.4 });
meshMap[1] = new THREE.Mesh(camGeo, camMat);
meshMap[1].position.set(18, -1.3, 0);
meshMap[1].castShadow = true;
scene.add(meshMap[1]);

const lidGeo = new THREE.BoxGeometry(2, 0.15, 2);
const lidMat = new THREE.MeshStandardMaterial({ color: 0x495057, roughness: 0.5, metalness: 0.6 });
const lid1 = new THREE.Mesh(lidGeo, lidMat);
lid1.position.set(18, -0.55, 0);
scene.add(lid1);

// 2. Canalización externa
const pipeGeo2 = new THREE.CylinderGeometry(0.2, 0.2, 8, 16);
pipeGeo2.rotateZ(Math.PI / 2);
const pipeMat = new THREE.MeshStandardMaterial({ color: 0xff4d00, roughness: 0.3, metalness: 0.3, emissive: 0xff4d00, emissiveIntensity: 0.1 });
meshMap[2] = new THREE.Mesh(pipeGeo2, pipeMat.clone());
meshMap[2].position.set(14, -1.5, 0);
scene.add(meshMap[2]);

// 3. Cámara de paso
meshMap[3] = new THREE.Mesh(camGeo.clone(), camMat.clone());
meshMap[3].position.set(8, -1.3, 0);
meshMap[3].castShadow = true;
scene.add(meshMap[3]);

const lid2 = lid1.clone();
lid2.position.set(8, -0.55, 0);
scene.add(lid2);

// 4. Canalización de enlace
const pipeGeo4 = new THREE.CylinderGeometry(0.2, 0.2, 8, 16);
pipeGeo4.rotateZ(Math.PI / 2);
meshMap[4] = new THREE.Mesh(pipeGeo4, pipeMat.clone());
meshMap[4].position.set(4, -1.2, 0);
scene.add(meshMap[4]);

// 5. Sala SOTI
const sotiGeo = new THREE.BoxGeometry(3.5, 1.9, 3);
const sotiMat = new THREE.MeshStandardMaterial({ color: 0xff4d00, roughness: 0.4, metalness: 0.5, emissive: 0xff4d00, emissiveIntensity: 0.1 });
meshMap[5] = new THREE.Mesh(sotiGeo, sotiMat);
meshMap[5].position.set(0, -1.05, 0); 
meshMap[5].castShadow = true;
buildingGroup.add(meshMap[5]);

// SOTI door
const doorGeo = new THREE.PlaneGeometry(1.2, 1.5);
const doorMat = new THREE.MeshStandardMaterial({ color: 0x343a40 });
const sotiDoor = new THREE.Mesh(doorGeo, doorMat);
sotiDoor.position.set(0, -1.2, 1.51);
buildingGroup.add(sotiDoor);

// SOTS
const sotsGeo = new THREE.BoxGeometry(3, 2.2, 2.5);
const sots = new THREE.Mesh(sotsGeo, sotiMat.clone());
sots.position.set(0, FLOORS * FLOOR_HEIGHT + 1.6, 0);
sots.castShadow = true;
buildingGroup.add(sots);

// 6. Canalización troncal (Shaft)
const shaftGeo = new THREE.CylinderGeometry(0.5, 0.5, FLOORS * FLOOR_HEIGHT - 2, 16);
const shaftMat = new THREE.MeshStandardMaterial({ color: 0xff4d00, roughness: 0.3, metalness: 0.4, emissive: 0xff4d00, emissiveIntensity: 0.1 });
meshMap[6] = new THREE.Mesh(shaftGeo, shaftMat);
meshMap[6].position.set(0, FLOORS * FLOOR_HEIGHT / 2 + 1, 0);
buildingGroup.add(meshMap[6]);

// --- ELEMENTOS DE DISTRIBUCIÓN ---
const budiGeo = new THREE.BoxGeometry(1, 1.2, 0.6);
const budiMat = new THREE.MeshStandardMaterial({ color: 0x6c757d, roughness: 0.5, metalness: 0.5 });
const lateralGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.5, 8); 
lateralGeo.rotateZ(Math.PI / 2);
const lateralMat = new THREE.MeshStandardMaterial({ color: 0x00b4d8, roughness: 0.3, metalness: 0.4, emissive: 0x00b4d8, emissiveIntensity: 0.1 });
const ctrGeo = new THREE.BoxGeometry(0.6, 0.7, 0.18);
const ctrMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3, metalness: 0.1 });
const tomaGeo = new THREE.BoxGeometry(0.3, 0.4, 0.1);
const tomaMat = new THREE.MeshStandardMaterial({ color: 0xffc107, roughness: 0.3, metalness: 0.5 });
const internalWallGeo = new THREE.BoxGeometry(0.1, FLOOR_HEIGHT - 0.2, 4);
const internalGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.7, 8);
internalGeo.rotateZ(Math.PI / 2);

// Store lateral curves for particle logic
const pathMap = { main: null, vertical: null, lateral: null };

for (let i = 0; i < FLOORS; i++) {
    // 7. BUDI
    const budi = new THREE.Mesh(budiGeo, budiMat.clone());
    budi.position.set(0.8, i * FLOOR_HEIGHT + 1, 1);
    budi.castShadow = true;
    buildingGroup.add(budi);
    
    // Etiqueta BUDI
    const labelGeo = new THREE.PlaneGeometry(0.6, 0.3);
    const labelMat = new THREE.MeshBasicMaterial({ color: 0x00b4d8 });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.set(0.8, i * FLOOR_HEIGHT + 1.3, 1.31);
    buildingGroup.add(label);
    
    if (i === 1) meshMap[7] = budi;

    // 9. Canalización Lateral (Tubería Azul)
    const lateral = new THREE.Mesh(lateralGeo.clone(), lateralMat.clone());
    lateral.position.set(2.8, i * FLOOR_HEIGHT + 1.2, 1);
    buildingGroup.add(lateral);
    if (i === 1) meshMap[9] = lateral;

    // Cableado Fibra Óptica Horizontal
    const floorFiber = createFiberCable([
        new THREE.Vector3(0.9, i * FLOOR_HEIGHT + 1.2, 1), 
        new THREE.Vector3(2.8, i * FLOOR_HEIGHT + 1.2, 1), 
        new THREE.Vector3(4.7, i * FLOOR_HEIGHT + 1.2, 1), 
        new THREE.Vector3(4.9, i * FLOOR_HEIGHT + 1.2, 1), 
        new THREE.Vector3(5.3, i * FLOOR_HEIGHT + 1.2, 1.8), 
        new THREE.Vector3(6.3, i * FLOOR_HEIGHT + 1.2, 2), 
        new THREE.Vector3(7.8, i * FLOOR_HEIGHT + 1.2, 2)  
    ], 0x00b4d8);
    buildingGroup.add(floorFiber.mesh);
    
    // Save the curve of the second floor as the "representative" lateral path
    if (i === 1) pathMap.lateral = floorFiber.curve;

    // 10. CTR
    const ctr = new THREE.Mesh(ctrGeo.clone(), ctrMat.clone());
    ctr.position.set(4.8, i * FLOOR_HEIGHT + 1.2, 1); 
    ctr.castShadow = true;
    buildingGroup.add(ctr);
    
    // Luz indicador CTR
    const lightGeo = new THREE.CircleGeometry(0.08, 16);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x00cc00 });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(4.8, i * FLOOR_HEIGHT + 1.4, 1.1);
    buildingGroup.add(light);
    if (i === 1) meshMap[10] = ctr;

    // 11. Canalización Interna
    const internal = new THREE.Mesh(internalGeo.clone(), lateralMat.clone());
    internal.position.set(6.3, i * FLOOR_HEIGHT + 1.2, 2); 
    buildingGroup.add(internal);
    if (i === 1) meshMap[11] = internal;

    // 12. Tomas de Usuario
    const toma = new THREE.Mesh(tomaGeo, tomaMat.clone());
    toma.position.set(7.8, i * FLOOR_HEIGHT + 1.2, 2);
    toma.castShadow = true;
    buildingGroup.add(toma);
    
    const toma2 = new THREE.Mesh(tomaGeo.clone(), tomaMat.clone());
    toma2.position.set(7.8, i * FLOOR_HEIGHT + 1.2, 3); 
    buildingGroup.add(toma2);
    
    if (i === 2) meshMap[12] = toma;

    // Muro divisorio ficticio
    const wall = new THREE.Mesh(internalWallGeo, materials.wall);
    wall.position.set(4.85, i * FLOOR_HEIGHT + FLOOR_HEIGHT/2, 0);
    buildingGroup.add(wall);
}

// 8. Antenas (CORREGIDO)
const antennaGroup = new THREE.Group();
const dishGeo = new THREE.SphereGeometry(1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
const dishMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, metalness: 0.8, roughness: 0.2 });
const dish = new THREE.Mesh(dishGeo, dishMat);
dish.rotation.x = Math.PI - 0.5; 
dish.position.set(-2, 1.0, 0);
antennaGroup.add(dish);

const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8);
const armMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
const arm = new THREE.Mesh(armGeo, armMat);
arm.rotation.x = Math.PI - 0.5;
arm.position.set(-2, 1.5, 0.5);
antennaGroup.add(arm);

const antGeo = new THREE.CylinderGeometry(0.08, 0.12, 2.5);
const ant = new THREE.Mesh(antGeo, new THREE.MeshStandardMaterial({ color: 0xaaaabb, metalness: 0.9 }));
ant.position.set(2, 1.25, 0);
antennaGroup.add(ant);

const topGeo = new THREE.SphereGeometry(0.2);
const topMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });
const top = new THREE.Mesh(topGeo, topMat);
top.position.set(2, 2.6, 0);
antennaGroup.add(top);
glowMeshes.push({ mesh: top, baseIntensity: 0.8 });

antennaGroup.position.set(0, FLOORS * FLOOR_HEIGHT + 0.5, 0);
meshMap[8] = antennaGroup;
buildingGroup.add(antennaGroup);

// --- CREATE MARKERS AND LABELS ---
ritData.forEach(item => {
    const label = createLabel(item.id, item.name, item.pos);
    labelMap[item.id] = label;
    scene.add(label);
});

// --- DATA FLOW PARTICLES (SMART SYSTEM) ---
const particleCount = 100;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);
const particleProgress = new Float32Array(particleCount);
const particleSpeeds = [];

let activeCurve = null; 

for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = 0;
    particlePositions[i * 3 + 1] = -100; 
    particlePositions[i * 3 + 2] = 0;
    
    particleColors[i * 3] = 0.0;
    particleColors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
    particleColors[i * 3 + 2] = 0.2;
    
    particleProgress[i] = Math.random();
    particleSpeeds.push(0.002 + Math.random() * 0.003);
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

const particleMaterial = new THREE.PointsMaterial({
    size: 0.25,
    vertexColors: true,
    transparent: true,
    opacity: 0.0, 
    blending: THREE.AdditiveBlending 
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

// --- CABLES DE FIBRA PRINCIPALES & CURVES ---

const mainFiber = createFiberCable([
    new THREE.Vector3(18, -1.5, 0),
    new THREE.Vector3(8, -1.5, 0),
    new THREE.Vector3(7, -1.3, 0),
    new THREE.Vector3(4, -1.2, 0),
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(0, -1.05, 0)
], 0xff4d00);
scene.add(mainFiber.mesh);
pathMap.main = mainFiber.curve;

const verticalFiber = createFiberCable([
    new THREE.Vector3(0, -1.05, 0),
    new THREE.Vector3(0, 5, 0),
    new THREE.Vector3(0, 8, 0),
    new THREE.Vector3(0, 11, 0),
    new THREE.Vector3(0, 14, 0)
], 0xff4d00);
buildingGroup.add(verticalFiber.mesh);
pathMap.vertical = verticalFiber.curve;

// --- UI INTERACTION ---
const menu = document.getElementById('menu-items');
const tooltip = document.getElementById('tooltip');
const infoPanel = document.getElementById('info-panel');

ritData.forEach(item => {
    const div = document.createElement('div');
    div.className = 'rit-item';
    div.dataset.id = item.id;
    div.innerHTML = `
        <div class="number-badge">${item.id}</div>
        <div class="text-content">
            <b>${item.name}</b>
            <span>${item.desc.substring(0, 60)}...</span>
        </div>
        <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="#ff4d00" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
        </svg>
    `;
    div.onclick = () => focusItem(item.id, item.pos, div);
    menu.appendChild(div);
});

let activeItem = null;
let savedMaterialsState = []; // Stores { mesh, originalEmissiveColor, originalEmissiveIntensity }

// Helper to get all meshes from an object (including children)
function getMeshes(object) {
    const meshes = [];
    if (object.isMesh) {
        meshes.push(object);
    }
    if (object.isGroup) {
        object.traverse((child) => {
            if (child.isMesh) {
                meshes.push(child);
            }
        });
    }
    return meshes;
}

function restoreOriginalState() {
    if (savedMaterialsState.length > 0) {
        savedMaterialsState.forEach(state => {
            if (state.mesh.material) {
                state.mesh.material.emissive.setHex(state.originalEmissiveColor);
                state.mesh.material.emissiveIntensity = state.originalEmissiveIntensity;
            }
        });
        savedMaterialsState = [];
    }
}

function focusItem(id, pos, element) {
    document.querySelectorAll('.rit-item').forEach(el => el.classList.remove('active'));
    if (element) element.classList.add('active');

    // 1. Restore previous selection
    restoreOriginalState();

    activeItem = id;
    
    // 2. Highlight new selection (Save state & Set White)
    if (meshMap[id]) {
        const meshesToHighlight = getMeshes(meshMap[id]);
        
        meshesToHighlight.forEach(mesh => {
            if (mesh.material) {
                // Save state
                savedMaterialsState.push({
                    mesh: mesh,
                    originalEmissiveColor: mesh.material.emissive.getHex(),
                    originalEmissiveIntensity: mesh.material.emissiveIntensity
                });
                
                // Set highlight
                mesh.material.emissive.setHex(0xffffff);
            }
        });
    }

    // 3. Particle Logic
    if (id >= 1 && id <= 4) {
        activeCurve = pathMap.main;
        particles.material.opacity = 1.0;
        particles.parent = scene; 
    } else if (id === 5 || id === 6 || id === 8) {
        activeCurve = pathMap.vertical;
        particles.material.opacity = 1.0;
        particles.parent = buildingGroup;
    } else if (id >= 7) {
        activeCurve = pathMap.lateral;
        particles.material.opacity = 1.0;
        particles.parent = buildingGroup;
    } else {
        activeCurve = null;
        particles.material.opacity = 0.0;
    }

    // 4. Info Panel
    const item = ritData.find(r => r.id === id);
    if (item) {
        infoPanel.querySelector('.info-number').textContent = id;
        infoPanel.querySelector('.info-title').textContent = item.name;
        infoPanel.querySelector('.info-desc').textContent = item.desc;
        infoPanel.classList.add('visible');
    }

    // 5. Camera Logic
    const targetPos = new THREE.Vector3(pos[0], pos[1], pos[2]);
    let offset;
    
    // ID 8 (Antena) special offset to view from distance
    if (id === 8) {
        offset = new THREE.Vector3(10, 2, 10);
    } else if (id >= 7) { 
        offset = new THREE.Vector3(6, 0, 6);
    } else { 
        offset = new THREE.Vector3(12, 0, 12);
    }
    
    const newCamPos = targetPos.clone().add(offset);
    animateCamera(newCamPos, targetPos);
}

function animateCamera(newCamPos, newTarget) {
    let progress = 0;
    const duration = 60;
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();

    function animate() {
        progress++;
        const t = easeOutCubic(progress / duration);
        
        camera.position.lerpVectors(startPos, newCamPos, t);
        controls.target.lerpVectors(startTarget, newTarget, t);
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        }
    }
    animate();
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

infoPanel.querySelector('.info-close').onclick = () => {
    infoPanel.classList.remove('visible');
};

const resetBtn = document.querySelector('.nav-btn[data-action="reset"]');
resetBtn.addEventListener('click', () => {
    restoreOriginalState();
    activeItem = null;
    activeCurve = null;
    particles.material.opacity = 0.0;
    document.querySelectorAll('.rit-item').forEach(el => el.classList.remove('active'));
    infoPanel.classList.remove('visible');
});

const toggleLabelsBtn = document.getElementById('toggle-labels');
toggleLabelsBtn.onclick = () => {
    showLabels = !showLabels;
    toggleLabelsBtn.classList.toggle('active', showLabels);
    toggleLabelsBtn.innerHTML = showLabels ? 
        `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ocultar Etiquetas` :
        `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> Mostrar Etiquetas`;
    
    Object.values(labelMap).forEach(label => {
        label.visible = showLabels;
        label.element.style.display = showLabels ? 'block' : 'none';
    });
};

const navSpeed = 0.1;
const zoomSpeed = 2;
const panSpeed = 0.5;

document.querySelectorAll('.nav-btn').forEach(btn => {
    let intervalId = null;
    
    const action = btn.dataset.action;
    
    const executeAction = () => {
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position.clone().sub(controls.target));
        
        switch(action) {
            case 'rotate-left':
                spherical.theta -= navSpeed;
                camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
                break;
            case 'rotate-right':
                spherical.theta += navSpeed;
                camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
                break;
            case 'rotate-up':
                spherical.phi = Math.max(0.1, spherical.phi - navSpeed);
                camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
                break;
            case 'rotate-down':
                spherical.phi = Math.min(Math.PI - 0.1, spherical.phi + navSpeed);
                camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
                break;
            case 'zoom-in':
                camera.position.lerp(controls.target, 0.1);
                break;
            case 'zoom-out':
                const dir = camera.position.clone().sub(controls.target).normalize();
                camera.position.add(dir.multiplyScalar(zoomSpeed));
                break;
            case 'pan-left':
                const left = new THREE.Vector3(-panSpeed, 0, 0).applyQuaternion(camera.quaternion);
                camera.position.add(left);
                controls.target.add(left);
                break;
            case 'pan-right':
                const right = new THREE.Vector3(panSpeed, 0, 0).applyQuaternion(camera.quaternion);
                camera.position.add(right);
                controls.target.add(right);
                break;
            case 'pan-up':
                const up = new THREE.Vector3(0, panSpeed, 0);
                camera.position.add(up);
                controls.target.add(up);
                break;
            case 'pan-down':
                const down = new THREE.Vector3(0, -panSpeed, 0);
                camera.position.add(down);
                controls.target.add(down);
                break;
            case 'reset':
                animateCamera(new THREE.Vector3(35, 20, 35), new THREE.Vector3(0, 6, 0));
                restoreOriginalState();
                activeItem = null;
                activeCurve = null; 
                particles.material.opacity = 0.0;
                document.querySelectorAll('.rit-item').forEach(el => el.classList.remove('active'));
                infoPanel.classList.remove('visible');
                break;
        }
    };
    
    btn.onmousedown = () => {
        executeAction();
        intervalId = setInterval(executeAction, 50);
    };
    
    btn.onmouseup = () => clearInterval(intervalId);
    btn.onmouseleave = () => clearInterval(intervalId);
    btn.onclick = executeAction;
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.onclick = () => {
        const view = btn.dataset.view;
        let newPos, newTarget;
        
        switch(view) {
            case 'front':
                newPos = new THREE.Vector3(0, 8, 40);
                newTarget = new THREE.Vector3(0, 8, 0);
                break;
            case 'side':
                newPos = new THREE.Vector3(40, 8, 0);
                newTarget = new THREE.Vector3(0, 8, 0);
                break;
            case 'top':
                newPos = new THREE.Vector3(0, 45, 0.1);
                newTarget = new THREE.Vector3(0, 0, 0);
                break;
            case 'iso':
                newPos = new THREE.Vector3(35, 20, 35);
                newTarget = new THREE.Vector3(0, 6, 0);
                break;
        }
        
        animateCamera(newPos, newTarget);
    };
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const meshes = Object.values(meshMap).filter(m => m);
    const intersects = raycaster.intersectObjects(meshes, true);
    
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        let foundId = null;
        
        for (const [id, mesh] of Object.entries(meshMap)) {
            if (mesh === obj || (mesh.children && mesh.children.includes(obj))) {
                foundId = id;
                break;
            }
        }
        
        if (foundId) {
            const item = ritData.find(r => r.id == foundId);
            if (item) {
                tooltip.textContent = item.name;
                tooltip.style.left = event.clientX + 15 + 'px';
                tooltip.style.top = event.clientY + 15 + 'px';
                tooltip.classList.add('visible');
                document.body.style.cursor = 'pointer';
            }
        }
    } else {
        tooltip.classList.remove('visible');
        document.body.style.cursor = 'default';
    }
}

function onClick(event) {
    if (event.target.closest('#side-panel') || event.target.closest('#legend') || 
        event.target.closest('#nav-controls') || event.target.closest('#view-presets') ||
        event.target.closest('#toggle-labels') || event.target.closest('#info-panel')) return;
    
    raycaster.setFromCamera(mouse, camera);
    const meshes = Object.values(meshMap).filter(m => m);
    const intersects = raycaster.intersectObjects(meshes, true);
    
    if (intersects.length > 0) {
        const obj = intersects[0].object;
        let foundId = null;
        
        for (const [id, mesh] of Object.entries(meshMap)) {
            if (mesh === obj || (mesh.children && mesh.children.includes(obj))) {
                foundId = id;
                break;
            }
        }
        
        if (foundId) {
            const item = ritData.find(r => r.id == foundId);
            const element = document.querySelector(`.rit-item[data-id="${foundId}"]`);
            if (item && element) {
                focusItem(parseInt(foundId), item.pos, element);
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
}

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onClick);

let time = 0;

function animate() {
    requestAnimationFrame(animate);
    time += 0.016;
    
    // --- SMART PARTICLE ANIMATION ---
    if (activeCurve) {
        const positions = particles.geometry.attributes.position.array;
        
        for (let i = 0; i < particleCount; i++) {
            // Update progress
            particleProgress[i] += particleSpeeds[i];
            if (particleProgress[i] > 1) particleProgress[i] = 0;
            
            // Get point along the active curve
            const point = activeCurve.getPoint(particleProgress[i]);
            
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // --- PULSE ANIMATION (FOR GROUPS AND MESHES) ---
    if (activeItem && savedMaterialsState.length > 0) {
        // Base 1.0, amplitude 0.5 -> Range 0.5 to 1.5
        const pulse = 1.0 + Math.sin(time * 8) * 0.5;
        savedMaterialsState.forEach(state => {
            if (state.mesh.material) {
                state.mesh.material.emissiveIntensity = pulse;
            }
        });
    }
    
    // Animate glow meshes (Antenna light)
    glowMeshes.forEach((item, i) => {
        if (item.mesh && item.mesh.material) {
            item.mesh.material.emissiveIntensity = item.baseIntensity + Math.sin(time * 4) * 0.3;
        }
    });
    
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
}, 1500);

animate();
