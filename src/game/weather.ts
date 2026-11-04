/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { sounds } from './audio';

export type WeatherType = 'clear' | 'rain' | 'thunderstorm' | 'snow' | 'foggy';

export class WeatherManager {
  public scene: THREE.Scene;
  public currentWeather: WeatherType = 'clear';
  public targetWeather: WeatherType = 'clear';
  public weatherTransitionProgress: number = 1.0;
  
  // Rain particle system
  private rainPoints: THREE.Points | null = null;
  private rainGeom: THREE.BufferGeometry | null = null;
  private rainPositions: Float32Array | null = null;
  private rainVelocities: Float32Array | null = null;
  private rainCount = 1400;

  // Snow particle system
  private snowPoints: THREE.Points | null = null;
  private snowGeom: THREE.BufferGeometry | null = null;
  private snowPositions: Float32Array | null = null;
  private snowCount = 700;

  // Wind state
  public windSpeed: number = 2.5; // m/s
  public windAngle: number = 0.4; // radians
  public windGust: number = 0;

  // Lightning system for Thunderstorms
  private nextLightningTime: number = 8;
  private lightningDuration: number = 0;
  public isLightningFlashing: boolean = false;
  private lightningLight: THREE.DirectionalLight | null = null;

  // Ambient wildlife sound timer
  private nextAmbienceTime: number = 6;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initWeatherParticles();
    this.initLightningLight();
  }

  private initWeatherParticles() {
    // 1. Rain Particles
    this.rainGeom = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 3);
    this.rainVelocities = new Float32Array(this.rainCount);

    const radius = 28;
    const heightRange = 32;

    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * radius * 2;
      this.rainPositions[i * 3 + 1] = Math.random() * heightRange;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;
      this.rainVelocities[i] = 28 + Math.random() * 12; // Falling velocity
    }

    this.rainGeom.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    // Custom realistic cyan-white raindrop particle material
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.16,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });

    this.rainPoints = new THREE.Points(this.rainGeom, rainMat);
    this.rainPoints.frustumCulled = false;
    this.scene.add(this.rainPoints);

    // 2. Snow Particles
    this.snowGeom = new THREE.BufferGeometry();
    this.snowPositions = new Float32Array(this.snowCount * 3);

    for (let i = 0; i < this.snowCount; i++) {
      this.snowPositions[i * 3] = (Math.random() - 0.5) * radius * 2;
      this.snowPositions[i * 3 + 1] = Math.random() * heightRange;
      this.snowPositions[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;
    }

    this.snowGeom.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));

    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.22,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });

    this.snowPoints = new THREE.Points(this.snowGeom, snowMat);
    this.snowPoints.frustumCulled = false;
    this.scene.add(this.snowPoints);
  }

  private initLightningLight() {
    this.lightningLight = new THREE.DirectionalLight(0xdbeafe, 0.0);
    this.lightningLight.position.set(20, 80, 20);
    this.scene.add(this.lightningLight);
  }

  public setWeather(type: WeatherType) {
    this.currentWeather = type;
    this.targetWeather = type;
    this.weatherTransitionProgress = 1.0;
  }

  public update(dt: number, playerPos: THREE.Vector3, timeOfDay: number, isHighAltitude: boolean = false) {
    // 1. Natural wind gust fluctuations
    this.windAngle += Math.sin(Date.now() * 0.0004) * 0.002;
    this.windGust = Math.sin(Date.now() * 0.0012) * 1.5;
    const effectiveWind = Math.max(0.8, this.windSpeed + this.windGust);

    const isRaining = this.currentWeather === 'rain' || this.currentWeather === 'thunderstorm';
    const isSnowing = this.currentWeather === 'snow' || (isRaining && isHighAltitude);

    // 2. Audio updates based on weather
    const rainIntensity = this.currentWeather === 'thunderstorm' ? 1.0 : isRaining ? 0.65 : 0;
    sounds.updateRainSound(rainIntensity);

    const windIntensity = this.currentWeather === 'thunderstorm' ? 0.9 : this.currentWeather === 'snow' ? 0.6 : effectiveWind / 6.0;
    sounds.updateWindSound(windIntensity);

    // 3. Ambient Wildlife Sound System (birds chirping during clear morning, crickets at dusk/night)
    this.nextAmbienceTime -= dt;
    if (this.nextAmbienceTime <= 0) {
      this.nextAmbienceTime = 8 + Math.random() * 12;
      if (this.currentWeather === 'clear') {
        const isDay = timeOfDay >= 0.22 && timeOfDay <= 0.75;
        if (isDay) {
          sounds.playBirdChirp();
        } else {
          sounds.playCricket();
        }
      }
    }

    // 4. Update Rain Particles
    if (this.rainPoints && this.rainPositions && this.rainGeom && this.rainVelocities) {
      const rainMat = this.rainPoints.material as THREE.PointsMaterial;
      const targetRainOpacity = isRaining && !isSnowing ? (this.currentWeather === 'thunderstorm' ? 0.78 : 0.62) : 0.0;
      rainMat.opacity += (targetRainOpacity - rainMat.opacity) * Math.min(1, dt * 2.5);

      if (rainMat.opacity > 0.01) {
        this.rainPoints.position.copy(playerPos);
        const radius = 28;
        const heightRange = 32;
        const windDriftX = Math.sin(this.windAngle) * effectiveWind * dt;
        const windDriftZ = Math.cos(this.windAngle) * effectiveWind * dt;

        for (let i = 0; i < this.rainCount; i++) {
          let y = this.rainPositions[i * 3 + 1];
          let x = this.rainPositions[i * 3];
          let z = this.rainPositions[i * 3 + 2];

          y -= this.rainVelocities[i] * dt;
          x += windDriftX;
          z += windDriftZ;

          if (y < -6) {
            y = heightRange - Math.random() * 4;
            x = (Math.random() - 0.5) * radius * 2;
            z = (Math.random() - 0.5) * radius * 2;
          }

          this.rainPositions[i * 3] = x;
          this.rainPositions[i * 3 + 1] = y;
          this.rainPositions[i * 3 + 2] = z;
        }

        this.rainGeom.attributes.position.needsUpdate = true;
      }
    }

    // 5. Update Snow Particles
    if (this.snowPoints && this.snowPositions && this.snowGeom) {
      const snowMat = this.snowPoints.material as THREE.PointsMaterial;
      const targetSnowOpacity = isSnowing ? 0.85 : 0.0;
      snowMat.opacity += (targetSnowOpacity - snowMat.opacity) * Math.min(1, dt * 2.5);

      if (snowMat.opacity > 0.01) {
        this.snowPoints.position.copy(playerPos);
        const radius = 28;
        const heightRange = 32;

        for (let i = 0; i < this.snowCount; i++) {
          let y = this.snowPositions[i * 3 + 1];
          let x = this.snowPositions[i * 3];
          let z = this.snowPositions[i * 3 + 2];

          // Gentle fluttering drift
          const swirl = Math.sin(Date.now() * 0.002 + i) * 0.05;
          y -= (3.5 + Math.sin(i) * 1.2) * dt;
          x += (Math.sin(this.windAngle) * effectiveWind * 0.4 + swirl) * dt;
          z += (Math.cos(this.windAngle) * effectiveWind * 0.4 + swirl) * dt;

          if (y < -4) {
            y = heightRange - Math.random() * 4;
            x = (Math.random() - 0.5) * radius * 2;
            z = (Math.random() - 0.5) * radius * 2;
          }

          this.snowPositions[i * 3] = x;
          this.snowPositions[i * 3 + 1] = y;
          this.snowPositions[i * 3 + 2] = z;
        }

        this.snowGeom.attributes.position.needsUpdate = true;
      }
    }

    // 6. Thunderstorm Lightning System
    if (this.currentWeather === 'thunderstorm') {
      this.nextLightningTime -= dt;

      if (this.nextLightningTime <= 0) {
        // Trigger lightning flash
        this.nextLightningTime = 12 + Math.random() * 18;
        this.lightningDuration = 0.22; // multi-strobe flash
        this.isLightningFlashing = true;

        // Delayed acoustic thunder roll
        const thunderDist = 0.2 + Math.random() * 0.6;
        setTimeout(() => {
          sounds.playThunder(thunderDist);
        }, Math.floor(thunderDist * 900));
      }

      if (this.lightningDuration > 0) {
        this.lightningDuration -= dt;
        // Multi-strobe flicker
        const flicker = Math.sin(this.lightningDuration * 45) > 0.1 ? 3.8 : 0.5;
        if (this.lightningLight) {
          this.lightningLight.intensity = flicker;
          this.lightningLight.position.set(playerPos.x + 15, playerPos.y + 70, playerPos.z + 15);
        }
        this.isLightningFlashing = true;
      } else {
        if (this.lightningLight) {
          this.lightningLight.intensity = 0.0;
        }
        this.isLightningFlashing = false;
      }
    } else {
      if (this.lightningLight) {
        this.lightningLight.intensity = 0.0;
      }
      this.isLightningFlashing = false;
    }
  }

  public dispose() {
    if (this.rainPoints) {
      this.scene.remove(this.rainPoints);
      this.rainGeom?.dispose();
      (this.rainPoints.material as THREE.Material).dispose();
      this.rainPoints = null;
    }
    if (this.snowPoints) {
      this.scene.remove(this.snowPoints);
      this.snowGeom?.dispose();
      (this.snowPoints.material as THREE.Material).dispose();
      this.snowPoints = null;
    }
    if (this.lightningLight) {
      this.scene.remove(this.lightningLight);
      this.lightningLight = null;
    }
  }
}
