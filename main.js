import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import GUI from "lil-gui";
// IMPORT DU GUI, LE MENU EN HAUT A DROITE //



// LA SCENE //
const scene = new THREE.Scene();

const hdrLoader = new RGBELoader();
const envMap = await hdrLoader.loadAsync("public/textures/qwantani_dusk_1_puresky_2k.hdr");
envMap.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = envMap;
scene.background = envMap;

// LA CAMERA //
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 2, 5);
camera.lookAt(0, 0, 0);

// LE RENDERER //
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// L'ORBIT CONTROLS //
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.enableDamping = true;
controls.target.set(0, 0, 0);

//  LUMIERE //
const dirLight = new THREE.DirectionalLight(0xff8800, 90);
dirLight.position.set(2, 5, 3);
dirLight.castShadow = true;
scene.add(dirLight);

// LA PISTE AUDIO //
const audioCtx = new AudioContext();
document.addEventListener("click", () => audioCtx.resume(), { once: true });

const keyObjects = {};
const activeOscillators = {};

// LA FONCTION POUR QUAND ON APPUIE SUR UNE TOUCHE ET QUAND ON LA RELACHE //
function pressKey(index) {
    const k = keyObjects[index];
    if (!k) {
        console.warn(`Touche [${index}] pas encore chargée`);
        return;
    }
    // La couleurs qd on touche // 
    k.mesh.material.color.set("#f0c040");
    k.mesh.rotation.x = 0.04;

    // Son
    if (!activeOscillators[index]) {
        const freq = WHITE_FREQS[index] ?? 440;
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        activeOscillators[index] = { osc, gain };
    }
}

function releaseKey(index) {
    const k = keyObjects[index];
    if (!k) return;
    // Restaure la couleur d'origine
    k.mesh.material.color.copy(k.originalColor);
    k.mesh.rotation.x = 0;

    // Fade out audio
    const a = activeOscillators[index];
    if (a) {
        a.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        a.osc.stop(audioCtx.currentTime + 0.3);
        delete activeOscillators[index];
    }
}

// MES TOUCHES //
const QWERTY_TO_INDEX = {
    // ── Octave 1 
    a: 0, // Do4
    z: 1,  // Do#4
    e: 4,  // Mi4
    r: 6,  // Fa4
    t: 8,  // Sol4
    y: 10,  // La4
    u: 12,  // Si4

    // ── Octave 2
    i: 14,  // Do5
    o: 16,  // Ré5
    p: 18,  // Mi5

    // ── Octave 3 
    q: 16,  // Si3
    s: 18,  // La3
    d: 20,  // Sol3
    f: 22,  // Fa3
    g: 24,  // Mi3
    h: 26,  // Ré3
    j: 28,  // Do3

    // ── Octave 4
    k: 30,  // Do5
    l: 32,  // Ré5
    m: 34,  // Mi5

    // ── Octave 5 
    w: 38,  // Si3
    x: 40,  // La3
    c: 42,  // Sol3
    v: 44,  // Fa3
    b: 46,  // Mi3
    n: 48,  // Ré3
};

// POUR CLAVIER  //
window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    const idx = QWERTY_TO_INDEX[e.key.toLowerCase()];
    if (idx !== undefined) pressKey(idx);
});

window.addEventListener("keyup", (e) => {
    const idx = QWERTY_TO_INDEX[e.key.toLowerCase()];
    if (idx !== undefined) releaseKey(idx);
});

// MON GUI POUR PANIER PIANOOOO//
const gui    = new GUI();
const params = { color: "#ffffff" };
let   pianoModel = null;

gui.addColor(params, "color").name("Couleur Panier-Piano 🎨").onChange(() => {
    if (!pianoModel) return;
    pianoModel.traverse((child) => {
        if (child.isMesh) child.material.color.set(params.color);
    });
});

// LE LOADER //
const gltfLoader = new GLTFLoader();

function loadGLB(path) {
    return new Promise((resolve, reject) =>
        gltfLoader.load(path, (gltf) => resolve(gltf.scene), undefined, reject)
    );
}

// MES ÉLÉMENTS FIXES //
loadGLB("models/sol_carreau.glb").then((model) => {
    model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }});
    scene.add(model);
    console.log("sol_carreau.glb");
}).catch(e => console.error("❌ ou est mon sol_carreau.glb", e));

loadGLB("models/piano.glb").then((model) => {
    model.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }});
    scene.add(model);
    pianoModel = model;
    console.log("piano.glb");
}).catch(e => console.error("❌ ou est mon panier-piano.glb", e)); // au cas ou si iol y une erreur comme ça jvois mieux // 

// POUR MES TOUCHES //
const BASE = "public/models/whites_keys/";
const BLACK_BASE = "public/models/black_keys/";

const WHITE_KEY_FILES = [
 `${BASE}touche 1.000.glb`,
    `${BASE}touche 1.001.glb`,
    `${BASE}touche 1.002.glb`,
    `${BASE}touche 1.003.glb`,
    `${BASE}touche 1.004.glb`,
    `${BASE}touche 1.005.glb`,
    `${BASE}touche 1.006.glb`,      
    `${BASE}touche 1.007.glb`,
    `${BASE}touche 1.008.glb`,
    `${BASE}touche 1.009.glb`,
    `${BASE}touche 1.010.glb`,
    `${BASE}touche 1.011.glb`,
    `${BASE}touche 1.012.glb`,
    `${BASE}touche 1.013.glb`,
    `${BASE}touche 1.014.glb`,
    `${BASE}touche 1.015.glb`,
    `${BASE}touche 1.016.glb`,
    `${BASE}touche 1.017.glb`,
    `${BASE}touche 1.018.glb`,
    `${BASE}touche 1.019.glb`,
    `${BASE}touche 1.020.glb`,
    `${BASE}touche 1.021.glb`,
    `${BASE}touche 1.022.glb`,
    `${BASE}touche 1.023.glb`,
    `${BASE}touche 1.024.glb`,
    `${BASE}touche 1.025.glb`,
    `${BASE}touche 1.026.glb`,
    `${BASE}touche 1.027.glb`,
    `${BASE}touche 1.028.glb`,
    `${BASE}touche 1.029.glb`,
    `${BASE}touche 1.030.glb`,
    `${BASE}touche 1.031.glb`,
    `${BASE}touche 1.032.glb`,
    `${BASE}touche 1.033.glb`,
    `${BASE}touche 1.034.glb`,
    `${BASE}touche 1.035.glb`,
    `${BASE}touche 1.036.glb`,
    `${BASE}touche 1.037.glb`,
    `${BASE}touche 1.038.glb`,
    `${BASE}touche 1.039.glb`,
    `${BASE}touche 1.040.glb`,
    `${BASE}touche 1.041.glb`,
    `${BASE}touche 1.042.glb`,
    `${BASE}touche 1.043.glb`,
    `${BASE}touche 1.044.glb`,
    `${BASE}touche 1.045.glb`,
    `${BASE}touche 1.046.glb`,
    `${BASE}touche 1.047.glb`,
    `${BASE}touche 1.048.glb`,  
    `${BASE}touche 1.049.glb`,
    `${BASE}touche 1.050.glb`,
    `${BASE}touche 1.051.glb`,
    `${BASE}touche 1.052.glb`,
    `${BASE}touche 1.053.glb`,
    `${BASE}touche 1.054.glb`,
];

const BLACK_KEY_FILES = [
    `${BLACK_BASE}touche noirs.000.glb`,
    `${BLACK_BASE}touche noirs.001.glb`,
    `${BLACK_BASE}touche noirs.002.glb`,
    `${BLACK_BASE}touche noirs.003.glb`,
    `${BLACK_BASE}touche noirs.004.glb`,
    `${BLACK_BASE}touche noirs.005.glb`,
    `${BLACK_BASE}touche noirs.006.glb`,
    `${BLACK_BASE}touche noirs.007.glb`,
    `${BLACK_BASE}touche noirs.008.glb`,
    `${BLACK_BASE}touche noirs.009.glb`,
    `${BLACK_BASE}touche noirs.010.glb`,
    `${BLACK_BASE}touche noirs.011.glb`,
    `${BLACK_BASE}touche noirs.012.glb`,
    `${BLACK_BASE}touche noirs.013.glb`,
    `${BLACK_BASE}touche noirs.014.glb`,
    `${BLACK_BASE}touche noirs.015.glb`,
    `${BLACK_BASE}touche noirs.016.glb`,
    `${BLACK_BASE}touche noirs.017.glb`,
    `${BLACK_BASE}touche noirs.018.glb`,
    `${BLACK_BASE}touche noirs.019.glb`,
    `${BLACK_BASE}touche noirs.020.glb`,
    `${BLACK_BASE}touche noirs.021.glb`,
    `${BLACK_BASE}touche noirs.022.glb`,
    `${BLACK_BASE}touche noirs.023.glb`,
    `${BLACK_BASE}touche noirs.024.glb`,
    `${BLACK_BASE}touche noirs.025.glb`,
    `${BLACK_BASE}touche noirs.026.glb`,
    `${BLACK_BASE}touche noirs.027.glb`,
    `${BLACK_BASE}touche noirs.028.glb`,
    `${BLACK_BASE}touche noirs.029.glb`,
    `${BLACK_BASE}touche noirs.030.glb`,
    `${BLACK_BASE}touche noirs.031.glb`,
    `${BLACK_BASE}touche noirs.032.glb`,
    `${BLACK_BASE}touche noirs.033.glb`,
    `${BLACK_BASE}touche noirs.034.glb`,
    `${BLACK_BASE}touche noirs.035.glb`,
];



// Chargement de chaque touche noir et blanc // 
WHITE_KEY_FILES.forEach((path, index) => {
    loadGLB(path).then((model) => {
        let mesh = null;

        model.traverse((child) => {
            if (child.isMesh && !mesh) {
                mesh = child;
                child.castShadow    = true;
                child.receiveShadow = true;
            }
        });

        if (!mesh) {
            console.warn("quoi", path);
            return;
        }

        mesh.material = mesh.material.clone();

        keyObjects[index] = {
            mesh,
            originalColor: mesh.material.color.clone(),
        };

        scene.add(model);
        console.log(`✅ [${index}]`, path.split("/").pop());

    }).catch(() => console.warn("⚠️  Introuvable : touches blanches XXX", path));
});


BLACK_KEY_FILES.forEach((path, index) => {
    loadGLB(path).then((model) => {
        let mesh = null;

        model.traverse((child) => {
            if (child.isMesh && !mesh) {
                mesh = child;
                child.castShadow    = true;
                child.receiveShadow = true;
            }
        });

        if (!mesh) {
            console.warn("feur", path);
            return;
        }

        mesh.material = mesh.material.clone();

        keyObjects[index] = {
            mesh,
            originalColor: mesh.material.color.clone(),
        };

        scene.add(model);
        console.log(`✅ [${index}]`, path.split("/").pop());

    }).catch(() => console.warn("⚠️  Introuvable : touches noirs XXX", path));
});


//  RESIZE LES ELEMENTS //
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// EN BOUCLE DE RENDU //
function animate() {
    controls.update();
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
//IL EST 22:45 JPP ET LA SEMAINE TT LES SOIRS DESSUS//
