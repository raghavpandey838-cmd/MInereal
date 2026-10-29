/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ItemStack } from '../game/types';
import { getItemIcon } from '../game/textures';
import { findMatchingRecipe, CRAFTING_RECIPES } from '../game/recipes';
import { sounds } from '../game/audio';

interface CraftingTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: (ItemStack | null)[];
  onUpdateInventory: (newInv: (ItemStack | null)[]) => void;
}

export const CraftingTableModal: React.FC<CraftingTableModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onUpdateInventory,
}) => {
  // 3x3 Crafting Grid (indices 0..8)
  const [grid, setGrid] = useState<(ItemStack | null)[]>(new Array(9).fill(null));
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [quickMoveActive, setQuickMoveActive] = useState<boolean>(false);

  if (!isOpen) return null;

  const craftResult = findMatchingRecipe(grid, 3);

  // Quick Move / Shift-Click item between Hotbar (0..8) and Inventory (9..35)
  const handleQuickMove = (slotIdx: number) => {
    const item = inventory[slotIdx];
    if (!item) return;

    const newInv = [...inventory];
    const isHotbar = slotIdx < 9;
    const targetStart = isHotbar ? 9 : 0;
    const targetEnd = isHotbar ? 36 : 9;

    let placed = false;
    for (let i = targetStart; i < targetEnd; i++) {
      if (newInv[i] && newInv[i]!.id === item.id && newInv[i]!.count < 64) {
        const space = 64 - newInv[i]!.count;
        const add = Math.min(space, item.count);
        newInv[i]!.count += add;
        item.count -= add;
        if (item.count <= 0) {
          newInv[slotIdx] = null;
          placed = true;
          break;
        }
      }
    }

    if (!placed && item.count > 0) {
      for (let i = targetStart; i < targetEnd; i++) {
        if (!newInv[i]) {
          newInv[i] = { ...item };
          newInv[slotIdx] = null;
          placed = true;
          break;
        }
      }
    }

    if (placed) {
      onUpdateInventory(newInv);
      sounds.playPop();
    }
  };

  // Consolidate identical stacks into full 64 stacks
  const handleAutoStack = () => {
    const newInv = [...inventory];
    for (let i = 0; i < newInv.length; i++) {
      if (!newInv[i]) continue;
      for (let j = i + 1; j < newInv.length; j++) {
        if (newInv[j] && newInv[j]!.id === newInv[i]!.id) {
          const space = 64 - newInv[i]!.count;
          if (space > 0) {
            const transfer = Math.min(space, newInv[j]!.count);
            newInv[i]!.count += transfer;
            newInv[j]!.count -= transfer;
            if (newInv[j]!.count <= 0) {
              newInv[j] = null;
            }
          }
        }
      }
    }
    onUpdateInventory(newInv);
    sounds.playCraft();
  };

  // Split stack in half
  const handleSplitStack = (slotIdx: number) => {
    const item = inventory[slotIdx];
    if (!item || item.count <= 1) return;

    const newInv = [...inventory];
    const half = Math.floor(item.count / 2);
    item.count -= half;

    const emptyIdx = newInv.findIndex((s, i) => s === null && i !== slotIdx);
    if (emptyIdx !== -1) {
      newInv[emptyIdx] = { ...item, count: half };
      onUpdateInventory(newInv);
      sounds.playPop();
    }
  };

  // Return all items from 3x3 grid to inventory in ONE CLICK
  const handleClearGrid = () => {
    const newInv = [...inventory];
    const newGrid = [...grid];

    for (let i = 0; i < 9; i++) {
      const item = newGrid[i];
      if (item) {
        let placed = false;
        for (let j = 0; j < newInv.length; j++) {
          if (newInv[j] && newInv[j]!.id === item.id && newInv[j]!.count < 64) {
            const space = 64 - newInv[j]!.count;
            const add = Math.min(space, item.count);
            newInv[j]!.count += add;
            item.count -= add;
            if (item.count <= 0) {
              placed = true;
              break;
            }
          }
        }
        if (!placed && item.count > 0) {
          const emptyIdx = newInv.findIndex((s) => s === null);
          if (emptyIdx !== -1) {
            newInv[emptyIdx] = { ...item };
          }
        }
        newGrid[i] = null;
      }
    }

    setGrid(newGrid);
    onUpdateInventory(newInv);
    sounds.playPop();
  };

  const handleSlotClick = (slotIdx: number, e?: React.MouseEvent) => {
    if (e?.shiftKey || quickMoveActive) {
      handleQuickMove(slotIdx);
      return;
    }

    const item = inventory[slotIdx];
    if (selectedSlotIndex === null) {
      if (item) {
        setSelectedSlotIndex(slotIdx);
        sounds.playPop();
      }
    } else {
      const newInv = [...inventory];
      const source = newInv[selectedSlotIndex];
      const target = newInv[slotIdx];

      if (source && target && source.id === target.id) {
        const space = 64 - target.count;
        const add = Math.min(space, source.count);
        target.count += add;
        source.count -= add;
        if (source.count <= 0) {
          newInv[selectedSlotIndex] = null;
        }
      } else {
        newInv[slotIdx] = source;
        newInv[selectedSlotIndex] = target;
      }

      onUpdateInventory(newInv);
      setSelectedSlotIndex(null);
      sounds.playPop();
    }
  };

  const handleGridSlotClick = (gridIdx: number) => {
    if (selectedSlotIndex !== null) {
      const newInv = [...inventory];
      const source = newInv[selectedSlotIndex];
      if (source) {
        const newGrid = [...grid];
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

        setGrid(newGrid);
        onUpdateInventory(newInv);
        sounds.playPop();
      }
    } else {
      // Return item to inventory
      const existing = grid[gridIdx];
      if (existing) {
        const newInv = [...inventory];
        const emptyIdx = newInv.findIndex((s) => s === null);
        if (emptyIdx !== -1) {
          newInv[emptyIdx] = existing;
          const newGrid = [...grid];
          newGrid[gridIdx] = null;
          setGrid(newGrid);
          onUpdateInventory(newInv);
          sounds.playPop();
        }
      }
    }
  };

  const handleCollectResult = () => {
    if (!craftResult) return;

    const newInv = [...inventory];
    const emptyIdx = newInv.findIndex((s) => s === null);
    if (emptyIdx === -1) {
      const stackIdx = newInv.findIndex((s) => s && s.id === craftResult.id && s.count + craftResult.count <= 64);
      if (stackIdx !== -1) {
        newInv[stackIdx]!.count += craftResult.count;
      } else {
        return;
      }
    } else {
      newInv[emptyIdx] = { ...craftResult };
    }

    const newGrid = grid.map((slot) => {
      if (!slot) return null;
      if (slot.count > 1) return { ...slot, count: slot.count - 1 };
      return null;
    });

    setGrid(newGrid);
    onUpdateInventory(newInv);
    sounds.playCraft();
  };

  // Craft All / Max batches possible from 3x3 grid
  const handleCraftMax = () => {
    let result = findMatchingRecipe(grid, 3);
    if (!result) return;

    const newInv = [...inventory];
    const newGrid = [...grid];

    while (result) {
      let placed = false;
      for (let i = 0; i < newInv.length; i++) {
        if (newInv[i] && newInv[i]!.id === result.id && newInv[i]!.count + result.count <= 64) {
          newInv[i]!.count += result.count;
          placed = true;
          break;
        }
      }
      if (!placed) {
        const emptyIdx = newInv.findIndex((s) => s === null);
        if (emptyIdx !== -1) {
          newInv[emptyIdx] = { ...result };
          placed = true;
        }
      }
      if (!placed) break; // Inventory full

      // Decrement each slot
      for (let g = 0; g < 9; g++) {
        if (newGrid[g]) {
          newGrid[g]!.count -= 1;
          if (newGrid[g]!.count <= 0) newGrid[g] = null;
        }
      }
      result = findMatchingRecipe(newGrid, 3);
    }

    setGrid(newGrid);
    onUpdateInventory(newInv);
    sounds.playCraft();
  };

  // Instant 1-Click Crafting from Recipe Book
  const tryAutoCraft = (recipeName: string) => {
    const recipe = CRAFTING_RECIPES.find((r) => r.name === recipeName);
    if (!recipe) return;

    const newInv = [...inventory];
    const emptyIdx = newInv.findIndex((s) => s === null);
    if (emptyIdx !== -1) {
      newInv[emptyIdx] = { ...recipe.result };
    } else {
      const stackIdx = newInv.findIndex((s) => s && s.id === recipe.result.id && s.count + recipe.result.count <= 64);
      if (stackIdx !== -1) {
        newInv[stackIdx]!.count += recipe.result.count;
      }
    }

    onUpdateInventory(newInv);
    sounds.playCraft();
  };

  const quickRecipes = [
    'Oak Planks',
    'Sticks',
    'Crafting Table',
    'Torches',
    'Wooden Pickaxe',
    'Stone Pickaxe',
    'Iron Pickaxe',
    'Diamond Pickaxe',
    'Diamond Sword',
    'Iron Sword',
    'Furnace',
    'Chest',
    'TNT',
    'Bookshelf',
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center pointer-events-auto p-2 sm:p-4 select-none">
      <div className="mc-panel p-3 sm:p-5 rounded text-[#3f3f3f] w-[560px] max-w-[96vw] max-h-[92vh] flex flex-col relative shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-[#888]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪓</span>
            <span className="font-bold text-base sm:text-lg text-[#252525]">Crafting Table (3x3 Grid)</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 bg-[#a53b3b] text-white border-2 border-[#551111] hover:bg-[#c24646] font-bold text-sm cursor-pointer rounded flex items-center justify-center active:scale-95"
            title="Close (ESC or E)"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(92vh-140px)] pr-1">
          {/* 1-Click Recipe Shortcuts */}
          <div className="mb-2 bg-[#b0b0b0] p-1.5 rounded border border-[#888]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-[#222]">⚡ 1-Click Quick Recipes:</span>
              <button
                onClick={handleClearGrid}
                className="text-[9px] bg-[#d97706] hover:bg-[#b45309] text-white font-bold px-1.5 py-0.5 rounded cursor-pointer active:scale-95"
              >
                Clear 3x3 Grid
              </button>
            </div>
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
              {quickRecipes.map((name) => (
                <button
                  key={name}
                  onClick={() => tryAutoCraft(name)}
                  className="mc-btn px-2 py-0.5 text-[10px] font-bold cursor-pointer active:scale-95 text-[#222]"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* 3x3 Crafting Area */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 mb-3 bg-[#b5b5b5] p-2.5 rounded border border-[#888]">
            {/* 3x3 Grid */}
            <div className="grid grid-cols-3 gap-1 bg-[#8b8b8b] p-1.5 sm:p-2 border border-[#444] rounded">
              {grid.map((slot, idx) => {
                const icon = slot ? getItemIcon(slot.id) : null;
                return (
                  <div
                    key={`craft3x3-${idx}`}
                    onClick={() => handleGridSlotClick(idx)}
                    className="mc-slot cursor-pointer relative hover:border-yellow-300"
                    title={slot ? `${slot.id} (${slot.count})` : 'Empty Craft Slot'}
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

            <div className="text-xl sm:text-2xl font-bold text-[#333]">➔</div>

            {/* Craft Result & Craft Max Button */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                onClick={handleCollectResult}
                className={`mc-slot w-12 h-12 sm:w-14 sm:h-14 relative border-2 ${
                  craftResult ? 'cursor-pointer bg-[#98d88b] border-[#22c55e] animate-pulse hover:scale-105' : 'opacity-60 border-[#555]'
                }`}
                title={craftResult ? `Click to take: ${craftResult.id} x${craftResult.count}` : 'Craft Result Slot'}
              >
                {craftResult && (
                  <img
                    src={getItemIcon(craftResult.id)}
                    alt=""
                    className="w-8 h-8 sm:w-10 sm:h-10 pixelated pointer-events-none"
                  />
                )}
                {craftResult && craftResult.count > 1 && (
                  <span className="absolute bottom-0 right-1 text-xs sm:text-sm font-bold text-white drop-shadow">
                    {craftResult.count}
                  </span>
                )}
              </div>
              {craftResult && (
                <button
                  onClick={handleCraftMax}
                  className="text-[9px] bg-[#22c55e] hover:bg-[#16a34a] text-black font-black px-1.5 py-0.5 rounded shadow cursor-pointer uppercase active:scale-95"
                  title="Craft all possible batches at once"
                >
                  ⚡ Craft Max
                </button>
              )}
            </div>
          </div>

          {/* Player Inventory (27 slots) with Action Bar */}
          <div className="mb-2">
            <div className="flex flex-wrap justify-between items-center mb-1 gap-1">
              <span className="text-xs font-bold text-[#333]">Inventory (27 Slots)</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setQuickMoveActive(!quickMoveActive)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer border transition-colors shadow-xs ${
                    quickMoveActive
                      ? 'bg-[#22c55e] text-black border-[#15803d] animate-pulse font-black'
                      : 'bg-[#9ca3af] hover:bg-[#d1d5db] text-black border-[#4b5563]'
                  }`}
                  title="Shift-Click / Quick Move items between Hotbar and 27-slot Inventory"
                >
                  ⚡ Quick Move {quickMoveActive ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={handleAutoStack}
                  className="text-[10px] bg-[#d97706] hover:bg-[#b45309] text-white font-bold px-2 py-0.5 rounded cursor-pointer border border-[#92400e] shadow-xs active:scale-95"
                  title="Consolidate identical item stacks"
                >
                  📦 Auto-Stack
                </button>
              </div>
            </div>

            <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-1.5 sm:p-2 border border-[#444] rounded">
              {inventory.slice(9, 36).map((slot, i) => {
                const actualIdx = i + 9;
                const isSelected = selectedSlotIndex === actualIdx;
                const icon = slot ? getItemIcon(slot.id) : null;
                return (
                  <div
                    key={`craft-inv-${actualIdx}`}
                    onClick={(e) => handleSlotClick(actualIdx, e)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleSplitStack(actualIdx);
                    }}
                    className={`mc-slot cursor-pointer relative hover:border-white select-none ${
                      isSelected ? 'border-2 border-yellow-300 bg-[#a6a6a6]' : ''
                    }`}
                    title={slot ? `${slot.id} (${slot.count}) - Shift/Click to quick-move, Right-Click to split` : 'Empty Slot'}
                  >
                    {icon && <img src={icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8 pixelated pointer-events-none" />}
                    {slot && slot.count > 1 && (
                      <span className="absolute bottom-0 right-1 text-[10px] sm:text-xs font-bold text-white drop-shadow pointer-events-none">
                        {slot.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hotbar (9 slots) */}
          <div>
            <span className="text-xs font-bold text-[#333] mb-1 block">Hotbar</span>
            <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-1.5 sm:p-2 border border-[#444] rounded">
              {inventory.slice(0, 9).map((slot, i) => {
                const isSelected = selectedSlotIndex === i;
                const icon = slot ? getItemIcon(slot.id) : null;
                return (
                  <div
                    key={`craft-hotbar-${i}`}
                    onClick={(e) => handleSlotClick(i, e)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleSplitStack(i);
                    }}
                    className={`mc-slot cursor-pointer relative hover:border-white select-none ${
                      isSelected ? 'border-2 border-yellow-300 bg-[#a6a6a6]' : ''
                    }`}
                    title={slot ? `${slot.id} (${slot.count}) - Shift/Click to quick-move, Right-Click to split` : `Hotbar Slot ${i + 1}`}
                  >
                    <span className="absolute top-0 left-0.5 text-[8px] text-white/50">{i + 1}</span>
                    {icon && <img src={icon} alt="" className="w-6 h-6 sm:w-8 sm:h-8 pixelated pointer-events-none" />}
                    {slot && slot.count > 1 && (
                      <span className="absolute bottom-0 right-1 text-[10px] sm:text-xs font-bold text-white drop-shadow pointer-events-none">
                        {slot.count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 text-center text-[10px] sm:text-xs text-[#555] border-t border-[#999] pt-1 flex justify-between items-center px-1">
          <span>⚡ <strong>Quick-Move:</strong> Shift-Click or toggle Quick Move</span>
          <span>½ <strong>Split Stack:</strong> Right-click slot</span>
          <span><kbd className="px-1 bg-white border border-[#888] rounded">E</kbd> / <kbd className="px-1 bg-white border border-[#888] rounded">ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
};
