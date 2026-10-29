/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ItemId, ItemStack } from './types';

export interface CraftingRecipe {
  name: string;
  gridSize: 2 | 3;
  pattern: (ItemId | null)[]; // 4 elements for 2x2, 9 elements for 3x3
  result: ItemStack;
}

export interface SmeltingRecipe {
  input: ItemId;
  output: ItemId;
  cookTime: number; // in seconds
}

export const SMELTING_RECIPES: SmeltingRecipe[] = [
  { input: 'iron_ore', output: 'iron_ingot', cookTime: 8 },
  { input: 'gold_ore', output: 'gold_ingot', cookTime: 8 },
  { input: 'sand', output: 'glass', cookTime: 6 },
  { input: 'cobblestone', output: 'stone', cookTime: 6 },
  { input: 'raw_porkchop', output: 'cooked_porkchop', cookTime: 6 },
  { input: 'raw_beef', output: 'cooked_beef', cookTime: 6 },
  { input: 'raw_chicken', output: 'cooked_chicken', cookTime: 6 },
];

export const FUEL_VALUES: Partial<Record<ItemId, number>> = {
  coal: 80, // cooks 10 items
  oak_log: 15,
  oak_planks: 15,
  stick: 5,
  crafting_table: 15,
  chest: 15,
};

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // 1 Log -> 4 Planks (Shapeless 1 slot)
  {
    name: 'Oak Planks',
    gridSize: 2,
    pattern: ['oak_log', null, null, null],
    result: { id: 'oak_planks', count: 4 },
  },
  // 2 Planks -> 4 Sticks
  {
    name: 'Sticks',
    gridSize: 2,
    pattern: ['oak_planks', null, 'oak_planks', null],
    result: { id: 'stick', count: 4 },
  },
  // 4 Planks -> Crafting Table
  {
    name: 'Crafting Table',
    gridSize: 2,
    pattern: ['oak_planks', 'oak_planks', 'oak_planks', 'oak_planks'],
    result: { id: 'crafting_table', count: 1 },
  },
  // 1 Coal + 1 Stick -> 4 Torches
  {
    name: 'Torches',
    gridSize: 2,
    pattern: ['coal', null, 'stick', null],
    result: { id: 'torch', count: 4 },
  },
  // 3x3 Recipes:
  // Wooden Pickaxe
  {
    name: 'Wooden Pickaxe',
    gridSize: 3,
    pattern: [
      'oak_planks', 'oak_planks', 'oak_planks',
      null, 'stick', null,
      null, 'stick', null,
    ],
    result: { id: 'wooden_pickaxe', count: 1, durability: 60, maxDurability: 60 },
  },
  // Stone Pickaxe
  {
    name: 'Stone Pickaxe',
    gridSize: 3,
    pattern: [
      'cobblestone', 'cobblestone', 'cobblestone',
      null, 'stick', null,
      null, 'stick', null,
    ],
    result: { id: 'stone_pickaxe', count: 1, durability: 132, maxDurability: 132 },
  },
  // Iron Pickaxe
  {
    name: 'Iron Pickaxe',
    gridSize: 3,
    pattern: [
      'iron_ingot', 'iron_ingot', 'iron_ingot',
      null, 'stick', null,
      null, 'stick', null,
    ],
    result: { id: 'iron_pickaxe', count: 1, durability: 251, maxDurability: 251 },
  },
  // Diamond Pickaxe
  {
    name: 'Diamond Pickaxe',
    gridSize: 3,
    pattern: [
      'diamond', 'diamond', 'diamond',
      null, 'stick', null,
      null, 'stick', null,
    ],
    result: { id: 'diamond_pickaxe', count: 1, durability: 1562, maxDurability: 1562 },
  },
  // Wooden Sword
  {
    name: 'Wooden Sword',
    gridSize: 3,
    pattern: [
      null, 'oak_planks', null,
      null, 'oak_planks', null,
      null, 'stick', null,
    ],
    result: { id: 'wooden_sword', count: 1, durability: 60, maxDurability: 60 },
  },
  // Stone Sword
  {
    name: 'Stone Sword',
    gridSize: 3,
    pattern: [
      null, 'cobblestone', null,
      null, 'cobblestone', null,
      null, 'stick', null,
    ],
    result: { id: 'stone_sword', count: 1, durability: 132, maxDurability: 132 },
  },
  // Iron Sword
  {
    name: 'Iron Sword',
    gridSize: 3,
    pattern: [
      null, 'iron_ingot', null,
      null, 'iron_ingot', null,
      null, 'stick', null,
    ],
    result: { id: 'iron_sword', count: 1, durability: 251, maxDurability: 251 },
  },
  // Diamond Sword
  {
    name: 'Diamond Sword',
    gridSize: 3,
    pattern: [
      null, 'diamond', null,
      null, 'diamond', null,
      null, 'stick', null,
    ],
    result: { id: 'diamond_sword', count: 1, durability: 1562, maxDurability: 1562 },
  },
  // Wooden Axe
  {
    name: 'Wooden Axe',
    gridSize: 3,
    pattern: [
      'oak_planks', 'oak_planks', null,
      'oak_planks', 'stick', null,
      null, 'stick', null,
    ],
    result: { id: 'wooden_axe', count: 1, durability: 60, maxDurability: 60 },
  },
  // Iron Axe
  {
    name: 'Iron Axe',
    gridSize: 3,
    pattern: [
      'iron_ingot', 'iron_ingot', null,
      'iron_ingot', 'stick', null,
      null, 'stick', null,
    ],
    result: { id: 'iron_axe', count: 1, durability: 251, maxDurability: 251 },
  },
  // Diamond Axe
  {
    name: 'Diamond Axe',
    gridSize: 3,
    pattern: [
      'diamond', 'diamond', null,
      'diamond', 'stick', null,
      null, 'stick', null,
    ],
    result: { id: 'diamond_axe', count: 1, durability: 1562, maxDurability: 1562 },
  },
  // Shovel
  {
    name: 'Iron Shovel',
    gridSize: 3,
    pattern: [
      null, 'iron_ingot', null,
      null, 'stick', null,
      null, 'stick', null,
    ],
    result: { id: 'iron_shovel', count: 1, durability: 251, maxDurability: 251 },
  },
  // Furnace (8 Cobblestone ring)
  {
    name: 'Furnace',
    gridSize: 3,
    pattern: [
      'cobblestone', 'cobblestone', 'cobblestone',
      'cobblestone', null, 'cobblestone',
      'cobblestone', 'cobblestone', 'cobblestone',
    ],
    result: { id: 'furnace', count: 1 },
  },
  // Chest (8 Planks ring)
  {
    name: 'Chest',
    gridSize: 3,
    pattern: [
      'oak_planks', 'oak_planks', 'oak_planks',
      'oak_planks', null, 'oak_planks',
      'oak_planks', 'oak_planks', 'oak_planks',
    ],
    result: { id: 'chest', count: 1 },
  },
  // TNT (4 Sand + 5 Gunpowder)
  {
    name: 'TNT',
    gridSize: 3,
    pattern: [
      'gunpowder', 'sand', 'gunpowder',
      'sand', 'gunpowder', 'sand',
      'gunpowder', 'sand', 'gunpowder',
    ],
    result: { id: 'tnt', count: 1 },
  },
  // Bread (3 Wheat)
  {
    name: 'Bread',
    gridSize: 3,
    pattern: [
      null, null, null,
      'wheat', 'wheat', 'wheat',
      null, null, null,
    ],
    result: { id: 'bread', count: 1 },
  },
];

export function findMatchingRecipe(grid: (ItemStack | null)[], size: 2 | 3): ItemStack | null {
  const itemGrid = grid.map((slot) => (slot ? slot.id : null));

  for (const recipe of CRAFTING_RECIPES) {
    if (recipe.gridSize === size) {
      const match = recipe.pattern.every((expectedId, idx) => {
        return expectedId === itemGrid[idx];
      });
      if (match) {
        return { ...recipe.result };
      }
    }
  }

  // Also support 2x2 recipes inside 3x3 table top-left
  if (size === 3) {
    for (const recipe of CRAFTING_RECIPES) {
      if (recipe.gridSize === 2) {
        // top-left quadrant check
        const match =
          recipe.pattern[0] === itemGrid[0] &&
          recipe.pattern[1] === itemGrid[1] &&
          recipe.pattern[2] === itemGrid[3] &&
          recipe.pattern[3] === itemGrid[4] &&
          itemGrid[2] === null &&
          itemGrid[5] === null &&
          itemGrid[6] === null &&
          itemGrid[7] === null &&
          itemGrid[8] === null;

        if (match) {
          return { ...recipe.result };
        }
      }
    }
  }

  return null;
}
