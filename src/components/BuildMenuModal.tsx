/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ItemId } from '../game/types';
import { getItemIcon } from '../game/textures';
import { STRUCTURES, StructureTemplate } from '../game/blueprints';
import { sounds } from '../game/audio';

interface BuildMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStructure: (template: StructureTemplate) => void;
  onSelectTool: (toolType: 'wall3x3' | 'floor5x5' | 'column4') => void;
  onSelectCreativeItem: (itemId: ItemId) => void;
  onSpawnDriveableVehicle: (type: 'car' | 'bike' | 'boat') => void;
  canUndo: boolean;
  onUndo: () => void;
  currentMode: 'survival' | 'creative';
}

const CREATIVE_CATEGORIES: {
  name: string;
  items: { id: ItemId; name: string }[];
}[] = [
  {
    name: 'Building Blocks',
    items: [
      { id: 'oak_planks', name: 'Oak Planks' },
      { id: 'bricks', name: 'Bricks' },
      { id: 'cobblestone', name: 'Cobblestone' },
      { id: 'stone', name: 'Stone' },
      { id: 'glass', name: 'Glass' },
      { id: 'bookshelf', name: 'Bookshelf' },
      { id: 'obsidian', name: 'Obsidian' },
      { id: 'netherrack', name: 'Netherrack' },
      { id: 'snow', name: 'Snow Block' },
      { id: 'sand', name: 'Sand' },
      { id: 'gravel', name: 'Gravel' },
      { id: 'bedrock', name: 'Bedrock' },
    ],
  },
  {
    name: 'Functional & Redstone',
    items: [
      { id: 'crafting_table', name: 'Crafting Table' },
      { id: 'furnace', name: 'Furnace' },
      { id: 'chest', name: 'Chest' },
      { id: 'tnt', name: 'TNT' },
      { id: 'torch', name: 'Torch' },
      { id: 'redstone', name: 'Redstone Dust' },
    ],
  },
  {
    name: 'Natural & Foliage',
    items: [
      { id: 'grass', name: 'Grass Block' },
      { id: 'dirt', name: 'Dirt' },
      { id: 'oak_log', name: 'Oak Log' },
      { id: 'oak_leaves', name: 'Oak Leaves' },
      { id: 'cactus', name: 'Cactus' },
      { id: 'poppy', name: 'Poppy Flower' },
      { id: 'dandelion', name: 'Dandelion' },
      { id: 'coal_ore', name: 'Coal Ore' },
      { id: 'iron_ore', name: 'Iron Ore' },
      { id: 'gold_ore', name: 'Gold Ore' },
      { id: 'diamond_ore', name: 'Diamond Ore' },
      { id: 'redstone_ore', name: 'Redstone Ore' },
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
      { id: 'bread', name: 'Bread' },
      { id: 'apple', name: 'Golden/Red Apple' },
      { id: 'cooked_porkchop', name: 'Cooked Porkchop' },
      { id: 'cooked_beef', name: 'Cooked Steak' },
    ],
  },
];

export const BuildMenuModal: React.FC<BuildMenuModalProps> = ({
  isOpen,
  onClose,
  onSelectStructure,
  onSelectTool,
  onSelectCreativeItem,
  onSpawnDriveableVehicle,
  canUndo,
  onUndo,
}) => {
  const [activeTab, setActiveTab] = useState<'blueprints' | 'vehicles' | 'multitools' | 'creative_palette'>('blueprints');
  const [activeCatIndex, setActiveCatIndex] = useState<number>(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center pointer-events-auto select-none p-3">
      <div className="mc-panel p-5 rounded text-[#3f3f3f] w-[640px] max-w-[96vw] relative flex flex-col max-h-[88vh] shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 border-b-2 border-[#888] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⚒️</span>
            <div>
              <h2 className="font-bold text-lg text-[#111] leading-tight">Master Builder & Vehicles Menu</h2>
              <span className="text-[11px] text-[#555]">
                Single-click construction: Blueprints, Driveable Vehicles, Multi-Block Tools & Infinite Palette
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
          <div className="flex gap-1.5">
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
              🏛️ Blueprints
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
                  ? 'bg-[#3b6ea5] text-white border-2 border-[#1c3a5e]'
                  : 'mc-btn'
              }`}
            >
              🧱 Multi-Block
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
            className="mc-btn px-2.5 py-1 text-xs font-bold flex items-center gap-1 disabled:opacity-40 whitespace-nowrap"
            title="Undo last placed structure or multi-block (Key: Z)"
          >
            <span>↩</span> Undo [Z]
          </button>
        </div>

        {/* TAB 1: BLUEPRINTS & HOUSES */}
        {activeTab === 'blueprints' && (
          <div className="overflow-y-auto pr-1 flex-1 space-y-2.5">
            <div className="bg-[#b0b0b0] p-2 rounded text-xs text-[#222] border border-[#888]">
              💡 <strong>Single Click Instant Build:</strong> Click <strong>"Build Now"</strong> on any blueprint to place it right in front of you instantly!
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {STRUCTURES.map((struct) => (
                <div
                  key={struct.id}
                  className="bg-[#c2c2c2] border-2 border-[#888] hover:border-[#3b6ea5] p-3 rounded flex flex-col justify-between transition-all"
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <span className="text-3xl p-1 bg-white/50 rounded border border-[#999]">
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

        {/* TAB 2: DRIVEABLE VEHICLES (Car, Bike, Boat) */}
        {activeTab === 'vehicles' && (
          <div className="overflow-y-auto pr-1 flex-1 space-y-3">
            <div className="bg-[#fff9db] border-2 border-[#eab308] p-2.5 rounded text-xs text-[#854d0e]">
              🚀 <strong>Driveable Vehicles:</strong> Spawn functional vehicles right at your location! Walk up to them and press <strong>[E]</strong> or click <strong>Drive</strong> to mount. Drive using <strong>WASD</strong> keys!
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

        {/* TAB 3: MULTI-BLOCK TOOLS */}
        {activeTab === 'multitools' && (
          <div className="overflow-y-auto pr-1 flex-1 space-y-3">
            <div className="bg-[#b0b0b0] p-2 rounded text-xs text-[#222] border border-[#888]">
              ⚡ <strong>Rapid Multi-Block Construction:</strong> Places 3x3 walls, 5x5 platforms, and 4-block pillars in 1 single click using your currently equipped block!
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Wall Tool */}
              <div className="bg-[#c2c2c2] border-2 border-[#888] p-3 rounded flex flex-col items-center text-center">
                <span className="text-3xl mb-1">🧱</span>
                <h3 className="font-bold text-xs mb-1">3x3 Wall</h3>
                <p className="text-[10px] text-[#555] mb-3">
                  Places a 3-wide by 3-high wall in front of you.
                </p>
                <button
                  onClick={() => {
                    onSelectTool('wall3x3');
                    onClose();
                  }}
                  className="mc-btn w-full py-1.5 text-xs font-bold"
                >
                  Place Wall
                </button>
              </div>

              {/* Floor Tool */}
              <div className="bg-[#c2c2c2] border-2 border-[#888] p-3 rounded flex flex-col items-center text-center">
                <span className="text-3xl mb-1">🟩</span>
                <h3 className="font-bold text-xs mb-1">5x5 Platform</h3>
                <p className="text-[10px] text-[#555] mb-3">
                  Places a 5x5 ground platform directly beneath you.
                </p>
                <button
                  onClick={() => {
                    onSelectTool('floor5x5');
                    onClose();
                  }}
                  className="mc-btn w-full py-1.5 text-xs font-bold"
                >
                  Place Platform
                </button>
              </div>

              {/* Column Tool */}
              <div className="bg-[#c2c2c2] border-2 border-[#888] p-3 rounded flex flex-col items-center text-center">
                <span className="text-3xl mb-1">🏛️</span>
                <h3 className="font-bold text-xs mb-1">4-Block Pillar</h3>
                <p className="text-[10px] text-[#555] mb-3">
                  Builds a 4-block vertical column to reach higher areas.
                </p>
                <button
                  onClick={() => {
                    onSelectTool('column4');
                    onClose();
                  }}
                  className="mc-btn w-full py-1.5 text-xs font-bold"
                >
                  Place Pillar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CREATIVE BLOCK PALETTE */}
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
            Mount/Dismount: <kbd className="px-1 bg-white border border-[#888] rounded">E</kbd>
          </span>
          <span>
            Drive: <kbd className="px-1 bg-white border border-[#888] rounded">W A S D</kbd>
          </span>
        </div>
      </div>
    </div>
  );
};
