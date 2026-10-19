/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  BEDROCK = 5,
  OAK_LOG = 6,
  OAK_LEAVES = 7,
  OAK_PLANKS = 8,
  SAND = 9,
  GRAVEL = 10,
  GLASS = 11,
  WATER = 12,
  COAL_ORE = 13,
  IRON_ORE = 14,
  GOLD_ORE = 15,
  DIAMOND_ORE = 16,
  REDSTONE_ORE = 17,
  CRAFTING_TABLE = 18,
  FURNACE = 19,
  CHEST = 20,
  TNT = 21,
  TORCH = 22,
  BRICKS = 23,
  BOOKSHELF = 24,
  OBSIDIAN = 25,
  NETHERRACK = 26,
  CACTUS = 27,
  POPPY = 28,
  DANDELION = 29,
  SNOW = 30,
}

export type ItemId =
  | 'grass'
  | 'dirt'
  | 'stone'
  | 'cobblestone'
  | 'bedrock'
  | 'oak_log'
  | 'oak_leaves'
  | 'oak_planks'
  | 'sand'
  | 'gravel'
  | 'glass'
  | 'water'
  | 'coal_ore'
  | 'iron_ore'
  | 'gold_ore'
  | 'diamond_ore'
  | 'redstone_ore'
  | 'crafting_table'
  | 'furnace'
  | 'chest'
  | 'tnt'
  | 'torch'
  | 'bricks'
  | 'bookshelf'
  | 'obsidian'
  | 'netherrack'
  | 'cactus'
  | 'poppy'
  | 'dandelion'
  | 'snow'
  // Tools
  | 'wooden_pickaxe'
  | 'stone_pickaxe'
  | 'iron_pickaxe'
  | 'diamond_pickaxe'
  | 'wooden_axe'
  | 'stone_axe'
  | 'iron_axe'
  | 'diamond_axe'
  | 'wooden_sword'
  | 'stone_sword'
  | 'iron_sword'
  | 'diamond_sword'
  | 'wooden_shovel'
  | 'stone_shovel'
  | 'iron_shovel'
  | 'diamond_shovel'
  // Materials & Food
  | 'stick'
  | 'coal'
  | 'iron_ingot'
  | 'gold_ingot'
  | 'diamond'
  | 'redstone'
  | 'apple'
  | 'raw_porkchop'
  | 'cooked_porkchop'
  | 'raw_beef'
  | 'cooked_beef'
  | 'bread'
  | 'wheat'
  | 'string'
  | 'feather'
  | 'gunpowder'
  | 'rotten_flesh'
  | 'bone';

export interface ItemStack {
  id: ItemId;
  count: number;
  durability?: number;
  maxDurability?: number;
}

export interface BlockDefinition {
  type: BlockType;
  id: ItemId;
  name: string;
  isTransparent?: boolean;
  isSolid?: boolean;
  isFluid?: boolean;
  hardness: number; // break time in seconds by bare hand
  requiredToolType?: 'pickaxe' | 'axe' | 'shovel' | 'sword';
  drops: { id: ItemId; count: number; chance?: number }[];
  lightEmission?: number;
}

export type GameMode = 'survival' | 'creative';

export interface PlayerStats {
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  saturation: number;
  oxygen: number;
  maxOxygen: number;
  experience: number;
  level: number;
  armor: number;
}

export interface MobEntity {
  id: string;
  type: 'zombie' | 'skeleton' | 'creeper' | 'pig' | 'cow' | 'sheep';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  health: number;
  maxHealth: number;
  hurtCooldown: number;
  attackCooldown: number;
  isGrounded: boolean;
  fuse?: number; // for creeper
  burning?: number; // daylight burn for zombies
}

export interface DroppedItemEntity {
  id: string;
  item: ItemStack;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotation: number;
  spawnTime: number;
  isGrounded: boolean;
}

export interface ParticleEffect {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface FurnaceState {
  x: number;
  y: number;
  z: number;
  input: ItemStack | null;
  fuel: ItemStack | null;
  output: ItemStack | null;
  burnTime: number;
  maxBurnTime: number;
  cookTime: number;
  maxCookTime: number;
}

export interface ChestState {
  x: number;
  y: number;
  z: number;
  slots: (ItemStack | null)[]; // 27 slots
}

export type VehicleType = 'car' | 'bike' | 'boat';

export interface VehicleEntity {
  id: string;
  type: VehicleType;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  speed: number;
  steering: number;
  isMounted: boolean;
}

