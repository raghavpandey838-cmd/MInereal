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
  // 42-73: Extended Authentic Minecraft Blocks
  BIRCH_PLANKS = 42,
  SPRUCE_PLANKS = 43,
  STONE_BRICKS = 44,
  MOSSY_COBBLESTONE = 45,
  SMOOTH_STONE = 46,
  SANDSTONE_TOP = 47,
  SANDSTONE_SIDE = 58,
  QUARTZ_BLOCK = 59,
  NETHER_BRICKS = 60,
  GLOWSTONE = 61,
  SEA_LANTERN = 62,
  REDSTONE_LAMP = 63,
  HAY_BALE_SIDE = 64,
  HAY_BALE_TOP = 65,
  GOLD_BLOCK = 66,
  DIAMOND_BLOCK = 67,
  EMERALD_BLOCK = 68,
  IRON_BLOCK = 69,
  LAPIS_BLOCK = 70,
  PUMPKIN_FACE = 71,
  PUMPKIN_SIDE = 72,
  PUMPKIN_TOP = 73,
  MELON_SIDE = 74,
  MELON_TOP = 75,
  TERRACOTTA_ORANGE = 76,
  TERRACOTTA_CYAN = 77,
  ICE = 78,
  LAVA = 79,
  BIRCH_LOG_SIDE = 80,
  BIRCH_LOG_TOP = 81,

  // 88-140: Extended Authentic Minecraft Blocks
  JUNGLE_PLANKS = 88,
  ACACIA_PLANKS = 89,
  DARK_OAK_PLANKS = 90,
  CRACKED_STONE_BRICKS = 91,
  RED_SANDSTONE_TOP = 92,
  RED_SANDSTONE_SIDE = 93,
  PURPUR_BLOCK = 94,
  END_STONE = 95,
  AMETHYST_BLOCK = 96,
  COPPER_BLOCK = 97,
  COAL_BLOCK = 98,
  REDSTONE_BLOCK = 99,
  SLIME_BLOCK = 100,
  HONEY_BLOCK = 101,
  WHITE_WOOL = 102,
  RED_WOOL = 103,
  BLUE_WOOL = 104,
  YELLOW_WOOL = 105,
  GREEN_WOOL = 106,
  BLACK_WOOL = 107,
  PINK_WOOL = 108,
  PURPLE_WOOL = 109,
  WHITE_CONCRETE = 110,
  RED_CONCRETE = 111,
  BLUE_CONCRETE = 112,
  YELLOW_CONCRETE = 113,
  GREEN_CONCRETE = 114,
  BLACK_CONCRETE = 115,
  STAINED_GLASS_CYAN = 116,
  STAINED_GLASS_RED = 117,
  STAINED_GLASS_WHITE = 118,
  PODZOL_TOP = 119,
  PODZOL_SIDE = 120,
  MYCELIUM_TOP = 121,
  MYCELIUM_SIDE = 122,
  SOUL_SAND = 123,
  BASALT_SIDE = 124,
  BASALT_TOP = 125,
  CRYING_OBSIDIAN = 126,
  SPRUCE_LOG_SIDE = 127,
  SPRUCE_LOG_TOP = 128,
  JUNGLE_LOG_SIDE = 129,
  JUNGLE_LOG_TOP = 130,
  BIRCH_LEAVES = 131,
  SPRUCE_LEAVES = 132,
  JUNGLE_LEAVES = 133,
  LANTERN = 134,
  RED_MUSHROOM = 135,
  BROWN_MUSHROOM = 136,
  BLUE_ORCHID = 137,
  TERRACOTTA_RED = 138,
  TERRACOTTA_WHITE = 139,
  RED_SAND = 140,

  // 240-249: Break stages 0-9
  BREAK_0 = 240,
  BREAK_1 = 241,
  BREAK_2 = 242,
  BREAK_3 = 243,
  BREAK_4 = 244,
  BREAK_5 = 245,
  BREAK_6 = 246,
  BREAK_7 = 247,
  BREAK_8 = 248,
  BREAK_9 = 249,
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

  // Birch Planks
  drawTile(ctx, TileIndex.BIRCH_PLANKS, (x, y) => {
    const isPlankBorder = y % 4 === 0;
    const plankRow = Math.floor(y / 4);
    const isVerticalSeam = (plankRow % 2 === 0 && x === 8) || (plankRow % 2 !== 0 && (x === 0 || x === 15));
    if (isPlankBorder || isVerticalSeam) return [175, 160, 125, 255];
    const n = pseudoRandom(x, y, 220);
    const v = 215 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.94), Math.floor(v * 0.74), 255];
  });

  // Spruce Planks
  drawTile(ctx, TileIndex.SPRUCE_PLANKS, (x, y) => {
    const isPlankBorder = y % 4 === 0;
    const plankRow = Math.floor(y / 4);
    const isVerticalSeam = (plankRow % 2 === 0 && x === 8) || (plankRow % 2 !== 0 && (x === 0 || x === 15));
    if (isPlankBorder || isVerticalSeam) return [60, 42, 25, 255];
    const n = pseudoRandom(x, y, 230);
    const v = 95 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.74), Math.floor(v * 0.48), 255];
  });

  // Stone Bricks (4 rows running bond with mortar)
  drawTile(ctx, TileIndex.STONE_BRICKS, (x, y) => {
    const isHorizMortar = y % 4 === 0;
    const brickRow = Math.floor(y / 4);
    const isVertMortar = (brickRow % 2 === 0 && (x === 0 || x === 8)) || (brickRow % 2 !== 0 && (x === 4 || x === 12));
    if (isHorizMortar || isVertMortar) return [68, 68, 68, 255];
    const n = pseudoRandom(x, y, 240);
    const v = 120 + Math.floor(n * 28);
    return [v, v, v, 255];
  });

  // Mossy Cobblestone
  drawTile(ctx, TileIndex.MOSSY_COBBLESTONE, (x, y) => {
    const isBorder = (x % 5 === 0 && y % 5 === 0) || (x === 0 || y === 0 || x === 15 || y === 15);
    const isMoss = pseudoRandom(x, y, 250) > 0.62;
    if (isMoss) {
      const g = 110 + Math.floor(pseudoRandom(x, y, 251) * 35);
      return [Math.floor(g * 0.5), g, Math.floor(g * 0.3), 255];
    }
    const n = pseudoRandom(x, y, 50);
    const base = isBorder ? 60 : 100 + Math.floor(n * 55);
    return [base, base, base, 255];
  });

  // Smooth Stone (Clean stone with beveled border)
  drawTile(ctx, TileIndex.SMOOTH_STONE, (x, y) => {
    const isOuterBorder = x === 0 || y === 0 || x === 15 || y === 15;
    if (isOuterBorder) return [110, 110, 110, 255];
    const n = pseudoRandom(x, y, 260);
    const v = 160 + Math.floor(n * 20);
    return [v, v, v, 255];
  });

  // Sandstone Top
  drawTile(ctx, TileIndex.SANDSTONE_TOP, (x, y) => {
    const n = pseudoRandom(x, y, 270);
    const v = 215 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.94), Math.floor(v * 0.74), 255];
  });

  // Sandstone Side (Horizontal sedimentary layers)
  drawTile(ctx, TileIndex.SANDSTONE_SIDE, (x, y) => {
    const layer = Math.floor(y / 2) % 2 === 0 ? 15 : -10;
    const n = pseudoRandom(x, y, 275);
    const v = 205 + layer + Math.floor(n * 20);
    return [v, Math.floor(v * 0.92), Math.floor(v * 0.7), 255];
  });

  // Block of Quartz (Elegant white marble)
  drawTile(ctx, TileIndex.QUARTZ_BLOCK, (x, y) => {
    const isEdge = x === 0 || y === 0 || x === 15 || y === 15;
    const n = pseudoRandom(x, y, 280);
    const v = (isEdge ? 220 : 238) + Math.floor(n * 16);
    return [v, Math.floor(v * 0.98), Math.floor(v * 0.96), 255];
  });

  // Nether Bricks
  drawTile(ctx, TileIndex.NETHER_BRICKS, (x, y) => {
    const isHorizMortar = y % 4 === 0;
    const brickRow = Math.floor(y / 4);
    const isVertMortar = (brickRow % 2 === 0 && (x === 0 || x === 8)) || (brickRow % 2 !== 0 && (x === 4 || x === 12));
    if (isHorizMortar || isVertMortar) return [35, 14, 18, 255];
    const n = pseudoRandom(x, y, 290);
    const r = 58 + Math.floor(n * 24);
    return [r, Math.floor(r * 0.42), Math.floor(r * 0.48), 255];
  });

  // Glowstone (Luminous golden crystal cluster)
  drawTile(ctx, TileIndex.GLOWSTONE, (x, y) => {
    const n = pseudoRandom(x, y, 300);
    const isGlint = n > 0.75;
    if (isGlint) return [255, 240, 140, 255];
    const r = 220 + Math.floor(n * 35);
    return [r, Math.floor(r * 0.76), Math.floor(r * 0.28), 255];
  });

  // Sea Lantern (Aquamarine glowing lamp)
  drawTile(ctx, TileIndex.SEA_LANTERN, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    const isCenter = x >= 5 && x <= 10 && y >= 5 && y <= 10;
    if (isCenter) return [235, 255, 250, 255];
    if (isBorder) return [120, 180, 175, 255];
    const n = pseudoRandom(x, y, 310);
    const g = 205 + Math.floor(n * 35);
    return [Math.floor(g * 0.7), g, Math.floor(g * 0.95), 255];
  });

  // Redstone Lamp
  drawTile(ctx, TileIndex.REDSTONE_LAMP, (x, y) => {
    const isBorder = x <= 1 || y <= 1 || x >= 14 || y >= 14;
    if (isBorder) return [75, 45, 25, 255];
    const n = pseudoRandom(x, y, 320);
    const r = 185 + Math.floor(n * 40);
    return [r, Math.floor(r * 0.55), Math.floor(r * 0.2), 255];
  });

  // Hay Bale Side
  drawTile(ctx, TileIndex.HAY_BALE_SIDE, (x, y) => {
    const isBand = y >= 6 && y <= 9;
    if (isBand) return [165, 30, 30, 255]; // Red ribbon tie
    const n = pseudoRandom(x, y, 330);
    const v = 195 + Math.floor(n * 35);
    return [v, Math.floor(v * 0.85), Math.floor(v * 0.2), 255];
  });

  // Hay Bale Top
  drawTile(ctx, TileIndex.HAY_BALE_TOP, (x, y) => {
    const dx = x - 7.5;
    const dy = y - 7.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const ring = Math.floor(dist) % 2 === 0 ? 15 : 0;
    const n = pseudoRandom(x, y, 335);
    const v = 185 + ring + Math.floor(n * 25);
    return [v, Math.floor(v * 0.82), Math.floor(v * 0.2), 255];
  });

  // Block of Gold
  drawTile(ctx, TileIndex.GOLD_BLOCK, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    const isInnerBevel = x === 2 || y === 2 || x === 13 || y === 13;
    if (isBorder) return [190, 140, 20, 255];
    if (isInnerBevel) return [255, 245, 120, 255];
    const n = pseudoRandom(x, y, 340);
    const v = 235 + Math.floor(n * 20);
    return [v, Math.floor(v * 0.84), 30, 255];
  });

  // Block of Diamond
  drawTile(ctx, TileIndex.DIAMOND_BLOCK, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    const isGlint = (x + y) % 6 === 0;
    if (isBorder) return [40, 160, 155, 255];
    if (isGlint) return [220, 255, 255, 255];
    const n = pseudoRandom(x, y, 350);
    const g = 210 + Math.floor(n * 35);
    return [Math.floor(g * 0.35), g, Math.floor(g * 0.96), 255];
  });

  // Block of Emerald
  drawTile(ctx, TileIndex.EMERALD_BLOCK, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    const isFacet = (x === y) || (x + y === 15);
    if (isBorder) return [15, 115, 45, 255];
    if (isFacet) return [110, 245, 150, 255];
    const n = pseudoRandom(x, y, 360);
    const g = 180 + Math.floor(n * 45);
    return [Math.floor(g * 0.2), g, Math.floor(g * 0.45), 255];
  });

  // Block of Iron
  drawTile(ctx, TileIndex.IRON_BLOCK, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    const isRivet = (x === 2 && y === 2) || (x === 13 && y === 2) || (x === 2 && y === 13) || (x === 13 && y === 13);
    if (isRivet) return [120, 120, 125, 255];
    if (isBorder) return [160, 160, 165, 255];
    const n = pseudoRandom(x, y, 370);
    const v = 215 + Math.floor(n * 25);
    return [v, v, Math.floor(v * 1.02), 255];
  });

  // Lapis Lazuli Block
  drawTile(ctx, TileIndex.LAPIS_BLOCK, (x, y) => {
    const n = pseudoRandom(x, y, 380);
    const isGoldFleck = n > 0.85;
    if (isGoldFleck) return [240, 205, 50, 255];
    const b = 150 + Math.floor(n * 60);
    return [Math.floor(b * 0.2), Math.floor(b * 0.38), b, 255];
  });

  // Pumpkin Face
  drawTile(ctx, TileIndex.PUMPKIN_FACE, (x, y) => {
    // Carved eye cutouts
    const isLeftEye = (x >= 3 && x <= 5) && (y >= 4 && y <= 6) && (x !== 3 || y !== 4);
    const isRightEye = (x >= 10 && x <= 12) && (y >= 4 && y <= 6) && (x !== 12 || y !== 4);
    const isNose = (x === 7 || x === 8) && y === 8;
    const isMouth = (y >= 10 && y <= 12) && (x >= 3 && x <= 12) && (x % 2 === y % 2);
    if (isLeftEye || isRightEye || isNose || isMouth) {
      return [35, 20, 10, 255]; // Dark carved hollow
    }
    const rib = x % 4 === 0 ? -25 : 10;
    const n = pseudoRandom(x, y, 390);
    const r = 210 + rib + Math.floor(n * 25);
    return [r, Math.floor(r * 0.56), Math.floor(r * 0.12), 255];
  });

  // Pumpkin Side
  drawTile(ctx, TileIndex.PUMPKIN_SIDE, (x, y) => {
    const rib = x % 4 === 0 ? -25 : 10;
    const n = pseudoRandom(x, y, 390);
    const r = 210 + rib + Math.floor(n * 25);
    return [r, Math.floor(r * 0.56), Math.floor(r * 0.12), 255];
  });

  // Pumpkin Top
  drawTile(ctx, TileIndex.PUMPKIN_TOP, (x, y) => {
    const isStem = x >= 6 && x <= 9 && y >= 6 && y <= 9;
    if (isStem) return [85, 115, 45, 255];
    const n = pseudoRandom(x, y, 395);
    const r = 200 + Math.floor(n * 30);
    return [r, Math.floor(r * 0.54), Math.floor(r * 0.12), 255];
  });

  // Melon Side (Dark and light green vertical stripes)
  drawTile(ctx, TileIndex.MELON_SIDE, (x, y) => {
    const stripe = (Math.floor(x / 2) + Math.floor(y / 6)) % 2 === 0;
    const n = pseudoRandom(x, y, 400);
    const g = (stripe ? 135 : 185) + Math.floor(n * 25);
    return [Math.floor(g * 0.52), g, Math.floor(g * 0.25), 255];
  });

  // Melon Top
  drawTile(ctx, TileIndex.MELON_TOP, (x, y) => {
    const n = pseudoRandom(x, y, 405);
    const g = 150 + Math.floor(n * 35);
    return [Math.floor(g * 0.55), g, Math.floor(g * 0.28), 255];
  });

  // Terracotta Orange
  drawTile(ctx, TileIndex.TERRACOTTA_ORANGE, (x, y) => {
    const n = pseudoRandom(x, y, 410);
    const r = 175 + Math.floor(n * 25);
    return [r, Math.floor(r * 0.52), Math.floor(r * 0.24), 255];
  });

  // Terracotta Cyan
  drawTile(ctx, TileIndex.TERRACOTTA_CYAN, (x, y) => {
    const n = pseudoRandom(x, y, 415);
    const v = 85 + Math.floor(n * 20);
    return [Math.floor(v * 0.95), Math.floor(v * 1.05), Math.floor(v * 1.05), 255];
  });

  // Ice (Translucent frosted crystal)
  drawTile(ctx, TileIndex.ICE, (x, y) => {
    const isFracture = (x * 2 + y * 3) % 11 === 0;
    if (isFracture) return [235, 250, 255, 230];
    const n = pseudoRandom(x, y, 420);
    const b = 225 + Math.floor(n * 25);
    return [Math.floor(b * 0.65), Math.floor(b * 0.85), b, 200];
  });

  // Lava (Molten flowing magma)
  drawTile(ctx, TileIndex.LAVA, (x, y) => {
    const hotSpot = Math.sin((x * 0.7 + y * 0.9)) > 0.3;
    if (hotSpot) return [255, 220, 40, 255];
    const n = pseudoRandom(x, y, 430);
    const r = 220 + Math.floor(n * 35);
    return [r, Math.floor(r * 0.42), 10, 255];
  });

  // Birch Log Side
  drawTile(ctx, TileIndex.BIRCH_LOG_SIDE, (x, y) => {
    const isLenticel = ((y === 3 && x >= 4 && x <= 8) || (y === 9 && x >= 10 && x <= 14) || (y === 13 && x >= 1 && x <= 5));
    if (isLenticel) return [45, 45, 45, 255];
    const n = pseudoRandom(x, y, 440);
    const v = 225 + Math.floor(n * 25);
    return [v, v, Math.floor(v * 0.95), 255];
  });

  // Birch Log Top
  drawTile(ctx, TileIndex.BIRCH_LOG_TOP, (x, y) => {
    const dx = x - 7.5;
    const dy = y - 7.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 7) return [225, 225, 220, 255]; // white bark perimeter
    const n = pseudoRandom(x, y, 445);
    const v = 185 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.85), Math.floor(v * 0.6), 255];
  });

  // Jungle Planks (warm salmon brown)
  drawTile(ctx, TileIndex.JUNGLE_PLANKS, (x, y) => {
    const isPlankBorder = y % 4 === 0;
    const plankRow = Math.floor(y / 4);
    const isVerticalSeam = (plankRow % 2 === 0 && x === 8) || (plankRow % 2 !== 0 && (x === 0 || x === 15));
    if (isPlankBorder || isVerticalSeam) return [115, 75, 52, 255];
    const n = pseudoRandom(x, y, 450);
    const v = 160 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.72), Math.floor(v * 0.55), 255];
  });

  // Acacia Planks (warm orange)
  drawTile(ctx, TileIndex.ACACIA_PLANKS, (x, y) => {
    const isPlankBorder = y % 4 === 0;
    const plankRow = Math.floor(y / 4);
    const isVerticalSeam = (plankRow % 2 === 0 && x === 8) || (plankRow % 2 !== 0 && (x === 0 || x === 15));
    if (isPlankBorder || isVerticalSeam) return [130, 60, 30, 255];
    const n = pseudoRandom(x, y, 455);
    const v = 175 + Math.floor(n * 30);
    return [v, Math.floor(v * 0.55), Math.floor(v * 0.28), 255];
  });

  // Dark Oak Planks (deep rich chocolate)
  drawTile(ctx, TileIndex.DARK_OAK_PLANKS, (x, y) => {
    const isPlankBorder = y % 4 === 0;
    const plankRow = Math.floor(y / 4);
    const isVerticalSeam = (plankRow % 2 === 0 && x === 8) || (plankRow % 2 !== 0 && (x === 0 || x === 15));
    if (isPlankBorder || isVerticalSeam) return [38, 25, 14, 255];
    const n = pseudoRandom(x, y, 460);
    const v = 66 + Math.floor(n * 20);
    return [v, Math.floor(v * 0.68), Math.floor(v * 0.45), 255];
  });

  // Cracked Stone Bricks
  drawTile(ctx, TileIndex.CRACKED_STONE_BRICKS, (x, y) => {
    const isHorizMortar = y % 4 === 0;
    const brickRow = Math.floor(y / 4);
    const isVertMortar = (brickRow % 2 === 0 && (x === 0 || x === 8)) || (brickRow % 2 !== 0 && (x === 4 || x === 12));
    const isCrack = (x === 5 && (y >= 1 && y <= 5)) || (x === 11 && (y >= 8 && y <= 13)) || (y === 7 && (x >= 4 && x <= 7));
    if (isCrack || isHorizMortar || isVertMortar) return [45, 45, 45, 255];
    const n = pseudoRandom(x, y, 465);
    const v = 115 + Math.floor(n * 30);
    return [v, v, v, 255];
  });

  // Red Sandstone Top & Side
  drawTile(ctx, TileIndex.RED_SANDSTONE_TOP, (x, y) => {
    const n = pseudoRandom(x, y, 470);
    const r = 180 + Math.floor(n * 25);
    return [r, Math.floor(r * 0.48), Math.floor(r * 0.2), 255];
  });
  drawTile(ctx, TileIndex.RED_SANDSTONE_SIDE, (x, y) => {
    const isBand = y === 3 || y === 12;
    const n = pseudoRandom(x, y, 475);
    const r = (isBand ? 140 : 175) + Math.floor(n * 25);
    return [r, Math.floor(r * 0.46), Math.floor(r * 0.2), 255];
  });

  // Purpur Block
  drawTile(ctx, TileIndex.PURPUR_BLOCK, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    const isCenter = x >= 5 && x <= 10 && y >= 5 && y <= 10;
    if (isBorder) return [130, 90, 130, 255];
    if (isCenter) return [190, 140, 190, 255];
    const n = pseudoRandom(x, y, 480);
    const v = 165 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.72), v, 255];
  });

  // End Stone
  drawTile(ctx, TileIndex.END_STONE, (x, y) => {
    const n = pseudoRandom(x, y, 485);
    const v = 205 + Math.floor(n * 35);
    return [v, v, Math.floor(v * 0.72), 255];
  });

  // Amethyst Block (crystalline purple)
  drawTile(ctx, TileIndex.AMETHYST_BLOCK, (x, y) => {
    const isFacet = (x + y) % 5 === 0 || (x - y + 16) % 5 === 0;
    const n = pseudoRandom(x, y, 490);
    const v = (isFacet ? 210 : 140) + Math.floor(n * 35);
    return [Math.floor(v * 0.85), Math.floor(v * 0.5), v, 255];
  });

  // Copper Block (warm metallic with rivets)
  drawTile(ctx, TileIndex.COPPER_BLOCK, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    const isRivet = (x === 2 && y === 2) || (x === 13 && y === 2) || (x === 2 && y === 13) || (x === 13 && y === 13);
    if (isRivet) return [235, 175, 120, 255];
    if (isBorder) return [130, 70, 45, 255];
    const n = pseudoRandom(x, y, 495);
    const r = 190 + Math.floor(n * 35);
    return [r, Math.floor(r * 0.58), Math.floor(r * 0.42), 255];
  });

  // Coal Block
  drawTile(ctx, TileIndex.COAL_BLOCK, (x, y) => {
    const n = pseudoRandom(x, y, 500);
    const v = 20 + Math.floor(n * 25);
    return [v, v, v, 255];
  });

  // Redstone Block
  drawTile(ctx, TileIndex.REDSTONE_BLOCK, (x, y) => {
    const isSpark = pseudoRandom(x, y, 505) > 0.85;
    if (isSpark) return [255, 120, 120, 255];
    const n = pseudoRandom(x, y, 506);
    const r = 180 + Math.floor(n * 60);
    return [r, 15, 15, 255];
  });

  // Slime Block (neon bouncy green)
  drawTile(ctx, TileIndex.SLIME_BLOCK, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    const isCore = x >= 4 && x <= 11 && y >= 4 && y <= 11;
    if (isBorder) return [95, 185, 75, 220];
    if (isCore) return [70, 160, 55, 240];
    const n = pseudoRandom(x, y, 510);
    const g = 190 + Math.floor(n * 35);
    return [Math.floor(g * 0.5), g, Math.floor(g * 0.4), 210];
  });

  // Honey Block (translucent amber jelly)
  drawTile(ctx, TileIndex.HONEY_BLOCK, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    const isHighlight = (x === 2 && y === 2) || (x === 3 && y === 2);
    if (isHighlight) return [255, 235, 120, 240];
    if (isBorder) return [200, 120, 20, 220];
    const n = pseudoRandom(x, y, 515);
    const r = 230 + Math.floor(n * 25);
    return [r, Math.floor(r * 0.65), 25, 215];
  });

  // Wool Drawer Helper
  const drawWoolTile = (tile: number, baseR: number, baseG: number, baseB: number, seed: number) => {
    drawTile(ctx, tile, (x, y) => {
      const isWeave = (x + y) % 2 === 0;
      const n = pseudoRandom(x, y, seed);
      const mult = (isWeave ? 1.05 : 0.92) * (0.95 + n * 0.1);
      return [
        Math.min(255, Math.floor(baseR * mult)),
        Math.min(255, Math.floor(baseG * mult)),
        Math.min(255, Math.floor(baseB * mult)),
        255,
      ];
    });
  };

  drawWoolTile(TileIndex.WHITE_WOOL, 235, 235, 235, 520);
  drawWoolTile(TileIndex.RED_WOOL, 175, 40, 40, 521);
  drawWoolTile(TileIndex.BLUE_WOOL, 45, 65, 175, 522);
  drawWoolTile(TileIndex.YELLOW_WOOL, 235, 200, 45, 523);
  drawWoolTile(TileIndex.GREEN_WOOL, 75, 135, 45, 524);
  drawWoolTile(TileIndex.BLACK_WOOL, 28, 28, 28, 525);
  drawWoolTile(TileIndex.PINK_WOOL, 235, 145, 175, 526);
  drawWoolTile(TileIndex.PURPLE_WOOL, 125, 45, 175, 527);

  // Concrete Drawer Helper (smooth matte saturated colors)
  const drawConcreteTile = (tile: number, r: number, g: number, b: number, seed: number) => {
    drawTile(ctx, tile, (x, y) => {
      const n = pseudoRandom(x, y, seed);
      const noise = -4 + Math.floor(n * 9);
      return [
        Math.max(0, Math.min(255, r + noise)),
        Math.max(0, Math.min(255, g + noise)),
        Math.max(0, Math.min(255, b + noise)),
        255,
      ];
    });
  };

  drawConcreteTile(TileIndex.WHITE_CONCRETE, 240, 240, 242, 530);
  drawConcreteTile(TileIndex.RED_CONCRETE, 160, 35, 35, 531);
  drawConcreteTile(TileIndex.BLUE_CONCRETE, 38, 55, 160, 532);
  drawConcreteTile(TileIndex.YELLOW_CONCRETE, 240, 185, 30, 533);
  drawConcreteTile(TileIndex.GREEN_CONCRETE, 68, 115, 32, 534);
  drawConcreteTile(TileIndex.BLACK_CONCRETE, 18, 18, 20, 535);

  // Stained Glass
  drawTile(ctx, TileIndex.STAINED_GLASS_CYAN, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    if (isBorder) return [40, 160, 180, 220];
    const isGlint = (x === 3 && y === 3) || (x === 4 && y === 3);
    if (isGlint) return [180, 245, 255, 230];
    return [55, 180, 200, 120];
  });
  drawTile(ctx, TileIndex.STAINED_GLASS_RED, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    if (isBorder) return [180, 35, 35, 220];
    const isGlint = (x === 3 && y === 3) || (x === 4 && y === 3);
    if (isGlint) return [255, 190, 190, 230];
    return [200, 45, 45, 120];
  });
  drawTile(ctx, TileIndex.STAINED_GLASS_WHITE, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
    if (isBorder) return [220, 220, 220, 220];
    const isGlint = (x === 3 && y === 3) || (x === 4 && y === 3);
    if (isGlint) return [255, 255, 255, 240];
    return [235, 235, 240, 110];
  });

  // Podzol
  drawTile(ctx, TileIndex.PODZOL_TOP, (x, y) => {
    const isNeedle = (x * 3 + y * 7) % 5 === 0;
    const n = pseudoRandom(x, y, 540);
    const r = (isNeedle ? 95 : 120) + Math.floor(n * 25);
    return [r, Math.floor(r * 0.62), Math.floor(r * 0.38), 255];
  });
  drawTile(ctx, TileIndex.PODZOL_SIDE, (x, y) => {
    if (y < 4) return [110, 75, 45, 255]; // podzol top cap
    const n = pseudoRandom(x, y, 545);
    const v = 95 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.7), Math.floor(v * 0.45), 255];
  });

  // Mycelium
  drawTile(ctx, TileIndex.MYCELIUM_TOP, (x, y) => {
    const isSpore = pseudoRandom(x, y, 550) > 0.8;
    if (isSpore) return [200, 175, 220, 255];
    const n = pseudoRandom(x, y, 551);
    const v = 110 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.9), Math.floor(v * 1.05), 255];
  });
  drawTile(ctx, TileIndex.MYCELIUM_SIDE, (x, y) => {
    if (y < 4) return [125, 110, 130, 255];
    const n = pseudoRandom(x, y, 555);
    const v = 95 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.7), Math.floor(v * 0.45), 255];
  });

  // Soul Sand
  drawTile(ctx, TileIndex.SOUL_SAND, (x, y) => {
    const isSoulFace = (x === 6 && y === 6) || (x === 9 && y === 6) || (x >= 6 && x <= 9 && y === 9);
    if (isSoulFace) return [55, 40, 32, 255];
    const n = pseudoRandom(x, y, 560);
    const v = 80 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.75), Math.floor(v * 0.6), 255];
  });

  // Basalt
  drawTile(ctx, TileIndex.BASALT_SIDE, (x, y) => {
    const isStripe = x % 3 === 0;
    const n = pseudoRandom(x, y, 565);
    const v = (isStripe ? 75 : 90) + Math.floor(n * 20);
    return [v, v, v, 255];
  });
  drawTile(ctx, TileIndex.BASALT_TOP, (x, y) => {
    const n = pseudoRandom(x, y, 570);
    const v = 65 + Math.floor(n * 20);
    return [v, v, v, 255];
  });

  // Crying Obsidian (obsidian with vibrant magenta energy tears)
  drawTile(ctx, TileIndex.CRYING_OBSIDIAN, (x, y) => {
    const isTear = (x === 4 && y >= 3 && y <= 8) || (x === 11 && y >= 7 && y <= 12) || (x === 8 && y === 10);
    if (isTear) return [220, 60, 255, 255];
    const n = pseudoRandom(x, y, 575);
    const v = 15 + Math.floor(n * 20);
    return [v + 8, v, v + 25, 255];
  });

  // Spruce Log Side & Top
  drawTile(ctx, TileIndex.SPRUCE_LOG_SIDE, (x, y) => {
    const isGroove = x % 4 === 0;
    const n = pseudoRandom(x, y, 580);
    const v = (isGroove ? 45 : 65) + Math.floor(n * 20);
    return [v, Math.floor(v * 0.75), Math.floor(v * 0.5), 255];
  });
  drawTile(ctx, TileIndex.SPRUCE_LOG_TOP, (x, y) => {
    const dx = x - 7.5;
    const dy = y - 7.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 7) return [50, 38, 25, 255];
    const n = pseudoRandom(x, y, 585);
    const v = 100 + Math.floor(n * 20);
    return [v, Math.floor(v * 0.8), Math.floor(v * 0.55), 255];
  });

  // Jungle Log Side & Top
  drawTile(ctx, TileIndex.JUNGLE_LOG_SIDE, (x, y) => {
    const isMoss = (x * 2 + y * 3) % 7 === 0;
    if (isMoss) return [95, 110, 45, 255];
    const n = pseudoRandom(x, y, 590);
    const v = 85 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.78), Math.floor(v * 0.52), 255];
  });
  drawTile(ctx, TileIndex.JUNGLE_LOG_TOP, (x, y) => {
    const dx = x - 7.5;
    const dy = y - 7.5;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 7) return [75, 65, 45, 255];
    const n = pseudoRandom(x, y, 595);
    const v = 140 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.78), Math.floor(v * 0.52), 255];
  });

  // Leaves (Birch, Spruce, Jungle)
  drawTile(ctx, TileIndex.BIRCH_LEAVES, (x, y) => {
    const n = pseudoRandom(x, y, 600);
    const isGap = n > 0.82;
    if (isGap) return [0, 0, 0, 0];
    const g = 135 + Math.floor(n * 45);
    return [Math.floor(g * 0.62), g, Math.floor(g * 0.28), 255];
  });
  drawTile(ctx, TileIndex.SPRUCE_LEAVES, (x, y) => {
    const n = pseudoRandom(x, y, 605);
    const isGap = n > 0.82;
    if (isGap) return [0, 0, 0, 0];
    const g = 90 + Math.floor(n * 35);
    return [Math.floor(g * 0.42), g, Math.floor(g * 0.42), 255];
  });
  drawTile(ctx, TileIndex.JUNGLE_LEAVES, (x, y) => {
    const n = pseudoRandom(x, y, 610);
    const isGap = n > 0.82;
    if (isGap) return [0, 0, 0, 0];
    const g = 165 + Math.floor(n * 45);
    return [Math.floor(g * 0.35), g, Math.floor(g * 0.15), 255];
  });

  // Lantern
  drawTile(ctx, TileIndex.LANTERN, (x, y) => {
    const isFrame = x === 2 || x === 13 || y === 2 || y === 13;
    const isCore = x >= 5 && x <= 10 && y >= 5 && y <= 10;
    if (isFrame) return [60, 60, 65, 255];
    if (isCore) return [255, 215, 80, 255];
    return [220, 150, 50, 220];
  });

  // Red Mushroom & Brown Mushroom & Blue Orchid
  drawTile(ctx, TileIndex.RED_MUSHROOM, (x, y) => {
    const isCap = y >= 2 && y <= 9 && x >= 3 && x <= 12;
    const isDot = (x === 5 && y === 4) || (x === 10 && y === 5) || (x === 7 && y === 7);
    const isStem = y >= 9 && y <= 15 && x >= 6 && x <= 9;
    if (isDot) return [245, 245, 245, 255];
    if (isCap) return [220, 35, 35, 255];
    if (isStem) return [215, 215, 215, 255];
    return [0, 0, 0, 0];
  });
  drawTile(ctx, TileIndex.BROWN_MUSHROOM, (x, y) => {
    const isCap = y >= 2 && y <= 8 && x >= 2 && x <= 13;
    const isStem = y >= 8 && y <= 15 && x >= 6 && x <= 9;
    if (isCap) return [155, 115, 75, 255];
    if (isStem) return [215, 215, 215, 255];
    return [0, 0, 0, 0];
  });
  drawTile(ctx, TileIndex.BLUE_ORCHID, (x, y) => {
    const isPetal = ((x >= 5 && x <= 10) && (y >= 4 && y <= 9)) || (x === 8 && y === 3);
    const isStem = x === 8 && y >= 9 && y <= 15;
    if (isPetal) return [45, 160, 245, 255];
    if (isStem) return [55, 140, 45, 255];
    return [0, 0, 0, 0];
  });

  // Terracotta Red & White
  drawTile(ctx, TileIndex.TERRACOTTA_RED, (x, y) => {
    const n = pseudoRandom(x, y, 620);
    const r = 145 + Math.floor(n * 25);
    return [r, Math.floor(r * 0.4), Math.floor(r * 0.3), 255];
  });
  drawTile(ctx, TileIndex.TERRACOTTA_WHITE, (x, y) => {
    const n = pseudoRandom(x, y, 625);
    const v = 210 + Math.floor(n * 25);
    return [v, Math.floor(v * 0.92), Math.floor(v * 0.85), 255];
  });

  // Red Sand
  drawTile(ctx, TileIndex.RED_SAND, (x, y) => {
    const n = pseudoRandom(x, y, 630);
    const r = 195 + Math.floor(n * 30);
    return [r, Math.floor(r * 0.52), Math.floor(r * 0.22), 255];
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
    case BlockType.BIRCH_PLANKS:
      return TileIndex.BIRCH_PLANKS;
    case BlockType.SPRUCE_PLANKS:
      return TileIndex.SPRUCE_PLANKS;
    case BlockType.STONE_BRICKS:
      return TileIndex.STONE_BRICKS;
    case BlockType.MOSSY_COBBLESTONE:
      return TileIndex.MOSSY_COBBLESTONE;
    case BlockType.SMOOTH_STONE:
      return TileIndex.SMOOTH_STONE;
    case BlockType.SANDSTONE:
      if (faceNormal === 'top' || faceNormal === 'bottom') return TileIndex.SANDSTONE_TOP;
      return TileIndex.SANDSTONE_SIDE;
    case BlockType.QUARTZ_BLOCK:
      return TileIndex.QUARTZ_BLOCK;
    case BlockType.NETHER_BRICKS:
      return TileIndex.NETHER_BRICKS;
    case BlockType.GLOWSTONE:
      return TileIndex.GLOWSTONE;
    case BlockType.SEA_LANTERN:
      return TileIndex.SEA_LANTERN;
    case BlockType.REDSTONE_LAMP:
      return TileIndex.REDSTONE_LAMP;
    case BlockType.HAY_BALE:
      if (faceNormal === 'top' || faceNormal === 'bottom') return TileIndex.HAY_BALE_TOP;
      return TileIndex.HAY_BALE_SIDE;
    case BlockType.GOLD_BLOCK:
      return TileIndex.GOLD_BLOCK;
    case BlockType.DIAMOND_BLOCK:
      return TileIndex.DIAMOND_BLOCK;
    case BlockType.EMERALD_BLOCK:
      return TileIndex.EMERALD_BLOCK;
    case BlockType.IRON_BLOCK:
      return TileIndex.IRON_BLOCK;
    case BlockType.LAPIS_BLOCK:
      return TileIndex.LAPIS_BLOCK;
    case BlockType.PUMPKIN:
      if (faceNormal === 'front') return TileIndex.PUMPKIN_FACE;
      if (faceNormal === 'top' || faceNormal === 'bottom') return TileIndex.PUMPKIN_TOP;
      return TileIndex.PUMPKIN_SIDE;
    case BlockType.MELON:
      if (faceNormal === 'top' || faceNormal === 'bottom') return TileIndex.MELON_TOP;
      return TileIndex.MELON_SIDE;
    case BlockType.TERRACOTTA_ORANGE:
      return TileIndex.TERRACOTTA_ORANGE;
    case BlockType.TERRACOTTA_CYAN:
      return TileIndex.TERRACOTTA_CYAN;
    case BlockType.ICE:
      return TileIndex.ICE;
    case BlockType.LAVA:
      return TileIndex.LAVA;
    case BlockType.BIRCH_LOG:
      if (faceNormal === 'top' || faceNormal === 'bottom') return TileIndex.BIRCH_LOG_TOP;
      return TileIndex.BIRCH_LOG_SIDE;
    case BlockType.JUNGLE_PLANKS:
      return TileIndex.JUNGLE_PLANKS;
    case BlockType.ACACIA_PLANKS:
      return TileIndex.ACACIA_PLANKS;
    case BlockType.DARK_OAK_PLANKS:
      return TileIndex.DARK_OAK_PLANKS;
    case BlockType.CRACKED_STONE_BRICKS:
      return TileIndex.CRACKED_STONE_BRICKS;
    case BlockType.RED_SANDSTONE:
      if (faceNormal === 'top' || faceNormal === 'bottom') return TileIndex.RED_SANDSTONE_TOP;
      return TileIndex.RED_SANDSTONE_SIDE;
    case BlockType.PURPUR_BLOCK:
      return TileIndex.PURPUR_BLOCK;
    case BlockType.END_STONE:
      return TileIndex.END_STONE;
    case BlockType.AMETHYST_BLOCK:
      return TileIndex.AMETHYST_BLOCK;
    case BlockType.COPPER_BLOCK:
      return TileIndex.COPPER_BLOCK;
    case BlockType.COAL_BLOCK:
      return TileIndex.COAL_BLOCK;
    case BlockType.REDSTONE_BLOCK:
      return TileIndex.REDSTONE_BLOCK;
    case BlockType.SLIME_BLOCK:
      return TileIndex.SLIME_BLOCK;
    case BlockType.HONEY_BLOCK:
      return TileIndex.HONEY_BLOCK;
    case BlockType.WHITE_WOOL:
      return TileIndex.WHITE_WOOL;
    case BlockType.RED_WOOL:
      return TileIndex.RED_WOOL;
    case BlockType.BLUE_WOOL:
      return TileIndex.BLUE_WOOL;
    case BlockType.YELLOW_WOOL:
      return TileIndex.YELLOW_WOOL;
    case BlockType.GREEN_WOOL:
      return TileIndex.GREEN_WOOL;
    case BlockType.BLACK_WOOL:
      return TileIndex.BLACK_WOOL;
    case BlockType.PINK_WOOL:
      return TileIndex.PINK_WOOL;
    case BlockType.PURPLE_WOOL:
      return TileIndex.PURPLE_WOOL;
    case BlockType.WHITE_CONCRETE:
      return TileIndex.WHITE_CONCRETE;
    case BlockType.RED_CONCRETE:
      return TileIndex.RED_CONCRETE;
    case BlockType.BLUE_CONCRETE:
      return TileIndex.BLUE_CONCRETE;
    case BlockType.YELLOW_CONCRETE:
      return TileIndex.YELLOW_CONCRETE;
    case BlockType.GREEN_CONCRETE:
      return TileIndex.GREEN_CONCRETE;
    case BlockType.BLACK_CONCRETE:
      return TileIndex.BLACK_CONCRETE;
    case BlockType.STAINED_GLASS_CYAN:
      return TileIndex.STAINED_GLASS_CYAN;
    case BlockType.STAINED_GLASS_RED:
      return TileIndex.STAINED_GLASS_RED;
    case BlockType.STAINED_GLASS_WHITE:
      return TileIndex.STAINED_GLASS_WHITE;
    case BlockType.PODZOL:
      if (faceNormal === 'top') return TileIndex.PODZOL_TOP;
      if (faceNormal === 'bottom') return TileIndex.DIRT;
      return TileIndex.PODZOL_SIDE;
    case BlockType.MYCELIUM:
      if (faceNormal === 'top') return TileIndex.MYCELIUM_TOP;
      if (faceNormal === 'bottom') return TileIndex.DIRT;
      return TileIndex.MYCELIUM_SIDE;
    case BlockType.SOUL_SAND:
      return TileIndex.SOUL_SAND;
    case BlockType.BASALT:
      if (faceNormal === 'top' || faceNormal === 'bottom') return TileIndex.BASALT_TOP;
      return TileIndex.BASALT_SIDE;
    case BlockType.CRYING_OBSIDIAN:
      return TileIndex.CRYING_OBSIDIAN;
    case BlockType.SPRUCE_LOG:
      if (faceNormal === 'top' || faceNormal === 'bottom') return TileIndex.SPRUCE_LOG_TOP;
      return TileIndex.SPRUCE_LOG_SIDE;
    case BlockType.JUNGLE_LOG:
      if (faceNormal === 'top' || faceNormal === 'bottom') return TileIndex.JUNGLE_LOG_TOP;
      return TileIndex.JUNGLE_LOG_SIDE;
    case BlockType.BIRCH_LEAVES:
      return TileIndex.BIRCH_LEAVES;
    case BlockType.SPRUCE_LEAVES:
      return TileIndex.SPRUCE_LEAVES;
    case BlockType.JUNGLE_LEAVES:
      return TileIndex.JUNGLE_LEAVES;
    case BlockType.LANTERN:
      return TileIndex.LANTERN;
    case BlockType.RED_MUSHROOM:
      return TileIndex.RED_MUSHROOM;
    case BlockType.BROWN_MUSHROOM:
      return TileIndex.BROWN_MUSHROOM;
    case BlockType.BLUE_ORCHID:
      return TileIndex.BLUE_ORCHID;
    case BlockType.TERRACOTTA_RED:
      return TileIndex.TERRACOTTA_RED;
    case BlockType.TERRACOTTA_WHITE:
      return TileIndex.TERRACOTTA_WHITE;
    case BlockType.RED_SAND:
      return TileIndex.RED_SAND;
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
  } else if (itemId === 'gold_block') {
    ctx.fillStyle = '#f5cf28';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#fff078';
    ctx.fillRect(4, 4, 24, 3);
    ctx.fillRect(4, 4, 3, 24);
    ctx.fillStyle = '#b89218';
    ctx.fillRect(4, 25, 24, 3);
    ctx.fillRect(25, 4, 3, 24);
  } else if (itemId === 'diamond_block') {
    ctx.fillStyle = '#4dedeb';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#b8f8f8';
    ctx.fillRect(4, 4, 24, 3);
    ctx.fillRect(4, 4, 3, 24);
    ctx.fillStyle = '#189da0';
    ctx.fillRect(4, 25, 24, 3);
    ctx.fillRect(25, 4, 3, 24);
  } else if (itemId === 'emerald_block') {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#86efac';
    ctx.fillRect(4, 4, 24, 3);
    ctx.fillRect(4, 4, 3, 24);
    ctx.fillStyle = '#15803d';
    ctx.fillRect(4, 25, 24, 3);
    ctx.fillRect(25, 4, 3, 24);
  } else if (itemId === 'iron_block') {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(4, 4, 24, 3);
    ctx.fillRect(4, 4, 3, 24);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(4, 25, 24, 3);
    ctx.fillRect(25, 4, 3, 24);
  } else if (itemId === 'lapis_block') {
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(4, 4, 24, 3);
    ctx.fillRect(4, 4, 3, 24);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(10, 10, 3, 3);
    ctx.fillRect(18, 16, 3, 3);
  } else if (itemId === 'stone_bricks') {
    ctx.fillStyle = '#78716c';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#44403c';
    ctx.fillRect(4, 15, 24, 2);
    ctx.fillRect(15, 4, 2, 12);
    ctx.fillRect(10, 16, 2, 12);
  } else if (itemId === 'glowstone') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(6, 6, 6, 6);
    ctx.fillRect(16, 14, 8, 8);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(4, 4, 24, 2);
  } else if (itemId === 'sea_lantern') {
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#ecfeff';
    ctx.fillRect(9, 9, 14, 14);
    ctx.fillStyle = '#0891b2';
    ctx.fillRect(4, 4, 24, 3);
    ctx.fillRect(4, 4, 3, 24);
  } else if (itemId === 'redstone_lamp') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(8, 8, 16, 16);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(11, 11, 10, 10);
  } else if (itemId === 'pumpkin') {
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#292524';
    ctx.fillRect(8, 9, 4, 4);
    ctx.fillRect(20, 9, 4, 4);
    ctx.fillRect(10, 18, 12, 4);
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(14, 2, 4, 3);
  } else if (itemId === 'melon') {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(8, 4, 4, 24);
    ctx.fillRect(20, 4, 4, 24);
  } else if (itemId === 'hay_bale') {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(4, 14, 24, 4);
  } else if (itemId === 'quartz_block') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(4, 4, 24, 2);
    ctx.fillRect(4, 4, 2, 24);
  } else if (itemId === 'nether_bricks') {
    ctx.fillStyle = '#4c0519';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#881337';
    ctx.fillRect(4, 15, 24, 2);
  } else if (itemId === 'sandstone') {
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#eab308';
    ctx.fillRect(4, 12, 24, 3);
    ctx.fillRect(4, 20, 24, 3);
  } else if (itemId === 'ice') {
    ctx.fillStyle = '#7dd3fc';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(8, 8, 4, 4);
    ctx.fillRect(18, 16, 4, 4);
  } else if (itemId === 'lava') {
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(8, 8, 8, 8);
    ctx.fillRect(18, 18, 6, 6);
  } else if (itemId === 'birch_log') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(6, 8, 8, 3);
    ctx.fillRect(16, 16, 8, 3);
  } else if (itemId === 'birch_planks') {
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(4, 10, 24, 2);
    ctx.fillRect(4, 18, 24, 2);
  } else if (itemId === 'spruce_planks') {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 10, 24, 2);
    ctx.fillRect(4, 18, 24, 2);
  } else if (itemId === 'mossy_cobblestone') {
    ctx.fillStyle = '#78716c';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(6, 6, 6, 6);
    ctx.fillRect(16, 16, 8, 6);
  } else if (itemId === 'smooth_stone') {
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#e7e5e4';
    ctx.fillRect(4, 4, 24, 3);
    ctx.fillRect(4, 4, 3, 24);
    ctx.fillStyle = '#57534e';
    ctx.fillRect(4, 25, 24, 3);
    ctx.fillRect(25, 4, 3, 24);
  } else if (itemId === 'terracotta_orange') {
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(4, 4, 24, 24);
  } else if (itemId === 'terracotta_cyan') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(4, 4, 24, 24);
  } else if (itemId.includes('wool')) {
    const woolColors: Record<string, string> = {
      white_wool: '#f8fafc',
      red_wool: '#dc2626',
      blue_wool: '#2563eb',
      yellow_wool: '#eab308',
      green_wool: '#16a34a',
      black_wool: '#1e293b',
      pink_wool: '#f472b6',
      purple_wool: '#9333ea',
    };
    ctx.fillStyle = woolColors[itemId] || '#f8fafc';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(4, 15, 24, 2);
    ctx.fillRect(15, 4, 2, 24);
  } else if (itemId.includes('concrete')) {
    const concreteColors: Record<string, string> = {
      white_concrete: '#ffffff',
      red_concrete: '#b91c1c',
      blue_concrete: '#1d4ed8',
      yellow_concrete: '#ca8a04',
      green_concrete: '#15803d',
      black_concrete: '#0f172a',
    };
    ctx.fillStyle = concreteColors[itemId] || '#ffffff';
    ctx.fillRect(4, 4, 24, 24);
  } else if (itemId === 'amethyst_block') {
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#e9d5ff';
    ctx.fillRect(8, 8, 8, 8);
  } else if (itemId === 'copper_block') {
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#fdba74';
    ctx.fillRect(4, 4, 24, 3);
    ctx.fillRect(4, 4, 3, 24);
  } else if (itemId === 'coal_block') {
    ctx.fillStyle = '#171717';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#404040';
    ctx.fillRect(6, 6, 6, 6);
  } else if (itemId === 'redstone_block') {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#fca5a5';
    ctx.fillRect(6, 6, 4, 4);
    ctx.fillRect(16, 16, 4, 4);
  } else if (itemId === 'slime_block') {
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#bef264';
    ctx.fillRect(4, 4, 24, 3);
    ctx.fillRect(4, 4, 3, 24);
  } else if (itemId === 'honey_block') {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(6, 6, 6, 6);
  } else if (itemId === 'purpur_block') {
    ctx.fillStyle = '#a21caf';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#f0abfc';
    ctx.fillRect(8, 8, 16, 16);
  } else if (itemId === 'end_stone') {
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(8, 10, 4, 4);
  } else if (itemId === 'crying_obsidian') {
    ctx.fillStyle = '#18181b';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = '#c026d3';
    ctx.fillRect(8, 6, 4, 8);
    ctx.fillRect(16, 14, 4, 8);
  } else if (itemId === 'lantern') {
    ctx.fillStyle = '#475569';
    ctx.fillRect(8, 6, 16, 20);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(10, 10, 12, 12);
  } else if (itemId.includes('planks')) {
    const woodColors: Record<string, string> = {
      jungle_planks: '#b45309',
      acacia_planks: '#ea580c',
      dark_oak_planks: '#451a03',
      oak_planks: '#d97706',
    };
    ctx.fillStyle = woodColors[itemId] || '#d97706';
    ctx.fillRect(4, 4, 24, 24);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(4, 11, 24, 2);
    ctx.fillRect(4, 19, 24, 2);
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
