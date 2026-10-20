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

    // 1. Directional Sun Key Light (Warm golden sunlight)
    this.sunLight = new THREE.DirectionalLight(0xfff7e6, 1.45);
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

    // 2. Hemisphere Ambient Light (Authentic Minecraft sky-blue above, grass-tint below)
    this.hemiLight = new THREE.HemisphereLight(0x78a7ff, 0x486432, 0.72);
    this.scene.add(this.hemiLight);

    // 3. Iconic Square Minecraft Sun
    const sunGeom = new THREE.PlaneGeometry(20, 20);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfffbe8,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    // 4. Moon Billboard (hidden below world because night is disabled)
    const moonGeom = new THREE.PlaneGeometry(12, 12);
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

    // 6. Procedural Authentic Minecraft Drifting Voxel Clouds
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 64;
    cloudCanvas.height = 64;
    const cctx = cloudCanvas.getContext('2d')!;
    cctx.clearRect(0, 0, 64, 64);

    for (let y = 0; y < 64; y += 4) {
      for (let x = 0; x < 64; x += 4) {
        const val =
          Math.sin(x * 0.22) * Math.cos(y * 0.22) +
          Math.sin(x * 0.08 + y * 0.12) * 0.8 +
          Math.cos(x * 0.15 - y * 0.05) * 0.4;
        if (val > 0.1) {
          cctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          cctx.fillRect(x, y, 4, 4);
          // Subtle darker bottom voxel border for 3D depth
          cctx.fillStyle = 'rgba(215, 225, 240, 0.85)';
          cctx.fillRect(x, y + 3, 4, 1);
        }
      }
    }

    this.cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    this.cloudTexture.magFilter = THREE.NearestFilter;
    this.cloudTexture.minFilter = THREE.NearestFilter;
    this.cloudTexture.wrapS = THREE.RepeatWrapping;
    this.cloudTexture.wrapT = THREE.RepeatWrapping;
    this.cloudTexture.repeat.set(16, 16);

    const cloudGeom = new THREE.PlaneGeometry(900, 900);
    const cloudMat = new THREE.MeshBasicMaterial({
      map: this.cloudTexture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      fog: false,
      depthWrite: false,
    });
    this.cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
    this.cloudMesh.rotation.x = Math.PI / 2;
    this.cloudMesh.position.set(0, 120, 0);
    this.scene.add(this.cloudMesh);

    // 7. Horizon Fog (Crisp Minecraft daytime blue)
    this.scene.fog = new THREE.FogExp2(0x78a7ff, 0.012);
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
    const daySkyColor = new THREE.Color(0x78a7ff);
    this.scene.background = daySkyColor;
    if (this.scene.fog) {
      this.scene.fog.color.copy(daySkyColor);
    }

    this.sunLight.intensity = 1.45;
    this.hemiLight.intensity = 0.72;
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
