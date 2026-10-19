/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ItemStack } from '../game/types';
import { getItemIcon } from '../game/textures';
import { sounds } from '../game/audio';

interface ChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: (ItemStack | null)[];
  onUpdateInventory: (newInv: (ItemStack | null)[]) => void;
  chestSlots: (ItemStack | null)[];
  onUpdateChestSlots: (newSlots: (ItemStack | null)[]) => void;
}

export const ChestModal: React.FC<ChestModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onUpdateInventory,
  chestSlots,
  onUpdateChestSlots,
}) => {
  const [selectedSource, setSelectedSource] = useState<{ type: 'inv' | 'chest'; index: number } | null>(null);

  if (!isOpen) return null;

  const handleInvSlotClick = (idx: number) => {
    if (!selectedSource) {
      if (inventory[idx]) setSelectedSource({ type: 'inv', index: idx });
    } else if (selectedSource.type === 'inv') {
      // Swap within inventory
      const newInv = [...inventory];
      const tmp = newInv[idx];
      newInv[idx] = newInv[selectedSource.index];
      newInv[selectedSource.index] = tmp;
      onUpdateInventory(newInv);
      setSelectedSource(null);
      sounds.playPop();
    } else {
      // Transfer from chest to inventory
      const newInv = [...inventory];
      const newChest = [...chestSlots];
      const chestItem = newChest[selectedSource.index];
      const invItem = newInv[idx];

      if (chestItem && invItem && chestItem.id === invItem.id) {
        invItem.count += chestItem.count;
        newChest[selectedSource.index] = null;
      } else {
        newInv[idx] = chestItem;
        newChest[selectedSource.index] = invItem;
      }

      onUpdateInventory(newInv);
      onUpdateChestSlots(newChest);
      setSelectedSource(null);
      sounds.playPop();
    }
  };

  const handleChestSlotClick = (idx: number) => {
    if (!selectedSource) {
      if (chestSlots[idx]) setSelectedSource({ type: 'chest', index: idx });
    } else if (selectedSource.type === 'chest') {
      // Swap within chest
      const newChest = [...chestSlots];
      const tmp = newChest[idx];
      newChest[idx] = newChest[selectedSource.index];
      newChest[selectedSource.index] = tmp;
      onUpdateChestSlots(newChest);
      setSelectedSource(null);
      sounds.playPop();
    } else {
      // Transfer from inventory to chest
      const newInv = [...inventory];
      const newChest = [...chestSlots];
      const invItem = newInv[selectedSource.index];
      const chestItem = newChest[idx];

      if (invItem && chestItem && invItem.id === chestItem.id) {
        chestItem.count += invItem.count;
        newInv[selectedSource.index] = null;
      } else {
        newChest[idx] = invItem;
        newInv[selectedSource.index] = chestItem;
      }

      onUpdateInventory(newInv);
      onUpdateChestSlots(newChest);
      setSelectedSource(null);
      sounds.playPop();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center pointer-events-auto">
      <div className="mc-panel p-5 rounded text-[#3f3f3f] w-[460px] relative select-none">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-lg">Chest Storage</span>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-[#a53b3b] text-white border-2 border-[#551111] hover:bg-[#c24646] font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Chest 27 slots (3 rows of 9) */}
        <div className="mb-4 bg-[#b5b5b5] p-2.5 rounded border border-[#888]">
          <span className="text-xs font-bold text-[#333] mb-1 block">Chest (27 Slots)</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-1.5 border border-[#444]">
            {chestSlots.map((slot, idx) => {
              const isSelected = selectedSource?.type === 'chest' && selectedSource.index === idx;
              const icon = slot ? getItemIcon(slot.id) : null;
              return (
                <div
                  key={`chest-slot-${idx}`}
                  onClick={() => handleChestSlotClick(idx)}
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

        {/* Inventory (27 slots) */}
        <div className="mb-3">
          <span className="text-xs font-bold text-[#333] mb-1 block">Inventory</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-2 border border-[#444]">
            {inventory.slice(9, 36).map((slot, i) => {
              const actualIdx = i + 9;
              const isSelected = selectedSource?.type === 'inv' && selectedSource.index === actualIdx;
              const icon = slot ? getItemIcon(slot.id) : null;
              return (
                <div
                  key={`chest-inv-${actualIdx}`}
                  onClick={() => handleInvSlotClick(actualIdx)}
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

        {/* Hotbar (9 slots) */}
        <div>
          <span className="text-xs font-bold text-[#333] mb-1 block">Hotbar</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-2 border border-[#444]">
            {inventory.slice(0, 9).map((slot, i) => {
              const isSelected = selectedSource?.type === 'inv' && selectedSource.index === i;
              const icon = slot ? getItemIcon(slot.id) : null;
              return (
                <div
                  key={`chest-hotbar-${i}`}
                  onClick={() => handleInvSlotClick(i)}
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
