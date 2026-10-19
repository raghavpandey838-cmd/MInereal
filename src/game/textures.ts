/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BlockType, ItemId } from './types';

// Atlas dimensions: 16x16 tiles of 16x16 pixels = 256x256 texture atlas
export const ATLAS_COLS = 16;
export const ATLAS_ROWS = 16;
export const TILE_SIZE = 16;

export enum TileIndex {
  GRASS_TOP = 0,
  GRASS_SIDE = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  BEDROCK = 5,
  OAK_LOG_SIDE = 6,
  OAK_LOG_TOP = 7,
  OAK_LEAVES = 8,
  OAK_PLANKS = 9,
  SAND = 10,
  GRAVEL = 11,
  GLASS = 12,
  WATER = 13,
  COAL_ORE = 14,
  IRON_ORE = 15,
  GOLD_ORE = 16,
  DIAMOND_ORE = 17,
  REDSTONE_ORE = 18,
  CRAFTING_TOP = 19,
  CRAFTING_SIDE = 20,
  CRAFTING_FRONT = 21,
  FURNACE_FRONT = 22,
  FURNACE_LIT = 23,
  FURNACE_SIDE = 24,
  CHEST_TOP = 25,
  CHEST_SIDE = 26,
  CHEST_FRONT = 27,
  TNT_SIDE = 28,
  TNT_TOP = 29,
  TNT_BOTTOM = 30,
  BRICKS = 31,
  BOOKSHELF = 32,
  OBSIDIAN = 33,
  NETHERRACK = 34,
  CACTUS_TOP = 35,
  CACTUS_SIDE = 36,
  SNOW_TOP = 37,
  SNOW_SIDE = 38,
  POPPY = 39,
  DANDELION = 40,
  TORCH = 41,
  // 48-57: Break stages 0-9
  BREAK_0 = 48,
  BREAK_1 = 49,
  BREAK_2 = 50,
  BREAK_3 = 51,
  BREAK_4 = 52,
  BREAK_5 = 53,
  BREAK_6 = 54,
  BREAK_7 = 55,
  BREAK_8 = 56,
  BREAK_9 = 57,
}

// Pseudo-random helper with seed
function pseudoRandom(x: number, y: number, seed: number = 42) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

// Helper to draw a 16x16 tile on canvas context
function drawTile(
  ctx: CanvasRenderingContext2D,
  tileIndex: number,
  pixelDrawer: (x: number, y: number) => [number, number, number, number] // r,g,b,a
) {
  const col = tileIndex % ATLAS_COLS;
  const row = Math.floor(tileIndex / ATLAS_COLS);
  const startX = col * TILE_SIZE;
  const startY = row * TILE_SIZE;

  const imgData = ctx.createImageData(TILE_SIZE, TILE_SIZE);
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const idx = (y * TILE_SIZE + x) * 4;
      const [r, g, b, a] = pixelDrawer(x, y);
      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = a;
    }
  }
  ctx.putImageData(imgData, startX, startY);
}

let cachedAtlasTexture: THREE.CanvasTexture | null = null;
let cachedItemIconDataUrls: Record<string, string> = {};

export function createBlockAtlas(): THREE.CanvasTexture {
  if (cachedAtlasTexture) return cachedAtlasTexture;

  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_COLS * TILE_SIZE;
  canvas.height = ATLAS_ROWS * TILE_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // Clear with transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Dirt drawer
  const getDirtPixel = (x: number, y: number): [number, number, number, number] => {
    const n = pseudoRandom(x, y, 10);
    const shade = 100 + Math.floor(n * 40);
    const r = Math.floor(shade * 0.95);
    const g = Math.floor(shade * 0.65);
    const b = Math.floor(shade * 0.45);
    return [r, g, b, 255];
  };

  // 2. Stone drawer
  const getStonePixel = (x: number, y: number, seed: number = 20): [number, number, number, number] => {
    const n = pseudoRandom(x, y, seed);
    const v = 110 + Math.floor(n * 45);
    return [v, v, v, 255];
  };

  // 3. Grass Top
  drawTile(ctx, TileIndex.GRASS_TOP, (x, y) => {
    const n = pseudoRandom(x, y, 30);
    const g = 135 + Math.floor(n * 55);
    const r = Math.floor(g * 0.45);
    const b = Math.floor(g * 0.25);
    return [r, g, b, 255];
  });

  // 4. Grass Side
  drawTile(ctx, TileIndex.GRASS_SIDE, (x, y) => {
    const grassDepth = 3 + Math.floor(pseudoRandom(x, 1, 40) * 3);
    if (y < grassDepth) {
      const n = pseudoRandom(x, y, 30);
      const g = 135 + Math.floor(n * 55);
      const r = Math.floor(g * 0.45);
      const b = Math.floor(g * 0.25);
      return [r, g, b, 255];
    }
    return getDirtPixel(x, y);
  });

  // 5. Dirt
  drawTile(ctx, TileIndex.DIRT, getDirtPixel);

  // 6. Stone
  drawTile(ctx, TileIndex.STONE, (x, y) => getStonePixel(x, y, 20));

  // 7. Cobblestone
  drawTile(ctx, TileIndex.COBBLESTONE, (x, y) => {
    const isBorder = (x % 5 === 0 && y % 5 === 0) || (x === 0 || y === 0 || x === 15 || y === 15);
    const n = pseudoRandom(x, y, 50);
    const base = isBorder ? 60 : 100 + Math.floor(n * 55);
    return [base, base, base, 255];
  });

  // 8. Bedrock
  drawTile(ctx, TileIndex.BEDROCK, (x, y) => {
    const n = pseudoRandom(x, y, 60);
    const val = n > 0.6 ? 75 : n > 0.3 ? 40 : 15;
    return [val, val, val, 255];
  });

  // 9. Oak Log Side
  drawTile(ctx, TileIndex.OAK_LOG_SIDE, (x, y) => {
    const stripe = Math.sin(x * 1.5) > 0.2 ? 25 : 0;
    const n = pseudoRandom(x, y, 70);
    const v = 80 + stripe + Math.floor(n * 25);
    return [Math.floor(v * 1.2), Math.floor(v * 0.85), Math.floor(v * 0.55), 255];
  });

  // 10. Oak Log Top
  drawTile(ctx, TileIndex.OAK_LOG_TOP, (x, y) => {
    const dx = x - 7.5;
    const dy = y - 7.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 7) {
      return [80, 58, 38, 255]; // bark ring
    }
    const ring = Math.floor(dist * 1.5) % 2 === 0 ? 15 : 0;
    const n = pseudoRandom(x, y, 80);
    const v = 150 - ring + Math.floor(n * 20);
    return [Math.floor(v * 1.1), Math.floor(v * 0.85), Math.floor(v * 0.55), 255];
  });

  // 11. Oak Leaves
  drawTile(ctx, TileIndex.OAK_LEAVES, (x, y) => {
    const n = pseudoRandom(x, y, 90);
    if (n < 0.2) return [0, 0, 0, 0]; // see-through pixel!
    const g = 110 + Math.floor(n * 60);
    return [Math.floor(g * 0.35), g, Math.floor(g * 0.25), 255];
  });

  // 12. Oak Planks
  drawTile(ctx, TileIndex.OAK_PLANKS, (x, y) => {
    const isPlankBorder = y % 4 === 0;
    const plankRow = Math.floor(y / 4);
    const isVerticalSeam = (plankRow % 2 === 0 && x === 8) || (plankRow % 2 !== 0 && (x === 0 || x === 15));
    if (isPlankBorder || isVerticalSeam) {
      return [115, 80, 45, 255];
    }
    const n = pseudoRandom(x, y, 100);
    const v = 160 + Math.floor(n * 35);
    return [v, Math.floor(v * 0.75), Math.floor(v * 0.48), 255];
  });

  // 13. Sand
  drawTile(ctx, TileIndex.SAND, (x, y) => {
    const n = pseudoRandom(x, y, 110);
    const v = 210 + Math.floor(n * 35);
    return [v, Math.floor(v * 0.92), Math.floor(v * 0.7), 255];
  });

  // 14. Gravel
  drawTile(ctx, TileIndex.GRAVEL, (x, y) => {
    const n = pseudoRandom(x, y, 120);
    const v = 115 + Math.floor(n * 50);
    return [Math.floor(v * 1.05), v, Math.floor(v * 0.95), 255];
  });

  // 15. Glass
  drawTile(ctx, TileIndex.GLASS, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    const isGlint = (x === 3 && y === 3) || (x === 4 && y === 4) || (x === 11 && y === 12);
    if (isBorder) return [210, 240, 255, 230];
    if (isGlint) return [255, 255, 255, 220];
    return [180, 220, 255, 45]; // transparent glass body
  });

  // 16. Water
  drawTile(ctx, TileIndex.WATER, (x, y) => {
    const wave = Math.sin((x + y) * 0.8);
    const b = 210 + Math.floor(wave * 25);
    return [30, 80, b, 200];
  });

  // Helper for ore spots
  const drawOre = (index: number, oreColor: (n: number) => [number, number, number], prob: number) => {
    drawTile(ctx, index, (x, y) => {
      const n = pseudoRandom(x, y, index * 10);
      if (n > prob) {
        return [...oreColor(n), 255];
      }
      return getStonePixel(x, y, index);
    });
  };

  // Coal Ore
  drawOre(TileIndex.COAL_ORE, (n) => [25 + Math.floor(n * 20), 25 + Math.floor(n * 20), 25 + Math.floor(n * 20)], 0.72);

  // Iron Ore
  drawOre(TileIndex.IRON_ORE, (n) => [215, 175 + Math.floor(n * 20), 140], 0.75);

  // Gold Ore
  drawOre(TileIndex.GOLD_ORE, (n) => [250, 215 + Math.floor(n * 25), 50], 0.78);

  // Diamond Ore
  drawOre(TileIndex.DIAMOND_ORE, (n) => [70 + Math.floor(n * 40), 235, 235], 0.78);

  // Redstone Ore
  drawOre(TileIndex.REDSTONE_ORE, (n) => [225 + Math.floor(n * 30), 20, 20], 0.76);

  // Crafting Table Top
  drawTile(ctx, TileIndex.CRAFTING_TOP, (x, y) => {
    if (x === 0 || y === 0 || x === 15 || y === 15 || (x >= 4 && x <= 11 && y >= 4 && y <= 11 && (x === 4 || x === 11 || y === 4 || y === 11))) {
      return [90, 60, 30, 255];
    }
    const n = pseudoRandom(x, y, 130);
    const v = 170 + Math.floor(n * 30);
    return [v, Math.floor(v * 0.7), Math.floor(v * 0.4), 255];
  });

  // Crafting Table Side
  drawTile(ctx, TileIndex.CRAFTING_SIDE, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    if (isBorder) return [80, 50, 25, 255];
    const n = pseudoRandom(x, y, 140);
    const v = 150 + Math.floor(n * 30);
    return [v, Math.floor(v * 0.68), Math.floor(v * 0.4), 255];
  });

  // Furnace Front
  drawTile(ctx, TileIndex.FURNACE_FRONT, (x, y) => {
    const isHole = x >= 4 && x <= 11 && y >= 8 && y <= 13;
    if (isHole) return [30, 30, 30, 255];
    return getStonePixel(x, y, 150);
  });

  // Furnace Side
  drawTile(ctx, TileIndex.FURNACE_SIDE, (x, y) => getStonePixel(x, y, 155));

  // TNT Side
  drawTile(ctx, TileIndex.TNT_SIDE, (x, y) => {
    if (y >= 6 && y <= 9) {
      // White band with black TNT text
      const isText = (x >= 3 && x <= 12 && (y === 7 || y === 8));
      return isText ? [0, 0, 0, 255] : [240, 240, 240, 255];
    }
    const n = pseudoRandom(x, y, 160);
    return [210 + Math.floor(n * 30), 40, 30, 255];
  });

  // TNT Top
  drawTile(ctx, TileIndex.TNT_TOP, (x, y) => {
    const dist = Math.abs(x - 7.5) + Math.abs(y - 7.5);
    if (dist < 2) return [60, 60, 60, 255]; // fuse
    const n = pseudoRandom(x, y, 170);
    return [190 + Math.floor(n * 30), 45, 35, 255];
  });

  // Bricks
  drawTile(ctx, TileIndex.BRICKS, (x, y) => {
    const isMortar = y % 4 === 0 || (Math.floor(y / 4) % 2 === 0 ? x % 8 === 0 : (x + 4) % 8 === 0);
    if (isMortar) return [200, 190, 180, 255];
    const n = pseudoRandom(x, y, 180);
    const r = 160 + Math.floor(n * 35);
    return [r, Math.floor(r * 0.5), Math.floor(r * 0.35), 255];
  });

  // Bookshelf
  drawTile(ctx, TileIndex.BOOKSHELF, (x, y) => {
    const isPlank = y < 2 || y > 13 || (y >= 7 && y <= 8) || x === 0 || x === 15;
    if (isPlank) return [150, 105, 65, 255];
    const bookCol = (Math.floor(x / 2) * 53) % 4;
    const colors: [number, number, number][] = [
      [180, 40, 40],
      [40, 140, 50],
      [40, 60, 170],
      [150, 120, 40],
    ];
    return [...colors[bookCol], 255];
  });

  // Obsidian
  drawTile(ctx, TileIndex.OBSIDIAN, (x, y) => {
    const n = pseudoRandom(x, y, 190);
    const val = 15 + Math.floor(n * 20);
    return [val + 5, val, val + 15, 255];
  });

  // Netherrack
  drawTile(ctx, TileIndex.NETHERRACK, (x, y) => {
    const n = pseudoRandom(x, y, 200);
    const r = 100 + Math.floor(n * 40);
    return [r, Math.floor(r * 0.25), Math.floor(r * 0.25), 255];
  });

  // Cactus Side
  drawTile(ctx, TileIndex.CACTUS_SIDE, (x, y) => {
    const rib = x % 3 === 0;
    const thorn = (x + y) % 7 === 0;
    if (thorn) return [20, 50, 20, 255];
    const g = rib ? 110 : 135;
    return [Math.floor(g * 0.4), g, Math.floor(g * 0.3), 255];
  });

  // Snow Top
  drawTile(ctx, TileIndex.SNOW_TOP, (x, y) => {
    const n = pseudoRandom(x, y, 210);
    const v = 240 + Math.floor(n * 15);
    return [v, v, Math.floor(v * 1.02), 255];
  });

  // Break stages 0 to 9
  for (let stage = 0; stage < 10; stage++) {
    const tile = TileIndex.BREAK_0 + stage;
    drawTile(ctx, tile, (x, y) => {
      const crackThreshold = (stage + 1) * 0.085;
      const n = pseudoRandom(x * 3, y * 3, stage * 13);
      if (n < crackThreshold) {
        return [0, 0, 0, 180 + stage * 7];
      }
      return [0, 0, 0, 0]; // transparent
    });
  }

  // Create Three.js Texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;

  cachedAtlasTexture = texture;
  return texture;
}

// Map BlockType and Face normal to Atlas Tile Index
export function getTileIndexForFace(
  block: BlockType,
  faceNormal: 'top' | 'bottom' | 'side' | 'front' = 'side'
): number {
  switch (block) {
    case BlockType.GRASS:
      if (faceNormal === 'top') return TileIndex.GRASS_TOP;
      if (faceNormal === 'bottom') return TileIndex.DIRT;
      return TileIndex.GRASS_SIDE;
    case BlockType.DIRT:
      return TileIndex.DIRT;
    case BlockType.STONE:
      return TileIndex.STONE;
    case BlockType.COBBLESTONE:
      return TileIndex.COBBLESTONE;
    case BlockType.BEDROCK:
      return TileIndex.BEDROCK;
    case BlockType.OAK_LOG:
      if (faceNormal === 'top' || faceNormal === 'bottom') return TileIndex.OAK_LOG_TOP;
      return TileIndex.OAK_LOG_SIDE;
    case BlockType.OAK_LEAVES:
      return TileIndex.OAK_LEAVES;
    case BlockType.OAK_PLANKS:
      return TileIndex.OAK_PLANKS;
    case BlockType.SAND:
      return TileIndex.SAND;
    case BlockType.GRAVEL:
      return TileIndex.GRAVEL;
    case BlockType.GLASS:
      return TileIndex.GLASS;
    case BlockType.WATER:
      return TileIndex.WATER;
    case BlockType.COAL_ORE:
      return TileIndex.COAL_ORE;
    case BlockType.IRON_ORE:
      return TileIndex.IRON_ORE;
    case BlockType.GOLD_ORE:
      return TileIndex.GOLD_ORE;
    case BlockType.DIAMOND_ORE:
      return TileIndex.DIAMOND_ORE;
    case BlockType.REDSTONE_ORE:
      return TileIndex.REDSTONE_ORE;
    case BlockType.CRAFTING_TABLE:
      if (faceNormal === 'top') return TileIndex.CRAFTING_TOP;
      if (faceNormal === 'bottom') return TileIndex.OAK_PLANKS;
      return TileIndex.CRAFTING_SIDE;
    case BlockType.FURNACE:
      if (faceNormal === 'front') return TileIndex.FURNACE_FRONT;
      if (faceNormal === 'top' || faceNormal === 'bottom') return TileIndex.STONE;
      return TileIndex.FURNACE_SIDE;
    case BlockType.TNT:
      if (faceNormal === 'top') return TileIndex.TNT_TOP;
      if (faceNormal === 'bottom') return TileIndex.TNT_TOP;
      return TileIndex.TNT_SIDE;
    case BlockType.BRICKS:
      return TileIndex.BRICKS;
    case BlockType.BOOKSHELF:
      if (faceNormal === 'top' || faceNormal === 'bottom') return TileIndex.OAK_PLANKS;
      return TileIndex.BOOKSHELF;
    case BlockType.OBSIDIAN:
      return TileIndex.OBSIDIAN;
    case BlockType.NETHERRACK:
      return TileIndex.NETHERRACK;
    case BlockType.CACTUS:
      return TileIndex.CACTUS_SIDE;
    case BlockType.SNOW:
      if (faceNormal === 'top') return TileIndex.SNOW_TOP;
      return TileIndex.SNOW_TOP;
    default:
      return TileIndex.STONE;
  }
}

// Return UV coordinates [u0, v0, u1, v1] for a tile index
export function getTileUV(tileIndex: number): [number, number, number, number] {
  const col = tileIndex % ATLAS_COLS;
  const row = Math.floor(tileIndex / ATLAS_COLS);

  const u0 = col / ATLAS_COLS;
  const v1 = 1 - row / ATLAS_ROWS; // Invert V for standard WebGL
  const u1 = (col + 1) / ATLAS_COLS;
  const v0 = 1 - (row + 1) / ATLAS_ROWS;

  return [u0, v0, u1, v1];
}

// Generate high quality pixel icon data URL for inventory rendering
export function getItemIcon(itemId: ItemId): string {
  if (cachedItemIconDataUrls[itemId]) {
    return cachedItemIconDataUrls[itemId];
  }

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Render bespoke icon based on item
  ctx.clearRect(0, 0, 32, 32);

  if (itemId.includes('sword')) {
    const isDiamond = itemId.includes('diamond');
    const isIron = itemId.includes('iron');
    const isStone = itemId.includes('stone');
    const isWood = itemId.includes('wooden');

    const bladeColor = isDiamond ? '#4dedeb' : isIron ? '#dcdcdc' : isStone ? '#888888' : '#a06030';
    // Draw angled sword
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    ctx.fillStyle = bladeColor;
    ctx.beginPath();
    ctx.moveTo(8, 24);
    ctx.lineTo(24, 8);
    ctx.lineTo(26, 6);
    ctx.lineTo(24, 4);
    ctx.lineTo(22, 6);
    ctx.lineTo(6, 22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Guard & Hilt
    ctx.fillStyle = isWood ? '#553311' : '#664422';
    ctx.fillRect(4, 24, 6, 6);
  } else if (itemId.includes('pickaxe')) {
    const isDiamond = itemId.includes('diamond');
    const isIron = itemId.includes('iron');
    const headColor = isDiamond ? '#4dedeb' : isIron ? '#dcdcdc' : '#888888';

    // Stick
    ctx.fillStyle = '#855428';
    ctx.fillRect(8, 20, 4, 8);
    ctx.fillRect(12, 16, 4, 4);
    ctx.fillRect(16, 12, 4, 4);
    ctx.fillRect(20, 8, 4, 4);

    // Pickaxe head
    ctx.fillStyle = headColor;
    ctx.fillRect(14, 4, 14, 6);
    ctx.fillRect(22, 10, 6, 8);
  } else if (itemId.includes('axe')) {
    const isDiamond = itemId.includes('diamond');
    const headColor = isDiamond ? '#4dedeb' : '#dcdcdc';
    ctx.fillStyle = '#855428';
    ctx.fillRect(10, 14, 4, 14);
    ctx.fillStyle = headColor;
    ctx.fillRect(14, 4, 10, 10);
    ctx.fillRect(12, 6, 4, 6);
  } else if (itemId.includes('shovel')) {
    ctx.fillStyle = '#855428';
    ctx.fillRect(10, 14, 4, 14);
    ctx.fillStyle = itemId.includes('diamond') ? '#4dedeb' : '#dcdcdc';
    ctx.fillRect(8, 4, 8, 10);
  } else if (itemId === 'apple') {
    ctx.fillStyle = '#e62e2e';
    ctx.beginPath();
    ctx.arc(16, 17, 10, 0, Math.PI * 2);
    ctx.fill();
    // Stem
    ctx.fillStyle = '#654321';
    ctx.fillRect(15, 4, 2, 5);
  } else if (itemId === 'diamond') {
    ctx.fillStyle = '#4dedeb';
    ctx.beginPath();
    ctx.moveTo(16, 6);
    ctx.lineTo(24, 14);
    ctx.lineTo(16, 26);
    ctx.lineTo(8, 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2ab5b3';
    ctx.stroke();
  } else if (itemId === 'iron_ingot' || itemId === 'gold_ingot') {
    ctx.fillStyle = itemId === 'gold_ingot' ? '#f5cf28' : '#e0e0e0';
    ctx.fillRect(8, 12, 16, 8);
    ctx.fillStyle = itemId === 'gold_ingot' ? '#fff078' : '#ffffff';
    ctx.fillRect(8, 10, 16, 2);
  } else if (itemId === 'coal') {
    ctx.fillStyle = '#222222';
    ctx.fillRect(10, 10, 12, 12);
  } else if (itemId === 'stick') {
    ctx.fillStyle = '#855428';
    ctx.fillRect(10, 8, 4, 16);
  } else if (itemId === 'bread') {
    ctx.fillStyle = '#b87532';
    ctx.fillRect(6, 12, 20, 8);
    ctx.fillStyle = '#e59a4c';
    ctx.fillRect(8, 10, 16, 2);
  } else {
    // Default block thumbnail representation
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(4, 4, 24, 4);
    ctx.fillRect(4, 4, 4, 24);
  }

  const url = canvas.toDataURL();
  cachedItemIconDataUrls[itemId] = url;
  return url;
}
