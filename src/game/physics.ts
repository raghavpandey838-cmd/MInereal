/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BlockType } from './types';
import { VoxelWorld } from './world';
import { BLOCK_DEFS } from './constants';

export interface AABB {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export class PhysicsEngine {
  public static GRAVITY = 26.0;
  public static TERMINAL_VELOCITY = 40.0;
  public static JUMP_SPEED = 8.6;
  public static WALK_SPEED = 4.3;
  public static SPRINT_SPEED = 6.4;
  public static SNEAK_SPEED = 2.2;
  public static SWIM_SPEED = 2.8;

  public static isSolidBlock(world: VoxelWorld, x: number, y: number, z: number): boolean {
    const block = world.getBlock(x, y, z);
    const def = BLOCK_DEFS[block];
    return !!(def && def.isSolid);
  }

  public static isWaterBlock(world: VoxelWorld, x: number, y: number, z: number): boolean {
    return world.getBlock(x, y, z) === BlockType.WATER;
  }

  // Check if an AABB collides with any solid block in the world
  public static checkCollision(world: VoxelWorld, box: AABB): boolean {
    const minX = Math.floor(box.minX);
    const maxX = Math.floor(box.maxX);
    const minY = Math.floor(box.minY);
    const maxY = Math.floor(box.maxY);
    const minZ = Math.floor(box.minZ);
    const maxZ = Math.floor(box.maxZ);

    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          if (this.isSolidBlock(world, x, y, z)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Update entity position with 3-axis AABB collision resolution & step-up assistance
  public static moveEntity(
    world: VoxelWorld,
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    halfWidth: number,
    height: number,
    dt: number,
    canStep: boolean = true
  ): { isGrounded: boolean; hitCeiling: boolean; hitWall: boolean; inWater: boolean } {
    let isGrounded = false;
    let hitCeiling = false;
    let hitWall = false;

    // Check if feet or body are in water
    const feetBlock = world.getBlock(Math.floor(pos.x), Math.floor(pos.y + 0.2), Math.floor(pos.z));
    const headBlock = world.getBlock(Math.floor(pos.x), Math.floor(pos.y + 1.5), Math.floor(pos.z));
    const inWater = feetBlock === BlockType.WATER || headBlock === BlockType.WATER;

    // Step-up height (allows stepping over small ledges or slabs smoothly)
    const stepHeight = canStep ? 0.55 : 0.0;

    // --- 1. Y AXIS (Vertical) ---
    const dy = vel.y * dt;
    const testBoxY: AABB = {
      minX: pos.x - halfWidth,
      maxX: pos.x + halfWidth,
      minY: pos.y + dy,
      maxY: pos.y + height + dy,
      minZ: pos.z - halfWidth,
      maxZ: pos.z + halfWidth,
    };

    if (this.checkCollision(world, testBoxY)) {
      if (vel.y < 0) {
        // Landing on ground
        pos.y = Math.floor(pos.y + dy) + 1.0;
        isGrounded = true;
      } else {
        // Hitting ceiling
        hitCeiling = true;
      }
      vel.y = 0;
    } else {
      pos.y += dy;
    }

    // --- 2. X AXIS (Horizontal) ---
    const dx = vel.x * dt;
    let testBoxX: AABB = {
      minX: pos.x + dx - halfWidth,
      maxX: pos.x + dx + halfWidth,
      minY: pos.y,
      maxY: pos.y + height,
      minZ: pos.z - halfWidth,
      maxZ: pos.z + halfWidth,
    };

    if (this.checkCollision(world, testBoxX)) {
      let stepped = false;
      if (canStep && isGrounded) {
        // Try step up
        const stepBoxX: AABB = {
          minX: pos.x + dx - halfWidth,
          maxX: pos.x + dx + halfWidth,
          minY: pos.y + stepHeight,
          maxY: pos.y + height + stepHeight,
          minZ: pos.z - halfWidth,
          maxZ: pos.z + halfWidth,
        };
        if (!this.checkCollision(world, stepBoxX)) {
          pos.y += stepHeight;
          pos.x += dx;
          stepped = true;
        }
      }
      if (!stepped) {
        vel.x = 0;
        hitWall = true;
      }
    } else {
      pos.x += dx;
    }

    // --- 3. Z AXIS (Horizontal) ---
    const dz = vel.z * dt;
    const testBoxZ: AABB = {
      minX: pos.x - halfWidth,
      maxX: pos.x + halfWidth,
      minY: pos.y,
      maxY: pos.y + height,
      minZ: pos.z + dz - halfWidth,
      maxZ: pos.z + dz + halfWidth,
    };

    if (this.checkCollision(world, testBoxZ)) {
      let stepped = false;
      if (canStep && isGrounded) {
        const stepBoxZ: AABB = {
          minX: pos.x - halfWidth,
          maxX: pos.x + halfWidth,
          minY: pos.y + stepHeight,
          maxY: pos.y + height + stepHeight,
          minZ: pos.z + dz - halfWidth,
          maxZ: pos.z + dz + halfWidth,
        };
        if (!this.checkCollision(world, stepBoxZ)) {
          pos.y += stepHeight;
          pos.z += dz;
          stepped = true;
        }
      }
      if (!stepped) {
        vel.z = 0;
        hitWall = true;
      }
    } else {
      pos.z += dz;
    }

    // Re-check grounding
    const groundProbe: AABB = {
      minX: pos.x - halfWidth + 0.05,
      maxX: pos.x + halfWidth - 0.05,
      minY: pos.y - 0.08,
      maxY: pos.y,
      minZ: pos.z - halfWidth + 0.05,
      maxZ: pos.z + halfWidth - 0.05,
    };
    if (this.checkCollision(world, groundProbe)) {
      isGrounded = true;
    }

    return { isGrounded, hitCeiling, hitWall, inWater };
  }
}
