// INDICADOR DE INICIO (Abre la consola F12 para ver esto)
console.log("--> Intentando cargar script.js...");

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

console.log("--> Librerías Three.js importadas correctamente.");

// --- DATOS ---
const ritData = [
    { id: 1, name: "Cámara de acceso", desc: "Punto de entrada (BNUP).", pos: [18, -1.3, 0], color: '#6c757d' },
    { id: 2, name: "Canalización externa", desc: "Tubería subterránea.", pos: [14, -1.5, 0], color: '#ff4d00' },
    { id: 3, name: "Cámara de paso", desc: "Registro de ingreso.", pos: [8, -1.3, 0], color: '#6c757d' },
    { id: 4, name: "Canalización de enlace", desc: "Conecta a salas técnicas.", pos: [4, -1.2, 0], color: '#ff4d00' },
    { id: 5, name: "Sala SOTI / SOTS", desc: "Salas de Operaciones.", pos: [0, -1.05, 0], color: '#ff4d00' },
    { id: 6, name: "Canalización troncal", desc: "Shaft vertical.", pos: [0, 8, 0], color: '#ff4d00' },
    { id: 7, name: "Cajas distribución", desc: "Derivación por piso.", pos: [0.8, 7, 1.2], color: '#6c757d' },
    { id: 8, name: "Captación de señal", desc: "Antenas satelitales.", pos: [0, 17, 0], color: '#ffffff' },
    { id: 9, name: "Canalización lateral", desc: "Hacia departamentos.", pos: [2.5, 7, 1], color: '#00b4d8' },
    { id: 10, name: "Caja Terminación (CTR)", desc: "Terminal hogar.", pos: [4.8, 7.5, 1], color: '#ffffff' },
    { id: 11, name: "Canalización interna", desc: "Ductos internos.", pos: [6.15, 7, 2], color: '#00b4d8' },
    { id: 12, name: "Tomas de usuario", desc: "Conexión final.", pos: [7.5, 6.5, 3], color: '#ffc107' }
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
        if (!container) throw new Error("No se encontró el contenedor #container");

        // 1. Escena
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f2f5);
        scene.fog = new THREE.Fog(0xf0f2f5, 40, 100);

        // 2. Cámara
        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(35, 25, 35);

        // 3. Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // 4. Etiquetas
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

        // --- ILUMINACIÓN ---
        const amb = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(amb);
        const dir = new THREE.DirectionalLight(0xffffff, 1.5);
        dir.position.set(20, 40, 20);
        dir.castShadow = true;
        scene.add(dir);

        // --- CONSTRUCCIÓN ---
        buildEnvironment();
        buildBuilding();
        buildRITElements();

        // --- UI ---
        createMenu();
        setupEventListeners();

        // --- QUITAR PANTALLA DE CARGA ---
        const loader = document.getElementById('loading');
        if (loader) {
            console.log("--> Ocultando pantalla de carga...");
            loader.classList.add('hidden');
        }

        animate();
        console.log("--> Aplicación iniciada con éxito.");

    } catch (error) {
        console.error("CRITICAL ERROR:", error);
        alert("Error al iniciar 3D: " + error.message);
    }
}

// --- MATERIALES SIMPLES PARA EVITAR ERRORES ---
const matConcrete = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 });
const matHighlight = new THREE.MeshStandardMaterial({ color: 0xff4d00 });

function buildEnvironment() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0xd0d4d8 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);
}

function buildBuilding() {
    // Edificio simplificado para asegurar carga rápida
    const group = new THREE.Group();
    for (let i = 0; i < 5; i++) {
        const slab = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 10), matConcrete);
        slab.position.y = i * 3;
        slab.castShadow = true;
        group.add(slab);
    }
    scene.add(group);
}

function buildRITElements() {
    ritData.forEach(d => {
        // Marcadores visuales simples
        const geom = new THREE.SphereGeometry(0.5);
        const mat = new THREE.MeshStandardMaterial({ color: d.color });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(d.pos[0], d.pos[1], d.pos[2]);
        mesh.castShadow = true;
        scene.add(mesh);
        
        // Guardar referencia
        if (!meshMap[d.id]) meshMap[d.id] = new THREE.Group();
        meshMap[d.id].add(mesh);
        scene.add(meshMap[d.id]); // Asegurar que el grupo está en escena

        // Etiqueta
        const div = document.createElement('div');
        div.className = 'label-tag';
        div.textContent = d.name;
        div.style.cssText = `background: rgba(0,0,0,0.8); color: white; padding: 2px 5px; border-radius: 4px; font-size: 10px; display: none;`;
        const label = new CSS2DObject(div);
        label.position.set(0, 1, 0);
        mesh.add(label);
        labelMap[d.id] = label;
    });
}

function createMenu() {
    const container = document.getElementById('menu-items');
    if (!container) return;
    ritData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'rit-item';
        div.setAttribute('data-id', item.id);
        div.innerHTML = `<div class="number-badge">${item.id}</div><b>${item.name}</b>`;
        div.onclick = () => selectItem(item.id);
        container.appendChild(div);
    });
}

function selectItem(id) {
    activeItem = id;
    if (id === -1) {
        moveCamera(new THREE.Vector3(35, 25, 35), new THREE.Vector3(0, 6, 0));
        return;
    }
    
    const data = ritData.find(d => d.id === id);
    if (data) {
        const target = new THREE.Vector3(data.pos[0], data.pos[1], data.pos[2]);
        moveCamera(target.clone().add(new THREE.Vector3(5, 5, 5)), target);
        
        // Mostrar Info
        const info = document.getElementById('info-panel');
        if(info) {
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
        t += 0.05;
        if (t > 1) t = 1;
        camera.position.lerpVectors(startPos, pos, t);
        controls.target.lerpVectors(startTarget, target, t);
        if (t < 1) requestAnimationFrame(anim);
    }
    anim();
}

function setupEventListeners() {
    // Toggle etiquetas
    const btnLabels = document.getElementById('toggle-labels');
    if (btnLabels) {
        let show = false;
        btnLabels.onclick = () => {
            show = !show;
            Object.values(labelMap).forEach(l => l.element.style.display = show ? 'block' : 'none');
        };
    }
    
    // Close info
    const closeInfo = document.querySelector('.info-close');
    if(closeInfo) closeInfo.onclick = () => document.getElementById('info-panel').classList.remove('visible');

    // Reset
    const reset = document.querySelector('.nav-btn[data-action="reset"]');
    if(reset) reset.onclick = () => selectItem(-1);

    // Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

// INICIAR
init();
