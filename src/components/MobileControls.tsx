/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { sounds } from '../game/audio';

interface MobileControlsProps {
  onSetKey: (key: string, code: string, pressed: boolean) => void;
  onMineStart: () => void;
  onMineStop: () => void;
  onInteract: () => void;
  onRotateCamera: (deltaYaw: number) => void;
  isFlying: boolean;
  onToggleFly: () => void;
  isMounted: boolean;
  onDismount: () => void;
  onOpenInventory: () => void;
  onOpenBuildMenu: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onTeleportHome: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onSetKey,
  onMineStart,
  onMineStop,
  onInteract,
  onRotateCamera,
  isFlying,
  onToggleFly,
  isMounted,
  onDismount,
  onOpenInventory,
  onOpenBuildMenu,
  canUndo,
  onUndo,
  onTeleportHome,
}) => {
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});
  const [isMiningActive, setIsMiningActive] = useState<boolean>(false);
  const [isSprinting, setIsSprinting] = useState<boolean>(false);
  const [isSneaking, setIsSneaking] = useState<boolean>(false);

  const handleTouchDown = (key: string, code: string) => {
    setActiveKeys((prev) => ({ ...prev, [key]: true }));
    onSetKey(key, code, true);
  };

  const handleTouchUp = (key: string, code: string) => {
    setActiveKeys((prev) => ({ ...prev, [key]: false }));
    onSetKey(key, code, false);
  };

  const toggleSprint = () => {
    const next = !isSprinting;
    setIsSprinting(next);
    onSetKey('control', 'ControlLeft', next);
    sounds.playPop();
  };

  const toggleSneak = () => {
    const next = !isSneaking;
    setIsSneaking(next);
    onSetKey('shift', 'ShiftLeft', next);
    sounds.playPop();
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between">
      {/* Top Floating Mobile Toolbar */}
      <div className="px-2 pt-14 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs p-1.5 rounded-lg border border-white/20">
          {/* Quick Turn Left */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onRotateCamera(0.5);
              sounds.playPop();
            }}
            onClick={() => onRotateCamera(0.5)}
            className="w-9 h-9 mc-btn flex items-center justify-center text-sm font-bold active:scale-95 text-white"
            title="Turn Camera Left"
          >
            ↺
          </button>

          {/* Quick Turn Right */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onRotateCamera(-0.5);
              sounds.playPop();
            }}
            onClick={() => onRotateCamera(-0.5)}
            className="w-9 h-9 mc-btn flex items-center justify-center text-sm font-bold active:scale-95 text-white"
            title="Turn Camera Right"
          >
            ↻
          </button>

          {/* Fly Toggle */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onToggleFly();
              sounds.playPop();
            }}
            onClick={onToggleFly}
            className={`w-9 h-9 mc-btn flex items-center justify-center text-xs font-bold active:scale-95 ${
              isFlying ? 'bg-cyan-600 text-white border-cyan-300' : ''
            }`}
            title="Toggle Fly Mode"
          >
            🕊️
          </button>

          {/* Undo Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              if (canUndo) {
                onUndo();
                sounds.playPop();
              }
            }}
            onClick={() => canUndo && onUndo()}
            disabled={!canUndo}
            className="w-9 h-9 mc-btn flex items-center justify-center text-xs font-bold active:scale-95 disabled:opacity-40"
            title="Undo Build"
          >
            ↩
          </button>

          {/* Home Spawn */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onTeleportHome();
              sounds.playPop();
            }}
            onClick={onTeleportHome}
            className="w-9 h-9 mc-btn flex items-center justify-center text-xs font-bold active:scale-95"
            title="Teleport to Spawn"
          >
            🏠
          </button>
        </div>

        {/* Right Top Quick Modals */}
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs p-1.5 rounded-lg border border-white/20">
          {/* Dismount Vehicle if riding */}
          {isMounted && (
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onDismount();
                sounds.playPop();
              }}
              onClick={onDismount}
              className="px-2.5 h-9 bg-red-600 text-white font-bold text-xs rounded border border-red-300 active:scale-95"
            >
              Exit Vehicle
            </button>
          )}

          {/* Build Menu [B] */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onOpenBuildMenu();
              sounds.playPop();
            }}
            onClick={onOpenBuildMenu}
            className="px-2.5 h-9 mc-btn flex items-center gap-1 text-xs font-bold text-yellow-300 active:scale-95 border-yellow-500/60"
          >
            <span>⚒️</span>
            <span>BUILD</span>
          </button>

          {/* Bag / Inventory [E] */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onOpenInventory();
              sounds.playPop();
            }}
            onClick={onOpenInventory}
            className="px-2.5 h-9 mc-btn flex items-center gap-1 text-xs font-bold active:scale-95"
          >
            <span>🎒</span>
            <span>BAG</span>
          </button>
        </div>
      </div>

      {/* Bottom Controls Row: D-Pad on Left, Action Buttons on Right */}
      <div className="p-3 pb-24 md:pb-20 flex justify-between items-end pointer-events-none">
        {/* Left Side: Authentic Minecraft D-Pad Cluster (W, A, S, D) */}
        <div className="pointer-events-auto flex flex-col items-center">
          {/* D-Pad Container (Cross Layout) */}
          <div className="relative w-36 h-36 select-none touch-none">
            {/* Background disc */}
            <div className="absolute inset-0 rounded-full bg-black/40 border-2 border-white/20 backdrop-blur-xs pointer-events-none" />

            {/* FORWARD: Key W */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchDown('w', 'KeyW');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchUp('w', 'KeyW');
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                handleTouchUp('w', 'KeyW');
              }}
              onMouseDown={() => handleTouchDown('w', 'KeyW')}
              onMouseUp={() => handleTouchUp('w', 'KeyW')}
              onMouseLeave={() => handleTouchUp('w', 'KeyW')}
              className={`absolute top-0 left-12 w-12 h-12 rounded-t-lg flex flex-col items-center justify-center font-bold text-white transition-all shadow-md ${
                activeKeys['w']
                  ? 'bg-white/50 scale-95 border-2 border-yellow-300'
                  : 'bg-[#4a4a4a]/90 hover:bg-[#5a5a5a] border-t-2 border-x-2 border-[#777]'
              }`}
            >
              <span className="text-sm leading-none">▲</span>
              <span className="text-[10px] text-yellow-300 font-mono">W</span>
            </button>

            {/* STRAFE LEFT: Key A */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchDown('a', 'KeyA');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchUp('a', 'KeyA');
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                handleTouchUp('a', 'KeyA');
              }}
              onMouseDown={() => handleTouchDown('a', 'KeyA')}
              onMouseUp={() => handleTouchUp('a', 'KeyA')}
              onMouseLeave={() => handleTouchUp('a', 'KeyA')}
              className={`absolute top-12 left-0 w-12 h-12 rounded-l-lg flex flex-row items-center justify-center gap-1 font-bold text-white transition-all shadow-md ${
                activeKeys['a']
                  ? 'bg-white/50 scale-95 border-2 border-yellow-300'
                  : 'bg-[#4a4a4a]/90 hover:bg-[#5a5a5a] border-l-2 border-y-2 border-[#777]'
              }`}
            >
              <span className="text-sm leading-none">◀</span>
              <span className="text-[10px] text-yellow-300 font-mono">A</span>
            </button>

            {/* CENTER BUTTON: Sneak Toggle */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                toggleSneak();
              }}
              onClick={toggleSneak}
              className={`absolute top-12 left-12 w-12 h-12 flex items-center justify-center font-bold text-[10px] transition-all ${
                isSneaking
                  ? 'bg-yellow-500 text-black border-2 border-white'
                  : 'bg-[#333333]/90 text-gray-300 hover:bg-[#444] border border-[#555]'
              }`}
              title="Sneak / Crouch Toggle"
            >
              {isSneaking ? 'SNEAK' : '●'}
            </button>

            {/* STRAFE RIGHT: Key D */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchDown('d', 'KeyD');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchUp('d', 'KeyD');
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                handleTouchUp('d', 'KeyD');
              }}
              onMouseDown={() => handleTouchDown('d', 'KeyD')}
              onMouseUp={() => handleTouchUp('d', 'KeyD')}
              onMouseLeave={() => handleTouchUp('d', 'KeyD')}
              className={`absolute top-12 right-0 w-12 h-12 rounded-r-lg flex flex-row items-center justify-center gap-1 font-bold text-white transition-all shadow-md ${
                activeKeys['d']
                  ? 'bg-white/50 scale-95 border-2 border-yellow-300'
                  : 'bg-[#4a4a4a]/90 hover:bg-[#5a5a5a] border-r-2 border-y-2 border-[#777]'
              }`}
            >
              <span className="text-[10px] text-yellow-300 font-mono">D</span>
              <span className="text-sm leading-none">▶</span>
            </button>

            {/* BACKWARD: Key S */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchDown('s', 'KeyS');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchUp('s', 'KeyS');
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                handleTouchUp('s', 'KeyS');
              }}
              onMouseDown={() => handleTouchDown('s', 'KeyS')}
              onMouseUp={() => handleTouchUp('s', 'KeyS')}
              onMouseLeave={() => handleTouchUp('s', 'KeyS')}
              className={`absolute bottom-0 left-12 w-12 h-12 rounded-b-lg flex flex-col items-center justify-center font-bold text-white transition-all shadow-md ${
                activeKeys['s']
                  ? 'bg-white/50 scale-95 border-2 border-yellow-300'
                  : 'bg-[#4a4a4a]/90 hover:bg-[#5a5a5a] border-b-2 border-x-2 border-[#777]'
              }`}
            >
              <span className="text-[10px] text-yellow-300 font-mono">S</span>
              <span className="text-sm leading-none">▼</span>
            </button>
          </div>

          {/* Sprint Toggle under D-Pad */}
          <div className="mt-2 flex gap-1">
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                toggleSprint();
              }}
              onClick={toggleSprint}
              className={`px-3 py-1 rounded text-[11px] font-bold border transition-all ${
                isSprinting
                  ? 'bg-orange-600 text-white border-orange-300 shadow-md'
                  : 'bg-black/60 text-gray-300 border-white/20'
              }`}
            >
              ⚡ SPRINT {isSprinting ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Right Side: Action Cluster (Jump, Mine/Attack, Place/Use, Down) */}
        <div className="pointer-events-auto flex flex-col items-end gap-2.5">
          {/* Secondary Action Row: Mine & Place */}
          <div className="flex gap-2">
            {/* MINE / ATTACK BUTTON (Hold to mine, tap to strike) */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                setIsMiningActive(true);
                onMineStart();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setIsMiningActive(false);
                onMineStop();
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                setIsMiningActive(false);
                onMineStop();
              }}
              onMouseDown={() => {
                setIsMiningActive(true);
                onMineStart();
              }}
              onMouseUp={() => {
                setIsMiningActive(false);
                onMineStop();
              }}
              className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-xl transition-all border-2 ${
                isMiningActive
                  ? 'bg-red-700/90 border-red-300 scale-95 animate-pulse'
                  : 'bg-gradient-to-b from-[#6b2121]/90 to-[#3f1212]/90 border-red-400/80 hover:bg-red-800'
              }`}
              title="Hold to Mine Block / Tap to Attack Mob"
            >
              <span className="text-base leading-none">⛏️</span>
              <span className="text-[9px] font-bold tracking-tight text-red-200">MINE</span>
            </button>

            {/* PLACE / USE / INTERACT BUTTON */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onInteract();
                sounds.playPop();
              }}
              onClick={() => {
                onInteract();
                sounds.playPop();
              }}
              className="w-14 h-14 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-xl transition-all border-2 bg-gradient-to-b from-[#1e4e2a]/90 to-[#122e1a]/90 border-green-400/80 active:scale-95 hover:bg-green-800"
              title="Place Block / Open Crafting or Chest"
            >
              <span className="text-base leading-none">🧱</span>
              <span className="text-[9px] font-bold tracking-tight text-green-200">PLACE</span>
            </button>
          </div>

          {/* Primary Action Row: Jump and Sink */}
          <div className="flex items-center gap-2">
            {/* Fly Down / Sink Button (shown when flying or sneaking) */}
            {isFlying && (
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  handleTouchDown('shift', 'ShiftLeft');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleTouchUp('shift', 'ShiftLeft');
                }}
                onTouchCancel={(e) => {
                  e.preventDefault();
                  handleTouchUp('shift', 'ShiftLeft');
                }}
                onMouseDown={() => handleTouchDown('shift', 'ShiftLeft')}
                onMouseUp={() => handleTouchUp('shift', 'ShiftLeft')}
                className={`w-12 h-12 rounded-full flex flex-col items-center justify-center font-bold text-white border-2 transition-all shadow-md ${
                  activeKeys['shift']
                    ? 'bg-cyan-500 scale-95 border-white'
                    : 'bg-black/70 border-cyan-400/60'
                }`}
                title="Fly Down"
              >
                <span className="text-sm">⮟</span>
                <span className="text-[8px] text-cyan-200">DOWN</span>
              </button>
            )}

            {/* JUMP BUTTON (Large right-thumb primary button) */}
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchDown('space', 'Space');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchUp('space', 'Space');
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                handleTouchUp('space', 'Space');
              }}
              onMouseDown={() => handleTouchDown('space', 'Space')}
              onMouseUp={() => handleTouchUp('space', 'Space')}
              className={`w-16 h-16 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-2xl transition-all border-2 ${
                activeKeys['space']
                  ? 'bg-yellow-500/90 text-black border-white scale-95'
                  : 'bg-[#444]/90 border-white/60 hover:bg-[#555]'
              }`}
              title="Jump / Fly Up / Swim"
            >
              <span className="text-xl leading-none">⮝</span>
              <span className="text-[10px] font-bold tracking-wide">JUMP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
