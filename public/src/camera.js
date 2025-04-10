import * as THREE from 'three';

export let cameraList = [];
export let camera;

export function retrieveListOfCameras(scene) {
  scene.traverse((object) => {
    if (object.isCamera) {
      cameraList.push(object);
    }
  });

  camera = cameraList[0]; // Set main camera
  updateCameraAspect(camera);
}

export function updateCameraAspect(camera) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

export function setCameraPosition(x, y, z) {
  if (!camera) return;
  camera.position.set(x, y, z);
}