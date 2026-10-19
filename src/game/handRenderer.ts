/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { ItemId } from './types';
import { TileIndex, getTileUV } from './textures';

export class HandRenderer {
  public camera: THREE.PerspectiveCamera;
  public handGroup: THREE.Group;
  public heldItemMesh: THREE.Mesh | null = null;
  public swingProgress: number = 0;
  public isSwinging: boolean = false;
  public currentItem: ItemId | null = null;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.handGroup = new THREE.Group();
    this.handGroup.position.set(0.35, -0.32, -0.6);
    this.camera.add(this.handGroup);

    this.updateHeldItem(null);
  }

  public swing() {
    if (!this.isSwinging) {
      this.isSwinging = true;
      this.swingProgress = 0;
    }
  }

  public updateHeldItem(itemId: ItemId | null) {
    this.currentItem = itemId;

    if (this.heldItemMesh) {
      this.handGroup.remove(this.heldItemMesh);
      this.heldItemMesh.geometry.dispose();
      this.heldItemMesh = null;
    }

    if (!itemId) {
      // Bare Steve Arm
      const geom = new THREE.BoxGeometry(0.14, 0.35, 0.14);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xc48c66,
        roughness: 0.8,
      });
      this.heldItemMesh = new THREE.Mesh(geom, mat);
      this.heldItemMesh.position.set(0, 0, 0);
      this.heldItemMesh.rotation.set(-0.3, 0.2, -0.2);
      this.handGroup.add(this.heldItemMesh);
    } else if (itemId.includes('sword') || itemId.includes('pickaxe') || itemId.includes('axe') || itemId.includes('shovel')) {
      // 3D Tool Model in hand
      const geom = new THREE.BoxGeometry(0.08, 0.45, 0.08);
      const isDiamond = itemId.includes('diamond');
      const isIron = itemId.includes('iron');
      const mat = new THREE.MeshStandardMaterial({
        color: isDiamond ? 0x4dedeb : isIron ? 0xd0d0d0 : 0x855428,
        metalness: isIron || isDiamond ? 0.3 : 0.05,
        roughness: 0.5,
      });
      this.heldItemMesh = new THREE.Mesh(geom, mat);
      this.heldItemMesh.position.set(0, 0.1, 0);
      this.heldItemMesh.rotation.set(-0.6, 0.3, -0.3);
      this.handGroup.add(this.heldItemMesh);
    } else {
      // Mini Voxel Block in hand
      const geom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const mat = new THREE.MeshStandardMaterial({
        color: itemId === 'tnt' ? 0xdd3333 : itemId === 'torch' ? 0xffbb44 : 0x7fa245,
        roughness: 0.7,
      });
      this.heldItemMesh = new THREE.Mesh(geom, mat);
      this.heldItemMesh.position.set(0, 0.05, 0);
      this.heldItemMesh.rotation.set(0.3, 0.5, 0);
      this.handGroup.add(this.heldItemMesh);
    }
  }

  public update(dt: number, isMoving: boolean) {
    // Handle swing animation
    if (this.isSwinging) {
      this.swingProgress += dt * 6.5; // ~0.15s per swing
      if (this.swingProgress >= 1) {
        this.swingProgress = 0;
        this.isSwinging = false;
      }
    }

    // Walking hand bob
    const walkBobTime = Date.now() * 0.009;
    const bobX = isMoving ? Math.cos(walkBobTime * 0.5) * 0.015 : 0;
    const bobY = isMoving ? Math.sin(walkBobTime) * 0.015 : 0;

    // Swing transformation
    const swingSin = Math.sin(this.swingProgress * Math.PI);
    const swingRotX = -swingSin * 0.9;
    const swingRotY = swingSin * 0.5;
    const swingPushZ = -swingSin * 0.15;

    this.handGroup.position.set(0.35 + bobX, -0.32 + bobY, -0.6 + swingPushZ);
    this.handGroup.rotation.set(swingRotX, swingRotY, 0);
  }

  public dispose() {
    if (this.heldItemMesh) {
      this.handGroup.remove(this.heldItemMesh);
      this.heldItemMesh.geometry.dispose();
    }
    this.camera.remove(this.handGroup);
  }
}

// Wireframe block outline and cracking stage visual
export class BlockHighlightManager {
  public outlineMesh: THREE.LineSegments;
  public crackMesh: THREE.Mesh;
  public crackMaterial: THREE.MeshBasicMaterial;
  public ghostMesh: THREE.Mesh;
  public ghostWireMesh: THREE.LineSegments;
  public scene: THREE.Scene;

  constructor(scene: THREE.Scene, atlasTexture: THREE.CanvasTexture) {
    this.scene = scene;

    // 1. Black Wireframe Box Outline
    const wireGeom = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
    const wireMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.outlineMesh = new THREE.LineSegments(wireGeom, wireMat);
    this.outlineMesh.visible = false;
    this.scene.add(this.outlineMesh);

    // 2. Crack Overlay Mesh (slightly enlarged to avoid coplanar Z-fighting)
    const crackGeom = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    this.crackMaterial = new THREE.MeshBasicMaterial({
      map: atlasTexture,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    this.crackMesh = new THREE.Mesh(crackGeom, this.crackMaterial);
    this.crackMesh.visible = false;
    this.scene.add(this.crackMesh);

    // 3. Ghost Placement Preview Box
    const ghostGeom = new THREE.BoxGeometry(0.998, 0.998, 0.998);
    const ghostMat = new THREE.MeshBasicMaterial({
      color: 0x55ff77,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.ghostMesh = new THREE.Mesh(ghostGeom, ghostMat);
    this.ghostMesh.visible = false;
    this.scene.add(this.ghostMesh);

    const ghostWireGeom = new THREE.EdgesGeometry(ghostGeom);
    const ghostWireMat = new THREE.LineBasicMaterial({
      color: 0x88ffa0,
      transparent: true,
      opacity: 0.8,
    });
    this.ghostWireMesh = new THREE.LineSegments(ghostWireGeom, ghostWireMat);
    this.ghostWireMesh.visible = false;
    this.scene.add(this.ghostWireMesh);
  }

  public setHighlight(x: number, y: number, z: number, visible: boolean) {
    this.outlineMesh.visible = visible;
    if (visible) {
      this.outlineMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    }
  }

  public setGhostPlacement(x: number, y: number, z: number, visible: boolean, colorHex: number = 0x55ff77) {
    this.ghostMesh.visible = visible;
    this.ghostWireMesh.visible = visible;
    if (visible) {
      this.ghostMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
      this.ghostWireMesh.position.set(x + 0.5, y + 0.5, z + 0.5);
      (this.ghostMesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    }
  }

  public setCrackStage(x: number, y: number, z: number, progress: number) {
    if (progress <= 0 || progress >= 1) {
      this.crackMesh.visible = false;
      return;
    }

    this.crackMesh.visible = true;
    this.crackMesh.position.set(x + 0.5, y + 0.5, z + 0.5);

    // Calculate stage 0-9
    const stage = Math.min(9, Math.floor(progress * 10));
    const tileIndex = TileIndex.BREAK_0 + stage;
    const [u0, v0, u1, v1] = getTileUV(tileIndex);

    // Update UVs for 6 faces
    const uvAttr = this.crackMesh.geometry.getAttribute('uv') as THREE.BufferAttribute;
    if (uvAttr) {
      for (let f = 0; f < 6; f++) {
        const base = f * 8;
        uvAttr.array[base] = u0;
        uvAttr.array[base + 1] = v1;
        uvAttr.array[base + 2] = u1;
        uvAttr.array[base + 3] = v1;
        uvAttr.array[base + 4] = u0;
        uvAttr.array[base + 5] = v0;
        uvAttr.array[base + 6] = u1;
        uvAttr.array[base + 7] = v0;
      }
      uvAttr.needsUpdate = true;
    }
  }

  public dispose() {
    this.scene.remove(this.outlineMesh);
    this.outlineMesh.geometry.dispose();
    this.scene.remove(this.crackMesh);
    this.crackMesh.geometry.dispose();
    this.scene.remove(this.ghostMesh);
    this.ghostMesh.geometry.dispose();
    this.scene.remove(this.ghostWireMesh);
    this.ghostWireMesh.geometry.dispose();
  }
}
