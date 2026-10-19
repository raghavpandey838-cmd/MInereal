/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { VehicleEntity, VehicleType, BlockType } from './types';
import { VoxelWorld } from './world';
import { PhysicsEngine } from './physics';
import { sounds } from './audio';

export interface VehicleVisual {
  entity: VehicleEntity;
  group: THREE.Group;
  wheels?: THREE.Mesh[];
  oars?: THREE.Mesh[];
  headlights?: THREE.SpotLight[];
}

export class VehicleManager {
  public vehicles: VehicleVisual[] = [];
  public mountedVehicle: VehicleVisual | null = null;
  public scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Spawn a vehicle in the world
  public spawnVehicle(type: VehicleType, x: number, y: number, z: number, yaw: number = 0): VehicleVisual {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;

    const wheels: THREE.Mesh[] = [];
    const oars: THREE.Mesh[] = [];
    const headlights: THREE.SpotLight[] = [];

    if (type === 'boat') {
      // 1. VOXEL ROWBOAT
      // Hull Base
      const hullMat = new THREE.MeshStandardMaterial({ color: 0x855428, roughness: 0.8 });
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x613d1c, roughness: 0.8 });
      const seatMat = new THREE.MeshStandardMaterial({ color: 0x9c6534, roughness: 0.7 });

      const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 2.2), hullMat);
      base.position.set(0, 0.1, 0);
      group.add(base);

      // Sides (Left, Right, Front bow, Back stern)
      const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 2.2), rimMat);
      leftWall.position.set(-0.65, 0.35, 0);
      group.add(leftWall);

      const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 2.2), rimMat);
      rightWall.position.set(0.65, 0.35, 0);
      group.add(rightWall);

      const stern = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 0.18), rimMat);
      stern.position.set(0, 0.35, -1.05);
      group.add(stern);

      const bow = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 0.18), rimMat);
      bow.position.set(0, 0.35, 1.05);
      group.add(bow);

      // Seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.45), seatMat);
      seat.position.set(0, 0.25, 0);
      group.add(seat);

      // Left & Right Oars
      const oarMat = new THREE.MeshStandardMaterial({ color: 0xdbb274, roughness: 0.7 });
      const oarL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4), oarMat);
      oarL.rotation.z = Math.PI / 4;
      oarL.position.set(-0.85, 0.4, 0.1);
      group.add(oarL);
      oars.push(oarL);

      const oarR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4), oarMat);
      oarR.rotation.z = -Math.PI / 4;
      oarR.position.set(0.85, 0.4, 0.1);
      group.add(oarR);
      oars.push(oarR);
    } else if (type === 'car') {
      // 2. VOXEL OFFROADER / CAR
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd93838, roughness: 0.6, metalness: 0.1 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x90caf9, transparent: true, opacity: 0.65, roughness: 0.2 });
      const bumperMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.9 });
      const rimWheelMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.4 });

      // Lower chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 2.8), bodyMat);
      chassis.position.set(0, 0.45, 0);
      group.add(chassis);

      // Cabin / Hood
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.0), bodyMat);
      hood.position.set(0, 0.75, 0.8);
      group.add(hood);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.65, 1.2), roofMat);
      cabin.position.set(0, 0.95, -0.3);
      group.add(cabin);

      // Windshield
      const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.5, 0.08), glassMat);
      windshield.position.set(0, 0.95, 0.32);
      windshield.rotation.x = -0.3;
      group.add(windshield);

      // Bumpers & Grille
      const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.25, 0.2), bumperMat);
      frontBumper.position.set(0, 0.4, 1.45);
      group.add(frontBumper);

      // 4 Heavy Voxel Wheels
      const wheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
      wheelGeom.rotateZ(Math.PI / 2);

      const wheelPositions: [number, number, number][] = [
        [-0.85, 0.35, 0.85],
        [0.85, 0.35, 0.85],
        [-0.85, 0.35, -0.85],
        [0.85, 0.35, -0.85],
      ];

      wheelPositions.forEach(([wx, wy, wz]) => {
        const wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(wx, wy, wz);
        group.add(wheel);
        wheels.push(wheel);
      });

      // Front Headlights
      const lightL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffaa }));
      lightL.position.set(-0.55, 0.7, 1.35);
      group.add(lightL);

      const lightR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffaa }));
      lightR.position.set(0.55, 0.7, 1.35);
      group.add(lightR);
    } else {
      // 3. VOXEL MOTORCYCLE / BIKE
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5, metalness: 0.2 });
      const engineMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.6, metalness: 0.5 });
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, metalness: 0.7 });

      // Main Bike Frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 1.6), frameMat);
      frame.position.set(0, 0.65, 0);
      group.add(frame);

      // Engine block
      const engineMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.6), engineMat);
      engineMesh.position.set(0, 0.4, 0);
      group.add(engineMesh);

      // Handlebars
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), handleMat);
      handle.position.set(0, 0.98, 0.5);
      group.add(handle);

      // Headlight
      const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.15), new THREE.MeshBasicMaterial({ color: 0xfff59d }));
      headlight.position.set(0, 0.9, 0.85);
      group.add(headlight);

      // Dual Big Wheels (Front & Back)
      const bikeWheelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
      bikeWheelGeom.rotateZ(Math.PI / 2);

      const frontWheel = new THREE.Mesh(bikeWheelGeom, wheelMat);
      frontWheel.position.set(0, 0.4, 0.85);
      group.add(frontWheel);
      wheels.push(frontWheel);

      const rearWheel = new THREE.Mesh(bikeWheelGeom, wheelMat);
      rearWheel.position.set(0, 0.4, -0.85);
      group.add(rearWheel);
      wheels.push(rearWheel);
    }

    this.scene.add(group);

    const vehicleVisual: VehicleVisual = {
      entity: {
        id: Math.random().toString(36).substring(2, 9),
        type,
        x,
        y,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        yaw,
        speed: 0,
        steering: 0,
        isMounted: false,
      },
      group,
      wheels,
      oars,
      headlights,
    };

    this.vehicles.push(vehicleVisual);
    sounds.playCraft();
    return vehicleVisual;
  }

  // Toggle Mount / Dismount nearest vehicle
  public toggleMountNearest(playerPos: THREE.Vector3): VehicleVisual | null {
    if (this.mountedVehicle) {
      // Dismount
      this.mountedVehicle.entity.isMounted = false;
      playerPos.x += Math.sin(this.mountedVehicle.entity.yaw + Math.PI / 2) * 1.5;
      playerPos.y += 0.5;
      playerPos.z += Math.cos(this.mountedVehicle.entity.yaw + Math.PI / 2) * 1.5;
      const v = this.mountedVehicle;
      this.mountedVehicle = null;
      sounds.playPop();
      return null;
    }

    // Find nearest within 3.5 blocks
    let nearest: VehicleVisual | null = null;
    let minDist = 3.5;

    for (const v of this.vehicles) {
      const dist = Math.hypot(playerPos.x - v.entity.x, playerPos.y - v.entity.y, playerPos.z - v.entity.z);
      if (dist < minDist) {
        minDist = dist;
        nearest = v;
      }
    }

    if (nearest) {
      nearest.entity.isMounted = true;
      this.mountedVehicle = nearest;
      sounds.playLevelUp();
      return nearest;
    }

    return null;
  }

  // Update vehicles physics and driving
  public updateVehicles(
    world: VoxelWorld,
    dt: number,
    keys: Record<string, boolean>,
    onWaterRipples?: (x: number, y: number, z: number) => void
  ) {
    const vPos = new THREE.Vector3();
    const vVel = new THREE.Vector3();

    for (const v of this.vehicles) {
      const ent = v.entity;

      if (ent.isMounted) {
        // Player input controls driving
        const forwardInput = (keys['KeyW'] || keys['w'] ? 1 : 0) - (keys['KeyS'] || keys['s'] ? 1 : 0);
        const steerInput = (keys['KeyA'] || keys['a'] ? 1 : 0) - (keys['KeyD'] || keys['d'] ? 1 : 0);

        // Max speeds based on vehicle type
        const maxSpeed = ent.type === 'bike' ? 18.0 : ent.type === 'car' ? 14.0 : 10.0;
        const accelRate = ent.type === 'bike' ? 16.0 : ent.type === 'car' ? 12.0 : 9.0;
        const turnRate = ent.type === 'bike' ? 3.0 : ent.type === 'car' ? 2.2 : 2.5;

        // Steer yaw
        if (Math.abs(ent.speed) > 0.5 || ent.type === 'boat') {
          ent.yaw += steerInput * turnRate * dt * (ent.speed >= 0 ? 1 : -1);
        }

        // Accelerate / Decelerate
        if (forwardInput !== 0) {
          ent.speed += forwardInput * accelRate * dt;
          ent.speed = Math.max(-maxSpeed * 0.4, Math.min(maxSpeed, ent.speed));
        } else {
          ent.speed *= Math.pow(0.92, dt * 60);
        }

        // Calculate velocity vectors
        ent.vx = Math.sin(ent.yaw) * ent.speed;
        ent.vz = Math.cos(ent.yaw) * ent.speed;

        // Oar animation for boat
        if (ent.type === 'boat' && v.oars && Math.abs(ent.speed) > 0.2) {
          const oarAngle = Math.sin(Date.now() * 0.01) * 0.4;
          v.oars[0].rotation.y = oarAngle;
          v.oars[1].rotation.y = -oarAngle;
          if (onWaterRipples && Math.random() < 0.3) {
            onWaterRipples(ent.x, ent.y, ent.z);
          }
        }

        // Spin wheels for car/bike
        if (v.wheels && Math.abs(ent.speed) > 0.1) {
          v.wheels.forEach((w) => {
            w.rotation.x += ent.speed * dt * 3.5;
          });
        }
      } else {
        // Unmounted friction
        ent.speed *= Math.pow(0.85, dt * 60);
        ent.vx = Math.sin(ent.yaw) * ent.speed;
        ent.vz = Math.cos(ent.yaw) * ent.speed;
      }

      // Vertical physics & terrain/water surface tracking
      const blockUnder = world.getBlock(Math.floor(ent.x), Math.floor(ent.y - 0.2), Math.floor(ent.z));
      const isOverWater = blockUnder === BlockType.WATER || world.getBlock(Math.floor(ent.x), Math.floor(ent.y), Math.floor(ent.z)) === BlockType.WATER;

      if (ent.type === 'boat' || isOverWater) {
        // Floating on water surface: snap smoothly to SEA_LEVEL = 24
        const targetWaterY = 24.0;
        ent.y += (targetWaterY - ent.y) * 10 * dt;
        ent.vy = 0;
      } else {
        // Land gravity
        ent.vy -= PhysicsEngine.GRAVITY * dt;
      }

      vPos.set(ent.x, ent.y, ent.z);
      vVel.set(ent.vx, ent.vy, ent.vz);

      const moveRes = PhysicsEngine.moveEntity(world, vPos, vVel, 0.7, 0.8, dt, true);
      ent.x = vPos.x;
      ent.y = vPos.y;
      ent.z = vPos.z;
      if (ent.type !== 'boat') {
        ent.vy = vVel.y;
      }

      // Sync 3D Mesh
      v.group.position.set(ent.x, ent.y, ent.z);
      v.group.rotation.y = ent.yaw;

      // Subtle roll tilt for motorcycle
      if (ent.type === 'bike') {
        const targetRoll = (keys['KeyA'] || keys['a'] ? -0.2 : (keys['KeyD'] || keys['d'] ? 0.2 : 0));
        v.group.rotation.z += (targetRoll - v.group.rotation.z) * 8 * dt;
      }
    }
  }

  public dispose() {
    this.vehicles.forEach((v) => this.scene.remove(v.group));
    this.vehicles = [];
    this.mountedVehicle = null;
  }
}
