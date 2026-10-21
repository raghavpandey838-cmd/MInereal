/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ItemStack, ItemId } from '../game/types';
import { getItemIcon } from '../game/textures';
import { findMatchingRecipe, CRAFTING_RECIPES } from '../game/recipes';
import { BLOCK_DEFS } from '../game/constants';
import { sounds } from '../game/audio';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: (ItemStack | null)[];
  onUpdateInventory: (newInv: (ItemStack | null)[]) => void;
}

type TabType = 'crafting' | 'creative' | 'recipes';

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onUpdateInventory,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('crafting');
  // 2x2 Crafting Grid (indices 0, 1, 2, 3)
  const [craftGrid, setCraftGrid] = useState<(ItemStack | null)[]>([null, null, null, null]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  if (!isOpen) return null;

  const craftResult = findMatchingRecipe(craftGrid, 2);

  // Return all items from 2x2 grid back to inventory with ONE CLICK
  const handleClearCraftGrid = () => {
    const newInv = [...inventory];
    const newGrid = [...craftGrid];

    for (let i = 0; i < 4; i++) {
      const item = newGrid[i];
      if (item) {
        // Try to stack or put in first empty slot
        let placed = false;
        for (let j = 0; j < newInv.length; j++) {
          if (newInv[j] && newInv[j]!.id === item.id) {
            newInv[j]!.count += item.count;
            placed = true;
            break;
          }
        }
        if (!placed) {
          const emptyIdx = newInv.findIndex((s) => s === null);
          if (emptyIdx !== -1) {
            newInv[emptyIdx] = item;
          }
        }
        newGrid[i] = null;
      }
    }

    setCraftGrid(newGrid);
    onUpdateInventory(newInv);
    sounds.playPop();
  };

  // Transfer item from inventory to crafting grid or vice versa
  const handleSlotClick = (slotIdx: number) => {
    const item = inventory[slotIdx];
    if (selectedSlotIndex === null) {
      if (item) {
        setSelectedSlotIndex(slotIdx);
        sounds.playPop();
      }
    } else {
      // Swap or combine
      const newInv = [...inventory];
      const source = newInv[selectedSlotIndex];
      const target = newInv[slotIdx];

      if (source && target && source.id === target.id) {
        // Stack together
        target.count += source.count;
        newInv[selectedSlotIndex] = null;
      } else {
        newInv[slotIdx] = source;
        newInv[selectedSlotIndex] = target;
      }

      onUpdateInventory(newInv);
      setSelectedSlotIndex(null);
      sounds.playPop();
    }
  };

  // Quick One-Click Crafting directly from Recipe Book
  const handleOneClickCraft = (recipeName: string) => {
    const recipe = CRAFTING_RECIPES.find((r) => r.name === recipeName);
    if (!recipe) return;

    const newInv = [...inventory];
    const emptyIdx = newInv.findIndex((s) => s === null);
    if (emptyIdx === -1) {
      // Find matching item stack to add to
      const stackIdx = newInv.findIndex((s) => s && s.id === recipe.result.id);
      if (stackIdx !== -1) {
        newInv[stackIdx]!.count += recipe.result.count;
      } else {
        return; // Full inventory
      }
    } else {
      newInv[emptyIdx] = { ...recipe.result };
    }

    onUpdateInventory(newInv);
    sounds.playCraft();
  };

  // Auto-fill 2x2 Crafting Grid with recipe pattern in ONE CLICK
  const handleAutoFill2x2Grid = (recipeName: string) => {
    const recipe = CRAFTING_RECIPES.find((r) => r.name === recipeName && r.gridSize === 2);
    if (!recipe) return;

    const newGrid: (ItemStack | null)[] = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      const neededId = recipe.pattern[i];
      if (neededId) {
        newGrid[i] = { id: neededId, count: 1 };
      }
    }
    setCraftGrid(newGrid);
    sounds.playPop();
  };

  const handleCraftSlotClick = (gridIdx: number) => {
    if (selectedSlotIndex !== null) {
      const newInv = [...inventory];
      const source = newInv[selectedSlotIndex];
      if (source) {
        const newGrid = [...craftGrid];
        const existing = newGrid[gridIdx];

        if (existing && existing.id === source.id) {
          existing.count += 1;
        } else {
          newGrid[gridIdx] = { ...source, count: 1 };
        }

        source.count -= 1;
        if (source.count <= 0) {
          newInv[selectedSlotIndex] = null;
          setSelectedSlotIndex(null);
        }

        setCraftGrid(newGrid);
        onUpdateInventory(newInv);
        sounds.playPop();
      }
    } else {
      // Take item back to inventory
      const existing = craftGrid[gridIdx];
      if (existing) {
        const newInv = [...inventory];
        const emptyIdx = newInv.findIndex((s) => s === null);
        if (emptyIdx !== -1) {
          newInv[emptyIdx] = existing;
          const newGrid = [...craftGrid];
          newGrid[gridIdx] = null;
          setCraftGrid(newGrid);
          onUpdateInventory(newInv);
          sounds.playPop();
        }
      }
    }
  };

  const handleCollectCraftResult = () => {
    if (!craftResult) return;

    const newInv = [...inventory];
    const emptyIdx = newInv.findIndex((s) => s === null);
    if (emptyIdx === -1) {
      const stackIdx = newInv.findIndex((s) => s && s.id === craftResult.id);
      if (stackIdx !== -1) {
        newInv[stackIdx]!.count += craftResult.count;
      } else {
        return;
      }
    } else {
      newInv[emptyIdx] = { ...craftResult };
    }

    // Consume 1 item from each craft slot
    const newGrid = craftGrid.map((slot) => {
      if (!slot) return null;
      if (slot.count > 1) return { ...slot, count: slot.count - 1 };
      return null;
    });

    setCraftGrid(newGrid);
    onUpdateInventory(newInv);
    sounds.playCraft();
  };

  // Add 64 of any creative item into inventory in ONE CLICK
  const handleAddCreativeItem = (itemId: ItemId) => {
    const newInv = [...inventory];
    const emptyIdx = newInv.findIndex((s) => s === null);
    if (emptyIdx !== -1) {
      newInv[emptyIdx] = { id: itemId, count: 64 };
    } else {
      // Replace slot 0
      newInv[0] = { id: itemId, count: 64 };
    }
    onUpdateInventory(newInv);
    sounds.playPop();
  };

  // Unique placeable block items for creative catalog
  const allBlockDefs = Object.values(BLOCK_DEFS).filter((d) => d.type !== 0 && d.id !== 'water');

  const filteredCreativeBlocks = allBlockDefs.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'wood') return d.id.includes('wood') || d.id.includes('planks') || d.id.includes('log');
    if (categoryFilter === 'stone') return d.id.includes('stone') || d.id.includes('brick') || d.id.includes('cobble');
    if (categoryFilter === 'minerals') return d.id.includes('ore') || d.id.includes('block') || d.id.includes('diamond') || d.id.includes('gold') || d.id.includes('iron');
    if (categoryFilter === 'colors') return d.id.includes('wool') || d.id.includes('concrete') || d.id.includes('terracotta') || d.id.includes('glass');
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center pointer-events-auto p-2 sm:p-4 select-none">
      <div className="mc-panel p-3 sm:p-5 rounded text-[#3f3f3f] w-[560px] max-w-[96vw] max-h-[92vh] flex flex-col relative shadow-2xl">
        {/* Header with Title, Tabs & Close Button */}
        <div className="flex justify-between items-center mb-2 sm:mb-3 pb-2 border-b-2 border-[#888]">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <span className="font-bold text-base sm:text-lg text-[#252525]">Minecraft Crafting</span>
            {/* Tab Switchers */}
            <div className="flex gap-1 bg-[#888] p-0.5 rounded border border-[#555]">
              <button
                onClick={() => {
                  setActiveTab('crafting');
                  sounds.playPop();
                }}
                className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                  activeTab === 'crafting' ? 'bg-[#55ff55] text-black shadow' : 'bg-[#aaa] text-[#333] hover:bg-[#bbb]'
                }`}
              >
                2x2 Crafting
              </button>
              <button
                onClick={() => {
                  setActiveTab('recipes');
                  sounds.playPop();
                }}
                className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                  activeTab === 'recipes' ? 'bg-[#55ff55] text-black shadow' : 'bg-[#aaa] text-[#333] hover:bg-[#bbb]'
                }`}
              >
                📖 Recipe Book
              </button>
              <button
                onClick={() => {
                  setActiveTab('creative');
                  sounds.playPop();
                }}
                className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer transition-colors ${
                  activeTab === 'creative' ? 'bg-[#ffaa00] text-black shadow' : 'bg-[#aaa] text-[#333] hover:bg-[#bbb]'
                }`}
              >
                ⭐ All Blocks
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 bg-[#a53b3b] text-white border-2 border-[#551111] hover:bg-[#c24646] font-bold text-sm cursor-pointer rounded flex items-center justify-center shrink-0 active:scale-95"
            title="Close (ESC or E)"
          >
            ✕
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto max-h-[calc(92vh-160px)] pr-1">
          {activeTab === 'crafting' && (
            <div>
              {/* Top: 2x2 Crafting Area & Player Preview */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3 bg-[#b5b5b5] p-2.5 rounded border border-[#888]">
                {/* Character Profile */}
                <div className="flex items-center gap-2">
                  <div className="w-14 h-24 sm:w-16 sm:h-28 bg-[#999999] border-2 border-[#555] rounded flex flex-col items-center justify-center text-xs text-white/80 p-1 shadow-inner">
                    <span className="text-2xl mb-1">🧑</span>
                    <span className="font-bold text-[10px] text-center">Raghav's Avatar</span>
                  </div>
                </div>

                {/* 2x2 Crafting Grid */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-[#222]">Crafting (2x2 Grid)</span>
                    <button
                      onClick={handleClearCraftGrid}
                      className="text-[10px] bg-[#d97706] hover:bg-[#b45309] text-white font-bold px-1.5 py-0.5 rounded cursor-pointer shadow active:scale-95"
                      title="Clear items in 2x2 grid back to inventory"
                    >
                      Clear Grid
                    </button>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-1 bg-[#8b8b8b] p-1.5 border border-[#444] rounded">
                      {craftGrid.map((slot, idx) => {
                        const icon = slot ? getItemIcon(slot.id) : null;
                        return (
                          <div
                            key={`craft-${idx}`}
                            onClick={() => handleCraftSlotClick(idx)}
                            className="mc-slot cursor-pointer relative hover:border-yellow-300"
                            title={slot ? `${slot.id} (${slot.count})` : 'Empty Craft Slot'}
                          >
                            {icon && <img src={icon} alt="" className="w-7 h-7 sm:w-8 sm:h-8 pixelated pointer-events-none" />}
                            {slot && slot.count > 1 && (
                              <span className="absolute bottom-0 right-1 text-xs font-bold text-white drop-shadow">
                                {slot.count}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Arrow */}
                    <div className="text-xl sm:text-2xl font-bold text-[#333]">➔</div>

                    {/* Craft Result Slot */}
                    <div
                      onClick={handleCollectCraftResult}
                      className={`mc-slot relative border-2 ${
                        craftResult
                          ? 'cursor-pointer bg-[#98d88b] border-[#22c55e] animate-pulse hover:scale-105'
                          : 'opacity-60 border-[#555]'
                      }`}
                      title={craftResult ? `Click to Craft: ${craftResult.id} x${craftResult.count}` : 'Craft Result Slot'}
                    >
                      {craftResult && (
                        <img
                          src={getItemIcon(craftResult.id)}
                          alt=""
                          className="w-7 h-7 sm:w-8 sm:h-8 pixelated pointer-events-none"
                        />
                      )}
                      {craftResult && craftResult.count > 1 && (
                        <span className="absolute bottom-0 right-1 text-xs font-bold text-white drop-shadow">
                          {craftResult.count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick 1-Click Craft Shortcuts Strip */}
                <div className="flex flex-col gap-1 text-[11px] font-bold">
                  <span className="text-[#333] text-[10px] uppercase">⚡ 1-Click Quick Craft:</span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => handleOneClickCraft('Oak Planks')}
                      className="mc-btn px-2 py-1 text-[10px] font-bold text-left flex items-center gap-1 cursor-pointer"
                      title="1 Oak Log -> 4 Oak Planks"
                    >
                      <span>🪵</span>
                      <span>Planks</span>
                    </button>
                    <button
                      onClick={() => handleOneClickCraft('Sticks')}
                      className="mc-btn px-2 py-1 text-[10px] font-bold text-left flex items-center gap-1 cursor-pointer"
                      title="2 Planks -> 4 Sticks"
                    >
                      <span>🥢</span>
                      <span>Sticks</span>
                    </button>
                    <button
                      onClick={() => handleOneClickCraft('Crafting Table')}
                      className="mc-btn px-2 py-1 text-[10px] font-bold text-left flex items-center gap-1 cursor-pointer"
                      title="4 Planks -> 1 Crafting Table"
                    >
                      <span>🪓</span>
                      <span>Table</span>
                    </button>
                    <button
                      onClick={() => handleOneClickCraft('Torches')}
                      className="mc-btn px-2 py-1 text-[10px] font-bold text-left flex items-center gap-1 cursor-pointer"
                      title="1 Coal + 1 Stick -> 4 Torches"
                    >
                      <span>🕯️</span>
                      <span>Torches</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recipes' && (
            <div className="mb-3 bg-[#b5b5b5] p-2.5 rounded border border-[#888]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-[#222]">📖 Real Minecraft Recipe Book (One-Click Instant Craft)</span>
                <span className="text-[10px] text-[#555]">Click recipe to auto-craft!</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
                {CRAFTING_RECIPES.map((recipe, idx) => {
                  const icon = getItemIcon(recipe.result.id);
                  return (
                    <div
                      key={`recipe-${idx}`}
                      className="bg-[#999999] hover:bg-[#aaaaaa] border border-[#666] p-1.5 rounded flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <img src={icon} alt="" className="w-6 h-6 pixelated pointer-events-none" />
                        <div>
                          <div className="font-bold text-xs text-[#111]">{recipe.name}</div>
                          <div className="text-[10px] text-[#444] font-mono">
                            Produces x{recipe.result.count}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        {recipe.gridSize === 2 && (
                          <button
                            onClick={() => handleAutoFill2x2Grid(recipe.name)}
                            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[9px] font-bold px-1.5 py-1 rounded cursor-pointer active:scale-95"
                            title="Auto-fill into 2x2 Crafting Grid"
                          >
                            Fill Grid
                          </button>
                        )}
                        <button
                          onClick={() => handleOneClickCraft(recipe.name)}
                          className="bg-[#16a34a] hover:bg-[#15803d] text-white text-[9px] font-bold px-2 py-1 rounded cursor-pointer active:scale-95 shadow"
                          title="Instant 1-Click Craft"
                        >
                          ⚡ Craft
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'creative' && (
            <div className="mb-3 bg-[#b5b5b5] p-2.5 rounded border border-[#888]">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-1.5 mb-2">
                <input
                  type="text"
                  placeholder="🔍 Search Minecraft blocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border-2 border-[#555] px-2 py-1 text-xs rounded font-sans flex-1 text-black outline-none"
                />
                <div className="flex gap-1 flex-wrap">
                  {['all', 'wood', 'stone', 'minerals', 'colors'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded cursor-pointer ${
                        categoryFilter === cat ? 'bg-black text-yellow-300' : 'bg-[#888] text-white hover:bg-[#777]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of 75+ Minecraft Blocks */}
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-1 max-h-52 overflow-y-auto p-1 bg-[#7f7f7f] border border-[#555] rounded">
                {filteredCreativeBlocks.map((block) => {
                  const icon = getItemIcon(block.id as ItemId);
                  return (
                    <button
                      key={`creative-${block.id}`}
                      onClick={() => handleAddCreativeItem(block.id as ItemId)}
                      className="mc-slot w-10 h-10 flex flex-col items-center justify-center cursor-pointer hover:border-yellow-400 hover:scale-105 transition-transform"
                      title={`Click to get 64x ${block.name}`}
                    >
                      <img src={icon} alt={block.name} className="w-7 h-7 pixelated pointer-events-none" />
                      <span className="text-[7px] text-white/80 truncate w-full text-center leading-none">
                        {block.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Inventory: 27 slots (rows 0-2) */}
          <div className="mb-2 sm:mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-[#333]">Survival Inventory (27 Slots)</span>
              <span className="text-[10px] text-[#555]">Click to select/swap items</span>
            </div>
            <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-1.5 sm:p-2 border border-[#444] rounded">
              {inventory.slice(9, 36).map((slot, i) => {
                const actualIdx = i + 9;
                const isSelected = selectedSlotIndex === actualIdx;
                const icon = slot ? getItemIcon(slot.id) : null;
                return (
                  <div
                    key={`inv-${actualIdx}`}
                    onClick={() => handleSlotClick(actualIdx)}
                    className={`mc-slot cursor-pointer relative hover:border-white ${
                      isSelected ? 'border-2 border-yellow-300 bg-[#a6a6a6]' : ''
                    }`}
                    title={slot ? `${slot.id} (${slot.count})` : 'Empty Slot'}
                  >
                    {icon && <img src={icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8 pixelated pointer-events-none" />}
                    {slot && slot.count > 1 && (
                      <span className="absolute bottom-0 right-1 text-[10px] sm:text-xs font-bold text-white drop-shadow">
                        {slot.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hotbar: 9 slots (indices 0-8) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-[#333]">Hotbar (Keys 1–9)</span>
              <span className="text-[10px] text-yellow-700 font-bold">Equipped on screen</span>
            </div>
            <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-1.5 sm:p-2 border border-[#444] rounded">
              {inventory.slice(0, 9).map((slot, i) => {
                const isSelected = selectedSlotIndex === i;
                const icon = slot ? getItemIcon(slot.id) : null;
                return (
                  <div
                    key={`hotbar-inv-${i}`}
                    onClick={() => handleSlotClick(i)}
                    className={`mc-slot cursor-pointer relative hover:border-white ${
                      isSelected ? 'border-2 border-yellow-300 bg-[#a6a6a6]' : ''
                    }`}
                    title={slot ? `${slot.id} (${slot.count})` : `Hotbar Slot ${i + 1}`}
                  >
                    <span className="absolute top-0 left-0.5 text-[8px] text-white/50">{i + 1}</span>
                    {icon && <img src={icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8 pixelated pointer-events-none" />}
                    {slot && slot.count > 1 && (
                      <span className="absolute bottom-0 right-1 text-[10px] sm:text-xs font-bold text-white drop-shadow">
                        {slot.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="mt-2 text-center text-[10px] sm:text-xs text-[#555] border-t border-[#999] pt-1">
          📱 <strong>Mobile & Laptop Compatible:</strong> Click item to pick up & swap · Click ⚡ to craft instantly · Press <kbd className="px-1 bg-white border border-[#888] rounded">E</kbd> or <kbd className="px-1 bg-white border border-[#888] rounded">ESC</kbd> to close
        </div>
      </div>
    </div>
  );
};
