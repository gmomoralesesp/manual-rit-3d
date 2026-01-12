import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// --- DATOS RIT ---
const ritData = [
    { id: 1, name: "Cámara de acceso", desc: "Ubicada en BNUP. Punto de entrada de los proveedores externos.", pos: [18, -1.3, 0], color: '#6c757d' },
    { id: 2, name: "Canalización externa", desc: "Tubería subterránea que transporta los cables desde la calle.", pos: [14, -1.5, 0], color: '#ff4d00' },
    { id: 3, name: "Cámara de paso", desc: "Punto de registro y tiro al ingreso del condominio.", pos: [8, -1.3, 0], color: '#6c757d' },
    { id: 4, name: "Canalización de enlace", desc: "Ducto principal hacia salas técnicas.", pos: [4, -1.2, 0], color: '#ff4d00' },
    { id: 5, name: "Sala SOTI / SOTS", desc: "Salas de Operaciones (Sótano y Azotea). Centro neurálgico.", pos: [0, -1.05, 0], color: '#ff4d00' },
    { id: 6, name: "Canalización troncal", desc: "Shaft vertical que recorre todos los pisos.", pos: [0, 8, 0], color: '#ff4d00' },
    { id: 7, name: "Cajas distribución", desc: "Punto de derivación en cada piso.", pos: [0.8, 7, 1.2], color: '#6c757d' },
    { id: 8, name: "Captación de señal", desc: "Antenas satelitales en la azotea.", pos: [0, 17, 0], color: '#ffffff' },
    { id: 9, name: "Canalización lateral", desc: "Tubería horizontal hacia departamentos.", pos: [2.5, 7, 1], color: '#00b4d8' },
    { id: 10, name: "Caja Terminación (CTR)", desc: "Terminal óptico dentro del hogar.", pos: [4.8, 7.5, 1], color: '#ffffff' },
    { id: 11, name: "Canalización interna", desc: "Ductos dentro de los muros.", pos: [6.15, 7, 2], color: '#00b4d8' },
    { id: 12, name: "Tomas de usuario", desc: "Rosetas finales para TV e Internet.", pos: [7.5, 6.5, 3], color: '#ffc107' }
];

// Variables
let scene, camera, renderer, labelRenderer, controls;
let meshMap = {};
let labelMap = {};
let glowMeshes = [];
let savedMaterialsState = [];
let activeItem = null;

function init() {
    try {
        const container = document.getElementById('container');
        if (!container) throw new Error("No container div");

        // 1. ESCENA & CAMARA
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f2f5);
        scene.fog = new THREE.Fog(0xf0f2f5, 40, 100);

        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(35, 25, 35); // Vista Isometrica

        // 2. RENDERER (Alta Calidad)
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        container.appendChild(renderer.domElement);

        labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0';
        labelRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(labelRenderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 6, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // 3. LUCES
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xffffff, 1.8);
        sun.position.set(20, 50, 20);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        scene.add(sun);

        const fill = new THREE.DirectionalLight(0xddeeff, 0.5);
        fill.position.set(-10, 10, -10);
        scene.add(fill);

        // 4. CONSTRUIR MUNDO (Versión Detallada)
        buildEnvironment();
        buildBuilding();
        buildRITElements();

        // 5. UI
        createMenu();
        setupEvents();

        // Fin Carga
        setTimeout(() => document.getElementById('loading').classList.add('hidden'), 800);
        
        animate();

    } catch (e) {
        console.error(e);
        alert("Error iniciando 3D: " + e.message);
    }
}

// --- MATERIALES AVANZADOS ---
const mats = {
    glass: new THREE.MeshPhysicalMaterial({
        color: 0xaaccff, transparent: true, opacity: 0.3,
        roughness: 0.1, metalness: 0.1, transmission: 0.5, thickness: 0.5,
        side: THREE.DoubleSide
    }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.6 }),
    floor: new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.8 }),
    ground: new THREE.MeshStandardMaterial({ color: 0xd0d4d8, roughness: 1 }),
    orange: new THREE.MeshStandardMaterial({ color: 0xff4d00, roughness: 0.4, metalness: 0.2 }),
    blue: new THREE.MeshStandardMaterial({ color: 0x00b4d8, roughness: 0.4, metalness: 0.2 }),
    grey: new THREE.MeshStandardMaterial({ color: 0x6c757d, roughness: 0.5 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xffc107, roughness: 0.4 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x343a40 })
};

function buildEnvironment() {
    // Suelo
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), mats.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Grid
    const grid = new THREE.GridHelper(100, 50, 0xbbbbbb, 0xdddddd);
    grid.position.y = -1.99;
    scene.add(grid);

    // Calle
    const street = new THREE.Mesh(new THREE.PlaneGeometry(8, 100), mats.dark);
    street.rotation.x = -Math.PI / 2;
    street.position.set(22, -1.98, 0);
    street.receiveShadow = true;
    scene.add(street);
}

function buildBuilding() {
    const group = new THREE.Group();
    const floors = 5;
    const h = 3, w = 16, d = 10;

    for (let i = 0; i < floors; i++) {
        const y = i * h;
        // Losa
        const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), mats.floor);
        slab.position.y = y;
        slab.castShadow = true;
        slab.receiveShadow = true;
        group.add(slab);

        // Columnas
        const positions = [[-w/2+0.5, d/2-0.5], [w/2-0.5, d/2-0.5], [-w/2+0.5, -d/2+0.5], [w/2-0.5, -d/2+0.5]];
        positions.forEach(p => {
            const col = new THREE.Mesh(new THREE.BoxGeometry(0.6, h, 0.6), mats.concrete);
            col.position.set(p[0], y + h/2, p[1]);
            col.castShadow = true;
            group.add(col);
        });

        // Vidrios
        if (i > 0) {
            const g1 = new THREE.Mesh(new THREE.PlaneGeometry(w-1, h-0.2), mats.glass);
            g1.position.set(0, y + h/2, d/2);
            group.add(g1);
            const g2 = g1.clone();
            g2.position.set(0, y + h/2, -d/2);
            g2.rotation.y = Math.PI;
            group.add(g2);
        }
    }
    
    // Techo
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w+1, 0.5, d+1), mats.concrete);
    roof.position.y = floors * h;
    roof.castShadow = true;
    group.add(roof);

    // Sótano transparente
    const basement = new THREE.Mesh(new THREE.BoxGeometry(w, 2, d), new THREE.MeshBasicMaterial({color: 0x555555, wireframe: true, transparent: true, opacity: 0.2}));
    basement.position.y = -1;
    group.add(basement);

    scene.add(group);
}

function buildRITElements() {
    // Geometrias Reutilizables
    const geoCam = new THREE.BoxGeometry(1.5, 1.2, 1.5);
    const geoPipe = new THREE.CylinderGeometry(0.15, 0.15, 1, 16);
    const geoBox = new THREE.BoxGeometry(0.8, 1, 0.5);

    // 1. Cámara Acceso
    const c1 = new THREE.Mesh(geoCam, mats.grey);
    c1.position.set(18, -1.3, 0);
    scene.add(c1); meshMap[1] = c1;

    // 2. Canalización Externa (Tubo)
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8), mats.orange);
    p2.rotation.z = Math.PI / 2;
    p2.position.set(14, -1.5, 0);
    scene.add(p2); meshMap[2] = p2;

    // 3. Cámara Paso
    const c3 = c1.clone();
    c3.position.set(8, -1.3, 0);
    scene.add(c3); meshMap[3] = c3;

    // 4. Enlace
    const p4 = p2.clone(); // Reusa geometria tubo
    p4.position.set(4, -1.2, 0);
    scene.add(p4); meshMap[4] = p4;

    // 5. Salas SOTI
    const soti = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2.5), mats.orange);
    soti.position.set(0, -1, 0);
    scene.add(soti); meshMap[5] = soti;

    // 6. Troncal
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 16), mats.orange);
    shaft.position.set(0, 7, 0);
    scene.add(shaft); meshMap[6] = shaft;

    // Loop pisos
    for(let i=0; i<5; i++) {
        const y = i * 3 + 1.2;
        
        // 7. BUDI
        const budi = new THREE.Mesh(geoBox, mats.grey);
        budi.position.set(0.8, y, 1);
        scene.add(budi);
        if(i===2) meshMap[7] = budi;

        // 9. Lateral (Azul)
        const lat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4), mats.blue);
        lat.rotation.z = Math.PI / 2;
        lat.position.set(3, y, 1);
        scene.add(lat);
        if(i===2) meshMap[9] = lat;

        // 10. CTR
        const ctr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.2), new THREE.MeshStandardMaterial({color: 0xffffff}));
        ctr.position.set(5.2, y, 1);
        scene.add(ctr);
        if(i===2) meshMap[10] = ctr;

        // 11. Interna
        const intern = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3), mats.blue);
        intern.rotation.z = Math.PI / 2;
        intern.rotation.y = -0.5;
        intern.position.set(6.5, y, 1.5);
        scene.add(intern);
        if(i===2) meshMap[11] = intern;

        // 12. Tomas
        const toma = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.05), mats.yellow);
        toma.position.set(8, y, 2.2);
        scene.add(toma);
        if(i===2) meshMap[12] = toma;
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

    // Etiquetas HTML
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
    ritData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'rit-item';
        div.setAttribute('data-id', item.id);
        div.innerHTML = `
            <div class="number-badge">${item.id}</div>
            <div class="text-content">
                <b>${item.name}</b>
                <span>${item.desc.substring(0, 45)}...</span>
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
    if (data) {
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
        }

        const targetPos = new THREE.Vector3(data.pos[0], data.pos[1], data.pos[2]);
        moveCamera(targetPos.clone().add(new THREE.Vector3(10, 5, 10)), targetPos);
        
        const info = document.getElementById('info-panel');
        info.querySelector('.info-number').textContent = id;
        info.querySelector('.info-title').textContent = data.name;
        info.querySelector('.info-desc').textContent = data.desc;
        info.classList.add('visible');
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

function setupEvents() {
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
    let show = false;
    toggle.onclick = (e) => {
        show = !show;
        e.currentTarget.classList.toggle('active');
        Object.values(labelMap).forEach(l => l.element.style.display = show ? 'block' : 'none');
    };

    document.querySelector('.nav-btn[data-action="reset"]').onclick = () => {
        selectItem(-1);
        document.getElementById('info-panel').classList.remove('visible');
    };
    
    document.querySelector('.info-close').onclick = () => document.getElementById('info-panel').classList.remove('visible');

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
    if(activeItem) {
        const i = 0.5 + Math.sin(time) * 0.5;
        savedMaterialsState.forEach(s => s.mesh.material.emissiveIntensity = i);
    }
    glowMeshes.forEach(m => m.scale.setScalar(1 + Math.sin(time)*0.2));
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

init();
