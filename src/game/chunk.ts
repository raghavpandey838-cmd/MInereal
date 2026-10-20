/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BlockType } from './types';
import { CHUNK_SIZE_X, CHUNK_SIZE_Z, CHUNK_HEIGHT, BLOCK_DEFS } from './constants';
import { getTileIndexForFace, getTileUV } from './textures';

export interface FaceDef {
  dir: [number, number, number];
  corners: [number, number, number][];
  faceType: 'top' | 'bottom' | 'side' | 'front';
}

const FACES: FaceDef[] = [
  // Top (+Y)
  {
    dir: [0, 1, 0],
    faceType: 'top',
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  // Bottom (-Y)
  {
    dir: [0, -1, 0],
    faceType: 'bottom',
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
  },
  // East (+X)
  {
    dir: [1, 0, 0],
    faceType: 'side',
    corners: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
  },
  // West (-X)
  {
    dir: [-1, 0, 0],
    faceType: 'side',
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  },
  // North (+Z)
  {
    dir: [0, 0, 1],
    faceType: 'side',
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
  },
  // South (-Z)
  {
    dir: [0, 0, -1],
    faceType: 'side',
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  },
];

export class Chunk {
  public cx: number;
  public cz: number;
  public blocks: Uint8Array;
  public mesh: THREE.Mesh | null = null;
  public waterMesh: THREE.Mesh | null = null;
  public group: THREE.Group;
  public isDirty: boolean = true;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_SIZE_X * CHUNK_HEIGHT * CHUNK_SIZE_Z);
    this.group = new THREE.Group();
    this.group.position.set(cx * CHUNK_SIZE_X, 0, cz * CHUNK_SIZE_Z);
  }

  public getIndex(lx: number, ly: number, lz: number): number {
    return ly * (CHUNK_SIZE_X * CHUNK_SIZE_Z) + lz * CHUNK_SIZE_X + lx;
  }

  public getBlock(lx: number, ly: number, lz: number): BlockType {
    if (lx < 0 || lx >= CHUNK_SIZE_X || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE_Z) {
      return BlockType.AIR;
    }
    return this.blocks[this.getIndex(lx, ly, lz)] as BlockType;
  }

  public setBlock(lx: number, ly: number, lz: number, type: BlockType) {
    if (lx < 0 || lx >= CHUNK_SIZE_X || ly < 0 || ly >= CHUNK_HEIGHT || lz < 0 || lz >= CHUNK_SIZE_Z) {
      return;
    }
    this.blocks[this.getIndex(lx, ly, lz)] = type;
    this.isDirty = true;
  }

  // Rebuild Three.js geometries for this chunk
  public rebuildMesh(
    getBlockAtWorldPos: (wx: number, wy: number, wz: number) => BlockType,
    opaqueMaterial: THREE.Material,
    waterMaterial: THREE.Material
  ) {
    const opaquePositions: number[] = [];
    const opaqueNormals: number[] = [];
    const opaqueUvs: number[] = [];
    const opaqueColors: number[] = [];
    const opaqueIndices: number[] = [];

    const waterPositions: number[] = [];
    const waterNormals: number[] = [];
    const waterUvs: number[] = [];
    const waterIndices: number[] = [];

    let opaqueIndexOffset = 0;
    let waterIndexOffset = 0;

    const startWX = this.cx * CHUNK_SIZE_X;
    const startWZ = this.cz * CHUNK_SIZE_Z;

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE_Z; z++) {
        for (let x = 0; x < CHUNK_SIZE_X; x++) {
          const block = this.getBlock(x, y, z);
          if (block === BlockType.AIR) continue;

          const isWater = block === BlockType.WATER;
          const isFoliage =
            block === BlockType.POPPY ||
            block === BlockType.DANDELION ||
            block === BlockType.RED_MUSHROOM ||
            block === BlockType.BROWN_MUSHROOM ||
            block === BlockType.BLUE_ORCHID;

          // Cross-quad rendering for flowers and mushrooms (both diagonals)
          if (isFoliage) {
            const tileIdx = getTileIndexForFace(block, 'side');
            const [u0, v0, u1, v1] = getTileUV(tileIdx);
            
            // Diagonal 1
            const p1 = [x, y, z, x + 1, y, z + 1, x + 1, y + 1, z + 1, x, y + 1, z];
            // Diagonal 2
            const p2 = [x, y, z + 1, x + 1, y, z, x + 1, y + 1, z, x, y + 1, z + 1];

            opaquePositions.push(...p1, ...p2);
            for (let i = 0; i < 8; i++) {
              opaqueNormals.push(0, 1, 0);
              opaqueColors.push(1, 1, 1);
            }
            opaqueUvs.push(
              u0, v0, u1, v0, u1, v1, u0, v1,
              u0, v0, u1, v0, u1, v1, u0, v1
            );
            opaqueIndices.push(
              opaqueIndexOffset,
              opaqueIndexOffset + 1,
              opaqueIndexOffset + 2,
              opaqueIndexOffset,
              opaqueIndexOffset + 2,
              opaqueIndexOffset + 3,
              opaqueIndexOffset + 4,
              opaqueIndexOffset + 5,
              opaqueIndexOffset + 6,
              opaqueIndexOffset + 4,
              opaqueIndexOffset + 6,
              opaqueIndexOffset + 7
            );
            opaqueIndexOffset += 8;
            continue;
          }

          // Standard voxel cube faces
          for (const face of FACES) {
            const [dx, dy, dz] = face.dir;
            const neighborBlock = getBlockAtWorldPos(startWX + x + dx, y + dy, startWZ + z + dz);
            const neighborDef = BLOCK_DEFS[neighborBlock];

            // Render face if neighbor is air or transparent (except water against water)
            let renderFace = false;
            if (isWater) {
              renderFace = neighborBlock === BlockType.AIR || Boolean(neighborDef?.isTransparent && neighborBlock !== BlockType.WATER);
            } else {
              renderFace = neighborBlock === BlockType.AIR || Boolean(neighborDef?.isTransparent && neighborBlock !== block);
            }

            if (!renderFace) continue;

            const tileIdx = getTileIndexForFace(block, face.faceType);
            const [u0, v0, u1, v1] = getTileUV(tileIdx);

            // Shading multiplier based on authentic Minecraft Java directional face lighting
            let shade = 1.0;
            if (dy > 0) shade = 1.0; // Top Face (Sunlight)
            else if (dy < 0) shade = 0.5; // Bottom Face (Under shadow)
            else if (dz !== 0) shade = 0.8; // North/South Face
            else shade = 0.6; // East/West Face

            if (isWater) {
              for (const [cx, cy, cz] of face.corners) {
                // Slightly lower water surface
                const actualY = face.dir[1] > 0 ? y + 0.9 : y + cy;
                waterPositions.push(x + cx, actualY, z + cz);
                waterNormals.push(...face.dir);
              }
              waterUvs.push(u0, v0, u1, v0, u1, v1, u0, v1);
              waterIndices.push(
                waterIndexOffset,
                waterIndexOffset + 1,
                waterIndexOffset + 2,
                waterIndexOffset,
                waterIndexOffset + 2,
                waterIndexOffset + 3
              );
              waterIndexOffset += 4;
            } else {
              for (const [cx, cy, cz] of face.corners) {
                opaquePositions.push(x + cx, y + cy, z + cz);
                opaqueNormals.push(...face.dir);
                opaqueColors.push(shade, shade, shade);
              }
              opaqueUvs.push(u0, v0, u1, v0, u1, v1, u0, v1);
              opaqueIndices.push(
                opaqueIndexOffset,
                opaqueIndexOffset + 1,
                opaqueIndexOffset + 2,
                opaqueIndexOffset,
                opaqueIndexOffset + 2,
                opaqueIndexOffset + 3
              );
              opaqueIndexOffset += 4;
            }
          }
        }
      }
    }

    // Dispose old meshes
    if (this.mesh) {
      this.group.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.waterMesh) {
      this.group.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      this.waterMesh = null;
    }

    // Build Opaque Mesh
    if (opaquePositions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(opaquePositions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(opaqueNormals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(opaqueUvs, 2));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(opaqueColors, 3));
      geometry.setIndex(opaqueIndices);
      geometry.computeBoundingSphere();

      this.mesh = new THREE.Mesh(geometry, opaqueMaterial);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      this.group.add(this.mesh);
    }

    // Build Water Mesh
    if (waterPositions.length > 0) {
      const waterGeom = new THREE.BufferGeometry();
      waterGeom.setAttribute('position', new THREE.Float32BufferAttribute(waterPositions, 3));
      waterGeom.setAttribute('normal', new THREE.Float32BufferAttribute(waterNormals, 3));
      waterGeom.setAttribute('uv', new THREE.Float32BufferAttribute(waterUvs, 2));
      waterGeom.setIndex(waterIndices);
      waterGeom.computeBoundingSphere();

      this.waterMesh = new THREE.Mesh(waterGeom, waterMaterial);
      this.waterMesh.receiveShadow = true;
      this.group.add(this.waterMesh);
    }

    this.isDirty = false;
  }

  public dispose() {
    if (this.mesh) {
      this.group.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.waterMesh) {
      this.group.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      this.waterMesh = null;
    }
  }
}
