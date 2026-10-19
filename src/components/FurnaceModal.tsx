/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ItemStack } from '../game/types';
import { getItemIcon } from '../game/textures';
import { SMELTING_RECIPES, FUEL_VALUES } from '../game/recipes';
import { sounds } from '../game/audio';

interface FurnaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: (ItemStack | null)[];
  onUpdateInventory: (newInv: (ItemStack | null)[]) => void;
}

export const FurnaceModal: React.FC<FurnaceModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onUpdateInventory,
}) => {
  const [inputSlot, setInputSlot] = useState<ItemStack | null>(null);
  const [fuelSlot, setFuelSlot] = useState<ItemStack | null>(null);
  const [outputSlot, setOutputSlot] = useState<ItemStack | null>(null);
  const [burnProgress, setBurnProgress] = useState<number>(0);
  const [cookProgress, setCookProgress] = useState<number>(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  // Smelting simulation loop
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // Check recipe match
      const recipe = inputSlot ? SMELTING_RECIPES.find((r) => r.input === inputSlot.id) : null;

      if (recipe && (fuelSlot || burnProgress > 0)) {
        if (burnProgress <= 0 && fuelSlot) {
          // Consume fuel
          setFuelSlot((f) => {
            if (!f) return null;
            return f.count > 1 ? { ...f, count: f.count - 1 } : null;
          });
          setBurnProgress(100);
        }

        if (burnProgress > 0) {
          setBurnProgress((b) => Math.max(0, b - 5));
          setCookProgress((c) => {
            if (c >= 100) {
              // Cooked!
              setOutputSlot((out) => {
                if (!out) return { id: recipe.output, count: 1 };
                if (out.id === recipe.output) return { ...out, count: out.count + 1 };
                return out;
              });
              setInputSlot((inp) => {
                if (!inp) return null;
                return inp.count > 1 ? { ...inp, count: inp.count - 1 } : null;
              });
              sounds.playPop();
              return 0;
            }
            return c + 15;
          });
        }
      } else {
        setCookProgress((c) => Math.max(0, c - 10));
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isOpen, inputSlot, fuelSlot, burnProgress]);

  if (!isOpen) return null;

  const handleInvSlotClick = (slotIdx: number) => {
    const item = inventory[slotIdx];
    if (selectedSlotIndex === null) {
      if (item) setSelectedSlotIndex(slotIdx);
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

  const handlePlaceInInput = () => {
    if (selectedSlotIndex !== null) {
      const newInv = [...inventory];
      const source = newInv[selectedSlotIndex];
      if (source) {
        setInputSlot(source);
        newInv[selectedSlotIndex] = null;
        setSelectedSlotIndex(null);
        onUpdateInventory(newInv);
        sounds.playPop();
      }
    } else if (inputSlot) {
      const newInv = [...inventory];
      const emptyIdx = newInv.findIndex((s) => s === null);
      if (emptyIdx !== -1) {
        newInv[emptyIdx] = inputSlot;
        setInputSlot(null);
        onUpdateInventory(newInv);
        sounds.playPop();
      }
    }
  };

  const handlePlaceInFuel = () => {
    if (selectedSlotIndex !== null) {
      const newInv = [...inventory];
      const source = newInv[selectedSlotIndex];
      if (source && FUEL_VALUES[source.id]) {
        setFuelSlot(source);
        newInv[selectedSlotIndex] = null;
        setSelectedSlotIndex(null);
        onUpdateInventory(newInv);
        sounds.playPop();
      }
    } else if (fuelSlot) {
      const newInv = [...inventory];
      const emptyIdx = newInv.findIndex((s) => s === null);
      if (emptyIdx !== -1) {
        newInv[emptyIdx] = fuelSlot;
        setFuelSlot(null);
        onUpdateInventory(newInv);
        sounds.playPop();
      }
    }
  };

  const handleCollectOutput = () => {
    if (!outputSlot) return;
    const newInv = [...inventory];
    const emptyIdx = newInv.findIndex((s) => s === null);
    if (emptyIdx !== -1) {
      newInv[emptyIdx] = outputSlot;
      setOutputSlot(null);
      onUpdateInventory(newInv);
      sounds.playPop();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center pointer-events-auto">
      <div className="mc-panel p-5 rounded text-[#3f3f3f] w-[460px] relative select-none">
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-lg">Furnace (Smelting)</span>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-[#a53b3b] text-white border-2 border-[#551111] hover:bg-[#c24646] font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Smelting Center */}
        <div className="flex items-center justify-center gap-6 mb-4 bg-[#b5b5b5] p-4 rounded border border-[#888]">
          <div className="flex flex-col items-center gap-2">
            {/* Input Slot (Ore/Sand/Meat) */}
            <div onClick={handlePlaceInInput} className="mc-slot cursor-pointer">
              {inputSlot && (
                <img src={getItemIcon(inputSlot.id)} alt="" className="w-8 h-8 pixelated pointer-events-none" />
              )}
              {inputSlot && inputSlot.count > 1 && (
                <span className="absolute bottom-0 right-1 text-xs font-bold text-white drop-shadow">
                  {inputSlot.count}
                </span>
              )}
            </div>

            {/* Fire flame indicator */}
            <div className="text-xl">
              {burnProgress > 0 ? (
                <span className="text-orange-500 animate-pulse drop-shadow">🔥</span>
              ) : (
                <span className="text-gray-400 opacity-40">🔥</span>
              )}
            </div>

            {/* Fuel Slot (Coal/Wood) */}
            <div onClick={handlePlaceInFuel} className="mc-slot cursor-pointer">
              {fuelSlot && (
                <img src={getItemIcon(fuelSlot.id)} alt="" className="w-8 h-8 pixelated pointer-events-none" />
              )}
              {fuelSlot && fuelSlot.count > 1 && (
                <span className="absolute bottom-0 right-1 text-xs font-bold text-white drop-shadow">
                  {fuelSlot.count}
                </span>
              )}
            </div>
          </div>

          {/* Progress Arrow */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-3 bg-gray-400 rounded overflow-hidden border border-gray-600">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${cookProgress}%` }} />
            </div>
            <span className="text-sm font-bold mt-1">➔</span>
          </div>

          {/* Output Slot */}
          <div
            onClick={handleCollectOutput}
            className={`mc-slot w-14 h-14 ${outputSlot ? 'cursor-pointer hover:bg-[#a6d89b]' : 'opacity-60'}`}
          >
            {outputSlot && (
              <img src={getItemIcon(outputSlot.id)} alt="" className="w-10 h-10 pixelated pointer-events-none" />
            )}
            {outputSlot && outputSlot.count > 1 && (
              <span className="absolute bottom-0 right-1 text-sm font-bold text-white drop-shadow">
                {outputSlot.count}
              </span>
            )}
          </div>
        </div>

        {/* Inventory */}
        <div className="mb-3">
          <span className="text-xs font-bold text-[#333] mb-1 block">Inventory</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-2 border border-[#444]">
            {inventory.slice(9, 36).map((slot, i) => {
              const actualIdx = i + 9;
              const isSelected = selectedSlotIndex === actualIdx;
              const icon = slot ? getItemIcon(slot.id) : null;
              return (
                <div
                  key={`furn-inv-${actualIdx}`}
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

        {/* Hotbar */}
        <div>
          <span className="text-xs font-bold text-[#333] mb-1 block">Hotbar</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8b8b8b] p-2 border border-[#444]">
            {inventory.slice(0, 9).map((slot, i) => {
              const isSelected = selectedSlotIndex === i;
              const icon = slot ? getItemIcon(slot.id) : null;
              return (
                <div
                  key={`furn-hotbar-${i}`}
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
