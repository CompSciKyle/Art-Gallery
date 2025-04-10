import * as THREE from 'three';
import { zoomingIn } from './zoom.js';

export let collidableObjects = [];
const raycaster = new THREE.Raycaster();
const intersectionDistance = 1; // Distance to check for collisions
const groundCheckDistance = 10; // Maximum distance to check for ground
const gravityStrength = 9.8; // Gravity strength (adjust as needed)
const dampingFactor = 0.1; // Smoothing factor for landing

export function createCollidableObjects(scene) {
    scene.traverse((object) => {
        if (object.isMesh) {
            collidableObjects.push(object);
        }
    });
}

export function checkDirectionalCollisions(camera, direction) {
    const rayOrigin = camera.position.clone();
    let rayDirection;

    switch (direction) {
        case 'forward':
            rayDirection = camera.getWorldDirection(new THREE.Vector3()).normalize();
            break;
        case 'backward':
            rayDirection = camera.getWorldDirection(new THREE.Vector3()).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
            break;
        case 'left':
            rayDirection = camera.getWorldDirection(new THREE.Vector3()).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
            break;
        case 'right':
            rayDirection = camera.getWorldDirection(new THREE.Vector3()).applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
            break;
        default:
            return false;
    }

    raycaster.set(rayOrigin, rayDirection);
    const intersects = raycaster.intersectObjects(collidableObjects, true);

    return intersects.length > 0 && intersects[0].distance <= intersectionDistance;
}

export function checkGroundCollision(camera, deltaTime) {
    if (zoomingIn) return; // Skip ground collision checks when zooming in

    const rayOrigin = camera.position.clone();
    const rayDirection = new THREE.Vector3(0, -1, 0);

    raycaster.set(rayOrigin, rayDirection);
    const intersects = raycaster.intersectObjects(collidableObjects, true);

    if (intersects.length > 0) {
        const groundDistance = intersects[0].distance;

        // If the ground is within the ground check distance
        if (groundDistance < 2.5) {
            // Smoothly adjust camera height to stay above the ground
            const targetHeight = intersects[0].point.y + 1.5;
            camera.position.y += (targetHeight - camera.position.y) * dampingFactor * deltaTime * 60; // Scale by deltaTime
        } else if (groundDistance > 1.5) {
            // If the camera is above the ground, apply gravity to make it fall
            camera.position.y -= gravityStrength * deltaTime; // Scale gravity by deltaTime
        }
    } else {
        // If no ground is detected, apply gravity to make the camera fall
        camera.position.y -= gravityStrength * deltaTime; // Scale gravity by deltaTime
    }
}