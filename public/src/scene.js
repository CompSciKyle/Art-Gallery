import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export const scene = new THREE.Scene();

// Renderer setup
export const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#background'),
  antialias: true, 
  powerPreference: "high-performance",
  stencil: true,
  depth: true
});

renderer.setSize(window.innerWidth, window.innerHeight);

scene.position.set(0, -0.1, 0);

// Load HDR environment map
const rgbeLoader = new RGBELoader();
rgbeLoader.load('public/images/canary_wharf_1k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = texture;
  scene.environmentIntensity = 0.4; // Default intensity
});

//Ambient light for even illumination
const ambientLight = new THREE.AmbientLight(0x404040, 30); // Default intensity
scene.add(ambientLight);

// Renderer configuration
renderer.shadowMap.enabled = true; // Shadows enabled
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Tonemapping enabled
renderer.toneMappingExposure = 1.2; // Default exposure
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.physicallyCorrectLights = true; // Physically correct lights