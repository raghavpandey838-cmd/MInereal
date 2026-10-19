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
  public timeOfDay: number = 0.25; // 0.0 = midnight, 0.25 = sunrise/morning, 0.5 = noon, 0.75 = sunset
  public dayDurationSec: number = 240; // 4 minutes full cycle (accelerated for fun gameplay)

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Directional Sun/Moon Key Light
    this.sunLight = new THREE.DirectionalLight(0xfff4e0, 1.3);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 120;
    const d = 30;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // 2. Hemisphere Ambient Light (warm sky, cool ground)
    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d4a26, 0.6);
    this.scene.add(this.hemiLight);

    // 3. Sun Billboard (square Minecraft sun)
    const sunGeom = new THREE.PlaneGeometry(16, 16);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfffae0,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    // 4. Moon Billboard (square Minecraft moon)
    const moonGeom = new THREE.PlaneGeometry(12, 12);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xeeffff,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.scene.add(this.moonMesh);

    // 5. Starfield for night
    const starCount = 300;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 90;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
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

    // Horizon fog
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);
  }

  public update(dt: number, playerPos: THREE.Vector3) {
    this.timeOfDay = (this.timeOfDay + dt / this.dayDurationSec) % 1.0;

    // Orbit angle: 0.5 = noon, 0.0 = midnight
    const angle = this.timeOfDay * Math.PI * 2;
    const orbitRadius = 80;

    const sunX = playerPos.x + Math.sin(angle) * orbitRadius;
    const sunY = playerPos.y + Math.cos(angle) * orbitRadius;
    const sunZ = playerPos.z;

    const moonX = playerPos.x - Math.sin(angle) * orbitRadius;
    const moonY = playerPos.y - Math.cos(angle) * orbitRadius;
    const moonZ = playerPos.z;

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.sunMesh.lookAt(playerPos);

    this.moonMesh.position.set(moonX, moonY, moonZ);
    this.moonMesh.lookAt(playerPos);

    // Starfield centered on player
    this.starPoints.position.copy(playerPos);

    // Sun light position & target
    this.sunLight.position.set(sunX, sunY, sunZ);
    this.sunLight.target.position.copy(playerPos);
    this.sunLight.target.updateMatrixWorld();

    // Day/Night colors interpolation
    // cos(angle) > 0 is day, < 0 is night
    const sunElev = Math.cos(angle);
    const dayFactor = Math.max(0, Math.min(1, (sunElev + 0.2) / 0.8));

    const daySkyColor = new THREE.Color(0x78a7ff);
    const sunsetColor = new THREE.Color(0xdf6f38);
    const nightSkyColor = new THREE.Color(0x0a0c18);

    const currentSkyColor = new THREE.Color();
    if (dayFactor > 0.4) {
      currentSkyColor.lerpColors(sunsetColor, daySkyColor, (dayFactor - 0.4) / 0.6);
    } else {
      currentSkyColor.lerpColors(nightSkyColor, sunsetColor, dayFactor / 0.4);
    }

    this.scene.background = currentSkyColor;
    if (this.scene.fog) {
      this.scene.fog.color.copy(currentSkyColor);
    }

    // Light intensity & colors
    this.sunLight.intensity = Math.max(0.1, dayFactor * 1.4);
    this.hemiLight.intensity = 0.2 + dayFactor * 0.55;

    // Star opacity at night
    const starMat = this.starPoints.material as THREE.PointsMaterial;
    starMat.opacity = Math.max(0, (1 - dayFactor * 1.8));
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
  }
}
