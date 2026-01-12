import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// --- CONFIGURACIÓN DE DATOS ---
const ritData = [
    { id: 1, name: "Cámara de acceso", desc: "Punto de entrada de los proveedores externos de telecomunicaciones (BNUP).", pos: [18, -1.3, 0], color: '#6c757d' },
    { id: 2, name: "Canalización externa", desc: "Tubería subterránea desde la calle hasta el predio.", pos: [14, -1.5, 0], color: '#ff4d00' },
    { id: 3, name: "Cámara de paso", desc: "Punto de registro y tiro al ingreso del condominio.", pos: [8, -1.3, 0], color: '#6c757d' },
    { id: 4, name: "Canalización de enlace", desc: "Conecta la entrada externa con las salas técnicas.", pos: [4, -1.2, 0], color: '#ff4d00' },
    { id: 5, name: "Sala SOTI / SOTS", desc: "Salas de Operaciones (Inferior y Superior).", pos: [0, -1.05, 0], color: '#ff4d00' },
    { id: 6, name: "Canalización troncal", desc: "Shaft vertical que recorre todos los pisos.", pos: [0, 8, 0], color: '#ff4d00' },
    { id: 7, name: "Cajas distribución", desc: "Punto de derivación en cada piso.", pos: [0.8, 7, 1.2], color: '#6c757d' },
    { id: 8, name: "Captación de señal", desc: "Antenas satelitales en azotea.", pos: [0, 17, 0], color: '#ffffff' },
    { id: 9, name: "Canalización lateral", desc: "Tubería hacia cada departamento.", pos: [2.5, 7, 1], color: '#00b4d8' },
    { id: 10, name: "Caja Terminación (CTR)", desc: "Punto terminal dentro del hogar.", pos: [4.8, 7.5, 1], color: '#ffffff' },
    { id: 11, name: "Canalización interna", desc: "Ductos dentro de los muros del hogar.", pos: [6.15, 7, 2], color: '#00b4d8' },
    { id: 12, name: "Tomas de usuario", desc: "Rosetas finales para conectar equipos.", pos: [7.5, 6.5, 3], color: '#ffc107' }
];

// Variables Globales
let scene, camera, renderer, labelRenderer, controls;
let meshMap = {};
let labelMap = {};
let particles;
let glowMeshes = [];
let savedMaterialsState = [];
let activeItem = null;

// --- INICIALIZACIÓN ---
function init() {
    const container = document.getElementById('container');

    // 1. Escena y Niebla (para profundidad)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f2f5); // Color gris claro limpio
    scene.fog = new THREE.Fog(0xf0f2f5, 40, 100);

    // 2. Cámara (Posición isométrica inicial)
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(35, 25, 35);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras suaves
    container.appendChild(renderer.domElement);

    // 4. Label Renderer (Etiquetas HTML flotantes)
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    // 5. Controles
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 6, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // No permitir ir bajo el suelo

    // --- ILUMINACIÓN (Más fuerte para evitar el look gris) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9); // Luz ambiente alta
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xddeeff, 0.6); // Luz de relleno azulada
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);

    // --- CONSTRUCCIÓN DEL MUNDO ---
    buildEnvironment();
    buildBuilding();
    buildRITElements();
    setupParticles();

    // --- INTERFAZ DE USUARIO ---
    createMenu();
    setupEventListeners();

    // Ocultar carga
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
    }, 1000);

    // Loop de animación
    animate();
}

// --- MATERIALES ---
const mats = {
    glass: new THREE.MeshPhysicalMaterial({
        color: 0xaaccff, transparent: true, opacity: 0.3, 
        metalness: 0.1, roughness: 0.1, transmission: 0.2, side: THREE.DoubleSide
    }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.5 }),
    floor: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 }),
    ground: new THREE.MeshStandardMaterial({ color: 0xd0d4d8, roughness: 1 }), // Suelo más oscuro para contraste
    highlight: new THREE.Color(0xffffff)
};

// --- ENTORNO ---
function buildEnvironment() {
    // Suelo
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), mats.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Calle
    const street = new THREE.Mesh(new THREE.PlaneGeometry(8, 100), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    street.rotation.x = -Math.PI / 2;
    street.position.set(22, -1.95, 0);
    street.receiveShadow = true;
    scene.add(street);

    // Grid auxiliar
    const grid = new THREE.GridHelper(100, 50, 0xbbbbbb, 0xdddddd);
    grid.position.y = -1.99;
    scene.add(grid);
}

// --- EDIFICIO ---
function buildBuilding() {
    const group = new THREE.Group();
    const floors = 5;
    const h = 3;
    const w = 16;
    const d = 10;

    for (let i = 0; i < floors; i++) {
        const y = i * h;
        
        // Losa (Piso)
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

    // Sótano (transparente)
    const basement = new THREE.Mesh(new THREE.BoxGeometry(w, 2, d), new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true, transparent: true, opacity: 0.3 }));
    basement.position.y = -1;
    group.add(basement);

    scene.add(group);
}

// --- ELEMENTOS RIT ---
function buildRITElements() {
    // Geometrías base
    const geoCam = new THREE.BoxGeometry(1.5, 1.2, 1.5);
    const geoPipe = new THREE.CylinderGeometry(0.2, 0.2, 1, 16);
    const geoBox = new THREE.BoxGeometry(0.8, 1, 0.5);
    
    // Materiales con color intenso
    const matOrange = new THREE.MeshStandardMaterial({ color: 0xff4d00, roughness: 0.3 });
    const matGrey = new THREE.MeshStandardMaterial({ color: 0x6c757d, roughness: 0.4 });
    const matBlue = new THREE.MeshStandardMaterial({ color: 0x00b4d8, roughness: 0.3 });
    const matYellow = new THREE.MeshStandardMaterial({ color: 0xffc107, roughness: 0.3 });

    // 1. Cámara Acceso
    const c1 = new THREE.Mesh(geoCam, matGrey);
    c1.position.set(18, -1.3, 0);
    scene.add(c1); meshMap[1] = c1;

    // 2. Canalización Externa
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8), matOrange);
    p2.rotation.z = Math.PI / 2;
    p2.position.set(14, -1.5, 0);
    scene.add(p2); meshMap[2] = p2;

    // 3. Cámara Paso
    const c3 = c1.clone();
    c3.position.set(8, -1.3, 0);
    scene.add(c3); meshMap[3] = c3;

    // 4. Enlace
    const p4 = p2.clone(); // reusar geometria pero ajustar longitud visualmente si es necesario
    p4.scale.y = 1; // 8 unidades
    p4.position.set(4, -1.2, 0);
    scene.add(p4); meshMap[4] = p4;

    // 5. Salas SOTI
    const soti = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2.5), matOrange);
    soti.position.set(0, -1, 0);
    scene.add(soti); meshMap[5] = soti;

    const sots = soti.clone();
    sots.position.set(0, 16, 0);
    scene.add(sots);

    // 6. Troncal (Shaft)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 16), matOrange);
    shaft.position.set(0, 7, 0);
    scene.add(shaft); meshMap[6] = shaft;

    // Loop para pisos
    for (let i = 0; i < 5; i++) {
        const y = i * 3 + 1.2;

        // 7. BUDI
        const budi = new THREE.Mesh(geoBox, matGrey);
        budi.position.set(0.8, y, 1);
        scene.add(budi);
        if (i===2) meshMap[7] = budi;

        // 9. Lateral (Tubo Azul)
        const lat = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4), matBlue);
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
        const intern = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3), matBlue);
        intern.rotation.z = Math.PI / 2;
        intern.rotation.y = -0.5;
        intern.position.set(6.5, y, 1.5);
        scene.add(intern);
        if (i===2) meshMap[11] = intern;

        // 12. Tomas
        const toma = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.05), matYellow);
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

    // Crear Etiquetas
    ritData.forEach(d => {
        const div = document.createElement('div');
        div.className = 'label-tag';
        div.textContent = d.name;
        div.style.cssText = `background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; border: 1px solid ${d.color}; display: none;`;
        const label = new CSS2DObject(div);
        label.position.set(d.pos[0], d.pos[1] + 1, d.pos[2]);
        scene.add(label);
        labelMap[d.id] = label;
    });
}

function setupParticles() {
    // Sistema simple de partículas (visual)
    const geom = new THREE.BufferGeometry();
    const count = 50;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count*3; i++) pos[i] = (Math.random()-0.5) * 50; // Random inicial
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    particles = new THREE.Points(geom, new THREE.PointsMaterial({color: 0x00ff00, size: 0.3, transparent: true, opacity: 0}));
    scene.add(particles);
}

// --- LÓGICA DE UI Y EVENTOS ---
function createMenu() {
    const container = document.getElementById('menu-items');
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
    // Resetear previos
    savedMaterialsState.forEach(s => s.mesh.material.emissive.setHex(0x000000));
    savedMaterialsState = [];
    document.querySelectorAll('.rit-item').forEach(el => el.classList.remove('active'));

    activeItem = id;
    const data = ritData.find(d => d.id === id);
    if (!data) return;

    // Highlight menú
    const btn = document.querySelector(`.rit-item[data-id="${id}"]`);
    if(btn) {
        btn.classList.add('active');
        btn.scrollIntoView({behavior: 'smooth', block: 'center'});
    }

    // Highlight 3D
    const targetObj = meshMap[id];
    if (targetObj) {
        const meshes = [];
        targetObj.traverse(c => { if(c.isMesh) meshes.push(c); });
        if(targetObj.isMesh) meshes.push(targetObj);

        meshes.forEach(m => {
            if(m.material && m.material.emissive) {
                savedMaterialsState.push({mesh: m});
                m.material.emissive.setHex(0x555555); // Brillo grisáceo al seleccionar
            }
        });

        // Mover Cámara
        const targetPos = new THREE.Vector3(data.pos[0], data.pos[1], data.pos[2]);
        const offset = new THREE.Vector3(10, 5, 10);
        
        moveCamera(targetPos.clone().add(offset), targetPos);
        
        // Mostrar Panel Info
        const info = document.getElementById('info-panel');
        info.querySelector('.info-number').textContent = id;
        info.querySelector('.info-title').textContent = data.name;
        info.querySelector('.info-desc').textContent = data.desc;
        info.classList.add('visible');
    }
}

function moveCamera(pos, target) {
    // Interpolación simple
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    let t = 0;
    
    function anim() {
        t += 0.02;
        if (t > 1) t = 1;
        camera.position.lerpVectors(startPos, pos, t);
        controls.target.lerpVectors(startTarget, target, t);
        if (t < 1) requestAnimationFrame(anim);
    }
    anim();
}

function setupEventListeners() {
    // Botones Vistas
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.onclick = () => {
            const v = btn.dataset.view;
            if (v === 'iso') moveCamera(new THREE.Vector3(35, 25, 35), new THREE.Vector3(0, 6, 0));
            if (v === 'top') moveCamera(new THREE.Vector3(0, 50, 0), new THREE.Vector3(0, 0, 0));
            if (v === 'front') moveCamera(new THREE.Vector3(0, 10, 50), new THREE.Vector3(0, 10, 0));
            if (v === 'side') moveCamera(new THREE.Vector3(50, 10, 0), new THREE.Vector3(0, 10, 0));
        };
    });

    // Etiquetas Toggle
    let showLabels = false;
    document.getElementById('toggle-labels').onclick = (e) => {
        showLabels = !showLabels;
        e.currentTarget.classList.toggle('active');
        Object.values(labelMap).forEach(l => l.element.style.display = showLabels ? 'block' : 'none');
    };

    // Close info
    document.querySelector('.info-close').onclick = () => document.getElementById('info-panel').classList.remove('visible');

    // Reset general
    document.querySelector('.nav-btn[data-action="reset"]').onclick = () => {
        selectItem(-1); // Deseleccionar
        moveCamera(new THREE.Vector3(35, 25, 35), new THREE.Vector3(0, 6, 0));
        document.getElementById('info-panel').classList.remove('visible');
    };

    // Raycaster para clicks en 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    window.addEventListener('click', (e) => {
        if (e.target.closest('#side-panel') || e.target.closest('button')) return;

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        
        const intersects = raycaster.intersectObjects(scene.children, true);
        if(intersects.length > 0) {
            let foundId = null;
            // Buscar si el objeto intersectado pertenece a algún ID
            for (const [id, obj] of Object.entries(meshMap)) {
                obj.traverse(c => { if(c === intersects[0].object) foundId = id; });
                if(obj === intersects[0].object) foundId = id;
            }
            if(foundId) selectItem(parseInt(foundId));
        }
    });

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// --- ANIMACIÓN ---
let time = 0;
function animate() {
    requestAnimationFrame(animate);
    time += 0.05;
    controls.update();

    // Pulse effects
    if (activeItem) {
        const i = 0.5 + Math.sin(time) * 0.5;
        savedMaterialsState.forEach(s => s.mesh.material.emissiveIntensity = i);
    }
    glowMeshes.forEach(m => m.scale.setScalar(1 + Math.sin(time)*0.2));

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// Iniciar todo
init();
