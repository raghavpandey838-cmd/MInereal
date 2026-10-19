/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ItemStack } from '../game/types';
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
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-between">
      {/* Screen Center Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="drop-shadow-sm">
          <line x1="10" y1="2" x2="10" y2="18" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
          <line x1="2" y1="10" x2="18" y2="10" stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
        </svg>
      </div>

      {/* Advancement Toast Notification (Top-Right Pop-In) */}
      {recentAdvancement && (
        <div className="absolute top-16 right-4 z-50 pointer-events-auto animate-bounce shadow-2xl">
          <div className="bg-[#1f1a14] border-2 border-[#d97706] text-white px-4 py-2.5 rounded-lg flex items-center gap-3 max-w-sm backdrop-blur-md">
            <span className="text-3xl p-1 bg-yellow-500/20 rounded border border-yellow-400">
              {recentAdvancement.icon}
            </span>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-yellow-400 font-bold flex items-center gap-1 font-mono">
                <span>🏆 ADVANCEMENT MADE!</span>
              </div>
              <div className="font-bold text-sm text-yellow-100">{recentAdvancement.title}</div>
              <div className="text-[11px] text-gray-300 leading-snug">{recentAdvancement.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar: Nav Coordinates, Time Controller, Flight Booster & Action Toolbar */}
      <div className="p-3 text-xs text-white/90 drop-shadow flex flex-wrap items-center justify-between gap-2 z-20">
        {/* Left: Compass & Coordinates Cluster */}
        <div className="flex items-center gap-1.5 pointer-events-auto flex-wrap">
          <div className="bg-black/65 px-3 py-1.5 rounded border border-white/20 flex items-center gap-2 font-mono shadow-md">
            <span className="text-yellow-400 font-bold">🧭 {compassHeading}</span>
            <span className="text-white/40">|</span>
            <span className="text-cyan-300">
              X: {Math.floor(playerCoords.x)} Y: {Math.floor(playerCoords.y)} Z: {Math.floor(playerCoords.z)}
            </span>
          </div>

          {/* Quick Home / Spawn Teleport */}
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

          {/* Waypoint buttons */}
          <button
            onClick={() => {
              sounds.playPop();
              onSaveWaypoint();
            }}
            className="mc-btn px-2 py-1 text-[11px] font-bold cursor-pointer text-cyan-200"
            title="Save your current position as a custom teleport waypoint"
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
              title="Warp to your saved custom waypoint"
            >
              ⚡ Warp WP
            </button>
          )}

          {/* Audio Mute toggle */}
          <button
            onClick={() => {
              sounds.playPop();
              onToggleMute();
            }}
            className="mc-btn px-2 py-1 text-[11px] font-bold cursor-pointer"
            title="Toggle Audio"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Mobile On-Screen Controls Toggle */}
          <button
            onClick={() => {
              sounds.playPop();
              onToggleMobileControls();
            }}
            className={`mc-btn px-2 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
              showMobileControls ? 'bg-green-700/80 border-green-400 text-green-100' : 'bg-black/60 text-gray-300'
            }`}
            title="Toggle Mobile On-Screen Keys"
          >
            📱 {showMobileControls ? 'KEYS ON' : 'KEYS OFF'}
          </button>
        </div>

        {/* Center: Active Vehicle Driving HUD or Desktop Click lock banner */}
        {mountedVehicle ? (
          <div className="bg-gradient-to-r from-blue-900/90 to-cyan-900/90 text-white px-4 py-1.5 rounded-full border border-cyan-400 flex items-center gap-3 shadow-xl pointer-events-auto animate-pulse">
            <span className="text-base">
              {mountedVehicle.type === 'car' ? '🏎️' : mountedVehicle.type === 'bike' ? '🏍️' : '🚣'}
            </span>
            <div className="flex flex-col text-left leading-none">
              <span className="font-bold text-xs uppercase tracking-wide text-cyan-200">
                {mountedVehicle.type === 'car'
                  ? 'Driving Offroader Car'
                  : mountedVehicle.type === 'bike'
                  ? 'Riding Motorcycle'
                  : 'Sailing Boat in Water'}
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
          <div className="bg-black/75 backdrop-blur-xs text-white px-3 py-1 rounded border border-white/20 font-bold text-xs shadow-lg pointer-events-none flex items-center gap-2">
            <span className="text-yellow-400">📱 Mobile:</span>
            <span>Use onscreen WASD keys</span>
            <span className="text-white/40 hidden sm:inline">|</span>
            <span className="text-gray-300 hidden sm:inline">Desktop: Click to lock mouse</span>
          </div>
        ) : null}

        {/* Right: Master Build Menu, Advancements & Creative Power Toolbar */}
        <div className="flex items-center gap-1.5 pointer-events-auto flex-wrap">
          {/* Celestial Time-of-day Quick Buttons */}
          <div className="bg-black/60 px-1.5 py-1 rounded border border-white/20 flex items-center gap-1 shadow-md">
            <button
              onClick={() => {
                sounds.playPop();
                onSetTimeOfDay(0.5); // Noon
              }}
              className="px-1.5 py-0.5 hover:bg-yellow-500/40 rounded text-[11px] cursor-pointer"
              title="Set High Noon (Sunny Day)"
            >
              ☀️ Noon
            </button>
            <button
              onClick={() => {
                sounds.playPop();
                onSetTimeOfDay(0.75); // Sunset
              }}
              className="px-1.5 py-0.5 hover:bg-orange-500/40 rounded text-[11px] cursor-pointer"
              title="Set Golden Sunset"
            >
              🌅 Sunset
            </button>
            <button
              onClick={() => {
                sounds.playPop();
                onSetTimeOfDay(0.0); // Midnight
              }}
              className="px-1.5 py-0.5 hover:bg-indigo-500/40 rounded text-[11px] cursor-pointer"
              title="Set Starry Midnight"
            >
              🌙 Night
            </button>
          </div>

          {/* Flight Mode Toggle & Speed Boost */}
          <div className="flex items-center">
            <button
              onClick={() => {
                sounds.playPop();
                onToggleFly();
              }}
              className={`mc-btn px-2.5 py-1.5 text-xs font-bold cursor-pointer flex items-center gap-1 ${
                isFlying ? 'bg-cyan-700 text-cyan-100 border-cyan-400' : ''
              }`}
              title="Toggle Flight Mode [F] (Space to fly up, Shift to fly down)"
            >
              <span>🕊️</span>
              <span>{isFlying ? 'FLY ON' : 'FLY [F]'}</span>
            </button>
            {isFlying && (
              <button
                onClick={() => {
                  sounds.playPop();
                  onToggleFlySpeed();
                }}
                className="mc-btn px-2 py-1.5 text-xs font-bold cursor-pointer text-yellow-300 ml-1"
                title="Cycle Flight Speed (1x, 2x, 3x)"
              >
                🚀 {flySpeedMultiplier}x
              </button>
            )}
          </div>

          {/* Advancements Modal Button */}
          <button
            onClick={() => {
              sounds.playPop();
              onOpenAdvancements();
            }}
            className="mc-btn px-2.5 py-1.5 text-xs font-bold text-yellow-300 hover:text-white cursor-pointer shadow-lg flex items-center gap-1 border-2 border-yellow-500/60"
            title="Open Advancements & Trophies"
          >
            <span>🏆</span>
            <span className="hidden sm:inline">TROPHIES</span>
          </button>

          {/* Build Menu Trigger */}
          <button
            onClick={() => {
              sounds.playPop();
              onOpenBuildMenu();
            }}
            className="mc-btn px-3 py-1.5 text-xs font-bold text-yellow-200 hover:text-white cursor-pointer shadow-lg flex items-center gap-1.5 border-2 border-yellow-400 bg-gradient-to-b from-[#3b6ea5] to-[#254668]"
            title="Open Master Build Menu [B]"
          >
            <span>⚒️</span>
            <span>BUILD [B]</span>
          </button>

          {/* Bag / Inventory */}
          <button
            onClick={() => {
              sounds.playPop();
              onOpenInventory();
            }}
            className="mc-btn px-2.5 py-1.5 text-xs font-bold cursor-pointer"
            title="Open Creative Palette / Inventory [E]"
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

      {/* Bottom HUD: Hotbar & Creative Hint Strip */}
      <div className="flex flex-col items-center pb-3 w-full">
        {/* Creative Badge Strip */}
        <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] bg-black/60 px-3 py-0.5 rounded-full border border-white/20 text-yellow-300 drop-shadow">
          <span>⭐ CREATIVE MODE</span>
          <span className="text-white/40">|</span>
          <span className="text-green-300">Infinite Blocks</span>
          <span className="text-white/40">|</span>
          <span className="text-cyan-300">Instant 1-Click Break</span>
        </div>

        {/* 9-Slot Authentic Hotbar (Single-Click Responsive) */}
        <div className="pointer-events-auto flex bg-[#8f8f8f] p-1 border-t-2 border-l-2 border-[#dbdbdb] border-r-2 border-b-2 border-[#2b2b2b] shadow-2xl rounded-xs max-w-full overflow-x-auto">
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
                className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center relative cursor-pointer m-0.5 shrink-0 ${
                  isSelected
                    ? 'border-2 border-white bg-[#a8a8a8] shadow-inner scale-105 z-10'
                    : 'border border-[#383838] bg-[#8b8b8b] hover:bg-[#9a9a9a]'
                }`}
              >
                {/* Slot number hint */}
                <span className="absolute top-0.5 left-1 text-[8px] sm:text-[9px] text-white/50 leading-none">
                  {index + 1}
                </span>

                {/* Item Icon */}
                {iconUrl && (
                  <img
                    src={iconUrl}
                    alt={slot?.id}
                    className="w-5 h-5 sm:w-7 sm:h-7 object-contain pixelated pointer-events-none drop-shadow"
                  />
                )}

                {/* Count Badge (∞ in Creative Mode!) */}
                {slot && (
                  <span className="absolute bottom-0.5 right-1 text-[10px] sm:text-xs font-bold text-yellow-300 drop-shadow-[1px_1px_0px_#222]">
                    ∞
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Hotbar Hint & Quick Controls */}
        <div className="text-[10px] text-white/80 mt-1 drop-shadow flex flex-wrap justify-center gap-2 font-mono px-2 text-center">
          <span className="text-yellow-300 font-bold">W A S D to Move</span>
          <span>⛏️ Click to Break (Instant)</span>
          <span>🧱 Tap to Place</span>
          <span>🕊️ Fly [F]</span>
          <span>🏛️ Build Menu [B]</span>
          <span>🏆 Trophies</span>
        </div>
      </div>
    </div>
  );
};
