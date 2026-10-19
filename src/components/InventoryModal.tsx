/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ItemStack } from '../game/types';
import { getItemIcon } from '../game/textures';
import { findMatchingRecipe } from '../game/recipes';
import { sounds } from '../game/audio';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: (ItemStack | null)[];
  onUpdateInventory: (newInv: (ItemStack | null)[]) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onUpdateInventory,
}) => {
  // 2x2 Crafting Grid (indices 0, 1, 2, 3)
  const [craftGrid, setCraftGrid] = useState<(ItemStack | null)[]>([null, null, null, null]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const craftResult = findMatchingRecipe(craftGrid, 2);

  // Transfer item from inventory to crafting grid or vice versa
  const handleSlotClick = (slotIdx: number) => {
    const item = inventory[slotIdx];
    if (selectedSlotIndex === null) {
      if (item) {
        setSelectedSlotIndex(slotIdx);
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
    if (emptyIdx === -1) return; // No space

    newInv[emptyIdx] = { ...craftResult };

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

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center pointer-events-auto">
      <div className="mc-panel p-5 rounded text-[#3f3f3f] w-[460px] relative select-none">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-lg text-[#3f3f3f]">Crafting & Inventory</span>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-[#a53b3b] text-white border-2 border-[#551111] hover:bg-[#c24646] font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Top: 2x2 Crafting & Character Preview */}
        <div className="flex items-center justify-between mb-4 bg-[#b5b5b5] p-3 rounded border border-[#888888]">
          <div className="text-center font-bold text-sm">
            <div className="w-16 h-28 bg-[#999999] border-2 border-[#555] rounded flex items-center justify-center text-xs text-white/70">
              Player
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs font-bold mb-1">Crafting (2x2)</span>
            <div className="flex items-center gap-3">
              {/* 2x2 Grid */}
              <div className="grid grid-cols-2 gap-1 bg-[#8b8b8b] p-1.5 border border-[#444]">
                {craftGrid.map((slot, idx) => {
                  const icon = slot ? getItemIcon(slot.id) : null;
                  return (
                    <div
                      key={`craft-${idx}`}
                      onClick={() => handleCraftSlotClick(idx)}
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

              {/* Arrow */}
              <div className="text-xl font-bold">➔</div>

              {/* Craft Result Slot */}
              <div
                onClick={handleCollectCraftResult}
                className={`mc-slot ${craftResult ? 'cursor-pointer hover:bg-[#a6d89b]' : 'opacity-60'}`}
              >
                {craftResult && (
                  <img
                    src={getItemIcon(craftResult.id)}
                    alt=""
                    className="w-8 h-8 pixelated pointer-events-none"
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
        </div>

        {/* Main Inventory: 27 slots (rows 0-2) */}
        <div className="mb-3">
          <span className="text-xs font-bold text-[#333] mb-1 block">Inventory</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-2 border border-[#444]">
            {inventory.slice(9, 36).map((slot, i) => {
              const actualIdx = i + 9;
              const isSelected = selectedSlotIndex === actualIdx;
              const icon = slot ? getItemIcon(slot.id) : null;
              return (
                <div
                  key={`inv-${actualIdx}`}
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

        {/* Hotbar: 9 slots (indices 0-8) */}
        <div>
          <span className="text-xs font-bold text-[#333] mb-1 block">Hotbar</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-2 border border-[#444]">
            {inventory.slice(0, 9).map((slot, i) => {
              const isSelected = selectedSlotIndex === i;
              const icon = slot ? getItemIcon(slot.id) : null;
              return (
                <div
                  key={`hotbar-inv-${i}`}
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

        {/* Bottom hint */}
        <div className="mt-3 text-center text-xs text-[#555]">
          Click an item to select, then click another slot to place or combine · Press <kbd className="px-1 bg-white border border-[#888] rounded">E</kbd> or <kbd className="px-1 bg-white border border-[#888] rounded">ESC</kbd> to close
        </div>
      </div>
    </div>
  );
};
