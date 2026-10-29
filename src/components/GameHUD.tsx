/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ItemStack, PlayerStats } from '../game/types';
import { getItemIcon } from '../game/textures';
import { sounds } from '../game/audio';

interface GameHUDProps {
  hotbar: (ItemStack | null)[];
  selectedIndex: number;
  onSelectSlot: (index: number) => void;
  isFlying: boolean;
  onToggleFly: () => void;
  flySpeedMultiplier: number;
  onToggleFlySpeed: () => void;
  onOpenBuildMenu: () => void;
  onOpenAdvancements: () => void;
  onSetTimeOfDay: (time: number) => void;
  onTeleportHome: () => void;
  onSaveWaypoint: () => void;
  onTeleportWaypoint: () => void;
  hasCustomWaypoint: boolean;
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
  showMobileControls: boolean;
  onToggleMobileControls: () => void;
  recentAdvancement: { title: string; description: string; icon: string } | null;
  onSpawnVehicle?: (type: 'car' | 'bike' | 'boat') => void;
  onPauseGame?: () => void;
  playerStats?: PlayerStats;
  onMineStart?: () => void;
  onMineStop?: () => void;
  onInteract?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hotbar,
  selectedIndex,
  onSelectSlot,
  isFlying,
  onToggleFly,
  flySpeedMultiplier,
  onToggleFlySpeed,
  onOpenBuildMenu,
  onOpenAdvancements,
  onSetTimeOfDay,
  onTeleportHome,
  onSaveWaypoint,
  onTeleportWaypoint,
  hasCustomWaypoint,
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
  showMobileControls,
  onToggleMobileControls,
  recentAdvancement,
  onSpawnVehicle,
  onPauseGame,
  playerStats,
  onMineStart,
  onMineStop,
  onInteract,
}) => {
  const [guiScale, setGuiScale] = useState<'compact' | 'normal'>('compact');
  const selectedItem = hotbar[selectedIndex] || null;

  const getItemDisplayName = (id: string): string => {
    return id
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between">
      {/* Screen Center Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="drop-shadow-sm">
          <line x1="10" y1="2" x2="10" y2="18" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
          <line x1="2" y1="10" x2="18" y2="10" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
        </svg>
      </div>

      {/* Advancement Toast Notification (Top-Right Pop-In) */}
      {recentAdvancement && (
        <div className="absolute top-14 right-2 sm:right-4 z-50 pointer-events-auto animate-bounce shadow-2xl">
          <div className="bg-[#1f1a14]/95 border-2 border-[#d97706] text-white px-3 py-2 rounded-lg flex items-center gap-2.5 max-w-xs backdrop-blur-md">
            <span className="text-2xl p-1 bg-yellow-500/20 rounded border border-yellow-400">
              {recentAdvancement.icon}
            </span>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-yellow-400 font-bold flex items-center gap-1 font-mono">
                <span>🏆 ADVANCEMENT MADE!</span>
              </div>
              <div className="font-bold text-xs text-yellow-100">{recentAdvancement.title}</div>
              <div className="text-[10px] text-gray-300 leading-snug">{recentAdvancement.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar: Ultra-slim responsive header that never covers screen on mobile */}
      <div className="p-1 sm:p-2 text-[10px] sm:text-xs text-white/90 drop-shadow flex items-center justify-between gap-1 z-20 w-full">
        {/* Left: Pause Button & Coordinates */}
        <div className="flex items-center gap-1 pointer-events-auto shrink-0">
          {/* Pause Button */}
          {onPauseGame && (
            <button
              onClick={() => {
                sounds.playPop();
                onPauseGame();
              }}
              className="mc-btn w-6 h-6 sm:w-7 sm:h-7 p-0 flex items-center justify-center text-[10px] sm:text-xs font-bold cursor-pointer bg-red-900/80 hover:bg-red-800 text-white border-red-400"
              title="Pause Game / Game Menu (ESC on PC)"
            >
              ⏸️
            </button>
          )}

          {/* Compass & Coordinates */}
          <div className="bg-black/60 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded border border-white/20 flex items-center gap-1 font-mono shadow-xs text-[9px] sm:text-[11px]">
            <span className="text-yellow-400 font-bold hidden md:inline">🧭 {compassHeading} |</span>
            <span className="text-cyan-300 font-bold">
              X:{Math.floor(playerCoords.x)} Y:{Math.floor(playerCoords.y)} Z:{Math.floor(playerCoords.z)}
            </span>
          </div>

          {/* Desktop-only quick spawn & waypoint buttons */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => {
                sounds.playPop();
                onTeleportHome();
              }}
              className="mc-btn px-2 py-1 text-[11px] font-bold cursor-pointer"
              title="Teleport to World Spawn (0, Y, 0)"
            >
              🏠 Spawn
            </button>
            <button
              onClick={() => {
                sounds.playPop();
                onSaveWaypoint();
              }}
              className="mc-btn px-2 py-1 text-[11px] font-bold cursor-pointer text-cyan-200"
              title="Save current position as waypoint"
            >
              📍 Set WP
            </button>
            {hasCustomWaypoint && (
              <button
                onClick={() => {
                  sounds.playPop();
                  onTeleportWaypoint();
                }}
                className="mc-btn px-2 py-1 text-[11px] font-bold cursor-pointer text-yellow-200"
                title="Warp to saved custom waypoint"
              >
                ⚡ Warp WP
              </button>
            )}
          </div>
        </div>

        {/* Center: Vehicle Driving HUD */}
        {mountedVehicle ? (
          <div className="bg-gradient-to-r from-blue-900/90 to-cyan-900/90 text-white px-3 py-1 rounded-full border border-cyan-400 flex items-center gap-2 shadow-xl pointer-events-auto animate-pulse">
            <span className="text-sm">
              {mountedVehicle.type === 'car' ? '🏎️' : mountedVehicle.type === 'bike' ? '🏍️' : '🚣'}
            </span>
            <span className="font-bold text-[11px] text-cyan-200 uppercase tracking-wide hidden sm:inline">
              {(Math.abs(mountedVehicle.speed) * 3.6).toFixed(0)} km/h
            </span>
            <button
              onClick={() => {
                sounds.playPop();
                onDismountVehicle();
              }}
              className="bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer shadow"
            >
              Exit
            </button>
          </div>
        ) : null}

        {/* Right: Clean Action Bar */}
        <div className="flex items-center gap-1 md:gap-1.5 pointer-events-auto shrink-0 flex-nowrap overflow-x-auto">
          {/* 1-Click Vehicle Spawner (Desktop / Tablet) */}
          {onSpawnVehicle && (
            <div className="hidden xl:flex bg-black/60 p-0.5 rounded border border-white/20 items-center gap-1 shadow-md">
              <button
                onClick={() => {
                  sounds.playPop();
                  onSpawnVehicle('car');
                }}
                className="mc-btn px-2 py-1 text-[11px] font-bold cursor-pointer hover:scale-105 active:scale-95"
                title="Spawn Offroader Car"
              >
                🏎️ Car
              </button>
              <button
                onClick={() => {
                  sounds.playPop();
                  onSpawnVehicle('bike');
                }}
                className="mc-btn px-2 py-1 text-[11px] font-bold cursor-pointer hover:scale-105 active:scale-95"
                title="Spawn Motorcycle"
              >
                🏍️ Bike
              </button>
              <button
                onClick={() => {
                  sounds.playPop();
                  onSpawnVehicle('boat');
                }}
                className="mc-btn px-2 py-1 text-[11px] font-bold cursor-pointer hover:scale-105 active:scale-95"
                title="Spawn Rowboat"
              >
                🚣 Boat
              </button>
            </div>
          )}

          {/* Flight Toggle & Speed */}
          <div className="flex items-center">
            <button
              onClick={() => {
                sounds.playPop();
                onToggleFly();
              }}
              className={`mc-btn px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-bold cursor-pointer flex items-center gap-0.5 ${
                isFlying ? 'bg-cyan-700 text-cyan-100 border-cyan-400' : ''
              }`}
              title="Toggle Flight Mode [F]"
            >
              <span>🕊️</span>
              <span className="hidden sm:inline">{isFlying ? 'FLY' : 'FLY'}</span>
            </button>
            {isFlying && (
              <button
                onClick={() => {
                  sounds.playPop();
                  onToggleFlySpeed();
                }}
                className="mc-btn px-1 py-0.5 sm:px-1.5 sm:py-1 text-[10px] sm:text-xs font-bold cursor-pointer text-yellow-300 ml-0.5"
                title="Cycle Flight Speed (1x, 2x, 3x)"
              >
                {flySpeedMultiplier}x
              </button>
            )}
          </div>

          {/* Master Build Menu */}
          <button
            onClick={() => {
              sounds.playPop();
              onOpenBuildMenu();
            }}
            className="mc-btn px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold text-yellow-200 hover:text-white cursor-pointer shadow flex items-center gap-1 border border-yellow-400 bg-gradient-to-b from-[#3b6ea5] to-[#254668]"
            title="Open Master Build Studio [B]"
          >
            <span>⚒️</span>
            <span>BUILD</span>
          </button>

          {/* Bag / Inventory */}
          <button
            onClick={() => {
              sounds.playPop();
              onOpenInventory();
            }}
            className="mc-btn px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-bold cursor-pointer flex items-center gap-0.5"
            title="Open Inventory / Crafting [E]"
          >
            <span>🎒</span>
            <span className="hidden sm:inline">BAG</span>
          </button>

          {/* Advancements Trophies */}
          <button
            onClick={() => {
              sounds.playPop();
              onOpenAdvancements();
            }}
            className="mc-btn px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-bold text-yellow-300 cursor-pointer shadow hidden sm:flex items-center gap-0.5 border border-yellow-500/60"
            title="Open Advancements & Trophies"
          >
            <span>🏆</span>
          </button>

          {/* Home Teleport */}
          <button
            onClick={() => {
              sounds.playPop();
              onTeleportHome();
            }}
            className="mc-btn px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-bold cursor-pointer"
            title="Teleport to Spawn"
          >
            🏠
          </button>

          {/* Quick Undo */}
          <button
            onClick={() => {
              sounds.playPop();
              onUndo();
            }}
            disabled={!canUndo}
            className="mc-btn px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-bold cursor-pointer disabled:opacity-40"
            title="Undo last placed structure (Z)"
          >
            <span>↩</span>
          </button>

          {/* Audio Mute toggle */}
          <button
            onClick={() => {
              sounds.playPop();
              onToggleMute();
            }}
            className="mc-btn px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-bold cursor-pointer"
            title="Toggle Audio"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* GUI Scale Toggle (Compact for Mobile / Large) */}
          <button
            onClick={() => {
              sounds.playPop();
              setGuiScale((s) => (s === 'compact' ? 'normal' : 'compact'));
            }}
            className={`mc-btn px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-bold cursor-pointer transition-colors ${
              guiScale === 'compact' ? 'bg-cyan-800/80 border-cyan-400 text-cyan-100' : 'bg-black/60 text-gray-300'
            }`}
            title="Toggle HUD GUI Scale (Compact for Mobile / Large)"
          >
            📐 {guiScale === 'compact' ? 'MINI' : 'FULL'}
          </button>

          {/* Mobile On-Screen Controls Toggle */}
          <button
            onClick={() => {
              sounds.playPop();
              onToggleMobileControls();
            }}
            className={`mc-btn px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-bold cursor-pointer transition-colors ${
              showMobileControls ? 'bg-green-700/80 border-green-400 text-green-100' : 'bg-black/60 text-gray-300'
            }`}
            title="Toggle Mobile On-Screen Keys"
          >
            📱
          </button>
        </div>
      </div>

      {/* Bottom HUD: Authentic Minecraft Bottom Interface with Hearts, Hunger, XP Bar & Blocks Hotbar Only */}
      <div
        className={`fixed bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center z-20 max-w-[98vw] transition-transform ${
          guiScale === 'compact' ? 'scale-85 sm:scale-95 md:scale-100 origin-bottom' : 'scale-100 origin-bottom'
        }`}
      >
        {/* Selected Held Item Tooltip Banner */}
        {selectedItem && (
          <div className="mb-0.5 sm:mb-1 text-center font-bold text-[10px] sm:text-xs text-yellow-300 bg-black/85 px-2.5 py-0.5 rounded-full border border-white/20 shadow-md drop-shadow backdrop-blur-xs flex items-center gap-1 animate-fade-in">
            <span>{getItemDisplayName(selectedItem.id)}</span>
          </div>
        )}



        {/* 9-Slot Authentic Blocks Hotbar (Clean - No clutter below) */}
        <div className="flex bg-[#8f8f8f] p-0.5 border-t-2 border-l-2 border-[#dbdbdb] border-r-2 border-b-2 border-[#2b2b2b] shadow-2xl rounded-xs max-w-full overflow-x-auto">
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
                className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 flex items-center justify-center relative cursor-pointer m-0.5 shrink-0 ${
                  isSelected
                    ? 'border-2 border-white bg-[#a8a8a8] shadow-inner scale-105 z-10'
                    : 'border border-[#383838] bg-[#8b8b8b] hover:bg-[#9a9a9a]'
                }`}
              >
                {/* Slot number hint */}
                <span className="absolute top-0.5 left-0.5 text-[7px] sm:text-[8px] text-white/50 leading-none">
                  {index + 1}
                </span>

                {/* Item Icon */}
                {iconUrl && (
                  <img
                    src={iconUrl}
                    alt={slot?.id}
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 object-contain pixelated pointer-events-none drop-shadow"
                  />
                )}

                {/* Count Badge (∞ in Creative Mode!) */}
                {slot && (
                  <span className="absolute bottom-0.5 right-0.5 text-[8px] sm:text-[9px] font-bold text-yellow-300 drop-shadow-[1px_1px_0px_#222]">
                    ∞
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
