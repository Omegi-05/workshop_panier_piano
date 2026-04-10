import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { DragControls } from "three/addons/controls/DragControls.js";
import GUI from "lil-gui";

// IMPORT DU GUI, LE MENU EN HAUT A DROITE //
const gui = new GUI();
const params = {
    color: "#ffffff",
    x: 0,
    y: 0,
    z: 0,
    scale: 1
};

// GUI - Position du modèle principal
gui.addColor(params, "color").name("Couleur 🎨").onChange(() => {
    if (mainModel) {
        mainModel.traverse((child) => {
            if (child.isMesh) {
                child.material.color.set(params.color);
            }
        });
    }
});


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);

// RGBELoader pour les fichiers HDR
const hdrLoader = new RGBELoader();
const envMap = await hdrLoader.loadAsync("public/textures/qwantani_dusk_1_puresky_2k.hdr");

envMap.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = envMap;
scene.background = envMap;

// CREATION DE LA CAMERA //
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping; 


const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false; // Désactive le déplacement latéral
controls.autoRotate = true; // Active la rotation automatique
controls.autoRotateSpeed = 0.5; // Vitesse de rotation automatique
controls.enableDamping = true; //rend le drag smooth
controls.target.set(0,0, 0); // Cible de sa rotation

// CHARGEMENT DU MODELE GLB //
const gltfLoader = new GLTFLoader();

// Charger le modèle principal
let mainModel = null;

gltfLoader.load(
    "models/piano_droit.glb", // MON PANIER PIANO
    (gltf) => {
        mainModel = gltf.scene;
        mainModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        mainModel.position.set(0, 0, 0);
        scene.add(mainModel);

        // Initialiser les DragControls après le chargement
        initDragControls();
    },
    (progress) => {
        console.log(`Chargement: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
    },
    (error) => {
        console.error("Erreur de chargement du modèle:", error);
    }
);

// AJOUT DES DRAG CONTROLS //
function initDragControls() {
    const dragControls = new DragControls(objects, camera, renderer.domElement);
    
    dragControls.addEventListener("hoveron", (event) => {
        event.object.scale.set(1.1, 1.1, 1.1);
        controls.enabled = false;
    });
    dragControls.addEventListener("hoveroff", (event) => {
        event.object.scale.set(1, 1, 1);
        controls.enabled = true;
    });
    dragControls.addEventListener("drag", (event) => {
        event.object.scale.set(1.2, 1.2, 1.2);
    });
    dragControls.addEventListener("dragend", (event) => {
        event.object.scale.set(1, 1, 1);
        controls.enabled = true;
    });
}



camera.position.set(3, 2, 5);
camera.lookAt(0, 0, 0);

// AJOUT LUMIERE 😎//
const dirLight = new THREE.DirectionalLight(0xFF8800, 90);
dirLight.position.set(2, 5, 3);
dirLight.castShadow = true;
scene.add(dirLight);

// Gérer le redimensionnement de la fenêtre //
window.addEventListener("resize", () => { 
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
});




function animate(time) {
    controls.update();
    renderer.render(scene, camera);
    
}

renderer.setAnimationLoop(animate);
