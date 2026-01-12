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
    const floorFiber = createFiberCable
