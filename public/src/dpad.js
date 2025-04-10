import { setMoveState } from './movement.js';
import { camera } from './camera.js';
import * as THREE from 'three';


export function createDPad() {
  // Create D-pad container
  const dpad = document.createElement('div');
  dpad.id = 'dpad';
  dpad.style.position = 'fixed';
  dpad.style.bottom = '20px';
  dpad.style.left = '50%';
  dpad.style.transform = 'translateX(-50%)';
  dpad.style.width = '100px';
  dpad.style.height = '100px';
  dpad.style.borderRadius = '50%';
  dpad.style.background = 'rgba(0, 0, 0, 0.3)';
  dpad.style.display = 'flex';
  dpad.style.justifyContent = 'center';
  dpad.style.alignItems = 'center';
  dpad.style.zIndex = '1000';
  dpad.style.touchAction = 'none';
  dpad.style.border = '2px solid rgba(255, 255, 255, 0.3)';
  dpad.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.2)';

  // Create thumb indicator
  const thumb = document.createElement('div');
  thumb.style.width = '40px';
  thumb.style.height = '40px';
  thumb.style.background = 'rgba(255, 255, 255, 0.3)';
  thumb.style.borderRadius = '50%';
  thumb.style.position = 'absolute';
  thumb.style.transition = 'transform 0.1s';
  thumb.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
  thumb.style.border = '2px solid rgba(255, 255, 255, 0.8)';
  dpad.appendChild(thumb);

  document.body.appendChild(dpad);

  // Touch handling variables
  let startTouch = null;
  const maxDrag = 35;
  const rotationSensitivity = 0.00072;
  const axisLockRatio = 2.0;
  const deadzone = 15;
  const maxRotationSpeed = 0.02;

  dpad.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startTouch = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      activeAxis: null
    };
    thumb.style.transform = 'translate(0, 0)';
    dpad.style.transform = 'translateX(-50%) scale(0.95)';
  });

  dpad.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!startTouch) return;

    const currentTouch = e.touches[0];
    const deltaX = currentTouch.clientX - startTouch.x;
    const deltaY = currentTouch.clientY - startTouch.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine active axis
    if (!startTouch.activeAxis) {
      if (absDeltaX > deadzone || absDeltaY > deadzone) {
        const ratio = absDeltaX / (absDeltaY || 0.1);
        startTouch.activeAxis = ratio > axisLockRatio ? 'x' : 'y';
      }
    }

    // Update thumb position (axis-locked)
    let displayX = 0, displayY = 0;
    if (startTouch.activeAxis === 'x') {
      displayX = Math.sign(deltaX) * Math.min(absDeltaX, maxDrag);
    } else if (startTouch.activeAxis === 'y') {
      displayY = Math.sign(deltaY) * Math.min(absDeltaY, maxDrag);
    }
    thumb.style.transform = `translate(${displayX}px, ${displayY}px)`;

    // Handle controls
    if (startTouch.activeAxis === 'x') {
      // Horizontal rotation with quaternion
      const rotationDelta = -deltaX * rotationSensitivity;
      const quaternion = new THREE.Quaternion()
        .setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationDelta);
      camera.quaternion.multiply(quaternion);
    }
     else if (startTouch.activeAxis === 'y') {
      // Vertical movement
      if (deltaY > deadzone) {
        setMoveState('moveBackward', true);
        setMoveState('moveForward', false);
      } else if (deltaY < -deadzone) {
        setMoveState('moveForward', true);
        setMoveState('moveBackward', false);
      }
      // Clear rotation states
      setMoveState('moveLeft', false);
      setMoveState('moveRight', false);
    }
  });

  dpad.addEventListener('touchend', (e) => {
    e.preventDefault();
    startTouch = null;
    thumb.style.transform = 'translate(0, 0)';
    dpad.style.transform = 'translateX(-50%) scale(1)';
    setMoveState('moveForward', false);
    setMoveState('moveBackward', false);
    setMoveState('moveLeft', false);
    setMoveState('moveRight', false);
  });
}

export function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
}