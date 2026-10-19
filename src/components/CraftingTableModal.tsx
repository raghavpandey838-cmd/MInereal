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

  if (!isOpen) return null;

  const craftResult = findMatchingRecipe(grid, 3);

  const handleSlotClick = (slotIdx: number) => {
    const item = inventory[slotIdx];
    if (selectedSlotIndex === null) {
      if (item) {
        setSelectedSlotIndex(slotIdx);
      }
    } else {
      const newInv = [...inventory];
      const source = newInv[selectedSlotIndex];
      const target = newInv[slotIdx];

      if (source && target && source.id === target.id) {
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
    if (emptyIdx === -1) return;

    newInv[emptyIdx] = { ...craftResult };

    const newGrid = grid.map((slot) => {
      if (!slot) return null;
      if (slot.count > 1) return { ...slot, count: slot.count - 1 };
      return null;
    });

    setGrid(newGrid);
    onUpdateInventory(newInv);
    sounds.playCraft();
  };

  // Quick recipe auto-craft helper
  const tryAutoCraft = (recipeName: string) => {
    const recipe = CRAFTING_RECIPES.find((r) => r.name === recipeName);
    if (!recipe) return;

    // Clear grid back to inv
    const newInv = [...inventory];
    grid.forEach((item) => {
      if (item) {
        const idx = newInv.findIndex((s) => s === null);
        if (idx !== -1) newInv[idx] = item;
      }
    });

    // Try take ingredients from inv
    const newGrid: (ItemStack | null)[] = new Array(9).fill(null);
    let success = true;

    for (let i = 0; i < recipe.pattern.length; i++) {
      const neededId = recipe.pattern[i];
      if (!neededId) continue;

      const foundIdx = newInv.findIndex((s) => s && s.id === neededId && s.count > 0);
      if (foundIdx === -1) {
        success = false;
        break;
      }

      newGrid[i] = { id: neededId, count: 1 };
      newInv[foundIdx]!.count -= 1;
      if (newInv[foundIdx]!.count <= 0) {
        newInv[foundIdx] = null;
      }
    }

    if (success) {
      setGrid(newGrid);
      onUpdateInventory(newInv);
      sounds.playCraft();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center pointer-events-auto">
      <div className="mc-panel p-5 rounded text-[#3f3f3f] w-[500px] relative select-none">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-lg text-[#3f3f3f]">Crafting Table (3x3)</span>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-[#a53b3b] text-white border-2 border-[#551111] hover:bg-[#c24646] font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Quick Recipes bar */}
        <div className="mb-3 flex flex-wrap gap-1 bg-[#b0b0b0] p-1.5 rounded border border-[#888]">
          <span className="text-[11px] font-bold self-center mr-1 text-[#333]">Quick:</span>
          {['Sticks', 'Wooden Pickaxe', 'Stone Pickaxe', 'Iron Pickaxe', 'Iron Sword', 'Torches', 'Furnace', 'Chest'].map(
            (name) => (
              <button
                key={name}
                onClick={() => tryAutoCraft(name)}
                className="mc-btn px-2 py-0.5 text-[11px] cursor-pointer"
              >
                {name}
              </button>
            )
          )}
        </div>

        {/* 3x3 Crafting Area */}
        <div className="flex items-center justify-center gap-6 mb-4 bg-[#b5b5b5] p-3 rounded border border-[#888]">
          {/* 3x3 Grid */}
          <div className="grid grid-cols-3 gap-1 bg-[#8b8b8b] p-2 border border-[#444]">
            {grid.map((slot, idx) => {
              const icon = slot ? getItemIcon(slot.id) : null;
              return (
                <div
                  key={`craft3x3-${idx}`}
                  onClick={() => handleGridSlotClick(idx)}
                  className="mc-slot cursor-pointer"
                >
                  {icon && <img src={icon} alt="" className="w-8 h-8 pixelated pointer-events-none" />}
                  {slot && slot.count > 1 && (
                    <span className="absolute bottom-0 right-1 text-xs font-bold text-white drop-shadow">
                      {slot.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-2xl font-bold">➔</div>

          {/* Craft Result */}
          <div
            onClick={handleCollectResult}
            className={`mc-slot w-14 h-14 ${craftResult ? 'cursor-pointer hover:bg-[#a6d89b]' : 'opacity-60'}`}
          >
            {craftResult && (
              <img
                src={getItemIcon(craftResult.id)}
                alt=""
                className="w-10 h-10 pixelated pointer-events-none"
              />
            )}
            {craftResult && craftResult.count > 1 && (
              <span className="absolute bottom-0 right-1 text-sm font-bold text-white drop-shadow">
                {craftResult.count}
              </span>
            )}
          </div>
        </div>

        {/* Player Inventory (27 slots) */}
        <div className="mb-3">
          <span className="text-xs font-bold text-[#333] mb-1 block">Inventory</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-2 border border-[#444]">
            {inventory.slice(9, 36).map((slot, i) => {
              const actualIdx = i + 9;
              const isSelected = selectedSlotIndex === actualIdx;
              const icon = slot ? getItemIcon(slot.id) : null;
              return (
                <div
                  key={`craft-inv-${actualIdx}`}
                  onClick={() => handleSlotClick(actualIdx)}
                  className={`mc-slot cursor-pointer ${isSelected ? 'selected' : ''}`}
                >
                  {icon && <img src={icon} alt="" className="w-8 h-8 pixelated pointer-events-none" />}
                  {slot && slot.count > 1 && (
                    <span className="absolute bottom-0 right-1 text-xs font-bold text-white drop-shadow">
                      {slot.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Hotbar */}
        <div>
          <span className="text-xs font-bold text-[#333] mb-1 block">Hotbar</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-2 border border-[#444]">
            {inventory.slice(0, 9).map((slot, i) => {
              const isSelected = selectedSlotIndex === i;
              const icon = slot ? getItemIcon(slot.id) : null;
              return (
                <div
                  key={`craft-hotbar-${i}`}
                  onClick={() => handleSlotClick(i)}
                  className={`mc-slot cursor-pointer ${isSelected ? 'selected' : ''}`}
                >
                  {icon && <img src={icon} alt="" className="w-8 h-8 pixelated pointer-events-none" />}
                  {slot && slot.count > 1 && (
                    <span className="absolute bottom-0 right-1 text-xs font-bold text-white drop-shadow">
                      {slot.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
