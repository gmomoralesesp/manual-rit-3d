import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- CONFIGURACIÓN DE DATOS ---
const ritData = [
    { id: 1, name: "Cámara de acceso", desc: "Ubicada en BNUP. Entrada principal de proveedores.", pos: [18, -1.5, 0] },
    { id: 2, name: "Canalización externa", desc: "Ductos subterráneos que cruzan el límite del predio.", pos: [14, -1.5, 0] },
    { id: 3, name: "Cámara de paso", desc: "Punto de registro al ingreso del condominio.", pos: [8, -1.5, 0] },
    { id: 4, name: "Canalización enlace", desc: "Conecta la entrada con las salas técnicas (SOTI).", pos: [4, -1.2, 0] },
    { id: 5, name: "Sala SOTI / SOTS", desc: "Centro de control y distribución del edificio.", pos: [0, -1.05, 0] },
    { id: 6, name: "Shaft Troncal", desc: "Canalización vertical que recorre todos los pisos.", pos: [0, 8, 0] },
    { id: 7, name: "Cajas BUDI", desc: "Distribución de fibra óptica por cada nivel.", pos: [0.8, 7, 1.2] },
    { id: 8, name: "Captación Azotea", desc: "Antenas satelitales y sistemas superiores.", pos: [0, 16, 0] },
    { id: 9, name: "Red Lateral", desc: "Ductos horizontales hacia los departamentos.", pos: [2.5, 7, 1] },
    { id: 10, name: "CTR Domiciliaria", desc: "Caja terminal de red dentro de la vivienda.", pos: [4.8, 7.5, 1] },
    { id: 11, name: "Red Interna", desc: "Ductos que alimentan las tomas del hogar.", pos: [6.15, 7, 2] },
    { id: 12, name: "Tomas Usuario", desc: "Rosetas finales para TV e Internet.", pos: [7.5, 6.5, 3] }
];

// --- INICIALIZACIÓN ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f2f5);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(35, 25, 35);
controls.enableDamping = true;

// --- LUCES ---
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(20, 40, 20);
sun.castShadow = true;
scene.add(sun);

// --- ENTORNO (Suelo y Calle) ---
const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0xdde0e3 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2;
ground.receiveShadow = true;
scene.add(ground);

const street = new THREE.Mesh(new THREE.PlaneGeometry(10, 100), new THREE.MeshStandardMaterial({ color: 0x333333 }));
street.rotation.x = -Math.PI / 2;
street.position.set(22, -1.98, 0);
scene.add(street);

// --- EDIFICIO TÉCNICO ---
const building = new THREE.Group();
const slabGeo = new THREE.BoxGeometry(16, 0.25, 10);
const slabMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.12 });

for (let i = 0; i <= 5; i++) {
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = i * 3;
    building.add(slab);
    
    // Columnas
    if(i < 5) {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3, 0.4), slabMat);
        col.position.set(7.5, i * 3 + 1.5, 4.5); building.add(col);
        const col2 = col.clone(); col2.position.set(-7.5, i * 3 + 1.5, 4.5); building.add(col2);
    }
}
const walls = new THREE.Mesh(new THREE.BoxGeometry(15.8, 15, 9.8), glassMat);
walls.position.y = 7.5;
building.add(walls);
scene.add(building);

// --- INFRAESTRUCTURA RIT (DUCTOS Y EQUIPOS) ---
const orangeMat = new THREE.MeshStandardMaterial({ color: 0xff4d00, roughness: 0.3 });
const blueMat = new THREE.MeshStandardMaterial({ color: 0x00b4d8, roughness: 0.3 });
const greyMat = new THREE.MeshStandardMaterial({ color: 0x6c757d });

// 1. Cámaras Subterráneas
function createBox(w, h, d, x, y, z, mat, id) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    scene.add(m);
    return m;
}
createBox(2, 1.5, 2, 18, -1.3, 0, greyMat); // Cam 1
createBox(2, 1.5, 2, 8, -1.3, 0, greyMat);  // Cam 3

// 2. Ductos Troncales (Naranjas)
function createDuct(len, r, x, y, z, mat, vert = false) {
    const geo = new THREE.CylinderGeometry(r, r, len, 16);
    if(!vert) geo.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    scene.add(m);
}
createDuct(10, 0.2, 13, -1.5, 0, orangeMat); // Canal externa
createDuct(8, 0.2, 4, -1.2, 0, orangeMat);  // Enlace
createDuct(18, 0.4, 0, 8, 0, orangeMat, true); // Shaft Troncal

// 3. Red Lateral (Azul)
createDuct(5, 0.1, 2.5, 7.2, 1, blueMat); // Lateral 1

// 4. Equipamiento
createBox(3, 1.8, 3, 0, -1.1, 0, orangeMat); // SOTI
createBox(0.8, 1.2, 0.6, 0.8, 7.1, 1.2, greyMat); // BUDI
createBox(0.5, 0.6, 0.15, 4.8, 7.5, 1, new THREE.MeshStandardMaterial({color:0xffffff})); // CTR

// 5. Antena
const antenna = new THREE.Group();
const dish = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshStandardMaterial({color:0xffffff}));
dish.rotation.x = Math.PI;
antenna.add(dish);
antenna.position.set(0, 15.6, 0);
scene.add(antenna);

// --- FLUJO DE DATOS (PARTÍCULAS) ---
const particles = [];
const pGeo = new THREE.SphereGeometry(0.12, 8, 8);
const pMat = new THREE.MeshBasicMaterial({ color: 0x28a745 });

for(let i=0; i<15; i++) {
    const p = new THREE.Mesh(pGeo, pMat);
    p.userData = { speed: 0.05 + Math.random()*0.05, offset: Math.random() * 10 };
    scene.add(p);
    particles.push(p);
}

// --- UI E INTERACCIÓN ---
const menu = document.getElementById('menu-items');
const info = document.getElementById('info-panel');

ritData.forEach(item => {
    const div = document.createElement('div');
    div.className = 'rit-item';
    div.innerHTML = `<div class="number-badge">${item.id}</div><span>${item.name}</span>`;
    div.onclick = () => {
        document.querySelectorAll('.rit-item').forEach(el => el.classList.remove('active'));
        div.classList.add('active');
        focusItem(item);
    };
    menu.appendChild(div);
});

function focusItem(item) {
    const target = new THREE.Vector3(...item.pos);
    const camPos = target.clone().add(new THREE.Vector3(12, 8, 12));
    
    // Animación de cámara manual
    let i = 0;
    const animate = () => {
        i += 0.05;
        camera.position.lerp(camPos, 0.1);
        controls.target.lerp(target, 0.1);
        if(i < 1) requestAnimationFrame(animate);
    };
    animate();

    info.querySelector('.info-number').textContent = item.id;
    info.querySelector('.info-title').textContent = item.name;
    info.querySelector('.info-desc').textContent = item.desc;
    info.classList.add('visible');
}

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.onclick = () => {
        const v = btn.dataset.view;
        if(v === 'front') camera.position.set(0, 8, 40);
        if(v === 'side') camera.position.set(40, 8, 0);
        if(v === 'iso') camera.position.set(35, 25, 35);
        controls.target.set(0, 6, 0);
    };
});

document.getElementById('reset-view').onclick = () => {
    camera.position.set(35, 25, 35);
    controls.target.set(0, 6, 0);
    info.classList.remove('visible');
};

// --- LOOP PRINCIPAL ---
function animate(time) {
    requestAnimationFrame(animate);
    
    // Animar flujo de datos
    particles.forEach((p, idx) => {
        const t = (time * 0.001 * p.userData.speed + p.userData.offset) % 1;
        // Trayectoria simple por el shaft troncal
        p.position.set(0, t * 15, 0);
    });

    controls.update();
    renderer.render(scene, camera);
}

window.onload = () => setTimeout(() => document.getElementById('loading').classList.add('hidden'), 1500);
animate(0);

window.onresize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};
