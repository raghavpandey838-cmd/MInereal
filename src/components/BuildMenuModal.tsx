/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ItemId } from '../game/types';
import { getItemIcon } from '../game/textures';
import { STRUCTURES, StructureTemplate } from '../game/blueprints';
import { sounds } from '../game/audio';

export type CreativeToolType =
  | 'wall3x3'
  | 'floor5x5'
  | 'column4'
  | 'sphereDome'
  | 'highway'
  | 'demolish'
  | 'tntCluster';

interface BuildMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStructure: (template: StructureTemplate) => void;
  onSelectTool: (toolType: CreativeToolType) => void;
  onSelectCreativeItem: (itemId: ItemId) => void;
  onSpawnDriveableVehicle: (type: 'car' | 'bike' | 'boat') => void;
  onSpawnMob: (type: 'pig' | 'cow' | 'sheep' | 'zombie' | 'skeleton' | 'creeper') => void;
  canUndo: boolean;
  onUndo: () => void;
}

const CREATIVE_CATEGORIES: {
  name: string;
  items: { id: ItemId; name: string }[];
}[] = [
  {
    name: 'Building & Architecture',
    items: [
      { id: 'stone_bricks', name: 'Stone Bricks' },
      { id: 'cracked_stone_bricks', name: 'Cracked Stone Bricks' },
      { id: 'mossy_cobblestone', name: 'Mossy Cobblestone' },
      { id: 'smooth_stone', name: 'Smooth Stone' },
      { id: 'quartz_block', name: 'Block of Quartz' },
      { id: 'sandstone', name: 'Sandstone' },
      { id: 'red_sandstone', name: 'Red Sandstone' },
      { id: 'bricks', name: 'Red Bricks' },
      { id: 'cobblestone', name: 'Cobblestone' },
      { id: 'stone', name: 'Stone' },
      { id: 'glass', name: 'Clear Glass' },
      { id: 'stained_glass_cyan', name: 'Cyan Stained Glass' },
      { id: 'stained_glass_red', name: 'Red Stained Glass' },
      { id: 'stained_glass_white', name: 'White Stained Glass' },
      { id: 'bookshelf', name: 'Bookshelf' },
      { id: 'obsidian', name: 'Obsidian' },
      { id: 'bedrock', name: 'Bedrock' },
    ],
  },
  {
    name: 'Planks & Wood Craft',
    items: [
      { id: 'oak_planks', name: 'Oak Planks' },
      { id: 'birch_planks', name: 'Birch Planks' },
      { id: 'spruce_planks', name: 'Spruce Planks' },
      { id: 'jungle_planks', name: 'Jungle Planks' },
      { id: 'acacia_planks', name: 'Acacia Planks' },
      { id: 'dark_oak_planks', name: 'Dark Oak Planks' },
      { id: 'oak_log', name: 'Oak Log' },
      { id: 'birch_log', name: 'Birch Log' },
      { id: 'spruce_log', name: 'Spruce Log' },
      { id: 'jungle_log', name: 'Jungle Log' },
      { id: 'oak_leaves', name: 'Oak Leaves' },
      { id: 'birch_leaves', name: 'Birch Leaves' },
      { id: 'spruce_leaves', name: 'Spruce Leaves' },
      { id: 'jungle_leaves', name: 'Jungle Leaves' },
    ],
  },
  {
    name: 'Wool & Colored Fabric',
    items: [
      { id: 'white_wool', name: 'White Wool' },
      { id: 'red_wool', name: 'Red Wool' },
      { id: 'blue_wool', name: 'Blue Wool' },
      { id: 'yellow_wool', name: 'Yellow Wool' },
      { id: 'green_wool', name: 'Green Wool' },
      { id: 'black_wool', name: 'Black Wool' },
      { id: 'pink_wool', name: 'Pink Wool' },
      { id: 'purple_wool', name: 'Purple Wool' },
    ],
  },
  {
    name: 'Concrete & Terracotta',
    items: [
      { id: 'white_concrete', name: 'White Concrete' },
      { id: 'red_concrete', name: 'Red Concrete' },
      { id: 'blue_concrete', name: 'Blue Concrete' },
      { id: 'yellow_concrete', name: 'Yellow Concrete' },
      { id: 'green_concrete', name: 'Green Concrete' },
      { id: 'black_concrete', name: 'Black Concrete' },
      { id: 'terracotta_orange', name: 'Orange Terracotta' },
      { id: 'terracotta_cyan', name: 'Cyan Terracotta' },
      { id: 'terracotta_red', name: 'Red Terracotta' },
      { id: 'terracotta_white', name: 'White Terracotta' },
    ],
  },
  {
    name: 'Precious Metals & Gems',
    items: [
      { id: 'diamond_block', name: 'Block of Diamond' },
      { id: 'emerald_block', name: 'Block of Emerald' },
      { id: 'gold_block', name: 'Block of Gold' },
      { id: 'iron_block', name: 'Block of Iron' },
      { id: 'amethyst_block', name: 'Block of Amethyst' },
      { id: 'copper_block', name: 'Block of Copper' },
      { id: 'lapis_block', name: 'Lapis Lazuli Block' },
      { id: 'redstone_block', name: 'Block of Redstone' },
      { id: 'coal_block', name: 'Block of Coal' },
      { id: 'slime_block', name: 'Bouncy Slime Block' },
      { id: 'honey_block', name: 'Honey Block' },
      { id: 'diamond_ore', name: 'Diamond Ore' },
      { id: 'gold_ore', name: 'Gold Ore' },
      { id: 'iron_ore', name: 'Iron Ore' },
      { id: 'coal_ore', name: 'Coal Ore' },
      { id: 'redstone_ore', name: 'Redstone Ore' },
    ],
  },
  {
    name: 'Lighting & Functional',
    items: [
      { id: 'lantern', name: 'Hanging Lantern' },
      { id: 'glowstone', name: 'Glowstone' },
      { id: 'sea_lantern', name: 'Sea Lantern' },
      { id: 'redstone_lamp', name: 'Redstone Lamp' },
      { id: 'torch', name: 'Torch' },
      { id: 'tnt', name: 'TNT Explosive' },
      { id: 'crafting_table', name: 'Crafting Table' },
      { id: 'furnace', name: 'Furnace' },
      { id: 'chest', name: 'Chest' },
      { id: 'hay_bale', name: 'Hay Bale' },
      { id: 'redstone', name: 'Redstone Dust' },
    ],
  },
  {
    name: 'Nether & The End',
    items: [
      { id: 'purpur_block', name: 'Purpur Block' },
      { id: 'end_stone', name: 'End Stone' },
      { id: 'crying_obsidian', name: 'Crying Obsidian' },
      { id: 'netherrack', name: 'Netherrack' },
      { id: 'nether_bricks', name: 'Nether Bricks' },
      { id: 'soul_sand', name: 'Soul Sand' },
      { id: 'basalt', name: 'Basalt Pillar' },
      { id: 'lava', name: 'Molten Lava' },
    ],
  },
  {
    name: 'Nature & Foliage',
    items: [
      { id: 'pumpkin', name: 'Carved Pumpkin' },
      { id: 'melon', name: 'Melon Block' },
      { id: 'grass', name: 'Grass Block' },
      { id: 'podzol', name: 'Podzol Soil' },
      { id: 'mycelium', name: 'Mycelium Grass' },
      { id: 'dirt', name: 'Dirt' },
      { id: 'sand', name: 'Sand' },
      { id: 'red_sand', name: 'Red Sand' },
      { id: 'gravel', name: 'Gravel' },
      { id: 'snow', name: 'Snow Block' },
      { id: 'ice', name: 'Ice Block' },
      { id: 'cactus', name: 'Cactus' },
      { id: 'poppy', name: 'Poppy Flower' },
      { id: 'dandelion', name: 'Dandelion' },
      { id: 'blue_orchid', name: 'Blue Orchid' },
      { id: 'red_mushroom', name: 'Red Mushroom' },
      { id: 'brown_mushroom', name: 'Brown Mushroom' },
      { id: 'water', name: 'Water Spring' },
    ],
  },
  {
    name: 'Tools & Weapons',
    items: [
      { id: 'diamond_pickaxe', name: 'Diamond Pickaxe' },
      { id: 'diamond_sword', name: 'Diamond Sword' },
      { id: 'diamond_axe', name: 'Diamond Axe' },
      { id: 'diamond_shovel', name: 'Diamond Shovel' },
      { id: 'iron_pickaxe', name: 'Iron Pickaxe' },
      { id: 'iron_sword', name: 'Iron Sword' },
      { id: 'apple', name: 'Red Apple' },
      { id: 'bread', name: 'Fresh Bread' },
      { id: 'cooked_porkchop', name: 'Cooked Porkchop' },
      { id: 'cooked_beef', name: 'Cooked Steak' },
    ],
  },
];

const MOBS_DATA: {
  type: 'pig' | 'cow' | 'sheep' | 'zombie' | 'skeleton' | 'creeper';
  name: string;
  desc: string;
  icon: string;
}[] = [
  { type: 'pig', name: 'Friendly Pig', desc: 'Pink farm animal that wanders and oinks happily.', icon: '🐷' },
  { type: 'cow', name: 'Dairy Cow', desc: 'Classic black and white cow grazing on grass.', icon: '🐮' },
  { type: 'sheep', name: 'Fluffy Sheep', desc: 'White wool sheep roaming the green fields.', icon: '🐑' },
  { type: 'zombie', name: 'Night Zombie', desc: 'Undead mob roaming around. (Harmless in Creative!)', icon: '🧟' },
  { type: 'skeleton', name: 'Skeleton Archer', desc: 'Ancient bone warrior.', icon: '💀' },
  { type: 'creeper', name: 'Voxel Creeper', desc: 'Iconic green creature with ticking fuse.', icon: '💥' },
];

export const BuildMenuModal: React.FC<BuildMenuModalProps> = ({
  isOpen,
  onClose,
  onSelectStructure,
  onSelectTool,
  onSelectCreativeItem,
  onSpawnDriveableVehicle,
  onSpawnMob,
  canUndo,
  onUndo,
}) => {
  const [activeTab, setActiveTab] = useState<'blueprints' | 'vehicles' | 'multitools' | 'mobs' | 'creative_palette'>('blueprints');
  const [activeCatIndex, setActiveCatIndex] = useState<number>(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center pointer-events-auto select-none p-3">
      <div className="mc-panel p-5 rounded text-[#222] w-[680px] max-w-[96vw] relative flex flex-col max-h-[88vh] shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 border-b-2 border-[#888] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚒️</span>
            <div>
              <h2 className="font-bold text-lg text-[#111] leading-tight flex items-center gap-2">
                Creative Master Builder Studio
                <span className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded font-mono font-bold">
                  CREATIVE ONLY
                </span>
              </h2>
              <span className="text-[11px] text-[#555]">
                Instant Blueprints, Driveable Vehicles, WorldEdit Supertools, Mob Spawner & Infinite Palette
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="w-8 h-8 bg-[#a53b3b] text-white border-2 border-[#551111] hover:bg-[#c24646] font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Top Navigation Tabs & Undo */}
        <div className="flex justify-between items-center mb-3 gap-1 overflow-x-auto pb-1">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => {
                sounds.playPop();
                setActiveTab('blueprints');
              }}
              className={`px-3 py-1.5 text-xs font-bold cursor-pointer rounded-xs transition-colors whitespace-nowrap ${
                activeTab === 'blueprints'
                  ? 'bg-[#3b6ea5] text-white border-2 border-[#1c3a5e]'
                  : 'mc-btn'
              }`}
            >
              🏛️ Blueprints ({STRUCTURES.length})
            </button>
            <button
              onClick={() => {
                sounds.playPop();
                setActiveTab('vehicles');
              }}
              className={`px-3 py-1.5 text-xs font-bold cursor-pointer rounded-xs transition-colors whitespace-nowrap ${
                activeTab === 'vehicles'
                  ? 'bg-[#eab308] text-black border-2 border-[#854d0e]'
                  : 'mc-btn'
              }`}
            >
              🚗 Drive Vehicles
            </button>
            <button
              onClick={() => {
                sounds.playPop();
                setActiveTab('multitools');
              }}
              className={`px-3 py-1.5 text-xs font-bold cursor-pointer rounded-xs transition-colors whitespace-nowrap ${
                activeTab === 'multitools'
                  ? 'bg-[#8b5cf6] text-white border-2 border-[#5b21b6]'
                  : 'mc-btn'
              }`}
            >
              🔮 Super Tools
            </button>
            <button
              onClick={() => {
                sounds.playPop();
                setActiveTab('mobs');
              }}
              className={`px-3 py-1.5 text-xs font-bold cursor-pointer rounded-xs transition-colors whitespace-nowrap ${
                activeTab === 'mobs'
                  ? 'bg-[#10b981] text-white border-2 border-[#047857]'
                  : 'mc-btn'
              }`}
            >
              🐮 Spawn Mobs
            </button>
            <button
              onClick={() => {
                sounds.playPop();
                setActiveTab('creative_palette');
              }}
              className={`px-3 py-1.5 text-xs font-bold cursor-pointer rounded-xs transition-colors whitespace-nowrap ${
                activeTab === 'creative_palette'
                  ? 'bg-[#3b6ea5] text-white border-2 border-[#1c3a5e]'
                  : 'mc-btn'
              }`}
            >
              📦 Infinite Blocks
            </button>
          </div>

          {/* Undo Action Button */}
          <button
            onClick={() => {
              sounds.playPop();
              onUndo();
            }}
            disabled={!canUndo}
            className="mc-btn px-2.5 py-1 text-xs font-bold flex items-center gap-1 disabled:opacity-40 whitespace-nowrap shrink-0"
            title="Undo last placed structure or multi-block (Key: Z)"
          >
            <span>↩</span> Undo [Z]
          </button>
        </div>

        {/* TAB 1: BLUEPRINTS & HOUSES */}
        {activeTab === 'blueprints' && (
          <div className="overflow-y-auto pr-1 flex-1 space-y-2.5">
            <div className="bg-[#b0b0b0] p-2 rounded text-xs text-[#222] border border-[#888]">
              💡 <strong>Instant 1-Click Construction:</strong> Choose any structure below to generate it instantly in front of you! Includes castle fortresses, luxury glass villas, shrines, sky islands & ships.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {STRUCTURES.map((struct) => (
                <div
                  key={struct.id}
                  className="bg-[#c2c2c2] border-2 border-[#888] hover:border-[#3b6ea5] p-3 rounded flex flex-col justify-between transition-all shadow-xs"
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <span className="text-3xl p-1 bg-white/60 rounded border border-[#999] shrink-0">
                      {struct.icon}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-[#111]">{struct.name}</h3>
                      <p className="text-[11px] text-[#444] leading-snug mt-0.5">
                        {struct.description}
                      </p>
                      <div className="text-[10px] text-[#666] mt-1 font-mono">
                        Size: {struct.width}W × {struct.height}H × {struct.depth}D
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectStructure(struct);
                      onClose();
                    }}
                    className="mc-btn w-full py-1.5 font-bold text-xs cursor-pointer hover:bg-[#85c276] text-white"
                  >
                    Build Structure Here ➔
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DRIVEABLE VEHICLES */}
        {activeTab === 'vehicles' && (
          <div className="overflow-y-auto pr-1 flex-1 space-y-3">
            <div className="bg-[#fff9db] border-2 border-[#eab308] p-2.5 rounded text-xs text-[#854d0e]">
              🚀 <strong>Driveable Vehicles:</strong> Spawn functional vehicles right at your location! Walk up to them and press <strong>[E]</strong> or click <strong>Drive</strong> to mount. Steer using <strong>WASD</strong> keys!
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Rowboat */}
              <div className="bg-[#c2c2c2] border-2 border-[#888] hover:border-cyan-600 p-3 rounded flex flex-col items-center text-center">
                <span className="text-4xl mb-1">🚣</span>
                <h3 className="font-bold text-sm mb-1 text-[#111]">Water Rowboat</h3>
                <p className="text-[11px] text-[#555] mb-3 flex-1">
                  Floats on water. Glides rapidly across rivers and oceans with animated oars & water ripples.
                </p>
                <button
                  onClick={() => {
                    onSpawnDriveableVehicle('boat');
                    onClose();
                  }}
                  className="mc-btn w-full py-2 text-xs font-bold text-cyan-100 hover:text-white"
                >
                  Spawn Boat in Water
                </button>
              </div>

              {/* Offroader Car */}
              <div className="bg-[#c2c2c2] border-2 border-[#888] hover:border-red-600 p-3 rounded flex flex-col items-center text-center">
                <span className="text-4xl mb-1">🏎️</span>
                <h3 className="font-bold text-sm mb-1 text-[#111]">Offroader Car</h3>
                <p className="text-[11px] text-[#555] mb-3 flex-1">
                  Fast 4-wheel drive voxel car with spinning wheels, headlights & responsive steering across land.
                </p>
                <button
                  onClick={() => {
                    onSpawnDriveableVehicle('car');
                    onClose();
                  }}
                  className="mc-btn w-full py-2 text-xs font-bold text-yellow-100 hover:text-white"
                >
                  Spawn Offroader Car
                </button>
              </div>

              {/* Dirt Bike */}
              <div className="bg-[#c2c2c2] border-2 border-[#888] hover:border-blue-600 p-3 rounded flex flex-col items-center text-center">
                <span className="text-4xl mb-1">🏍️</span>
                <h3 className="font-bold text-sm mb-1 text-[#111]">Motorcycle / Bike</h3>
                <p className="text-[11px] text-[#555] mb-3 flex-1">
                  Agile dual-wheel motorcycle with high acceleration, banking roll tilts into turns & speed boost!
                </p>
                <button
                  onClick={() => {
                    onSpawnDriveableVehicle('bike');
                    onClose();
                  }}
                  className="mc-btn w-full py-2 text-xs font-bold text-blue-100 hover:text-white"
                >
                  Spawn Motorcycle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CREATIVE SUPER TOOLS & WORLDEDIT */}
        {activeTab === 'multitools' && (
          <div className="overflow-y-auto pr-1 flex-1 space-y-3">
            <div className="bg-[#f3e8ff] border-2 border-[#9333ea] p-2.5 rounded text-xs text-[#581c87]">
              🔮 <strong>Creative WorldEdit Supertools:</strong> Advanced instant terraforming powers! Generate glass biodomes, 12-block paved highways, demolish terrain, or lay down multi-block platforms.
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Glass Dome */}
              <div className="bg-[#c2c2c2] border-2 border-[#888] p-2.5 rounded flex flex-col items-center text-center">
                <span className="text-3xl mb-1">🔮</span>
                <h3 className="font-bold text-xs mb-1">Glass Biodome</h3>
                <p className="text-[10px] text-[#555] mb-2 flex-1">
                  Generates an expansive 7x7 spherical glass greenhouse dome.
                </p>
                <button
                  onClick={() => {
                    onSelectTool('sphereDome');
                    onClose();
                  }}
                  className="mc-btn w-full py-1 text-xs font-bold text-purple-200"
                >
                  Create Dome
                </button>
              </div>

              {/* Highway Road */}
              <div className="bg-[#c2c2c2] border-2 border-[#888] p-2.5 rounded flex flex-col items-center text-center">
                <span className="text-3xl mb-1">🛣️</span>
                <h3 className="font-bold text-xs mb-1">Highway Road</h3>
                <p className="text-[10px] text-[#555] mb-2 flex-1">
                  Lays a 3-wide smooth stone roadway stretching 12 blocks ahead.
                </p>
                <button
                  onClick={() => {
                    onSelectTool('highway');
                    onClose();
                  }}
                  className="mc-btn w-full py-1 text-xs font-bold"
                >
                  Pave Road
                </button>
              </div>

              {/* Demolish Brush */}
              <div className="bg-[#c2c2c2] border-2 border-[#888] p-2.5 rounded flex flex-col items-center text-center">
                <span className="text-3xl mb-1">🧹</span>
                <h3 className="font-bold text-xs mb-1">Demolish Brush</h3>
                <p className="text-[10px] text-[#555] mb-2 flex-1">
                  Instantly clears out a 5x5x5 cubic area in front of you.
                </p>
                <button
                  onClick={() => {
                    onSelectTool('demolish');
                    onClose();
                  }}
                  className="mc-btn w-full py-1 text-xs font-bold text-red-200"
                >
                  Clear Area
                </button>
              </div>

              {/* TNT Cluster */}
              <div className="bg-[#c2c2c2] border-2 border-[#888] p-2.5 rounded flex flex-col items-center text-center">
                <span className="text-3xl mb-1">💥</span>
                <h3 className="font-bold text-xs mb-1">TNT Mega Cluster</h3>
                <p className="text-[10px] text-[#555] mb-2 flex-1">
                  Places a 3x3 array of TNT blocks ready for pyrotechnic blasting.
                </p>
                <button
                  onClick={() => {
                    onSelectTool('tntCluster');
                    onClose();
                  }}
                  className="mc-btn w-full py-1 text-xs font-bold text-orange-200"
                >
                  Place TNT
                </button>
              </div>

              {/* 3x3 Wall */}
              <div className="bg-[#c2c2c2] border-2 border-[#888] p-2.5 rounded flex flex-col items-center text-center">
                <span className="text-3xl mb-1">🧱</span>
                <h3 className="font-bold text-xs mb-1">3x3 Wall</h3>
                <p className="text-[10px] text-[#555] mb-2 flex-1">
                  Builds a 3x3 upright wall using your currently equipped block.
                </p>
                <button
                  onClick={() => {
                    onSelectTool('wall3x3');
                    onClose();
                  }}
                  className="mc-btn w-full py-1 text-xs font-bold"
                >
                  Place Wall
                </button>
              </div>

              {/* 5x5 Platform */}
              <div className="bg-[#c2c2c2] border-2 border-[#888] p-2.5 rounded flex flex-col items-center text-center">
                <span className="text-3xl mb-1">🟩</span>
                <h3 className="font-bold text-xs mb-1">5x5 Platform</h3>
                <p className="text-[10px] text-[#555] mb-2 flex-1">
                  Instantly creates a 5x5 ground floor platform directly beneath you.
                </p>
                <button
                  onClick={() => {
                    onSelectTool('floor5x5');
                    onClose();
                  }}
                  className="mc-btn w-full py-1 text-xs font-bold"
                >
                  Place Floor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MOB SPAWNER */}
        {activeTab === 'mobs' && (
          <div className="overflow-y-auto pr-1 flex-1 space-y-3">
            <div className="bg-[#ecfdf5] border-2 border-[#10b981] p-2.5 rounded text-xs text-[#065f46]">
              🐮 <strong>Creative Mob Spawner:</strong> Bring your voxel realm to life! 1-click to spawn animals, pets, or creatures right near you.
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {MOBS_DATA.map((mob) => (
                <div
                  key={mob.type}
                  className="bg-[#c2c2c2] border-2 border-[#888] hover:border-green-600 p-3 rounded flex flex-col items-center text-center"
                >
                  <span className="text-4xl mb-1">{mob.icon}</span>
                  <h3 className="font-bold text-xs mb-1 text-[#111]">{mob.name}</h3>
                  <p className="text-[10px] text-[#555] mb-3 flex-1">{mob.desc}</p>
                  <button
                    onClick={() => {
                      onSpawnMob(mob.type);
                      onClose();
                    }}
                    className="mc-btn w-full py-1.5 text-xs font-bold text-green-100 hover:text-white"
                  >
                    Spawn {mob.type.toUpperCase()}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CREATIVE BLOCK PALETTE */}
        {activeTab === 'creative_palette' && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex gap-1 mb-2 border-b border-[#999] pb-1 overflow-x-auto">
              {CREATIVE_CATEGORIES.map((cat, idx) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    sounds.playPop();
                    setActiveCatIndex(idx);
                  }}
                  className={`px-2 py-1 text-[11px] font-bold rounded cursor-pointer whitespace-nowrap ${
                    activeCatIndex === idx
                      ? 'bg-[#3b6ea5] text-white'
                      : 'bg-[#9e9e9e] text-[#222] hover:bg-[#b0b0b0]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 grid grid-cols-6 sm:grid-cols-8 gap-1.5 p-1 bg-[#8b8b8b] border border-[#555] rounded">
              {CREATIVE_CATEGORIES[activeCatIndex].items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectCreativeItem(item.id);
                    sounds.playPop();
                  }}
                  className="mc-slot w-auto h-14 flex flex-col items-center justify-center p-1 cursor-pointer hover:bg-[#a6d89b] hover:scale-105 transition-transform"
                  title={`Add 64x ${item.name} to Hotbar`}
                >
                  <img
                    src={getItemIcon(item.id)}
                    alt={item.name}
                    className="w-7 h-7 object-contain pixelated pointer-events-none drop-shadow"
                  />
                  <span className="text-[9px] text-[#222] font-bold truncate max-w-full leading-tight mt-0.5">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-[#555] text-center">
              Single-click any block to place 64x into your active hotbar slot!
            </div>
          </div>
        )}

        {/* Footer info line */}
        <div className="mt-3 pt-2 border-t border-[#999] flex justify-between items-center text-[11px] text-[#666]">
          <span>
            Shortcut: <kbd className="px-1 bg-white border border-[#888] rounded">B</kbd> Build Menu
          </span>
          <span>
            Mount Vehicle: <kbd className="px-1 bg-white border border-[#888] rounded">E</kbd>
          </span>
          <span>
            Drive: <kbd className="px-1 bg-white border border-[#888] rounded">W A S D</kbd>
          </span>
        </div>
      </div>
    </div>
  );
};
