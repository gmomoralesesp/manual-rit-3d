import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// --- CONFIGURACIÓN DE DATOS ---
const ritData = [
    { id: 1, name: "Cámara de acceso", desc: "Punto de entrada de los proveedores externos (BNUP).", pos: [18, -1.3, 0], color: '#6c757d' },
    { id: 2, name: "Canalización externa", desc: "Tubería subterránea naranja desde la calle.", pos: [14, -1.5, 0], color: '#ff4d00' },
    { id: 3, name: "Cámara de paso", desc: "Registro de ingreso para mantenimiento.", pos: [8, -1.3, 0], color: '#6c757d' },
    { id: 4, name: "Canalización de enlace", desc: "Conecta hacia las salas técnicas del edificio.", pos: [4, -1.2, 0], color: '#ff4d00' },
    { id: 5, name: "Sala SOTI / SOTS", desc: "Salas de Operaciones (Sótano y Azotea).", pos: [0, -1.05, 0], color: '#ff4d00' },
    { id: 6, name: "Canalización troncal", desc: "Shaft vertical principal.", pos: [0, 8, 0], color: '#ff4d00' },
    { id: 7, name: "Cajas distribución", desc: "Punto de derivación en cada piso.", pos: [0.8, 7, 1.2], color: '#6c757d' },
    { id: 8, name: "Captación de señal", desc: "Antenas satelitales en azotea.", pos: [0, 17, 0], color: '#ffffff' },
    { id: 9, name: "Canalización lateral", desc: "Tubería azul hacia departamentos.", pos: [2.5, 7, 1], color: '#00b4d8' },
    { id: 10, name: "Caja Terminación (CTR)", desc: "Terminal óptico dentro del hogar.", pos: [4.8, 7.5, 1], color: '#ffffff' },
    { id: 11, name: "Canalización interna", desc: "Ductos internos.", pos: [6.15, 7, 2], color: '#00b4d8' },
    { id: 12, name: "Tomas de usuario", desc: "Conexión final para equipos.", pos: [7.5, 6.5, 3], color: '#ffc107' }
];

let scene, camera, renderer, labelRenderer, controls;
let meshMap = {};
let labelMap = {};
let glowMeshes = [];
let savedMaterialsState = [];
let activeItem = null;

function init() {
    try {
        const container = document.getElementById('container');
        if (!container) throw new Error("No container");

        // 1. ESCENA
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f2f5); // Fondo limpio
        scene.fog = new THREE.Fog(0xf0f2f5, 40, 120); // Niebla suave

        // 2. CÁMARA
        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(35, 25, 35); // Vista isométrica inicial

        // 3. RENDERER (Calidad Alta)
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras suaves
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        container.appendChild(renderer.domElement);

        // 4. ETIQUETAS
        labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0';
        labelRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(labelRenderer.domElement);

        // 5. CONTROLES
        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 6, 0);
        controls.enableDamping = true;

        // --- ILUMINACIÓN (Crucial para el aspecto 3D) ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.8); // Sol fuerte
        dirLight.position.set(20, 50, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048; // Sombras nítidas
        dirLight.shadow.mapSize.height = 2048;
        scene.add(dirLight);

        const fillLight = new THREE.DirectionalLight(0xddeeff, 0.5); // Relleno azulado
        fillLight.position.set(-10, 10, -10);
        scene.add(fillLight);

        // --- CONSTRUCCIÓN (Gráficos High-Def) ---
        buildEnvironment();
        buildBuilding(); // Aquí está el edificio de vidrio
        buildRITElements(); // Aquí están las tuberías detalladas

        // --- UI ---
        createMenu();
        setupEventListeners();

        // --- FIN CARGA ---
        setTimeout(() => {
            const loader = document.getElementById('loading');
            if(loader) loader.classList.add('hidden');
        }, 800);

        animate();

    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
    }
}

// --- MATERIALES PREMIUM ---
const mats = {
    // Vidrio translúcido realista
    glass: new THREE.MeshPhysicalMaterial({
        color: 0xaaccff, transparent: true, opacity: 0.3, 
        metalness: 0.1, roughness: 0.05, transmission: 0.6, thickness: 0.5,
        side: THREE.DoubleSide
    }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.6 }),
    floor: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 }),
    ground: new THREE.MeshStandardMaterial({ color: 0xd0d4d8, roughness: 1 }),
    // Materiales RIT brillantes
    orangePipe: new THREE.MeshStandardMaterial({ color: 0xff4d00, roughness: 0.3, metalness: 0.2 }),
    bluePipe: new THREE.MeshStandardMaterial({ color: 0x00b4d8, roughness: 0.3, metalness: 0.2 }),
    darkBox: new THREE.MeshStandardMaterial({ color: 0x495057, roughness: 0.5 }),
};

function buildEnvironment() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), mats.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(100, 50, 0xbbbbbb, 0xdddddd);
    grid.position.y = -1.99;
    scene.add(grid);
}

function buildBuilding() {
    const group = new THREE.Group();
    const floors = 5;
    const h = 3; // Altura piso
    const w = 16; // Ancho
    const d = 10; // Profundidad

    for (let i = 0; i < floors; i++) {
        const y = i * h;
        // Losa
        const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), mats.floor);
        slab.position.y = y;
        slab.castShadow = true;
        slab.receiveShadow = true;
        group.add(slab);

        // Columnas
        const colPos = [[-w/2+0.5, d/2-0.5], [w/2-0.5, d/2-0.5], [-w/2+0.5, -d/2+0.5], [w/2-0.5, -d/2+0.5]];
        colPos.forEach(pos => {
            const col = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.6), mats.concrete);
            col.position.set(pos[0], y + h/2, pos[1]);
            col.castShadow = true;
            group.add(col);
        });

        // Vidrios (solo pisos superiores)
        if (i > 0) {
            const glassF = new THREE.Mesh(new THREE.PlaneGeometry(w-1, h-0.2), mats.glass);
            glassF.position.set(0, y + h/2, d/2);
            group.add(glassF);
            
            const glassB = glassF.clone();
            glassB.position.set(0, y + h/2, -d/2);
            glassB.rotation.y = Math.PI;
            group.add(glassB);
        }
    }
    
    // Techo
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w+1, 0.5, d+1), mats.concrete);
    roof.position.y = floors * h;
    roof.castShadow = true;
    group.add(roof);

    // Sótano transparente
    const basement = new THREE.Mesh(new THREE.BoxGeometry(w, 2, d), new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true, transparent: true, opacity: 0.2 }));
    basement.position.y = -1;
    group.add(basement);

    scene.add(group);
}

function buildRITElements() {
    // 1. Cámara Acceso
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), mats.darkBox);
    c1.position.set(18, -1.3, 0);
    scene.add(c1); meshMap[1] = c1;

    // 2. Canalización Externa (Tubo Naranja)
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8), mats.orangePipe);
    p2.rotation.z = Math.PI / 2;
    p2.position.set(14, -1.5, 0);
    scene.add(p2); meshMap[2] = p2;

    // 3. Cámara Paso
    const c3 = c1.clone();
    c3.position.set(8, -1.3, 0);
    scene.add(c3); meshMap[3] = c3;

    // 4. Enlace
    const p4 = p2.clone();
    p4.position.set(4, -1.2, 0);
    scene.add(p4); meshMap[4] = p4;

    // 5. Salas SOTI
    const soti = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2.5), mats.orangePipe);
    soti.position.set(0, -1, 0);
    scene.add(soti); meshMap[5] = soti;

    // 6. Troncal (Shaft)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 16), mats.orangePipe);
    shaft.position.set(0, 7, 0);
    scene.add(shaft); meshMap[6] = shaft;

    // Elementos por piso
    for (let i = 0; i < 5; i++) {
        const y = i * 3 + 1.2;

        // 7. BUDI
        const budi = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.5), mats.darkBox);
        budi.position.set(0.8, y, 1);
        scene.add(budi);
        if (i===2) meshMap[7] = budi;

        // 9. Lateral (Azul)
        const lat = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4), mats.bluePipe);
        lat.rotation.z = Math.PI / 2;
        lat.position.set(3, y, 1);
        scene.add(lat);
        if (i===2) meshMap[9] = lat;

        // 10. CTR
        const ctr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.2), new THREE.MeshStandardMaterial({color: 0xffffff}));
        ctr.position.set(5.2, y, 1);
        scene.add(ctr);
        if (i===2) meshMap[10] = ctr;

        // 11. Interna
        const intern = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3), mats.bluePipe);
        intern.rotation.z = Math.PI / 2;
        intern.rotation.y = -0.5;
        intern.position.set(6.5, y, 1.5);
        scene.add(intern);
        if (i===2) meshMap[11] = intern;

        // 12. Tomas
        const toma = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.05), new THREE.MeshStandardMaterial({color: 0xffc107}));
        toma.position.set(8, y, 2.2);
        scene.add(toma);
        if (i===2) meshMap[12] = toma;
    }

    // 8. Antena
    const antGroup = new THREE.Group();
    const dish = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16, 0, 6.3, 0, 1.2), new THREE.MeshStandardMaterial({color: 0xffffff, side: THREE.DoubleSide}));
    dish.rotation.x = Math.PI;
    dish.position.y = 1;
    antGroup.add(dish);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({color: 0xff0000}));
    glow.position.set(0, 1.5, 0);
    antGroup.add(glow);
    glowMeshes.push(glow);

    antGroup.position.set(0, 17.5, 0);
    scene.add(antGroup);
    meshMap[8] = antGroup;

    // Crear Etiquetas HTML
    ritData.forEach(d => {
        const div = document.createElement('div');
        div.className = 'label-tag';
        div.textContent = d.name;
        div.style.cssText = `background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; border: 1px solid ${d.color}; display: none;`;
        const label = new CSS2DObject(div);
        label.position.set(d.pos[0], d.pos[1] + 1, d.pos[2]);
        scene.add(label);
        labelMap[d.id] = label;
    });
}

function createMenu() {
    const container = document.getElementById('menu-items');
    if(!container) return;
    ritData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'rit-item';
        div.setAttribute('data-id', item.id);
        div.innerHTML = `
            <div class="number-badge">${item.id}</div>
            <div class="text-content">
                <b>${item.name}</b>
                <span>${item.desc.substring(0, 50)}...</span>
            </div>
        `;
        div.onclick = () => selectItem(item.id);
        container.appendChild(div);
    });
}

function selectItem(id) {
    savedMaterialsState.forEach(s => s.mesh.material.emissive.setHex(0x000000));
    savedMaterialsState = [];
    document.querySelectorAll('.rit-item').forEach(el => el.classList.remove('active'));

    activeItem = id;
    if (id === -1) {
        moveCamera(new THREE.Vector3(35, 25, 35), new THREE.Vector3(0, 6, 0));
        return;
    }

    const data = ritData.find(d => d.id === id);
    if (!data) return;

    const btn = document.querySelector(`.rit-item[data-id="${id}"]`);
    if(btn) {
        btn.classList.add('active');
        btn.scrollIntoView({behavior: 'smooth', block: 'center'});
    }

    const targetObj = meshMap[id];
    if (targetObj) {
        const meshes = [];
        targetObj.traverse(c => { if(c.isMesh) meshes.push(c); });
        if(targetObj.isMesh) meshes.push(targetObj);

        meshes.forEach(m => {
            if(m.material && m.material.emissive) {
                savedMaterialsState.push({mesh: m});
                m.material.emissive.setHex(0x555555);
            }
        });

        const targetPos = new THREE.Vector3(data.pos[0], data.pos[1], data.pos[2]);
        moveCamera(targetPos.clone().add(new THREE.Vector3(8, 5, 8)), targetPos);
        
        const info = document.getElementById('info-panel');
        if(info) {
            info.querySelector('.info-number').textContent = id;
            info.querySelector('.info-title').textContent = data.name;
            info.querySelector('.info-desc').textContent = data.desc;
            info.classList.add('visible');
        }
    }
}

function moveCamera(pos, target) {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    let t = 0;
    
    function anim() {
        t += 0.03;
        if (t > 1) t = 1;
        camera.position.lerpVectors(startPos, pos, t);
        controls.target.lerpVectors(startTarget, target, t);
        if (t < 1) requestAnimationFrame(anim);
    }
    anim();
}

function setupEventListeners() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.onclick = () => {
            const v = btn.dataset.view;
            if (v === 'iso') moveCamera(new THREE.Vector3(35, 25, 35), new THREE.Vector3(0, 6, 0));
            if (v === 'top') moveCamera(new THREE.Vector3(0, 50, 0), new THREE.Vector3(0, 0, 0));
            if (v === 'front') moveCamera(new THREE.Vector3(0, 10, 50), new THREE.Vector3(0, 10, 0));
            if (v === 'side') moveCamera(new THREE.Vector3(50, 10, 0), new THREE.Vector3(0, 10, 0));
        };
    });

    const toggle = document.getElementById('toggle-labels');
    if(toggle) {
        let show = false;
        toggle.onclick = (e) => {
            show = !show;
            e.currentTarget.classList.toggle('active');
            Object.values(labelMap).forEach(l => l.element.style.display = show ? 'block' : 'none');
        };
    }

    const reset = document.querySelector('.nav-btn[data-action="reset"]');
    if(reset) reset.onclick = () => {
        selectItem(-1);
        const info = document.getElementById('info-panel');
        if(info) info.classList.remove('visible');
    };

    const closeInfo = document.querySelector('.info-close');
    if(closeInfo) closeInfo.onclick = () => document.getElementById('info-panel').classList.remove('visible');

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
    });
}

let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.05;
    controls.update();

    if (activeItem) {
        const i = 0.5 + Math.sin(time) * 0.5;
        savedMaterialsState.forEach(s => s.mesh.material.emissiveIntensity = i);
    }
    glowMeshes.forEach(m => m.scale.setScalar(1 + Math.sin(time)*0.2));

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Iniciar
init();
