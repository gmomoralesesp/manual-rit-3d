import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// --- DATA ---
const ritData = [
    { id: 1, name: "Cámara de acceso", desc: "Ubicada en BNUP (Bien Nacional de Uso Público). Punto de entrada de los proveedores externos.", pos: [18, -1.5, 0] },
    { id: 2, name: "Canalización externa", desc: "Tubería subterránea que transporta los cables desde la calle hasta el predio.", pos: [14, -1.5, 0] },
    { id: 3, name: "Cámara de paso", desc: "Punto de registro y tiro al ingreso del condominio.", pos: [8, -1.5, 0] },
    { id: 4, name: "Canalización de enlace", desc: "Ducto principal que conecta la entrada con las salas técnicas.", pos: [4, -1.2, 0] },
    { id: 5, name: "Sala SOTI / SOTS", desc: "Salas de Operaciones de Telecomunicaciones (Sótano y Azotea).", pos: [0, -1.05, 0] },
    { id: 6, name: "Canalización troncal", desc: "Shaft vertical que recorre todos los pisos del edificio.", pos: [0, 8, 0] },
    { id: 7, name: "Cajas BUDI", desc: "Punto de derivación en cada piso para conexión hacia departamentos.", pos: [0.8, 7, 1.2] },
    { id: 8, name: "Captación Azotea", desc: "Antenas satelitales y sistemas de recepción superior.", pos: [0, 16, 0] },
    { id: 9, name: "Canalización lateral", desc: "Tubería horizontal desde el shaft troncal al departamento.", pos: [2.5, 7, 1] },
    { id: 10, name: "Caja CTR", desc: "Caja terminación domiciliaria (2 pelos de fibra).", pos: [4.8, 7.5, 1] },
    { id: 11, name: "Canalización interna", desc: "Ductos dentro de los muros del hogar.", pos: [6.15, 7, 2] },
    { id: 12, name: "Tomas de usuario", desc: "Rosetas finales para TV, Internet y Telefonía.", pos: [7.5, 6.5, 3] }
];

// --- SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f2f5);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('container').appendChild(renderer.domElement);

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

// --- LIGHTING ---
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(20, 40, 20);
sun.castShadow = true;
scene.add(sun);

// --- BUILDING ---
const buildingGroup = new THREE.Group();
const floorGeo = new THREE.BoxGeometry(16, 0.2, 10);
const floorMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.15 });

for (let i = 0; i <= 5; i++) {
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = i * 3;
    floor.receiveShadow = true;
    buildingGroup.add(floor);
}
const walls = new THREE.Mesh(new THREE.BoxGeometry(15.8, 15, 9.8), glassMat);
walls.position.y = 7.5;
buildingGroup.add(walls);
scene.add(buildingGroup);

// --- ESTRUCTURA RIT ---
const meshMap = {};
const pipeMat = new THREE.MeshStandardMaterial({ color: 0xff4d00 });
const blueMat = new THREE.MeshStandardMaterial({ color: 0x00b4d8 });

// Shaft Troncal
const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 18, 16), pipeMat);
shaft.position.set(0, 7.5, 0);
scene.add(shaft);
meshMap[6] = shaft;

// Tuberías horizontales simplificadas para el ejemplo
function createPipe(len, pos, mat, id) {
    const geo = new THREE.CylinderGeometry(0.2, 0.2, len, 12);
    geo.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    scene.add(m);
    if(id) meshMap[id] = m;
}
createPipe(10, [13, -1.5, 0], pipeMat, 2);
createPipe(8, [4, -1.2, 0], pipeMat, 4);

// --- PARTICLES (DATA FLOW) ---
const particleCount = 50;
const pGeo = new THREE.SphereGeometry(0.1, 8, 8);
const pMat = new THREE.MeshBasicMaterial({ color: 0x28a745 });
const particles = [];
for(let i=0; i<particleCount; i++) {
    const p = new THREE.Mesh(pGeo, pMat);
    p.visible = false;
    scene.add(p);
    particles.push(p);
}

// --- UI & INTERACTION ---
const menu = document.getElementById('menu-items');
const info = document.getElementById('info-panel');
const labelMap = {};

ritData.forEach(item => {
    // Menú
    const div = document.createElement('div');
    div.className = 'rit-item';
    div.innerHTML = `<div class="number-badge">${item.id}</div><div class="text-content"><b>${item.name}</b></div>`;
    div.onclick = () => focusItem(item.id, item.pos);
    menu.appendChild(div);

    // Etiquetas 3D
    const lblDiv = document.createElement('div');
    lblDiv.className = 'label3d';
    lblDiv.style.color = 'white';
    lblDiv.style.background = 'rgba(0,0,0,0.6)';
    lblDiv.style.padding = '2px 5px';
    lblDiv.style.borderRadius = '4px';
    lblDiv.style.fontSize = '10px';
    lblDiv.textContent = item.name;
    const label = new CSS2DObject(lblDiv);
    label.position.set(item.pos[0], item.pos[1] + 1, item.pos[2]);
    label.visible = false;
    scene.add(label);
    labelMap[item.id] = label;
});

function focusItem(id, pos) {
    const target = new THREE.Vector3(...pos);
    const camPos = target.clone().add(new THREE.Vector3(12, 8, 12));
    
    // Animación de cámara
    let step = 0;
    const animateCam = () => {
        step += 0.05;
        camera.position.lerp(camPos, 0.1);
        controls.target.lerp(target, 0.1);
        if(step < 1) requestAnimationFrame(animateCam);
    };
    animateCam();

    const data = ritData.find(d => d.id === id);
    info.querySelector('.info-number').textContent = id;
    info.querySelector('.info-title').textContent = data.name;
    info.querySelector('.info-desc').textContent = data.desc;
    info.classList.add('visible');
}

// Eventos de botones
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.onclick = () => {
        const v = btn.dataset.view;
        if(v === 'front') camera.position.set(0, 8, 40);
        if(v === 'side') camera.position.set(40, 8, 0);
        if(v === 'top') camera.position.set(0, 50, 0);
        if(v === 'iso') camera.position.set(35, 20, 35);
        controls.target.set(0, 6, 0);
    };
});

document.getElementById('toggle-labels').onclick = function() {
    const active = this.classList.toggle('active');
    Object.values(labelMap).forEach(l => l.visible = active);
    this.textContent = active ? "Ocultar Etiquetas" : "Mostrar Etiquetas";
};

// Loop principal
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

window.onload = () => setTimeout(() => document.getElementById('loading').classList.add('hidden'), 1500);
animate();

window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
};
