/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ItemStack, PlayerStats, GameMode } from '../game/types';
import { getItemIcon } from '../game/textures';
import { sounds } from '../game/audio';

interface GameHUDProps {
  stats: PlayerStats;
  hotbar: (ItemStack | null)[];
  selectedIndex: number;
  gameMode: GameMode;
  onSelectSlot: (index: number) => void;
  hurtFlash: boolean;
  isFlying: boolean;
  onToggleFly: () => void;
  onOpenBuildMenu: () => void;
  onTeleportHome: () => void;
  canUndo: boolean;
  onUndo: () => void;
  isLocked: boolean;
  playerCoords: { x: number; y: number; z: number };
  compassHeading: string;
  onRotateCamera: (deltaYaw: number) => void;
  mountedVehicle: { type: 'car' | 'bike' | 'boat'; speed: number } | null;
  onDismountVehicle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenInventory: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  hotbar,
  selectedIndex,
  gameMode,
  onSelectSlot,
  hurtFlash,
  isFlying,
  onToggleFly,
  onOpenBuildMenu,
  onTeleportHome,
  canUndo,
  onUndo,
  isLocked,
  playerCoords,
  compassHeading,
  onRotateCamera,
  mountedVehicle,
  onDismountVehicle,
  isMuted,
  onToggleMute,
  onOpenInventory,
}) => {
  const hearts = [];
  const fullHearts = Math.floor(stats.health / 2);
  const halfHeart = stats.health % 2 >= 1;
  for (let i = 0; i < 10; i++) {
    if (i < fullHearts) {
      hearts.push('full');
    } else if (i === fullHearts && halfHeart) {
      hearts.push('half');
    } else {
      hearts.push('empty');
    }
  }

  const drumsticks = [];
  const fullFood = Math.floor(stats.hunger / 2);
  const halfFood = stats.hunger % 2 >= 1;
  for (let i = 0; i < 10; i++) {
    if (i < fullFood) {
      drumsticks.push('full');
    } else if (i === fullFood && halfFood) {
      drumsticks.push('half');
    } else {
      drumsticks.push('empty');
    }
  }

  const bubbles = Math.ceil((stats.oxygen / stats.maxOxygen) * 10);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between">
      {/* Hurt Flash Vignette */}
      {hurtFlash && (
        <div className="absolute inset-0 bg-red-600/35 transition-opacity duration-100 animate-pulse pointer-events-none z-10" />
      )}

      {/* Screen Center Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="drop-shadow-sm">
          <line x1="10" y1="2" x2="10" y2="18" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
          <line x1="2" y1="10" x2="18" y2="10" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
        </svg>
      </div>

      {/* Top Bar: Nav Coordinates, Compass, Vehicle Status & Action Toolbar */}
      <div className="p-3 text-xs text-white/90 drop-shadow flex flex-wrap items-center justify-between gap-2 z-20">
        {/* Left: Compass & Coordinates Cluster */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-black/60 px-3 py-1.5 rounded border border-white/20 flex items-center gap-2 font-mono shadow-md">
            <span className="text-yellow-400 font-bold">🧭 {compassHeading}</span>
            <span className="text-white/40">|</span>
            <span className="text-cyan-300">
              X: {Math.floor(playerCoords.x)} Y: {Math.floor(playerCoords.y)} Z: {Math.floor(playerCoords.z)}
            </span>
          </div>

          {/* Quick Home/Spawn Teleport */}
          <button
            onClick={() => {
              sounds.playPop();
              onTeleportHome();
            }}
            className="mc-btn px-2.5 py-1 text-[11px] font-bold cursor-pointer"
            title="Teleport back to World Spawn (0, Y, 0)"
          >
            🏠 Spawn
          </button>

          {/* Audio Mute toggle */}
          <button
            onClick={() => {
              sounds.playPop();
              onToggleMute();
            }}
            className="mc-btn px-2 py-1 text-[11px] font-bold cursor-pointer"
            title="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* Center: Active Vehicle Driving HUD or Click to Lock Banner */}
        {mountedVehicle ? (
          <div className="bg-gradient-to-r from-blue-900/90 to-cyan-900/90 text-white px-4 py-1.5 rounded-full border border-cyan-400 flex items-center gap-3 shadow-xl pointer-events-auto animate-pulse">
            <span className="text-base">
              {mountedVehicle.type === 'car' ? '🏎️' : mountedVehicle.type === 'bike' ? '🏍️' : '🚣'}
            </span>
            <div className="flex flex-col text-left leading-none">
              <span className="font-bold text-xs uppercase tracking-wide text-cyan-200">
                {mountedVehicle.type === 'car' ? 'Driving Offroader Car' : mountedVehicle.type === 'bike' ? 'Riding Motorcycle' : 'Sailing Boat in Water'}
              </span>
              <span className="text-[10px] text-white/80 font-mono mt-0.5">
                Speed: {(Math.abs(mountedVehicle.speed) * 3.6).toFixed(0)} km/h · Steer with W A S D
              </span>
            </div>
            <button
              onClick={() => {
                sounds.playPop();
                onDismountVehicle();
              }}
              className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-0.5 rounded text-[11px] font-bold ml-2 cursor-pointer shadow"
            >
              Exit [E]
            </button>
          </div>
        ) : !isLocked ? (
          <div className="bg-yellow-500/90 text-black px-3 py-1 rounded font-bold text-xs shadow-lg pointer-events-none">
            🖱️ Click screen to lock mouse & look · [ESC] to free mouse
          </div>
        ) : null}

        {/* Right: Master Build Menu & Flight & Inventory Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Build Menu Trigger */}
          <button
            onClick={() => {
              sounds.playPop();
              onOpenBuildMenu();
            }}
            className="mc-btn px-3 py-1.5 text-xs font-bold text-yellow-300 hover:text-white cursor-pointer shadow-lg flex items-center gap-1.5 border-2 border-yellow-500/50"
          >
            <span>⚒️</span>
            <span>BUILD MENU [B]</span>
          </button>

          {/* Flight Mode Toggle */}
          <button
            onClick={() => {
              sounds.playPop();
              onToggleFly();
            }}
            className={`mc-btn px-2.5 py-1.5 text-xs font-bold cursor-pointer flex items-center gap-1 ${
              isFlying ? 'bg-cyan-700 text-cyan-100 border-cyan-400' : ''
            }`}
            title="Toggle Fly Mode (Space to rise, Shift to sink) - Key: F"
          >
            <span>🕊️</span>
            <span>{isFlying ? 'FLYING (ON)' : 'FLY [F]'}</span>
          </button>

          {/* Inventory Button */}
          <button
            onClick={() => {
              sounds.playPop();
              onOpenInventory();
            }}
            className="mc-btn px-2.5 py-1.5 text-xs font-bold cursor-pointer"
            title="Open Inventory (Key: E)"
          >
            🎒 Bag [E]
          </button>

          {/* Quick Undo */}
          <button
            onClick={() => {
              sounds.playPop();
              onUndo();
            }}
            disabled={!canUndo}
            className="mc-btn px-2 py-1.5 text-xs font-bold cursor-pointer disabled:opacity-40"
            title="Undo last placed structure or multi-block (Key: Z)"
          >
            <span>↩</span>
          </button>
        </div>
      </div>

      {/* Subtle On-Screen Turn Assistance Buttons */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-auto z-10 opacity-70 hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            sounds.playPop();
            onRotateCamera(0.4);
          }}
          className="mc-btn w-9 h-12 flex items-center justify-center font-bold text-sm shadow-md"
          title="Turn Left (← or A)"
        >
          ◀
        </button>
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-auto z-10 opacity-70 hover:opacity-100 transition-opacity">
        <button
          onClick={() => {
            sounds.playPop();
            onRotateCamera(-0.4);
          }}
          className="mc-btn w-9 h-12 flex items-center justify-center font-bold text-sm shadow-md"
          title="Turn Right (→ or D)"
        >
          ▶
        </button>
      </div>

      {/* Bottom HUD: Hearts, Hunger, XP, Hotbar */}
      <div className="flex flex-col items-center pb-3 w-full">
        {/* Survival Status Rows (Hearts & Hunger & Air) */}
        {gameMode === 'survival' && (
          <div className="w-[364px] flex flex-col gap-1 mb-1.5">
            {/* Oxygen Bubbles if swimming */}
            {stats.oxygen < stats.maxOxygen && (
              <div className="flex justify-end gap-1 mb-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={`bubble-${i}`}
                    className={`w-3.5 h-3.5 rounded-full border border-blue-400 ${
                      i < bubbles ? 'bg-cyan-400' : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-between items-center px-1">
              {/* 10 Hearts */}
              <div className="flex gap-1">
                {hearts.map((type, i) => (
                  <div
                    key={`heart-${i}`}
                    className={`w-4 h-4 flex items-center justify-center ${
                      stats.health <= 4 ? 'animate-bounce' : ''
                    }`}
                  >
                    <svg viewBox="0 0 16 16" className="w-4 h-4">
                      {type === 'full' ? (
                        <path
                          d="M8 14s-6-4-6-8a4 4 0 0 1 6-3 4 4 0 0 1 6 3c0 4-6 8-6 8z"
                          fill="#ff2222"
                          stroke="#4a0000"
                          strokeWidth="1.2"
                        />
                      ) : type === 'half' ? (
                        <>
                          <path
                            d="M8 14s-6-4-6-8a4 4 0 0 1 6-3v11z"
                            fill="#ff2222"
                            stroke="#4a0000"
                            strokeWidth="1.2"
                          />
                          <path
                            d="M8 3a4 4 0 0 1 6 3c0 4-6 8-6 8v-11z"
                            fill="#441111"
                            stroke="#4a0000"
                            strokeWidth="1.2"
                          />
                        </>
                      ) : (
                        <path
                          d="M8 14s-6-4-6-8a4 4 0 0 1 6-3 4 4 0 0 1 6 3c0 4-6 8-6 8z"
                          fill="#331111"
                          stroke="#220000"
                          strokeWidth="1.2"
                        />
                      )}
                    </svg>
                  </div>
                ))}
              </div>

              {/* 10 Hunger Drumsticks */}
              <div className="flex gap-1">
                {drumsticks.map((type, i) => (
                  <div key={`hunger-${i}`} className="w-4 h-4 flex items-center justify-center">
                    <svg viewBox="0 0 16 16" className="w-4 h-4">
                      <circle
                        cx="9"
                        cy="7"
                        r="5"
                        fill={type === 'full' ? '#c77826' : type === 'half' ? '#9e5917' : '#3d2510'}
                        stroke="#231407"
                        strokeWidth="1.2"
                      />
                      <rect
                        x="3"
                        y="10"
                        width="3"
                        height="4"
                        fill="#f0ebd8"
                        stroke="#4a3b2c"
                        strokeWidth="0.8"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Experience Bar */}
        <div className="relative w-[364px] h-2 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xs mb-1">
          <div
            className="h-full bg-gradient-to-r from-[#62d936] to-[#87f55b] transition-all duration-150"
            style={{ width: `${Math.min(100, stats.experience * 100)}%` }}
          />
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold text-[#7fff00] drop-shadow-[0_1.5px_1px_rgba(0,0,0,1)]">
            {stats.level}
          </div>
        </div>

        {/* 9-Slot Authentic Hotbar (Single-Click Responsive) */}
        <div className="pointer-events-auto flex bg-[#8f8f8f] p-1 border-t-2 border-l-2 border-[#dbdbdb] border-r-2 border-b-2 border-[#2b2b2b] shadow-2xl rounded-xs">
          {hotbar.map((slot, index) => {
            const isSelected = selectedIndex === index;
            const iconUrl = slot ? getItemIcon(slot.id) : null;
            return (
              <button
                key={`hotbar-${index}`}
                onClick={() => {
                  sounds.playPop();
                  onSelectSlot(index);
                }}
                className={`w-10 h-10 flex items-center justify-center relative cursor-pointer m-0.5 ${
                  isSelected
                    ? 'border-2 border-white bg-[#a8a8a8] shadow-inner scale-105 z-10'
                    : 'border border-[#383838] bg-[#8b8b8b] hover:bg-[#9a9a9a]'
                }`}
              >
                {/* Slot number hint */}
                <span className="absolute top-0.5 left-1 text-[9px] text-white/50 leading-none">
                  {index + 1}
                </span>

                {/* Item Icon */}
                {iconUrl && (
                  <img
                    src={iconUrl}
                    alt={slot?.id}
                    className="w-7 h-7 object-contain pixelated pointer-events-none drop-shadow"
                  />
                )}

                {/* Count Badge */}
                {slot && slot.count > 1 && (
                  <span className="absolute bottom-0.5 right-1 text-xs font-bold text-white drop-shadow-[1px_1px_0px_#222]">
                    {slot.count}
                  </span>
                )}

                {/* Durability Bar */}
                {slot && slot.durability !== undefined && slot.maxDurability && (
                  <div className="absolute bottom-0.5 left-1 right-1 h-1 bg-black/60 rounded-xs overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${(slot.durability / slot.maxDurability) * 100}%`,
                        backgroundColor:
                          slot.durability / slot.maxDurability > 0.5
                            ? '#22c55e'
                            : slot.durability / slot.maxDurability > 0.2
                            ? '#eab308'
                            : '#ef4444',
                      }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Hotbar Hint & Quick Controls */}
        <div className="text-[10px] text-white/80 mt-1 drop-shadow flex gap-3 font-mono">
          <span className="text-yellow-300 font-bold">[W A S D] Move Everytime</span>
          <span>[B] Build / Vehicles</span>
          <span>[F] Fly Mode</span>
          <span>[E] Mount/Bag</span>
          <span>[Right-Click] Place</span>
        </div>
      </div>
    </div>
  );
};
