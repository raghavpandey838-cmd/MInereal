/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { WeatherType } from './weather';

export class DayNightCycle {
  public scene: THREE.Scene;
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public sunMesh: THREE.Mesh;
  public sunCoronaMesh: THREE.Mesh;
  public moonMesh: THREE.Mesh;
  public starPoints: THREE.Points;
  public cloudMesh: THREE.Mesh;
  public cloudTexture: THREE.CanvasTexture;
  public timeOfDay: number = 0.5; // 0.0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
  public dayDurationSec: number = 360; // 6 minute full 24-hr day/night cycle
  public isAutoCycle: boolean = true; // Toggleable in settings
  public isUnderwater: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Directional Sun Key Light (Warm golden sunlight with cast shadows)
    this.sunLight = new THREE.DirectionalLight(0xfffaec, 2.15);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 160;
    const d = 40;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // 2. Hemisphere Ambient Light (Realistic atmospheric bounce lighting)
    this.hemiLight = new THREE.HemisphereLight(0x8abaff, 0x567e37, 1.1);
    this.scene.add(this.hemiLight);

    // 3. Iconic Square Minecraft Sun & Celestial Corona Bloom
    const sunGeom = new THREE.PlaneGeometry(24, 24);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfffbe8,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    // Atmospheric Celestial Corona Glow (BSL Shaderpack style bloom)
    const coronaGeom = new THREE.PlaneGeometry(58, 58);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffdf80,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    });
    this.sunCoronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
    this.scene.add(this.sunCoronaMesh);

    // 4. Iconic Square Minecraft Moon with Crater Surface
    const moonCanvas = document.createElement('canvas');
    moonCanvas.width = 64;
    moonCanvas.height = 64;
    const mctx = moonCanvas.getContext('2d')!;
    mctx.fillStyle = '#f1f5f9';
    mctx.fillRect(0, 0, 64, 64);
    mctx.fillStyle = '#cbd5e1';
    mctx.fillRect(8, 8, 20, 20);
    mctx.fillRect(36, 12, 16, 24);
    mctx.fillRect(16, 36, 24, 16);
    mctx.fillStyle = '#94a3b8';
    mctx.fillRect(12, 12, 10, 10);
    mctx.fillRect(40, 18, 8, 12);
    const moonTexture = new THREE.CanvasTexture(moonCanvas);
    moonTexture.magFilter = THREE.NearestFilter;
    moonTexture.minFilter = THREE.NearestFilter;

    const moonGeom = new THREE.PlaneGeometry(20, 20);
    const moonMat = new THREE.MeshBasicMaterial({
      map: moonTexture,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.scene.add(this.moonMesh);

    // 5. Starfield (600 sparkling stars across celestial dome)
    const starCount = 600;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9 + 0.1); // upper hemisphere
      const dist = 170;
      starPositions[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = dist * Math.cos(phi);
      starPositions[i * 3 + 2] = dist * Math.sin(phi) * Math.sin(theta);
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      fog: false,
      transparent: true,
      opacity: 0,
    });
    this.starPoints = new THREE.Points(starGeom, starMat);
    this.scene.add(this.starPoints);

    // 6. Procedural Authentic Minecraft Drifting Pixel Voxel Clouds
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
        const nx = bx / cols;
        const ny = by / rows;
        const v1 = Math.sin(nx * Math.PI * 4) * Math.cos(ny * Math.PI * 3);
        const v2 = Math.sin(nx * Math.PI * 8 + 1.2) * Math.sin(ny * Math.PI * 6 + 0.8) * 0.5;
        const v3 = Math.cos((nx + ny) * Math.PI * 6) * 0.35;
        const density = v1 + v2 + v3;

        if (density > 0.42) {
          const px = bx * blockSize;
          const py = by * blockSize;
          cctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          cctx.fillRect(px, py, blockSize, blockSize);

          cctx.fillStyle = 'rgba(210, 224, 246, 0.85)';
          cctx.fillRect(px, py + blockSize - 1, blockSize, 1);
        }
      }
    }

    this.cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    this.cloudTexture.magFilter = THREE.NearestFilter;
    this.cloudTexture.minFilter = THREE.NearestFilter;
    this.cloudTexture.wrapS = THREE.RepeatWrapping;
    this.cloudTexture.wrapT = THREE.RepeatWrapping;
    this.cloudTexture.repeat.set(5, 5);

    const cloudGeom = new THREE.PlaneGeometry(1600, 1600);
    const cloudMat = new THREE.MeshBasicMaterial({
      map: this.cloudTexture,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      fog: false,
      depthWrite: false,
    });
    this.cloudMesh = new THREE.Mesh(cloudGeom, cloudMat);
    this.cloudMesh.rotation.x = Math.PI / 2;
    this.cloudMesh.position.set(0, 138, 0);
    this.scene.add(this.cloudMesh);

    // 7. Horizon Fog
    this.scene.fog = new THREE.FogExp2(0x7cb2ff, 0.0085);
  }

  public setTimeOfDay(time: number) {
    this.timeOfDay = Math.max(0, Math.min(1, time));
  }

  public setUnderwater(underwater: boolean) {
    this.isUnderwater = underwater;
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    weather: WeatherType = 'clear',
    isLightning: boolean = false,
    windSpeed: number = 2.5,
    windAngle: number = 0.4
  ) {
    // If auto cycle enabled, advance time naturally
    if (this.isAutoCycle) {
      this.timeOfDay = (this.timeOfDay + dt / this.dayDurationSec) % 1.0;
    }

    // Celestial angle
    const angle = this.timeOfDay * Math.PI * 2;
    const orbitRadius = 140;

    // Sun positions
    const sunX = playerPos.x + Math.sin(angle) * orbitRadius;
    const sunY = playerPos.y + Math.cos(angle) * orbitRadius;
    const sunZ = playerPos.z + 12;

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.sunMesh.lookAt(playerPos);

    this.sunCoronaMesh.position.set(sunX, sunY, sunZ);
    this.sunCoronaMesh.lookAt(playerPos);

    // Moon is opposite to the sun
    const moonAngle = angle + Math.PI;
    const moonX = playerPos.x + Math.sin(moonAngle) * orbitRadius;
    const moonY = playerPos.y + Math.cos(moonAngle) * orbitRadius;
    const moonZ = playerPos.z + 12;

    this.moonMesh.position.set(moonX, moonY, moonZ);
    this.moonMesh.lookAt(playerPos);

    // Starfield moves with player
    this.starPoints.position.copy(playerPos);

    // Sun Key Light tracks sun or moon
    const isDay = sunY > playerPos.y - 10;
    if (isDay) {
      this.sunLight.position.set(sunX, Math.max(playerPos.y + 15, sunY), sunZ);
      this.sunLight.target.position.copy(playerPos);
    } else {
      // At night, moon acts as softer key light
      this.sunLight.position.set(moonX, Math.max(playerPos.y + 15, moonY), moonZ);
      this.sunLight.target.position.copy(playerPos);
    }
    this.sunLight.target.updateMatrixWorld();

    // Drifting Minecraft cloud layer with wind
    this.cloudMesh.position.x = playerPos.x;
    this.cloudMesh.position.z = playerPos.z;
    if (this.cloudTexture) {
      const windDrift = (windSpeed / 5.0) * dt * 0.003;
      this.cloudTexture.offset.x += Math.sin(windAngle) * windDrift;
      this.cloudTexture.offset.y += Math.cos(windAngle) * windDrift;
    }

    // Color gradient transitions across the 24-hour cycle
    let skyColor: THREE.Color;
    let fogDensity = 0.0085;
    let sunIntensity = 2.15;
    let hemiIntensity = 1.1;
    let starOpacity = 0.0;

    // Compute day progression phase
    if (this.timeOfDay >= 0.22 && this.timeOfDay < 0.32) {
      // Dawn / Sunrise: Golden orange and peach
      const t = (this.timeOfDay - 0.22) / 0.1;
      const dawnCol = new THREE.Color(0xef854b);
      const dayCol = new THREE.Color(0x7cb2ff);
      skyColor = dawnCol.clone().lerp(dayCol, t);
      sunIntensity = 1.2 + t * 0.95;
      hemiIntensity = 0.8 + t * 0.3;
      starOpacity = Math.max(0, 1 - t * 2.5);
    } else if (this.timeOfDay >= 0.32 && this.timeOfDay < 0.68) {
      // Full Daytime / High Noon: Vibrant azure blue
      skyColor = new THREE.Color(0x7cb2ff);
      sunIntensity = 2.15;
      hemiIntensity = 1.1;
      starOpacity = 0.0;
    } else if (this.timeOfDay >= 0.68 && this.timeOfDay < 0.78) {
      // Golden Hour / Sunset: Rich crimson-amber
      const t = (this.timeOfDay - 0.68) / 0.1;
      const dayCol = new THREE.Color(0x7cb2ff);
      const sunsetCol = new THREE.Color(0xe06638);
      skyColor = dayCol.clone().lerp(sunsetCol, t);
      sunIntensity = 2.15 - t * 0.9;
      hemiIntensity = 1.1 - t * 0.35;
      starOpacity = Math.max(0, (t - 0.5) * 2);
    } else if (this.timeOfDay >= 0.78 && this.timeOfDay < 0.85) {
      // Dusk / Twilight: Deep purple indigo
      const t = (this.timeOfDay - 0.78) / 0.07;
      const sunsetCol = new THREE.Color(0xe06638);
      const duskCol = new THREE.Color(0x181a33);
      skyColor = sunsetCol.clone().lerp(duskCol, t);
      sunIntensity = 1.25 - t * 0.85;
      hemiIntensity = 0.75 - t * 0.4;
      starOpacity = 0.6 + t * 0.4;
    } else {
      // Full Night: Starry deep dark navy
      skyColor = new THREE.Color(0x070b16);
      sunIntensity = 0.45; // Silvery moonlight
      hemiIntensity = 0.35;
      starOpacity = 1.0;
    }

    // Weather modifiers
    if (weather === 'rain') {
      skyColor.lerp(new THREE.Color(0x404a58), 0.75);
      fogDensity = 0.014;
      sunIntensity *= 0.55;
      hemiIntensity *= 0.65;
    } else if (weather === 'thunderstorm') {
      skyColor.lerp(new THREE.Color(0x242833), 0.85);
      fogDensity = 0.018;
      sunIntensity *= 0.4;
      hemiIntensity *= 0.5;
    } else if (weather === 'snow') {
      skyColor.lerp(new THREE.Color(0xdde3ed), 0.6);
      fogDensity = 0.016;
      sunIntensity *= 0.7;
    } else if (weather === 'foggy') {
      skyColor.lerp(new THREE.Color(0xb0bcc9), 0.7);
      fogDensity = 0.024;
      sunIntensity *= 0.6;
    }

    // Lightning Flash illumination
    if (isLightning) {
      skyColor = new THREE.Color(0xdbeafe);
      sunIntensity = 4.2;
      hemiIntensity = 2.8;
      fogDensity = 0.009;
    }

    // Star opacity
    (this.starPoints.material as THREE.PointsMaterial).opacity = starOpacity;

    // Apply to scene background and fog
    if (this.isUnderwater) {
      const waterSkyColor = new THREE.Color(0x0a284e);
      this.scene.background = waterSkyColor;
      if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.setHex(0x0c305c);
        this.scene.fog.density = 0.038;
      }
      this.sunLight.intensity = 0.65;
      this.hemiLight.intensity = 0.4;
    } else {
      this.scene.background = skyColor;
      if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color.copy(skyColor);
        this.scene.fog.density = fogDensity;
      }
      this.sunLight.intensity = sunIntensity;
      this.hemiLight.intensity = hemiIntensity;
    }
  }

  public dispose() {
    this.scene.remove(this.sunLight);
    this.scene.remove(this.hemiLight);
    this.scene.remove(this.sunMesh);
    this.sunMesh.geometry.dispose();
    this.scene.remove(this.sunCoronaMesh);
    this.sunCoronaMesh.geometry.dispose();
    this.scene.remove(this.moonMesh);
    this.moonMesh.geometry.dispose();
    this.scene.remove(this.starPoints);
    this.starPoints.geometry.dispose();
    this.scene.remove(this.cloudMesh);
    this.cloudMesh.geometry.dispose();
    this.cloudTexture.dispose();
  }
}
