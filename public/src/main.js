import { scene, renderer } from './scene.js';
import { camera, setCameraPosition } from './camera.js';
import { loadScene } from './loader.js';
import { createDPad, isMobileDevice } from './dpad.js';
import { moveSpeed, setCamera, moveState } from './movement.js';
import * as THREE from 'three';
import { checkDirectionalCollisions, checkGroundCollision, createCollidableObjects } from './collision.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { outlineObjects } from './loader.js';
import axios from 'axios';

const clock = new THREE.Clock();
let composer = null;

axios.defaults.withCredentials = true;

async function init() {
    try {
        await loadScene(scene);

        // Set camera position and controls
        if (isMobileDevice()) {
            createDPad();
            setCameraPosition(1, 1.4, 4); 
        } else {
            setCamera(camera);
            setCameraPosition(0, 1.4, 4);
            camera.lookAt(new THREE.Vector3(0, 1, 0)); 
        }

        // Create effect composer with correct pass order
        composer = new EffectComposer(renderer);
        
        // 1. Render pass (base scene)
        const renderPass = new RenderPass(scene, camera);
        composer.addPass(renderPass);

        //ADDS OUTLINE FOR SELECTED OBJECTS; INTENSIVE ON CPU
    //     const outlinePass = new OutlinePass(
    //         new THREE.Vector2(window.innerWidth, window.innerHeight),
    //         scene,
    //         camera
    //     );

    // // Add this after creating outlinePass
    // outlinePass.visibleEdgeColor.setHex(0x66aaff);
    // outlinePass.hiddenEdgeColor.setHex(0x4444aa);
    // outlinePass.edgeStrength = 2.5;
    // outlinePass.edgeGlow = 0.7;
    // outlinePass.edgeThickness = 2;


    //     // Verify and set outline objects
    //     if (outlineObjects.length > 0) {
    //         outlinePass.selectedObjects = outlineObjects;
    //     } else {
    //         console.warn('No outline objects found');
    //     }

    //     composer.addPass(outlinePass);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.35,   // Strength
            0.75,   // Radius
            0.85    // Threshold
        );
        composer.addPass(bloomPass);

        const vignettePass = new ShaderPass(VignetteShader);
        composer.addPass(vignettePass);

        const outputPass = new OutputPass();
        composer.addPass(outputPass);

        // Initialize collision system
        createCollidableObjects(scene);

        // Start animation loop
        if (camera) {
            animate();
        } else {
            console.error("Camera initialization failed");
        }
    } catch (error) {
        console.error("Scene initialization failed:", error);
    }
}

function animate() {
    requestAnimationFrame(animate);

    // Handle movement
    const deltaTime = clock.getDelta();
    let moveVector = new THREE.Vector3();

    if (moveState.moveForward && !checkDirectionalCollisions(camera, 'forward')) {
        moveVector.add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(moveSpeed * deltaTime));
    }
    if (moveState.moveBackward && !checkDirectionalCollisions(camera, 'backward')) {
        moveVector.add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(-moveSpeed * deltaTime));
    }
    if (moveState.moveLeft && !checkDirectionalCollisions(camera, 'left')) {
        moveVector.add(
            camera.getWorldDirection(new THREE.Vector3()).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2).multiplyScalar(moveSpeed * deltaTime)
        );
    }
    if (moveState.moveRight && !checkDirectionalCollisions(camera, 'right')) {
        moveVector.add(
            camera.getWorldDirection(new THREE.Vector3()).applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2).multiplyScalar(moveSpeed * deltaTime)
        );
    }

    // Apply movement constraints
    moveVector.y = 0;
    checkGroundCollision(camera, deltaTime);
    camera.position.add(moveVector);

    // Render frame
    composer.render();
}

// Start application
init();