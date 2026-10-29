/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export class DayNightCycle {
  public scene: THREE.Scene;
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public sunMesh: THREE.Mesh;
  public moonMesh: THREE.Mesh;
  public starPoints: THREE.Points;
  public cloudMesh: THREE.Mesh;
  public cloudTexture: THREE.CanvasTexture;
  public timeOfDay: number = 0.5; // Strictly DAY TIME only (0.5 = High Noon)
  public dayDurationSec: number = 240;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Directional Sun Key Light (Warm golden sunlight, enhanced brightness)
    this.sunLight = new THREE.DirectionalLight(0xfffaec, 2.15);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 140;
    const d = 35;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // 2. Hemisphere Ambient Light (Authentic Minecraft daylight: sky-blue above, grass-tint below)
    this.hemiLight = new THREE.HemisphereLight(0x8abaff, 0x567e37, 1.1);
    this.scene.add(this.hemiLight);

    // 3. Iconic Square Minecraft Sun
    const sunGeom = new THREE.PlaneGeometry(24, 24);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfffbe8,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    // 4. Moon Billboard (hidden below world because night is disabled)
    const moonGeom = new THREE.PlaneGeometry(14, 14);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xeeffff,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.moonMesh.position.set(0, -200, 0);
    this.scene.add(this.moonMesh);

    // 5. Starfield (hidden during perpetual day)
    const starCount = 100;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      fog: false,
      transparent: true,
      opacity: 0,
    });
    this.starPoints = new THREE.Points(starGeom, starMat);
    this.scene.add(this.starPoints);

    // 6. Procedural Authentic Minecraft Drifting Pixel Voxel Clouds
    // Real Minecraft clouds are composed of 4x4 or 8x8 pixel blocks arranged in cumulus groups
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 128;
    cloudCanvas.height = 128;
    const cctx = cloudCanvas.getContext('2d')!;
    cctx.clearRect(0, 0, 128, 128);

    const blockSize = 4;
    const cols = 128 / blockSize;
    const rows = 128 / blockSize;

    for (let by = 0; by < rows; by++) {
      for (let bx = 0; bx < cols; bx++) {
        // Multi-frequency Minecraft cloud noise generating rectangular clusters
        const nx = bx / cols;
        const ny = by / rows;
        const v1 = Math.sin(nx * Math.PI * 4) * Math.cos(ny * Math.PI * 3);
        const v2 = Math.sin(nx * Math.PI * 8 + 1.2) * Math.sin(ny * Math.PI * 6 + 0.8) * 0.5;
        const v3 = Math.cos((nx + ny) * Math.PI * 6) * 0.35;
        const density = v1 + v2 + v3;

        if (density > 0.08) {
          const px = bx * blockSize;
          const py = by * blockSize;
          // Bright white main cloud body
          cctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
          cctx.fillRect(px, py, blockSize, blockSize);

          // Authentic Minecraft bottom shadow underbelly for 3D voxel effect
          cctx.fillStyle = 'rgba(216, 228, 248, 0.90)';
          cctx.fillRect(px, py + blockSize - 1, blockSize, 1);
        }
      }
    }

    this.cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    this.cloudTexture.magFilter = THREE.NearestFilter;
    this.cloudTexture.minFilter = THREE.NearestFilter;
    this.cloudTexture.wrapS = THREE.RepeatWrapping;
    this.cloudTexture.wrapT = THREE.RepeatWrapping;
    this.cloudTexture.repeat.set(12, 12);

    const cloudGeom = new THREE.PlaneGeometry(1400, 1400);
    const cloudMat = new THREE.MeshBasicMaterial({
      map: this.cloudTexture,
      transparent: true,
      opacity: 0.94,
      side: THREE.DoubleSide,
      fog: false,
      depthWrite: false,
    });
    this.cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
    this.cloudMesh.rotation.x = Math.PI / 2;
    this.cloudMesh.position.set(0, 126, 0);
    this.scene.add(this.cloudMesh);

    // 7. Horizon Fog (Crisp Minecraft daytime blue with clear view distance)
    this.scene.fog = new THREE.FogExp2(0x7cb2ff, 0.0085);
  }

  public setTimeOfDay(_time: number) {
    // Perpetual sunny day: user requested strictly DAY TIME only (no night time)
    this.timeOfDay = 0.5;
  }

  public update(dt: number, playerPos: THREE.Vector3) {
    // Strictly High Noon DAY TIME
    this.timeOfDay = 0.5;

    // Angle at 0.5 = High Noon (sun shining straight and glorious overhead)
    const angle = this.timeOfDay * Math.PI * 2;
    const orbitRadius = 140;

    const sunX = playerPos.x + Math.sin(angle) * orbitRadius;
    const sunY = playerPos.y + Math.cos(angle) * orbitRadius;
    const sunZ = playerPos.z + 12;

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.sunMesh.lookAt(playerPos);

    // Hide moon below world
    this.moonMesh.position.set(playerPos.x, playerPos.y - 150, playerPos.z);

    // Hide stars during day
    this.starPoints.position.copy(playerPos);

    // Sun directional light position & target
    this.sunLight.position.set(sunX, sunY, sunZ);
    this.sunLight.target.position.copy(playerPos);
    this.sunLight.target.updateMatrixWorld();

    // Drifting Minecraft cloud layer
    this.cloudMesh.position.x = playerPos.x;
    this.cloudMesh.position.z = playerPos.z;
    if (this.cloudTexture) {
      this.cloudTexture.offset.x += dt * 0.0025;
      this.cloudTexture.offset.y += dt * 0.0008;
    }

    // Authentic vibrant bright Minecraft Sky & Fog
    const daySkyColor = new THREE.Color(0x7cb2ff);
    this.scene.background = daySkyColor;
    if (this.scene.fog) {
      this.scene.fog.color.copy(daySkyColor);
    }

    this.sunLight.intensity = 2.15;
    this.hemiLight.intensity = 1.1;
  }

  public dispose() {
    this.scene.remove(this.sunLight);
    this.scene.remove(this.hemiLight);
    this.scene.remove(this.sunMesh);
    this.sunMesh.geometry.dispose();
    this.scene.remove(this.moonMesh);
    this.moonMesh.geometry.dispose();
    this.scene.remove(this.starPoints);
    this.starPoints.geometry.dispose();
    this.scene.remove(this.cloudMesh);
    this.cloudMesh.geometry.dispose();
    this.cloudTexture.dispose();
  }
}
