import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Get references to the loading screen elements
const loadingScreen = document.getElementById('loading-screen');
console.log('Loading screen element:', loadingScreen); // Debugging

const progressFill = document.querySelector('.progress-fill');
const progressPercentage = document.querySelector('.progress-percentage');

// Three.js Scene Setup
const loadingManager = new THREE.LoadingManager();
const scenePath = '/public/models/scene.gltf';

// Update loading progress
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal) * 100;
    progressFill.style.width = `${progress}%`;
    progressPercentage.textContent = `${Math.round(progress)}%`;
};

// Hide loading screen when loading is complete
loadingManager.onLoad = () => {
    console.log('Loading complete!'); // Debugging
    loadingScreen.classList.add('hidden');
};

// Load the GLTF model
export const LoadGLTFByPath = () => {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader(loadingManager);
        loader.load(
            scenePath,
            (gltf) => {
                console.log('GLTF model loaded successfully:', gltf); // Debugging
                resolve(gltf);
            },
            undefined,
            (error) => {
                console.error('Error loading GLTF model:', error); // Debugging
                reject(error);
            }
        );
    });
};