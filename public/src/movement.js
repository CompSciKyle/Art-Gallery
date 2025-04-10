import * as THREE from 'three';
import { zoomingIn } from './zoom.js';

export let moveSpeed = 10;
export let keyDirection = new THREE.Vector3();
let mouseSensitivity = 0.002;
const dampingFactor = 0.15;

let cameraRef = null;

// Direction-based movement state
export let moveState = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
};

// Define player direction for raycasting
export let direction = 'forward';

// Mouse movement variables
const mouse = { x: 0, y: 0 };
const target = { x: 0, y: 0 };

// Euler for camera rotation
const euler = new THREE.Euler(0, 0, 0, 'YXZ');
const pointerSpeed = 2.0;

// Polar angle limits
const minPolarAngle = 0;
const maxPolarAngle = Math.PI;

// Edge detection threshold (10% of screen width/height)
const edgeThreshold = 0.1;

export function setCamera(cam) {
    cameraRef = cam;
    cameraRef.rotation.reorder('YXZ'); // Reorder rotation for better control
}

// Function to update movement state
export function setMoveState(direction, state) {
    if (moveState.hasOwnProperty(direction)) {
        moveState[direction] = state;
    }
}

// Keyboard event handlers
export function handleKeyDown(event) {
    switch (event.key.toLowerCase()) {
        case 'w':
            setMoveState('moveForward', true);
            direction = 'forward';
            break;
        case 's':
            setMoveState('moveBackward', true);
            direction = 'backward';
            break;
        case 'a':
            setMoveState('moveLeft', true);
            direction = 'left';
            break;
        case 'd':
            setMoveState('moveRight', true);
            direction = 'right';
            break;
    }
}

export function handleKeyUp(event) {
    switch (event.key.toLowerCase()) {
        case 'w':
            setMoveState('moveForward', false);
            break;
        case 's':
            setMoveState('moveBackward', false);
            break;
        case 'a':
            setMoveState('moveLeft', false);
            break;
        case 'd':
            setMoveState('moveRight', false);
            break;
    }
}

// Mouse movement handler
export function handleMouseMove(event) {
    if (!cameraRef || zoomingIn) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    euler.setFromQuaternion(cameraRef.quaternion);

    euler.y -= movementX * 0.002 * pointerSpeed;
    euler.x -= movementY * 0.002 * pointerSpeed;

    euler.x = Math.max(
        Math.PI / 2 - maxPolarAngle,
        Math.min(Math.PI / 2 - minPolarAngle, euler.x)
    );

    cameraRef.quaternion.setFromEuler(euler);

    // Edge detection for automatic rotation
    const mouseX = event.clientX / window.innerWidth; // Normalized mouse X (0 to 1)
    const mouseY = event.clientY / window.innerHeight; // Normalized mouse Y (0 to 1)

    // Check if the mouse is near the edges of the screen
    if (mouseX < edgeThreshold) {
        // Rotate camera to the left
        euler.y += mouseSensitivity * 10;
    } else if (mouseX > 1 - edgeThreshold) {
        // Rotate camera to the right
        euler.y -= mouseSensitivity * 10;
    }

    if (mouseY < edgeThreshold) {
        // Rotate camera upward
        euler.x -= mouseSensitivity * 10;
    } else if (mouseY > 1 - edgeThreshold) {
        // Rotate camera downward
        euler.x += mouseSensitivity * 10;
    }

    // Apply the updated rotation
    cameraRef.quaternion.setFromEuler(euler);
}

export function updateMovement(deltaTime) {
    if (!cameraRef) return;
  
    const moveVector = new THREE.Vector3();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
  
    // Get camera orientation vectors
    cameraRef.getWorldDirection(forward);
    forward.y = 0; // Flatten to horizontal plane
    forward.normalize();
  
    right.crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
  
    // Apply movement based on state
    if (moveState.moveForward) moveVector.add(forward);
    if (moveState.moveBackward) moveVector.add(forward.negate());
    if (moveState.moveLeft) moveVector.add(right.negate());
    if (moveState.moveRight) moveVector.add(right);
  
    // Normalize and scale movement
    if (moveVector.length() > 0) {
      moveVector.normalize().multiplyScalar(moveSpeed * deltaTime);
    }
  
    // Apply movement
    cameraRef.position.add(moveVector);
  }

// Attach input event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
document.addEventListener('mousemove', handleMouseMove);
