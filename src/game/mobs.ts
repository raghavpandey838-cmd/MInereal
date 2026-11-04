/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { MobEntity, DroppedItemEntity, ParticleEffect, ItemId, BlockType, GameMode } from './types';
import { VoxelWorld } from './world';
import { PhysicsEngine } from './physics';
import { sounds } from './audio';

export interface MobVisual {
  entity: MobEntity;
  group: THREE.Group;
  head: THREE.Mesh;
  body: THREE.Mesh;
  leftArm?: THREE.Mesh;
  rightArm?: THREE.Mesh;
  leftLeg?: THREE.Mesh;
  rightLeg?: THREE.Mesh;
  legFL?: THREE.Mesh; // 4-legged mobs
  legFR?: THREE.Mesh;
  legBL?: THREE.Mesh;
  legBR?: THREE.Mesh;
  wingL?: THREE.Mesh; // Chicken wings
  wingR?: THREE.Mesh;
  spiderLegs?: THREE.Mesh[]; // Spider 8 legs
  flashTimer: number;
}

export class EntityManager {
  public mobs: MobVisual[] = [];
  public droppedItems: { entity: DroppedItemEntity; mesh: THREE.Group }[] = [];
  public particles: ParticleEffect[] = [];
  public particlePoints: THREE.Points | null = null;
  public primedTntList: { x: number; y: number; z: number; mesh: THREE.Mesh; fuse: number }[] = [];
  public arrows: { pos: THREE.Vector3; vel: THREE.Vector3; mesh: THREE.Mesh; life: number }[] = [];
  public scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initParticleSystem();
  }

  private initParticleSystem() {
    const maxParticles = 400;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    this.particlePoints = new THREE.Points(geom, mat);
    this.particlePoints.frustumCulled = false;
    this.scene.add(this.particlePoints);
  }

  // Spawn a mob
  public spawnMob(
    type: 'zombie' | 'skeleton' | 'creeper' | 'spider' | 'pig' | 'cow' | 'sheep' | 'chicken',
    x: number,
    y: number,
    z: number
  ): MobVisual {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    let head: THREE.Mesh;
    let body: THREE.Mesh;
    let leftArm: THREE.Mesh | undefined;
    let rightArm: THREE.Mesh | undefined;
    let leftLeg: THREE.Mesh | undefined;
    let rightLeg: THREE.Mesh | undefined;
    let legFL: THREE.Mesh | undefined;
    let legFR: THREE.Mesh | undefined;
    let legBL: THREE.Mesh | undefined;
    let legBR: THREE.Mesh | undefined;
    let wingL: THREE.Mesh | undefined;
    let wingR: THREE.Mesh | undefined;
    let spiderLegs: THREE.Mesh[] | undefined;

    let maxHealth = 20;

    if (type === 'zombie') {
      maxHealth = 20;
      // Head
      const headMat = new THREE.MeshStandardMaterial({ color: 0x477839, roughness: 0.8 });
      head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
      head.position.y = 1.65;
      group.add(head);

      // Torso
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x247596, roughness: 0.8 });
      body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.25), bodyMat);
      body.position.y = 1.05;
      group.add(body);

      // Arms (held forward in classic zombie pose)
      const armMat = new THREE.MeshStandardMaterial({ color: 0x477839, roughness: 0.8 });
      leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.75, 0.25), armMat);
      leftArm.position.set(-0.38, 1.05, 0.35);
      leftArm.rotation.x = -Math.PI / 2;
      group.add(leftArm);

      rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.75, 0.25), armMat);
      rightArm.position.set(0.38, 1.05, 0.35);
      rightArm.rotation.x = -Math.PI / 2;
      group.add(rightArm);

      // Legs
      const legMat = new THREE.MeshStandardMaterial({ color: 0x223366, roughness: 0.8 });
      leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.24), legMat);
      leftLeg.position.set(-0.13, 0.38, 0);
      group.add(leftLeg);

      rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.75, 0.24), legMat);
      rightLeg.position.set(0.13, 0.38, 0);
      group.add(rightLeg);
    } else if (type === 'skeleton') {
      maxHealth = 20;
      const boneMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.7 });
      head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), boneMat);
      head.position.y = 1.65;
      group.add(head);

      body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.75, 0.2), boneMat);
      body.position.y = 1.05;
      group.add(body);

      leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.75, 0.15), boneMat);
      leftArm.position.set(-0.32, 1.05, 0.3);
      leftArm.rotation.x = -Math.PI / 2.2;
      group.add(leftArm);

      rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.75, 0.15), boneMat);
      rightArm.position.set(0.32, 1.05, 0.3);
      rightArm.rotation.x = -Math.PI / 2.2;
      group.add(rightArm);

      leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.75, 0.15), boneMat);
      leftLeg.position.set(-0.12, 0.38, 0);
      group.add(leftLeg);

      rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.75, 0.15), boneMat);
      rightLeg.position.set(0.12, 0.38, 0);
      group.add(rightLeg);
    } else if (type === 'creeper') {
      maxHealth = 20;
      const creeperMat = new THREE.MeshStandardMaterial({ color: 0x42963b, roughness: 0.8 });
      head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), creeperMat);
      head.position.y = 1.45;
      group.add(head);

      body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.65, 0.25), creeperMat);
      body.position.y = 0.9;
      group.add(body);

      const legMat = new THREE.MeshStandardMaterial({ color: 0x367a30, roughness: 0.8 });
      legFL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.2), legMat);
      legFL.position.set(-0.15, 0.22, 0.15);
      group.add(legFL);

      legFR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.2), legMat);
      legFR.position.set(0.15, 0.22, 0.15);
      group.add(legFR);

      legBL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.2), legMat);
      legBL.position.set(-0.15, 0.22, -0.15);
      group.add(legBL);

      legBR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.45, 0.2), legMat);
      legBR.position.set(0.15, 0.22, -0.15);
      group.add(legBR);
    } else if (type === 'sheep') {
      // Sheep (Fluffy realistic sheep with wool coat, pink face & eyes)
      maxHealth = 8;
      const faceMat = new THREE.MeshStandardMaterial({ color: 0xdfcbb5, roughness: 0.8 });
      head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.46), faceMat);
      head.position.set(0, 0.85, 0.42);
      group.add(head);

      // Wool top cap on head
      const woolMat = new THREE.MeshStandardMaterial({ color: 0xf6f6f6, roughness: 0.95 });
      const woolCap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.46), woolMat);
      woolCap.position.set(0, 0.98, 0.4);
      group.add(woolCap);

      // Black eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
      eyeL.position.set(-0.2, 0.88, 0.55);
      group.add(eyeL);
      const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
      eyeR.position.set(0.2, 0.88, 0.55);
      group.add(eyeR);

      // Fluffy wool body (puffy geometry)
      body = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.68, 1.05), woolMat);
      body.position.set(0, 0.72, 0);
      group.add(body);

      const legMat = new THREE.MeshStandardMaterial({ color: 0xdfcbb5, roughness: 0.8 });
      legFL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.16), legMat);
      legFL.position.set(-0.2, 0.22, 0.3);
      group.add(legFL);

      legFR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.16), legMat);
      legFR.position.set(0.2, 0.22, 0.3);
      group.add(legFR);

      legBL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.16), legMat);
      legBL.position.set(-0.2, 0.22, -0.3);
      group.add(legBL);

      legBR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.16), legMat);
      legBR.position.set(0.2, 0.22, -0.3);
      group.add(legBR);
    } else if (type === 'cow') {
      // Dairy Cow (Realistic with horns, snout, patched hide, and pink udders)
      maxHealth = 10;
      const cowMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 });
      head = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.48), cowMat);
      head.position.set(0, 0.9, 0.45);
      group.add(head);

      // Authentic Cow Horns
      const hornMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6 });
      const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), hornMat);
      hornL.position.set(-0.28, 1.14, 0.44);
      group.add(hornL);

      const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.08), hornMat);
      hornR.position.set(0.28, 1.14, 0.44);
      group.add(hornR);

      // Protruding Snout with nostrils
      const snoutMat = new THREE.MeshStandardMaterial({ color: 0x362c24, roughness: 0.8 });
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.22), snoutMat);
      snout.position.set(0, 0.78, 0.68);
      group.add(snout);

      // Torso with white spot patches
      body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.75, 1.05), cowMat);
      body.position.set(0, 0.75, 0);
      group.add(body);

      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.8 });
      const patch = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.5), whiteMat);
      patch.position.set(0, 0.8, -0.1);
      group.add(patch);

      // Pink Udders underneath
      const udderMat = new THREE.MeshStandardMaterial({ color: 0xf4a8b8, roughness: 0.8 });
      const udder = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.24), udderMat);
      udder.position.set(0, 0.36, -0.15);
      group.add(udder);

      const legMat = new THREE.MeshStandardMaterial({ color: 0x2d1f15, roughness: 0.8 });
      legFL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.18), legMat);
      legFL.position.set(-0.2, 0.22, 0.32);
      group.add(legFL);

      legFR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.18), legMat);
      legFR.position.set(0.2, 0.22, 0.32);
      group.add(legFR);

      legBL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.18), legMat);
      legBL.position.set(-0.2, 0.22, -0.32);
      group.add(legBL);

      legBR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.18), legMat);
      legBR.position.set(0.2, 0.22, -0.32);
      group.add(legBR);
    } else if (type === 'chicken') {
      // Chicken (White feather body, red comb, yellow beak, red wattle, flapping wings)
      maxHealth = 4;
      const chickenMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 });
      head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.26), chickenMat);
      head.position.set(0, 0.72, 0.22);
      group.add(head);

      // Bright Red Comb on top
      const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 });
      const comb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.16), redMat);
      comb.position.set(0, 0.9, 0.22);
      group.add(comb);

      // Yellow Beak
      const beakMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
      const beak = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.14), beakMat);
      beak.position.set(0, 0.72, 0.38);
      group.add(beak);

      // Red Wattle underneath beak
      const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), redMat);
      wattle.position.set(0, 0.62, 0.32);
      group.add(wattle);

      // Feathered Body
      body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.52), chickenMat);
      body.position.set(0, 0.48, 0);
      group.add(body);

      // Flapping Wings
      wingL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.4), chickenMat);
      wingL.position.set(-0.24, 0.48, 0);
      group.add(wingL);

      wingR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.4), chickenMat);
      wingR.position.set(0.24, 0.48, 0);
      group.add(wingR);

      // Yellow Legs
      leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), beakMat);
      leftLeg.position.set(-0.1, 0.14, 0.04);
      group.add(leftLeg);

      rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.08), beakMat);
      rightLeg.position.set(0.1, 0.14, 0.04);
      group.add(rightLeg);
    } else if (type === 'pig') {
      // Pig (Authentic Minecraft pink pig with protruding snout, nostrils, and black/white eyes)
      maxHealth = 10;
      const pigMat = new THREE.MeshStandardMaterial({ color: 0xf29bb0, roughness: 0.8 });
      head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), pigMat);
      head.position.set(0, 0.74, 0.38);
      group.add(head);

      // Protruding Pig Snout
      const snoutMat = new THREE.MeshStandardMaterial({ color: 0xdb8397, roughness: 0.7 });
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.16), snoutMat);
      snout.position.set(0, 0.65, 0.64);
      group.add(snout);

      // Nostrils on snout
      const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x5a2030 });
      const nostrilL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.02), nostrilMat);
      nostrilL.position.set(-0.06, 0.65, 0.73);
      group.add(nostrilL);
      const nostrilR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.02), nostrilMat);
      nostrilR.position.set(0.06, 0.65, 0.73);
      group.add(nostrilR);

      // Eyes on sides of head
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
      eyeL.position.set(-0.25, 0.78, 0.54);
      group.add(eyeL);
      const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.02), eyeMat);
      eyeR.position.set(0.25, 0.78, 0.54);
      group.add(eyeR);

      body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.9), pigMat);
      body.position.set(0, 0.65, 0);
      group.add(body);

      const legMat = new THREE.MeshStandardMaterial({ color: 0xdb8397, roughness: 0.8 });
      legFL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.18), legMat);
      legFL.position.set(-0.2, 0.18, 0.3);
      group.add(legFL);

      legFR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.18), legMat);
      legFR.position.set(0.2, 0.18, 0.3);
      group.add(legFR);

      legBL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.18), legMat);
      legBL.position.set(-0.2, 0.18, -0.3);
      group.add(legBL);

      legBR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.18), legMat);
      legBR.position.set(0.2, 0.18, -0.3);
      group.add(legBR);
    } else if (type === 'spider') {
      // Spider (Authentic Minecraft spider with red eyes, flat abdomen and 8 legs)
      maxHealth = 16;
      const spiderMat = new THREE.MeshStandardMaterial({ color: 0x1f1917, roughness: 0.85 });
      // Head
      head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.45), spiderMat);
      head.position.set(0, 0.45, 0.45);
      group.add(head);

      // Red glowing spider eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeMat);
      eyeL.position.set(-0.12, 0.48, 0.68);
      group.add(eyeL);
      const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeMat);
      eyeR.position.set(0.12, 0.48, 0.68);
      group.add(eyeR);

      // Abdomen
      body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.85), spiderMat);
      body.position.set(0, 0.48, -0.2);
      group.add(body);

      // 8 Articulated Legs
      spiderLegs = [];
      const legMat = new THREE.MeshStandardMaterial({ color: 0x181312, roughness: 0.9 });
      for (let legIdx = 0; legIdx < 8; legIdx++) {
        const isRight = legIdx >= 4;
        const sideIdx = legIdx % 4;
        const legGeom = new THREE.BoxGeometry(0.08, 0.08, 0.65);
        const leg = new THREE.Mesh(legGeom, legMat);
        const zOff = 0.25 - sideIdx * 0.2;
        const xOff = isRight ? 0.38 : -0.38;
        leg.position.set(xOff, 0.32, zOff);
        leg.rotation.y = (isRight ? 1 : -1) * (0.4 + sideIdx * 0.15);
        leg.rotation.z = isRight ? -0.35 : 0.35;
        group.add(leg);
        spiderLegs.push(leg);
      }
    } else {
      head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x477839 }));
      body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.25), new THREE.MeshStandardMaterial({ color: 0x247596 }));
    }

    this.scene.add(group);

    const mobVisual: MobVisual = {
      entity: {
        id: Math.random().toString(36).substring(2, 9),
        type,
        x,
        y,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        yaw: 0,
        pitch: 0,
        health: maxHealth,
        maxHealth,
        hurtCooldown: 0,
        attackCooldown: 0,
        isGrounded: false,
        fuse: type === 'creeper' ? 0 : undefined,
      },
      group,
      head,
      body,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      legFL,
      legFR,
      legBL,
      legBR,
      wingL,
      wingR,
      spiderLegs,
      flashTimer: 0,
    };

    this.mobs.push(mobVisual);
    return mobVisual;
  }

  // Spawn an arrow projectile
  public spawnArrow(fromX: number, fromY: number, fromZ: number, targetPos: THREE.Vector3) {
    const arrowGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.65, 5);
    arrowGeom.rotateX(Math.PI / 2);
    const arrowMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
    const arrowMesh = new THREE.Mesh(arrowGeom, arrowMat);
    arrowMesh.position.set(fromX, fromY, fromZ);

    const dir = new THREE.Vector3().subVectors(targetPos, new THREE.Vector3(fromX, fromY, fromZ)).normalize();
    dir.y += 0.12; // arc compensation
    dir.normalize();

    const speed = 19.0;
    const vel = dir.multiplyScalar(speed);
    arrowMesh.lookAt(targetPos);

    this.scene.add(arrowMesh);
    this.arrows.push({
      pos: new THREE.Vector3(fromX, fromY, fromZ),
      vel,
      mesh: arrowMesh,
      life: 0,
    });
  }

  // Update flying arrows
  public updateArrows(dt: number, world: VoxelWorld, playerPos: THREE.Vector3, onPlayerDamage: (amt: number) => void) {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arr = this.arrows[i];
      arr.life += dt;
      if (arr.life > 4.5) {
        this.scene.remove(arr.mesh);
        arr.mesh.geometry.dispose();
        this.arrows.splice(i, 1);
        continue;
      }

      arr.vel.y -= 9.8 * dt; // gravity arc
      arr.pos.addScaledVector(arr.vel, dt);
      arr.mesh.position.copy(arr.pos);
      arr.mesh.lookAt(arr.pos.clone().add(arr.vel));

      // Hit player check
      const dist = arr.pos.distanceTo(new THREE.Vector3(playerPos.x, playerPos.y + 0.9, playerPos.z));
      if (dist < 0.85) {
        sounds.playArrowHit();
        onPlayerDamage(3);
        this.spawnParticleBurst(arr.pos.x, arr.pos.y, arr.pos.z, '#ef4444', 6);
        this.scene.remove(arr.mesh);
        arr.mesh.geometry.dispose();
        this.arrows.splice(i, 1);
        continue;
      }

      // Hit solid block check
      const bx = Math.floor(arr.pos.x);
      const by = Math.floor(arr.pos.y);
      const bz = Math.floor(arr.pos.z);
      if (world.getBlock(bx, by, bz) !== BlockType.AIR && world.getBlock(bx, by, bz) !== BlockType.WATER) {
        sounds.playArrowHit();
        this.scene.remove(arr.mesh);
        arr.mesh.geometry.dispose();
        this.arrows.splice(i, 1);
      }
    }
  }

  // Update mob AI, physics, animations, and combat
  public updateMobs(
    world: VoxelWorld,
    playerPos: THREE.Vector3,
    dt: number,
    onPlayerDamage: (amount: number) => void,
    heldItemId?: ItemId | null,
    gameMode: GameMode = 'survival',
    timeOfDay: number = 0.5
  ) {
    const mobPos = new THREE.Vector3();
    const mobVel = new THREE.Vector3();
    const isTargetable = gameMode !== 'creative' && gameMode !== 'spectator';
    const isHardcore = gameMode === 'hardcore';

    // Update arrows
    this.updateArrows(dt, world, playerPos, onPlayerDamage);

    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];
      const ent = mob.entity;

      // Check if feet are in water
      const feetBlock = world.getBlock(Math.floor(ent.x), Math.floor(ent.y), Math.floor(ent.z));
      const inWater = feetBlock === BlockType.WATER;

      // Daylight burning for zombies and skeletons when unshaded and not in water
      if ((ent.type === 'zombie' || ent.type === 'skeleton') && timeOfDay >= 0.25 && timeOfDay <= 0.75 && !inWater) {
        const topY = world.findHighestSolidY(Math.floor(ent.x), Math.floor(ent.z));
        if (ent.y >= topY - 0.5) {
          ent.burning = (ent.burning || 0) + dt;
          if (Math.random() < 0.25) {
            this.spawnParticleBurst(ent.x, ent.y + 1.2, ent.z, '#f97316', 3);
          }
          if (ent.burning >= 1.5) {
            ent.burning = 0;
            ent.health -= 1;
            mob.flashTimer = 0.2;
            mob.group.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material) {
                child.material.color.set(0xff3333);
              }
            });
            sounds.playMobHurt();
            if (ent.health <= 0) {
              this.killMob(i, world, true);
              continue;
            }
          }
        }
      }

      // Hurt cooldown & hit flash
      if (ent.hurtCooldown > 0) {
        ent.hurtCooldown -= dt;
      }
      if (mob.flashTimer > 0) {
        mob.flashTimer -= dt;
        if (mob.flashTimer <= 0) {
          // Reset material color
          mob.group.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              child.material.color.set(0xffffff);
            }
          });
        }
      }

      // Check death
      if (ent.health <= 0) {
        this.killMob(i, world);
        continue;
      }

      // AI Behavior & Aggro Detection
      const distToPlayer = Math.hypot(playerPos.x - ent.x, playerPos.z - ent.z);
      const dyToPlayer = playerPos.y - ent.y;
      let isChasing = false;
      let currentChaseSpeed = 0;

      if (ent.type === 'zombie') {
        const aggroDist = isHardcore ? 40 : 32;
        if (isTargetable && distToPlayer < aggroDist) {
          isChasing = true;
          const angle = Math.atan2(playerPos.x - ent.x, playerPos.z - ent.z);
          ent.yaw = angle;
          currentChaseSpeed = isHardcore ? 3.4 : 2.8;
          ent.vx = Math.sin(angle) * currentChaseSpeed;
          ent.vz = Math.cos(angle) * currentChaseSpeed;

          // Attack player if close
          if (distToPlayer < 1.4 && Math.abs(dyToPlayer) < 1.8) {
            if (ent.attackCooldown <= 0) {
              const dmg = isHardcore ? 5 : 3;
              onPlayerDamage(dmg);
              sounds.playPlayerHurt();
              ent.attackCooldown = isHardcore ? 0.75 : 1.0;
            }
          }
        } else {
          // Slow idle wander
          if (Math.random() < 0.02) {
            ent.yaw += (Math.random() - 0.5) * 2;
            ent.vx = Math.sin(ent.yaw) * 0.8;
            ent.vz = Math.cos(ent.yaw) * 0.8;
          }
        }
      } else if (ent.type === 'skeleton') {
        const aggroDist = isHardcore ? 34 : 26;
        if (isTargetable && distToPlayer < aggroDist) {
          isChasing = true;
          const angle = Math.atan2(playerPos.x - ent.x, playerPos.z - ent.z);
          ent.yaw = angle;
          currentChaseSpeed = isHardcore ? 2.8 : 2.3;

          // Tactical archery positioning: maintain 8 to 14 blocks
          if (distToPlayer < 6.5) {
            ent.vx = -Math.sin(angle) * currentChaseSpeed;
            ent.vz = -Math.cos(angle) * currentChaseSpeed;
          } else if (distToPlayer > 13.5) {
            ent.vx = Math.sin(angle) * currentChaseSpeed;
            ent.vz = Math.cos(angle) * currentChaseSpeed;
          } else {
            // Circle / strafe player
            ent.vx = Math.cos(angle) * 1.6;
            ent.vz = -Math.sin(angle) * 1.6;
          }

          if (distToPlayer < 24 && Math.abs(dyToPlayer) < 6.0) {
            if (ent.attackCooldown <= 0) {
              sounds.playArrowShoot();
              this.spawnArrow(ent.x, ent.y + 1.2, ent.z, playerPos);
              ent.attackCooldown = isHardcore ? 1.2 : 1.8;
            }
          }
        } else {
          // Slow wander
          if (Math.random() < 0.02) {
            ent.yaw += (Math.random() - 0.5) * 2;
            ent.vx = Math.sin(ent.yaw) * 0.7;
            ent.vz = Math.cos(ent.yaw) * 0.7;
          }
        }
      } else if (ent.type === 'creeper') {
        const aggroDist = isHardcore ? 28 : 22;
        if (isTargetable && distToPlayer < aggroDist) {
          isChasing = true;
          const angle = Math.atan2(playerPos.x - ent.x, playerPos.z - ent.z);
          ent.yaw = angle;
          currentChaseSpeed = isHardcore ? 3.4 : 2.8;
          ent.vx = Math.sin(angle) * currentChaseSpeed;
          ent.vz = Math.cos(angle) * currentChaseSpeed;

          // Fuse ticking if within trigger range
          const fuseTriggerDist = isHardcore ? 3.6 : 3.2;
          const maxFuseTime = isHardcore ? 0.9 : 1.35;

          if (distToPlayer < fuseTriggerDist) {
            ent.fuse = (ent.fuse || 0) + dt;
            if (ent.fuse > 0.06 && ent.fuse < 0.22) {
              sounds.playCreeperHiss();
            }

            // Swell / pulse white
            const scale = 1.0 + (ent.fuse / maxFuseTime) * 0.45;
            mob.group.scale.set(scale, scale, scale);

            if (ent.fuse >= maxFuseTime) {
              // EXPLODE!
              this.explodeAt(world, ent.x, ent.y + 0.5, ent.z, isHardcore ? 4.8 : 3.8);
              this.killMob(i, world, false);
              continue;
            }
          } else {
            ent.fuse = Math.max(0, (ent.fuse || 0) - dt * 2.5);
            mob.group.scale.set(1, 1, 1);
          }
        } else {
          ent.fuse = 0;
          mob.group.scale.set(1, 1, 1);
          if (Math.random() < 0.02) {
            ent.yaw += (Math.random() - 0.5) * 2;
            ent.vx = Math.sin(ent.yaw) * 0.7;
            ent.vz = Math.cos(ent.yaw) * 0.7;
          }
        }
      } else if (ent.type === 'spider') {
        const aggroDist = isHardcore ? 36 : 28;
        if (isTargetable && distToPlayer < aggroDist) {
          isChasing = true;
          const angle = Math.atan2(playerPos.x - ent.x, playerPos.z - ent.z);
          ent.yaw = angle;
          currentChaseSpeed = isHardcore ? 3.6 : 3.0;
          ent.vx = Math.sin(angle) * currentChaseSpeed;
          ent.vz = Math.cos(angle) * currentChaseSpeed;

          // Spider Pounce / Leap when close!
          if (distToPlayer < 4.5 && ent.isGrounded && ent.attackCooldown <= 0) {
            ent.vy = 6.2;
            ent.vx = Math.sin(angle) * (currentChaseSpeed + 2.0);
            ent.vz = Math.cos(angle) * (currentChaseSpeed + 2.0);
            sounds.playSwing();
            ent.attackCooldown = 1.2;
          }

          // Bite attack
          if (distToPlayer < 1.4 && Math.abs(dyToPlayer) < 1.6) {
            if (ent.attackCooldown <= 0) {
              const dmg = isHardcore ? 4 : 2;
              onPlayerDamage(dmg);
              sounds.playPlayerHurt();
              ent.attackCooldown = 0.8;
            }
          }
        } else {
          // Idle skitter
          if (Math.random() < 0.03) {
            ent.yaw += (Math.random() - 0.5) * 2;
            ent.vx = Math.sin(ent.yaw) * 1.0;
            ent.vz = Math.cos(ent.yaw) * 1.0;
          }
        }
      } else {
        // Peaceful animals (Pig, Cow, Sheep, Chicken)
        const isAnimalFood =
          heldItemId &&
          (heldItemId === 'wheat' ||
            heldItemId === 'hay_bale' ||
            heldItemId === 'apple' ||
            heldItemId === 'bread' ||
            heldItemId === 'seeds' ||
            heldItemId === 'carrot' ||
            heldItemId === 'raw_beef' ||
            heldItemId === 'raw_porkchop');

        // 1. Panic Fleeing when damaged
        if (ent.fleeTimer && ent.fleeTimer > 0) {
          ent.fleeTimer -= dt;
          ent.vx = Math.sin(ent.yaw) * 3.0;
          ent.vz = Math.cos(ent.yaw) * 3.0;
          if (Math.random() < 0.06) {
            ent.yaw += (Math.random() - 0.5) * 1.5;
          }
        }
        // 2. Follow player eagerly when holding food!
        else if (isAnimalFood && distToPlayer < 10) {
          const angle = Math.atan2(playerPos.x - ent.x, playerPos.z - ent.z);
          ent.yaw = angle;
          if (distToPlayer > 2.0) {
            ent.vx = Math.sin(angle) * 1.7;
            ent.vz = Math.cos(angle) * 1.7;
          } else {
            ent.vx = 0;
            ent.vz = 0;
          }
          // Turn head toward player
          mob.head.rotation.y = 0;
        }
        // 3. Idle Grazing / Wandering
        else {
          ent.grazeTimer = (ent.grazeTimer || 0) + dt;
          // Grazing animation for Cow & Sheep: dips head to ground
          if ((ent.type === 'cow' || ent.type === 'sheep') && ent.grazeTimer > 5.0 && ent.isGrounded) {
            mob.head.rotation.x = 0.45;
            ent.vx = 0;
            ent.vz = 0;
            if (ent.grazeTimer > 7.0) {
              ent.grazeTimer = 0;
              mob.head.rotation.x = 0;
            }
          } else {
            mob.head.rotation.x = 0;
            if (Math.random() < 0.015) {
              ent.yaw += (Math.random() - 0.5) * 2;
              ent.vx = Math.sin(ent.yaw) * 1.2;
              ent.vz = Math.cos(ent.yaw) * 1.2;
            }
          }

          // Random ambient sound when player is nearby
          if (distToPlayer < 9 && Math.random() < 0.001) {
            if (ent.type === 'cow') sounds.playCowMoo();
            else if (ent.type === 'sheep') sounds.playSheepBaa();
            else if (ent.type === 'pig') sounds.playPigOink();
            else if (ent.type === 'chicken') sounds.playChickenCluck();
          }
        }
      }

      if (ent.attackCooldown > 0) {
        ent.attackCooldown -= dt;
      }

      // Physics integration
      ent.vy -= PhysicsEngine.GRAVITY * dt;
      if (ent.vy < -PhysicsEngine.TERMINAL_VELOCITY) {
        ent.vy = -PhysicsEngine.TERMINAL_VELOCITY;
      }

      mobPos.set(ent.x, ent.y, ent.z);
      mobVel.set(ent.vx, ent.vy, ent.vz);

      // Auto jump when hitting wall
      const res = PhysicsEngine.moveEntity(world, mobPos, mobVel, 0.3, 1.8, dt, true);
      ent.x = mobPos.x;
      ent.y = mobPos.y;
      ent.z = mobPos.z;
      ent.vy = mobVel.y;
      ent.isGrounded = res.isGrounded;

      if (res.hitWall && res.isGrounded) {
        ent.vy = 6.8;
        if (isChasing) {
          ent.vx = Math.sin(ent.yaw) * currentChaseSpeed;
          ent.vz = Math.cos(ent.yaw) * currentChaseSpeed;
        }
      }

      // Damping
      ent.vx *= 0.85;
      ent.vz *= 0.85;

      // Sync 3D Mesh
      mob.group.position.set(ent.x, ent.y, ent.z);
      mob.group.rotation.y = ent.yaw;

      // Leg swing animation
      const walkTime = Date.now() * 0.008;
      const isMoving = Math.hypot(ent.vx, ent.vz) > 0.2;
      const legAngle = isMoving ? Math.sin(walkTime) * 0.6 : 0;

      if (mob.leftLeg && mob.rightLeg) {
        mob.leftLeg.rotation.x = legAngle;
        mob.rightLeg.rotation.x = -legAngle;
      }
      if (mob.legFL && mob.legFR && mob.legBL && mob.legBR) {
        mob.legFL.rotation.x = legAngle;
        mob.legFR.rotation.x = -legAngle;
        mob.legBL.rotation.x = -legAngle;
        mob.legBR.rotation.x = legAngle;
      }

      // Spider 8 legs crawling animation
      if (mob.spiderLegs) {
        const crawlTime = Date.now() * 0.015;
        mob.spiderLegs.forEach((leg, idx) => {
          const phase = idx % 2 === 0 ? 1 : -1;
          leg.rotation.x = isMoving ? Math.sin(crawlTime + idx * 0.8) * 0.35 * phase : 0;
        });
      }

      // Chicken Flapping Wings Animation
      if (mob.wingL && mob.wingR) {
        const isFlapping = !ent.isGrounded || isMoving;
        const wingAngle = isFlapping ? Math.sin(Date.now() * 0.02) * 0.7 : 0;
        mob.wingL.rotation.z = -wingAngle;
        mob.wingR.rotation.z = wingAngle;
      }
    }
  }

  // Damage a mob from player attack
  public damageMob(mobIndex: number, amount: number, knockbackDir: THREE.Vector3) {
    const mob = this.mobs[mobIndex];
    if (!mob || mob.entity.hurtCooldown > 0) return;

    mob.entity.health -= amount;
    mob.entity.hurtCooldown = 0.4;
    mob.flashTimer = 0.2;
    mob.entity.fleeTimer = 3.5; // Panic flee when damaged

    // Apply knockback
    mob.entity.vx += knockbackDir.x * 6;
    mob.entity.vy += 4.5;
    mob.entity.vz += knockbackDir.z * 6;

    // Animal hurt vocalization
    if (mob.entity.type === 'cow') sounds.playCowMoo();
    else if (mob.entity.type === 'sheep') sounds.playSheepBaa();
    else if (mob.entity.type === 'pig') sounds.playPigOink();
    else if (mob.entity.type === 'chicken') sounds.playChickenCluck();
    else sounds.playMobHurt();

    // Red damage flash
    mob.group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material.color.set(0xff3333);
      }
    });

    // Spawn damage blood/hit particles
    this.spawnParticleBurst(mob.entity.x, mob.entity.y + 1, mob.entity.z, '#ff2222', 12);
  }

  public killMob(index: number, world: VoxelWorld, dropItems: boolean = true) {
    const mob = this.mobs[index];
    if (!mob) return;

    this.scene.remove(mob.group);
    sounds.playPop();

    // Death smoke puff
    this.spawnParticleBurst(mob.entity.x, mob.entity.y + 0.8, mob.entity.z, '#ffffff', 18);

    if (dropItems) {
      if (mob.entity.type === 'zombie') {
        this.spawnDroppedItem({ id: 'rotten_flesh', count: 1 }, mob.entity.x, mob.entity.y + 0.5, mob.entity.z);
      } else if (mob.entity.type === 'skeleton') {
        this.spawnDroppedItem({ id: 'bone', count: 2 }, mob.entity.x, mob.entity.y + 0.5, mob.entity.z);
      } else if (mob.entity.type === 'spider') {
        this.spawnDroppedItem({ id: 'string', count: 2 }, mob.entity.x, mob.entity.y + 0.5, mob.entity.z);
      } else if (mob.entity.type === 'creeper') {
        this.spawnDroppedItem({ id: 'gunpowder', count: 1 }, mob.entity.x, mob.entity.y + 0.5, mob.entity.z);
      } else if (mob.entity.type === 'pig') {
        this.spawnDroppedItem({ id: 'raw_porkchop', count: 2 }, mob.entity.x, mob.entity.y + 0.5, mob.entity.z);
      } else if (mob.entity.type === 'cow') {
        this.spawnDroppedItem({ id: 'raw_beef', count: 2 }, mob.entity.x, mob.entity.y + 0.5, mob.entity.z);
        this.spawnDroppedItem({ id: 'bone', count: 1 }, mob.entity.x, mob.entity.y + 0.5, mob.entity.z);
      } else if (mob.entity.type === 'sheep') {
        this.spawnDroppedItem({ id: 'white_wool', count: 1 }, mob.entity.x, mob.entity.y + 0.5, mob.entity.z);
      } else if (mob.entity.type === 'chicken') {
        this.spawnDroppedItem({ id: 'raw_chicken', count: 1 }, mob.entity.x, mob.entity.y + 0.5, mob.entity.z);
        this.spawnDroppedItem({ id: 'feather', count: 2 }, mob.entity.x, mob.entity.y + 0.5, mob.entity.z);
      }
    }

    this.mobs.splice(index, 1);
  }

  // Explode at position: carves voxel sphere, deals damage, spawns particles & sound
  public explodeAt(world: VoxelWorld, cx: number, cy: number, cz: number, radius: number = 3.5) {
    sounds.playExplosion();

    const minX = Math.floor(cx - radius);
    const maxX = Math.ceil(cx + radius);
    const minY = Math.max(1, Math.floor(cy - radius));
    const maxY = Math.min(60, Math.ceil(cy + radius));
    const minZ = Math.floor(cz - radius);
    const maxZ = Math.ceil(cz + radius);

    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          const dist = Math.hypot(x - cx, y - cy, z - cz);
          if (dist <= radius) {
            const block = world.getBlock(x, y, z);
            if (block !== BlockType.AIR && block !== BlockType.BEDROCK && block !== BlockType.OBSIDIAN) {
              world.setBlock(x, y, z, BlockType.AIR);
              if (Math.random() < 0.2) {
                this.spawnParticleBurst(x, y, z, '#888888', 3);
              }
            }
          }
        }
      }
    }

    world.rebuildDirtyChunks();
    this.spawnParticleBurst(cx, cy, cz, '#ff6600', 35);
  }

  // Dropped Items Management
  public spawnDroppedItem(item: { id: ItemId; count: number }, x: number, y: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Mini 3D voxel cube representation
    const geom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const mat = new THREE.MeshStandardMaterial({
      color: item.id.includes('diamond') ? 0x4dedeb : item.id.includes('gold') ? 0xfcd038 : 0x8b5a2b,
      roughness: 0.7,
    });
    const mesh = new THREE.Mesh(geom, mat);
    group.add(mesh);

    this.scene.add(group);

    this.droppedItems.push({
      entity: {
        id: Math.random().toString(),
        item,
        x,
        y,
        z,
        vx: (Math.random() - 0.5) * 3,
        vy: 4.5,
        vz: (Math.random() - 0.5) * 3,
        rotation: 0,
        spawnTime: Date.now(),
        isGrounded: false,
      },
      mesh: group,
    });
  }

  public updateDroppedItems(
    world: VoxelWorld,
    playerPos: THREE.Vector3,
    dt: number,
    onPickup: (item: { id: ItemId; count: number }) => void
  ) {
    const itemPos = new THREE.Vector3();
    const itemVel = new THREE.Vector3();

    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const drop = this.droppedItems[i];
      const ent = drop.entity;

      // Item spin and bob
      ent.rotation += dt * 3;
      drop.mesh.rotation.y = ent.rotation;

      // Distance to player for vacuum attraction
      const dist = Math.hypot(playerPos.x - ent.x, playerPos.y - ent.y, playerPos.z - ent.z);
      if (dist < 1.7) {
        // Collect!
        onPickup(ent.item);
        sounds.playPop();
        this.scene.remove(drop.mesh);
        this.droppedItems.splice(i, 1);
        continue;
      } else if (dist < 3.5) {
        // Magnetize towards player
        ent.vx += ((playerPos.x - ent.x) / dist) * 7 * dt;
        ent.vy += ((playerPos.y + 0.5 - ent.y) / dist) * 7 * dt;
        ent.vz += ((playerPos.z - ent.z) / dist) * 7 * dt;
      } else {
        // Gravity
        ent.vy -= PhysicsEngine.GRAVITY * dt;
      }

      itemPos.set(ent.x, ent.y, ent.z);
      itemVel.set(ent.vx, ent.vy, ent.vz);

      const res = PhysicsEngine.moveEntity(world, itemPos, itemVel, 0.2, 0.3, dt, false);
      ent.x = itemPos.x;
      ent.y = itemPos.y;
      ent.z = itemPos.z;
      ent.vy = itemVel.y;
      ent.vx *= 0.9;
      ent.vz *= 0.9;

      drop.mesh.position.set(ent.x, ent.y, ent.z);
    }
  }

  // Particle System (Anti-Lag: capped & only updates GPU when particles exist)
  public spawnParticleBurst(x: number, y: number, z: number, colorHex: string, count: number = 8) {
    if (this.particles.length > 180) {
      this.particles.splice(0, count);
    }
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 0.4,
        y: y + (Math.random() - 0.5) * 0.4,
        z: z + (Math.random() - 0.5) * 0.4,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 1,
        vz: (Math.random() - 0.5) * 4,
        color: colorHex,
        size: 0.15,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.4,
      });
    }
  }

  public updateParticles(dt: number) {
    if (!this.particlePoints) return;

    if (this.particles.length === 0) {
      if (this.particlePoints.visible) {
        this.particlePoints.visible = false;
      }
      return;
    }
    this.particlePoints.visible = true;

    const positions = this.particlePoints.geometry.attributes.position.array as Float32Array;
    const colors = this.particlePoints.geometry.attributes.color.array as Float32Array;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.vy -= 18 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
    }

    const c = new THREE.Color();
    for (let i = 0; i < 400; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        c.set(p.color);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      } else {
        positions[i * 3 + 1] = -9999;
      }
    }

    this.particlePoints.geometry.attributes.position.needsUpdate = true;
    this.particlePoints.geometry.attributes.color.needsUpdate = true;
  }

  public clearMobs() {
    for (const mob of this.mobs) {
      this.scene.remove(mob.group);
    }
    this.mobs = [];
    for (const arr of this.arrows) {
      this.scene.remove(arr.mesh);
      arr.mesh.geometry.dispose();
    }
    this.arrows = [];
  }

  // Spawn initial pack suited for chosen game mode
  public spawnInitialPack(world: VoxelWorld, spawnX: number, spawnZ: number, mode: GameMode) {
    this.clearMobs();

    // 1. Animals around spawn
    const spawnY = world.findHighestSolidY(Math.floor(spawnX), Math.floor(spawnZ));
    this.spawnMob('cow', spawnX + 4, spawnY + 1, spawnZ + 3);
    this.spawnMob('sheep', spawnX - 3, spawnY + 1, spawnZ + 4);
    this.spawnMob('pig', spawnX + 5, spawnY + 1, spawnZ - 3);
    this.spawnMob('chicken', spawnX - 2, spawnY + 1, spawnZ - 4);

    // 2. Initial hostile pack for Survival / Hardcore / Adventure
    if (mode === 'survival' || mode === 'hardcore' || mode === 'adventure') {
      const hostileDist = 20;
      const z1Y = world.findHighestSolidY(Math.floor(spawnX + hostileDist), Math.floor(spawnZ + hostileDist));
      this.spawnMob('zombie', spawnX + hostileDist, z1Y + 1, spawnZ + hostileDist);

      const z2Y = world.findHighestSolidY(Math.floor(spawnX - hostileDist), Math.floor(spawnZ + 14));
      this.spawnMob('zombie', spawnX - hostileDist, z2Y + 1, spawnZ + 14);

      const skelY = world.findHighestSolidY(Math.floor(spawnX + 16), Math.floor(spawnZ - hostileDist));
      this.spawnMob('skeleton', spawnX + 16, skelY + 1, spawnZ - hostileDist);

      const creepY = world.findHighestSolidY(Math.floor(spawnX - 16), Math.floor(spawnZ - 18));
      this.spawnMob('creeper', spawnX - 16, creepY + 1, spawnZ - 18);

      const spidY = world.findHighestSolidY(Math.floor(spawnX + 22), Math.floor(spawnZ - 10));
      this.spawnMob('spider', spawnX + 22, spidY + 1, spawnZ - 10);
    }
  }

  private mobSpawnTimer: number = 0;

  // Natural continuous mob spawning loop (called in gameLoop)
  public updateMobSpawning(
    world: VoxelWorld,
    playerPos: THREE.Vector3,
    timeOfDay: number,
    gameMode: GameMode,
    dt: number
  ) {
    this.mobSpawnTimer += dt;
    if (this.mobSpawnTimer < 2.0) return;
    this.mobSpawnTimer = 0;

    // Despawn mobs that have moved too far away (> 52 blocks)
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const m = this.mobs[i];
      const dist = Math.hypot(m.entity.x - playerPos.x, m.entity.z - playerPos.z);
      if (dist > 52) {
        this.scene.remove(m.group);
        this.mobs.splice(i, 1);
      }
    }

    if (gameMode === 'spectator') return;

    // Count hostiles and peacefuls
    let hostileCount = 0;
    let peacefulCount = 0;
    for (const m of this.mobs) {
      if (['zombie', 'skeleton', 'creeper', 'spider'].includes(m.entity.type)) {
        hostileCount++;
      } else {
        peacefulCount++;
      }
    }

    const maxHostiles = gameMode === 'hardcore' ? 14 : 10;
    const maxPeacefuls = 6;
    const isNight = timeOfDay < 0.24 || timeOfDay > 0.76;
    const isUnderground = playerPos.y < 26;

    // 1. Spawn Hostiles (Night time or in caves/underground)
    if ((isNight || isUnderground) && hostileCount < maxHostiles) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 18;
      const sx = Math.floor(playerPos.x + Math.sin(angle) * dist);
      const sz = Math.floor(playerPos.z + Math.cos(angle) * dist);

      let sy: number;
      if (isUnderground) {
        sy = Math.max(2, Math.floor(playerPos.y) + Math.floor((Math.random() - 0.5) * 6));
      } else {
        sy = world.findHighestSolidY(sx, sz);
      }

      const groundBlock = world.getBlock(sx, sy, sz);
      const headSpace1 = world.getBlock(sx, sy + 1, sz);
      const headSpace2 = world.getBlock(sx, sy + 2, sz);

      const isSolidGround =
        groundBlock !== BlockType.AIR &&
        groundBlock !== BlockType.WATER &&
        groundBlock !== BlockType.LAVA;
      const hasClearance =
        (headSpace1 === BlockType.AIR || headSpace1 === BlockType.POPPY || headSpace1 === BlockType.DANDELION) &&
        headSpace2 === BlockType.AIR;

      if (isSolidGround && hasClearance) {
        const hostilePool: ('zombie' | 'skeleton' | 'creeper' | 'spider')[] = [
          'zombie',
          'zombie',
          'skeleton',
          'creeper',
          'spider',
        ];
        const chosen = hostilePool[Math.floor(Math.random() * hostilePool.length)];
        this.spawnMob(chosen, sx + 0.5, sy + 1, sz + 0.5);
        this.spawnParticleBurst(sx + 0.5, sy + 1.2, sz + 0.5, '#4a044e', 8);
      }
    }

    // 2. Spawn Peaceful Animals during the day on surface Grass
    if (!isNight && !isUnderground && peacefulCount < maxPeacefuls) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 16 + Math.random() * 18;
      const sx = Math.floor(playerPos.x + Math.sin(angle) * dist);
      const sz = Math.floor(playerPos.z + Math.cos(angle) * dist);
      const sy = world.findHighestSolidY(sx, sz);

      const groundBlock = world.getBlock(sx, sy, sz);
      const headSpace = world.getBlock(sx, sy + 1, sz);

      if (
        groundBlock === BlockType.GRASS &&
        (headSpace === BlockType.AIR || headSpace === BlockType.POPPY || headSpace === BlockType.DANDELION)
      ) {
        const animalPool: ('cow' | 'sheep' | 'pig' | 'chicken')[] = ['cow', 'sheep', 'pig', 'chicken'];
        const chosen = animalPool[Math.floor(Math.random() * animalPool.length)];
        this.spawnMob(chosen, sx + 0.5, sy + 1, sz + 0.5);
      }
    }
  }

  public dispose() {
    this.mobs.forEach((mob) => this.scene.remove(mob.group));
    this.mobs = [];
    this.droppedItems.forEach((drop) => this.scene.remove(drop.mesh));
    this.droppedItems = [];
    this.arrows.forEach((arr) => {
      this.scene.remove(arr.mesh);
      arr.mesh.geometry.dispose();
    });
    this.arrows = [];
    if (this.particlePoints) {
      this.scene.remove(this.particlePoints);
      this.particlePoints.geometry.dispose();
    }
  }
}
