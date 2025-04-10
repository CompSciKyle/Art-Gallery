import * as THREE from 'three';
import { camera } from './camera.js';
import { scene } from './scene.js';
import { showProductSidebar, objectInfo } from './sidebar.js';
import { SecureWooClient } from './WooCommerceBrowserClient.js';
import { isMobileDevice } from './dpad.js'; // Import mobile detection

export const secureApi = new SecureWooClient('https://woo-proxy.kylejfournier.workers.dev');

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
export let zoomTarget = null;
let zoomProgress = 0;
let originalPosition = new THREE.Vector3();
let originalRotation = new THREE.Quaternion();
export let zoomingIn = false;
let targetPosition = new THREE.Vector3();
let targetRotation = new THREE.Quaternion();
const ZOOM_SPEED = 0.05; // Increased speed for smoother transitions

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

async function fetchProductDetails(objectName) {
  const productId = objectInfo[objectName]?.productId;
  if (!productId) {
    console.error('Product not configured for this object.');
    return null;
  }
  try {
    return await secureApi.get(`/products/${productId}`);
  } catch (error) {
    console.error('Error fetching product:', error.message);
    return null;
  }
}

async function onMouseClick(event) {
  // Get reference to the sidebar.
  const sidebar = document.getElementById('product-sidebar');

  // If we are zoomed in and the click is outside of the sidebar, unzoom.
  if (zoomTarget !== null && sidebar && !sidebar.contains(event.target)) {
    unzoom();
    // Optionally hide the sidebar.
    sidebar.classList.remove('active');
    return;
  }

  // Otherwise, handle the click for zooming in.
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length === 0) return;

  const clickedObject = intersects[0].object;
  const productDetails = await fetchProductDetails(clickedObject.name);
  if (!productDetails) return;

  showProductSidebar(productDetails);

  // Record the original camera position and orientation if this is the first zoom.
  if (zoomTarget === null) {
    originalPosition.copy(camera.position);
    originalRotation.copy(camera.quaternion);
  }

  // Set the new zoom target and flag for zoom in.
  zoomTarget = clickedObject;
  zoomingIn = true;

  // Calculate target position and rotation to center the object.
  const box = new THREE.Box3().setFromObject(zoomTarget);
  const center = box.getCenter(new THREE.Vector3());
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);

  // Compute the required distance so that the object fits in view.
  const fov = camera.fov * (Math.PI / 180);
  const distance = sphere.radius / Math.sin(fov / 2) * 1.5; // Adjust factor as needed.

  // Compute vector from the object's center to the camera's current position.
  const direction = camera.position.clone().sub(center).normalize();
  // Place the camera along that direction so the object becomes centered.
  targetPosition.copy(center).addScaledVector(direction, distance);

  // Compute the target rotation so the camera looks at the object's center.
  const targetMatrix = new THREE.Matrix4();
  targetMatrix.lookAt(targetPosition, center, camera.up);
  targetRotation.setFromRotationMatrix(targetMatrix);

  // Hide the dpad on mobile when zooming in.
  if (isMobileDevice()) {
    const dpad = document.getElementById('dpad');
    if (dpad) {
      dpad.style.display = 'none';
    }
  }

  zoomProgress = 0;
  updateZoom();
}

function animateZoom() {
  if (!zoomTarget) return;

  // Increment or decrement zoom progress.
  zoomProgress += zoomingIn ? ZOOM_SPEED : -ZOOM_SPEED;
  zoomProgress = Math.min(Math.max(zoomProgress, 0), 1);

  const eased = easeInOutQuad(zoomProgress);
  camera.position.lerpVectors(originalPosition, targetPosition, eased);
  camera.quaternion.slerpQuaternions(originalRotation, targetRotation, eased);

  if (zoomProgress > 0 && zoomProgress < 1) {
    requestAnimationFrame(animateZoom);
  } else if (!zoomingIn) {
    // Ensure the camera returns to the original state when unzooming.
    camera.position.copy(originalPosition);
    camera.quaternion.copy(originalRotation);
    zoomTarget = null;
  }
}

export function updateZoom() {
  requestAnimationFrame(animateZoom);
}

// New function to unzoom.
export function unzoom() {
  if (zoomTarget !== null) {
    zoomingIn = false;
    zoomProgress = 1;
    targetPosition.copy(originalPosition);
    targetRotation.copy(originalRotation);
    updateZoom();

    // Show the dpad on mobile when unzooming.
    if (isMobileDevice()) {
      const dpad = document.getElementById('dpad');
      if (dpad) {
        dpad.style.display = 'flex';
      }
    }
  }
}

window.addEventListener('click', onMouseClick);
