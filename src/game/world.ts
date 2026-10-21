/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BlockType } from './types';
import { CHUNK_SIZE_X, CHUNK_SIZE_Z, CHUNK_HEIGHT, SEA_LEVEL } from './constants';
import { Chunk } from './chunk';
import { PerlinNoise } from './noise';
import { createBlockAtlas } from './textures';

export interface VoxelRaycastHit {
  hit: boolean;
  x: number;
  y: number;
  z: number;
  normal: [number, number, number];
  block: BlockType;
}

export class VoxelWorld {
  public chunks: Map<string, Chunk> = new Map();
  public scene: THREE.Scene;
  public perlin: PerlinNoise;
  public seed: number;
  public opaqueMaterial: THREE.MeshStandardMaterial;
  public waterMaterial: THREE.MeshStandardMaterial;
  public modifiedBlocks: Map<string, BlockType> = new Map();
  public worldRadius: number = 3; // Vast radius: 7x7 chunks = 112x112 blocks loaded simultaneously
  private lastLoadedCX: number = 99999;
  private lastLoadedCZ: number = 99999;

  constructor(scene: THREE.Scene, seed: number = 42817) {
    this.scene = scene;
    this.seed = seed;
    this.perlin = new PerlinNoise(seed);

    const atlasTexture = createBlockAtlas();

    this.opaqueMaterial = new THREE.MeshStandardMaterial({
      map: atlasTexture,
      roughness: 0.9,
      metalness: 0.05,
      vertexColors: true,
      alphaTest: 0.5,
      shadowSide: THREE.DoubleSide,
    });

    this.waterMaterial = new THREE.MeshStandardMaterial({
      map: atlasTexture,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  public getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public getBlock(wx: number, wy: number, wz: number): BlockType {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return BlockType.AIR;

    const blockKey = `${Math.floor(wx)},${Math.floor(wy)},${Math.floor(wz)}`;
    if (this.modifiedBlocks.has(blockKey)) {
      return this.modifiedBlocks.get(blockKey)!;
    }

    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);
    const chunk = this.chunks.get(this.getChunkKey(cx, cz));

    if (!chunk) return BlockType.AIR;

    const lx = ((wx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((wz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

    return chunk.getBlock(lx, wy, lz);
  }

  public setBlock(wx: number, wy: number, wz: number, type: BlockType) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return;

    const blockX = Math.floor(wx);
    const blockY = Math.floor(wy);
    const blockZ = Math.floor(wz);
    const blockKey = `${blockX},${blockY},${blockZ}`;

    this.modifiedBlocks.set(blockKey, type);

    const cx = Math.floor(blockX / CHUNK_SIZE_X);
    const cz = Math.floor(blockZ / CHUNK_SIZE_Z);
    const chunk = this.chunks.get(this.getChunkKey(cx, cz));

    if (chunk) {
      const lx = ((blockX % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
      const lz = ((blockZ % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
      chunk.setBlock(lx, blockY, lz, type);
    }

    // Check if on chunk border, mark neighbor dirty
    const lx = ((blockX % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((blockZ % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

    if (lx === 0) this.markChunkDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE_X - 1) this.markChunkDirty(cx + 1, cz);
    if (lz === 0) this.markChunkDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE_Z - 1) this.markChunkDirty(cx, cz + 1);
  }

  private markChunkDirty(cx: number, cz: number) {
    const chunk = this.chunks.get(this.getChunkKey(cx, cz));
    if (chunk) {
      chunk.isDirty = true;
    }
  }

  // Generate chunks around player & stream new chunks dynamically
  public updateChunksAroundPlayer(playerWX: number, playerWZ: number) {
    const centerCX = Math.floor(playerWX / CHUNK_SIZE_X);
    const centerCZ = Math.floor(playerWZ / CHUNK_SIZE_Z);

    if (centerCX === this.lastLoadedCX && centerCZ === this.lastLoadedCZ) {
      return;
    }
    this.lastLoadedCX = centerCX;
    this.lastLoadedCZ = centerCZ;

    let newChunksCreated = false;

    for (let dx = -this.worldRadius; dx <= this.worldRadius; dx++) {
      for (let dz = -this.worldRadius; dz <= this.worldRadius; dz++) {
        const cx = centerCX + dx;
        const cz = centerCZ + dz;
        const key = this.getChunkKey(cx, cz);
        if (!this.chunks.has(key)) {
          this.getOrCreateChunk(cx, cz);
          newChunksCreated = true;
        }
      }
    }

    if (newChunksCreated) {
      this.populateWorldFeatures(centerCX, centerCZ);
      this.rebuildDirtyChunks();
    }
  }

  public generateInitialWorld(centerX: number = 0, centerZ: number = 0) {
    const centerCX = Math.floor(centerX / CHUNK_SIZE_X);
    const centerCZ = Math.floor(centerZ / CHUNK_SIZE_Z);
    this.lastLoadedCX = centerCX;
    this.lastLoadedCZ = centerCZ;

    for (let dx = -this.worldRadius; dx <= this.worldRadius; dx++) {
      for (let dz = -this.worldRadius; dz <= this.worldRadius; dz++) {
        const cx = centerCX + dx;
        const cz = centerCZ + dz;
        this.getOrCreateChunk(cx, cz);
      }
    }

    // Populate terrain features (trees, flowers, cacti)
    this.populateWorldFeatures(centerCX, centerCZ);

    // Apply any saved modified blocks
    this.modifiedBlocks.forEach((type, key) => {
      const [x, y, z] = key.split(',').map(Number);
      const cx = Math.floor(x / CHUNK_SIZE_X);
      const cz = Math.floor(z / CHUNK_SIZE_Z);
      const chunk = this.chunks.get(this.getChunkKey(cx, cz));
      if (chunk) {
        const lx = ((x % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
        const lz = ((z % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
        chunk.setBlock(lx, y, lz, type);
      }
    });

    this.rebuildDirtyChunks();
  }

  private getOrCreateChunk(cx: number, cz: number): Chunk {
    const key = this.getChunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz);
      this.generateChunkTerrain(chunk);
      this.chunks.set(key, chunk);
      this.scene.add(chunk.group);
    }
    return chunk;
  }

  // Procedural multi-biome terrain generator
  private generateChunkTerrain(chunk: Chunk) {
    const startWX = chunk.cx * CHUNK_SIZE_X;
    const startWZ = chunk.cz * CHUNK_SIZE_Z;

    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        const wx = startWX + lx;
        const wz = startWZ + lz;

        // 1. Continental Ocean vs Land Noise
        const oceanNoise = this.perlin.noise2D(wx * 0.008, wz * 0.008);
        const isDeepOcean = oceanNoise < -0.32;

        // 2. Winding River Noise carving through landscape
        const riverVal = this.perlin.noise2D(wx * 0.012 + 100, wz * 0.012 - 100);
        const isRiver = Math.abs(riverVal) < 0.045;

        // 3. Biome factors: Temperature & Moisture
        const tempNoise = this.perlin.noise2D(wx * 0.007, wz * 0.007);
        const isDesert = tempNoise > 0.38;

        // 4. Mountains & Hills
        const mountainNoise = this.perlin.noise2D(wx * 0.006 + 50, wz * 0.006 + 50);
        const isMountain = mountainNoise > 0.28 && !isDeepOcean;

        // 5. Calculate Terrain Height
        let height = 26; // baseline above SEA_LEVEL (24)

        if (isDeepOcean) {
          // Ocean trench / deep sea bed
          const seaFloor = 14 + Math.floor(Math.abs(oceanNoise) * 12);
          height = Math.max(8, seaFloor);
        } else if (isRiver) {
          // River channel bed
          height = SEA_LEVEL - 2;
        } else if (isMountain) {
          // Towering mountain peaks
          const peakBonus = (mountainNoise - 0.28) * 45;
          const rough = this.perlin.fbm2D(wx * 0.03, wz * 0.03, 3, 0.5) * 8;
          height = Math.floor(32 + peakBonus + rough);
          height = Math.min(CHUNK_HEIGHT - 6, height);
        } else if (isDesert) {
          // Rolling desert dunes
          const dune = this.perlin.fbm2D(wx * 0.02, wz * 0.02, 2, 0.5) * 8;
          height = Math.floor(25 + dune);
        } else {
          // Plains & Forest rolling landscape
          const hill = this.perlin.fbm2D(wx * 0.018, wz * 0.018, 3, 0.5) * 9;
          height = Math.floor(26 + hill);
        }

        // Fill column
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          if (y === 0) {
            chunk.setBlock(lx, y, lz, BlockType.BEDROCK);
            continue;
          }

          if (y > height) {
            // Fill water if below sea level
            if (y <= SEA_LEVEL) {
              chunk.setBlock(lx, y, lz, BlockType.WATER);
            }
            continue;
          }

          // 3D Cave Noise carving
          const caveNoise = this.perlin.noise3D(wx * 0.06, y * 0.08, wz * 0.06);
          if (y < height - 2 && caveNoise > 0.48 && y > 3 && !isDeepOcean) {
            chunk.setBlock(lx, y, lz, BlockType.AIR);
            continue;
          }

          // Surface block layer
          if (y === height) {
            if (height <= SEA_LEVEL + 1) {
              // Beaches & Seabed
              chunk.setBlock(lx, y, lz, BlockType.SAND);
            } else if (isDesert) {
              chunk.setBlock(lx, y, lz, BlockType.SAND);
            } else if (height > 46) {
              // High mountain snow
              chunk.setBlock(lx, y, lz, BlockType.SNOW);
            } else if (height > 38) {
              // Rocky mountain cliff
              chunk.setBlock(lx, y, lz, BlockType.STONE);
            } else {
              // Lush green grass
              chunk.setBlock(lx, y, lz, BlockType.GRASS);
            }
          } else if (y >= height - 3) {
            if (isDesert || height <= SEA_LEVEL + 1) {
              chunk.setBlock(lx, y, lz, BlockType.SAND);
            } else if (height > 46) {
              chunk.setBlock(lx, y, lz, BlockType.SNOW);
            } else {
              chunk.setBlock(lx, y, lz, BlockType.DIRT);
            }
          } else {
            // Subterranean Stone with Ore Veins
            const oreRnd = this.perlin.noise3D(wx * 0.2, y * 0.2, wz * 0.2);

            if (y < 16 && oreRnd > 0.72) {
              chunk.setBlock(lx, y, lz, BlockType.DIAMOND_ORE);
            } else if (y < 22 && oreRnd < -0.7) {
              chunk.setBlock(lx, y, lz, BlockType.REDSTONE_ORE);
            } else if (y < 30 && oreRnd > 0.65) {
              chunk.setBlock(lx, y, lz, BlockType.GOLD_ORE);
            } else if (y < 45 && oreRnd > 0.58) {
              chunk.setBlock(lx, y, lz, BlockType.IRON_ORE);
            } else if (oreRnd < -0.55) {
              chunk.setBlock(lx, y, lz, BlockType.COAL_ORE);
            } else {
              chunk.setBlock(lx, y, lz, BlockType.STONE);
            }
          }
        }
      }
    }
  }

  // Populate trees and flowers across chunks
  private populateWorldFeatures(centerCX: number, centerCZ: number) {
    for (let dx = -this.worldRadius; dx <= this.worldRadius; dx++) {
      for (let dz = -this.worldRadius; dz <= this.worldRadius; dz++) {
        const cx = centerCX + dx;
        const cz = centerCZ + dz;
        const startWX = cx * CHUNK_SIZE_X;
        const startWZ = cz * CHUNK_SIZE_Z;

        // Tree scattering
        for (let lx = 3; lx < CHUNK_SIZE_X - 3; lx += 4) {
          for (let lz = 3; lz < CHUNK_SIZE_Z - 3; lz += 4) {
            const wx = startWX + lx;
            const wz = startWZ + lz;
            const treeChance = this.perlin.noise2D(wx * 0.1, wz * 0.1);

            if (treeChance > 0.2) {
              const topY = this.findHighestSolidY(wx, wz);
              const surfaceBlock = this.getBlock(wx, topY, wz);
              if (surfaceBlock === BlockType.GRASS && topY > SEA_LEVEL) {
                this.growTree(wx, topY + 1, wz);
              }
            } else if (treeChance < -0.3) {
              // Flower
              const topY = this.findHighestSolidY(wx, wz);
              if (this.getBlock(wx, topY, wz) === BlockType.GRASS) {
                const flowerType = treeChance < -0.5 ? BlockType.POPPY : BlockType.DANDELION;
                this.setRawBlockInChunk(wx, topY + 1, wz, flowerType);
              }
            }
          }
        }
      }
    }
  }

  private growTree(baseX: number, baseY: number, baseZ: number) {
    const trunkHeight = 4 + Math.floor(Math.random() * 2);

    // Trunk
    for (let y = 0; y < trunkHeight; y++) {
      this.setRawBlockInChunk(baseX, baseY + y, baseZ, BlockType.OAK_LOG);
    }

    // Leaves canopy
    const leafStart = baseY + trunkHeight - 2;
    for (let ly = leafStart; ly <= baseY + trunkHeight + 1; ly++) {
      const radius = ly >= baseY + trunkHeight ? 1 : 2;
      for (let ox = -radius; ox <= radius; ox++) {
        for (let oz = -radius; oz <= radius; oz++) {
          if (ox === 0 && oz === 0 && ly < baseY + trunkHeight) continue;
          if (Math.abs(ox) === radius && Math.abs(oz) === radius && Math.random() > 0.6) continue;
          const curr = this.getBlock(baseX + ox, ly, baseZ + oz);
          if (curr === BlockType.AIR) {
            this.setRawBlockInChunk(baseX + ox, ly, baseZ + oz, BlockType.OAK_LEAVES);
          }
        }
      }
    }
  }

  private setRawBlockInChunk(wx: number, wy: number, wz: number, type: BlockType) {
    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);
    const chunk = this.chunks.get(this.getChunkKey(cx, cz));
    if (chunk) {
      const lx = ((wx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
      const lz = ((wz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
      chunk.setBlock(lx, wy, lz, type);
    }
  }

  public findHighestSolidY(wx: number, wz: number): number {
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      const block = this.getBlock(wx, y, wz);
      if (block !== BlockType.AIR && block !== BlockType.WATER && block !== BlockType.POPPY && block !== BlockType.DANDELION) {
        return y;
      }
    }
    return 0;
  }

  /**
   * Finds a guaranteed dry, solid land coordinate for player spawn.
   * Performs an outward spiral search to avoid water bodies, rivers, and oceans.
   * Builds a clean 5x5 dry grass landing pad so the landing area is 100% solid and safe.
   */
  public findSafeDryLandSpawn(preferredX: number = 0, preferredZ: number = 0): { x: number; y: number; z: number } {
    let bestX = preferredX;
    let bestZ = preferredZ;
    let bestY = 28;
    let found = false;

    // Outward spiral search up to radius 48 blocks
    for (let r = 0; r <= 48 && !found; r += 2) {
      for (let dx = -r; dx <= r && !found; dx += 2) {
        for (let dz = -r; dz <= r && !found; dz += 2) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          const wx = preferredX + dx;
          const wz = preferredZ + dz;

          // Check if this column has water
          let hasWater = false;
          for (let y = SEA_LEVEL + 2; y >= SEA_LEVEL - 2; y--) {
            if (this.getBlock(wx, y, wz) === BlockType.WATER) {
              hasWater = true;
              break;
            }
          }
          if (hasWater) continue;

          // Find top solid ground block
          const topY = this.findHighestSolidY(wx, wz);
          if (topY > SEA_LEVEL) {
            const above1 = this.getBlock(wx, topY + 1, wz);
            const above2 = this.getBlock(wx, topY + 2, wz);
            if (
              (above1 === BlockType.AIR || above1 === BlockType.POPPY || above1 === BlockType.DANDELION) &&
              above2 === BlockType.AIR
            ) {
              bestX = wx;
              bestZ = wz;
              bestY = topY;
              found = true;
              break;
            }
          }
        }
      }
    }

    // Ensure the landing area is a pristine 5x5 dry land pad at minimum height 26 (strictly above sea level 24)
    const landingY = Math.max(bestY, 26);
    for (let ox = -2; ox <= 2; ox++) {
      for (let oz = -2; oz <= 2; oz++) {
        const lx = bestX + ox;
        const lz = bestZ + oz;
        // Surface grass
        this.setBlock(lx, landingY, lz, BlockType.GRASS);
        // Subsurface dirt foundation
        this.setBlock(lx, landingY - 1, lz, BlockType.DIRT);
        this.setBlock(lx, landingY - 2, lz, BlockType.DIRT);
        this.setBlock(lx, landingY - 3, lz, BlockType.STONE);
        // Clear air space above for player head room
        this.setBlock(lx, landingY + 1, lz, BlockType.AIR);
        this.setBlock(lx, landingY + 2, lz, BlockType.AIR);
        this.setBlock(lx, landingY + 3, lz, BlockType.AIR);
      }
    }
    this.rebuildDirtyChunks();

    return { x: bestX, y: landingY, z: bestZ };
  }

  public rebuildDirtyChunks() {
    this.chunks.forEach((chunk) => {
      if (chunk.isDirty) {
        chunk.rebuildMesh(
          (wx, wy, wz) => this.getBlock(wx, wy, wz),
          this.opaqueMaterial,
          this.waterMaterial
        );
      }
    });
  }

  // Fast DDA (Digital Differential Analyzer) 3D Voxel Raycasting
  public raycast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number = 6
  ): VoxelRaycastHit {
    let px = origin.x;
    let py = origin.y;
    let pz = origin.z;

    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;

    let mapX = Math.floor(px);
    let mapY = Math.floor(py);
    let mapZ = Math.floor(pz);

    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const stepZ = dz > 0 ? 1 : -1;

    const deltaDistX = dx === 0 ? 1e30 : Math.abs(1 / dx);
    const deltaDistY = dy === 0 ? 1e30 : Math.abs(1 / dy);
    const deltaDistZ = dz === 0 ? 1e30 : Math.abs(1 / dz);

    let sideDistX = dx > 0 ? (mapX + 1.0 - px) * deltaDistX : (px - mapX) * deltaDistX;
    let sideDistY = dy > 0 ? (mapY + 1.0 - py) * deltaDistY : (py - mapY) * deltaDistY;
    let sideDistZ = dz > 0 ? (mapZ + 1.0 - pz) * deltaDistZ : (pz - mapZ) * deltaDistZ;

    let normal: [number, number, number] = [0, 0, 0];
    let distance = 0;

    while (distance < maxDistance) {
      const block = this.getBlock(mapX, mapY, mapZ);
      if (block !== BlockType.AIR && block !== BlockType.WATER) {
        return {
          hit: true,
          x: mapX,
          y: mapY,
          z: mapZ,
          normal,
          block,
        };
      }

      if (sideDistX < sideDistY) {
        if (sideDistX < sideDistZ) {
          distance = sideDistX;
          sideDistX += deltaDistX;
          mapX += stepX;
          normal = [-stepX, 0, 0];
        } else {
          distance = sideDistZ;
          sideDistZ += deltaDistZ;
          mapZ += stepZ;
          normal = [0, 0, -stepZ];
        }
      } else {
        if (sideDistY < sideDistZ) {
          distance = sideDistY;
          sideDistY += deltaDistY;
          mapY += stepY;
          normal = [0, -stepY, 0];
        } else {
          distance = sideDistZ;
          sideDistZ += deltaDistZ;
          mapZ += stepZ;
          normal = [0, 0, -stepZ];
        }
      }
    }

    return {
      hit: false,
      x: 0,
      y: 0,
      z: 0,
      normal: [0, 0, 0],
      block: BlockType.AIR,
    };
  }

  // Save modified blocks to JSON string
  public serializeWorld(): string {
    const list: [number, number, number, number][] = [];
    this.modifiedBlocks.forEach((type, key) => {
      const [x, y, z] = key.split(',').map(Number);
      list.push([x, y, z, type]);
    });
    return JSON.stringify({ seed: this.seed, blocks: list });
  }

  public deserializeWorld(jsonStr: string) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.seed) this.seed = data.seed;
      if (Array.isArray(data.blocks)) {
        this.modifiedBlocks.clear();
        for (const [x, y, z, type] of data.blocks) {
          this.modifiedBlocks.set(`${x},${y},${z}`, type as BlockType);
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  public dispose() {
    this.chunks.forEach((chunk) => {
      this.scene.remove(chunk.group);
      chunk.dispose();
    });
    this.chunks.clear();
    this.opaqueMaterial.dispose();
    this.waterMaterial.dispose();
  }
}
