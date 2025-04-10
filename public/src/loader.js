import { LoadGLTFByPath } from './Helpers/ModelHelper.js';
import { createCollidableObjects } from './collision.js';
import { retrieveListOfCameras } from './camera.js';
import { scene } from './scene.js';
import * as THREE from 'three';

// Glass material
// Thicker, less transparent glass material
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.1, // Slightly higher for performance
  transparent: true,
  opacity: 1,
  transmission: 0.9, // Slightly lower for performance
  thickness: 0.1, // Match geometry thickness
  ior: 1.3, // Realistic for glass
  envMap: scene.environment, // Use a lower-resolution environment map
  envMapIntensity: 0.5, // Reduce for performance
  side: THREE.FrontSide, // Avoid DoubleSide if possible
});

const glassFrameMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0,
  roughness: 0.05,
  transparent: true,
  opacity: 1,
  transmission: 1,
  thickness: 0.1,  // Must match actual geometry thickness
  ior: 1.3,
  envMap: scene.environment,
  envMapIntensity: 0.75,
  side: THREE.FrontSide,

});

const glowMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.1,
  roughness: 0.05,
  transparent: true,
  opacity: 0.9,
  transmission: 0.8,
  emissive: 0x66aaff,       // Glow color
  emissiveIntensity: 0.5,   // Base intensity
  envMap: scene.environment,
  envMapIntensity: 1.2,
  side: THREE.FrontSide,
});


const GLOW_OBJECT_NAMES = [
  'Pattern2D_8750002_1', 
  'Pattern2D_8750007_1_1',
  'Pattern2D_8750007_1_2'
];

export let outlineObjects = [];


export function loadScene(scene) {
  return new Promise((resolve, reject) => {
    LoadGLTFByPath()
      .then((gltf) => {
        // Traverse the loaded model to find and replace specific objects
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            // Replace materials for specific objects
            if (child.name === 'Plane007_1' || child.name === 'Cube039' || child.name === 'Cube029_2' || child.name === 'Plane005_1' || child.name === 'Cube025' || child.name === 'Cube05' || child.name === 'Cube005' || child.name === 'Cube010' || child.name === 'Cube008') { // Replace with your object names
              child.material = glassMaterial; // Replace the material with glass
              child.castShadow = true; // Enable shadow casting
              child.receiveShadow = true; // Enable shadow receiving
            }

            if (GLOW_OBJECT_NAMES.includes(child.name)) {
              outlineObjects.push(child);
            }

            if (child.name === 'Cube030_2' || child.name === 'Cube036_2')
            {
              child.material = glassFrameMaterial;
            }

          }
        });

        // Add the loaded GLTF model to the scene
        scene.add(gltf.scene);

        // Retrieve cameras and create collidable objects
        retrieveListOfCameras(scene);
        createCollidableObjects(scene);

        resolve();
      })
      .catch((error) => {
        console.error('Error loading GLTF scene:', error);
        reject(error);
      });
  });
}