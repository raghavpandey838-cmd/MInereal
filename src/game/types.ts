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
  BIRCH_PLANKS = 31,
  SPRUCE_PLANKS = 32,
  STONE_BRICKS = 33,
  MOSSY_COBBLESTONE = 34,
  SMOOTH_STONE = 35,
  SANDSTONE = 36,
  QUARTZ_BLOCK = 37,
  NETHER_BRICKS = 38,
  GLOWSTONE = 39,
  SEA_LANTERN = 40,
  REDSTONE_LAMP = 41,
  HAY_BALE = 42,
  GOLD_BLOCK = 43,
  DIAMOND_BLOCK = 44,
  EMERALD_BLOCK = 45,
  IRON_BLOCK = 46,
  LAPIS_BLOCK = 47,
  PUMPKIN = 48,
  MELON = 49,
  TERRACOTTA_ORANGE = 50,
  TERRACOTTA_CYAN = 51,
  ICE = 52,
  LAVA = 53,
  BIRCH_LOG = 54,
  // Extensive Real Minecraft Blocks
  JUNGLE_PLANKS = 55,
  ACACIA_PLANKS = 56,
  DARK_OAK_PLANKS = 57,
  CRACKED_STONE_BRICKS = 58,
  RED_SANDSTONE = 59,
  PURPUR_BLOCK = 60,
  END_STONE = 61,
  AMETHYST_BLOCK = 62,
  COPPER_BLOCK = 63,
  COAL_BLOCK = 64,
  REDSTONE_BLOCK = 65,
  SLIME_BLOCK = 66,
  HONEY_BLOCK = 67,
  WHITE_WOOL = 68,
  RED_WOOL = 69,
  BLUE_WOOL = 70,
  YELLOW_WOOL = 71,
  GREEN_WOOL = 72,
  BLACK_WOOL = 73,
  PINK_WOOL = 74,
  PURPLE_WOOL = 75,
  WHITE_CONCRETE = 76,
  RED_CONCRETE = 77,
  BLUE_CONCRETE = 78,
  YELLOW_CONCRETE = 79,
  GREEN_CONCRETE = 80,
  BLACK_CONCRETE = 81,
  STAINED_GLASS_CYAN = 82,
  STAINED_GLASS_RED = 83,
  STAINED_GLASS_WHITE = 84,
  PODZOL = 85,
  MYCELIUM = 86,
  SOUL_SAND = 87,
  BASALT = 88,
  CRYING_OBSIDIAN = 89,
  SPRUCE_LOG = 90,
  JUNGLE_LOG = 91,
  BIRCH_LEAVES = 92,
  SPRUCE_LEAVES = 93,
  JUNGLE_LEAVES = 94,
  LANTERN = 95,
  RED_MUSHROOM = 96,
  BROWN_MUSHROOM = 97,
  BLUE_ORCHID = 98,
  TERRACOTTA_RED = 99,
  TERRACOTTA_WHITE = 100,
  RED_SAND = 101,
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
  // Real Minecraft Placeable Blocks
  | 'birch_planks'
  | 'spruce_planks'
  | 'stone_bricks'
  | 'mossy_cobblestone'
  | 'smooth_stone'
  | 'sandstone'
  | 'quartz_block'
  | 'nether_bricks'
  | 'glowstone'
  | 'sea_lantern'
  | 'redstone_lamp'
  | 'hay_bale'
  | 'gold_block'
  | 'diamond_block'
  | 'emerald_block'
  | 'iron_block'
  | 'lapis_block'
  | 'pumpkin'
  | 'melon'
  | 'terracotta_orange'
  | 'terracotta_cyan'
  | 'ice'
  | 'lava'
  | 'birch_log'
  // Extended Blocks
  | 'jungle_planks'
  | 'acacia_planks'
  | 'dark_oak_planks'
  | 'cracked_stone_bricks'
  | 'red_sandstone'
  | 'purpur_block'
  | 'end_stone'
  | 'amethyst_block'
  | 'copper_block'
  | 'coal_block'
  | 'redstone_block'
  | 'slime_block'
  | 'honey_block'
  | 'white_wool'
  | 'red_wool'
  | 'blue_wool'
  | 'yellow_wool'
  | 'green_wool'
  | 'black_wool'
  | 'pink_wool'
  | 'purple_wool'
  | 'white_concrete'
  | 'red_concrete'
  | 'blue_concrete'
  | 'yellow_concrete'
  | 'green_concrete'
  | 'black_concrete'
  | 'stained_glass_cyan'
  | 'stained_glass_red'
  | 'stained_glass_white'
  | 'podzol'
  | 'mycelium'
  | 'soul_sand'
  | 'basalt'
  | 'crying_obsidian'
  | 'spruce_log'
  | 'jungle_log'
  | 'birch_leaves'
  | 'spruce_leaves'
  | 'jungle_leaves'
  | 'lantern'
  | 'red_mushroom'
  | 'brown_mushroom'
  | 'blue_orchid'
  | 'terracotta_red'
  | 'terracotta_white'
  | 'red_sand'
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

