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
  flySpeedMultiplier: number;
  onToggleFlySpeed: () => void;
  isMounted: boolean;
  onDismount: () => void;
  onOpenInventory: () => void;
  onOpenBuildMenu: () => void;
  onOpenAdvancements: () => void;
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
  isMounted,
  onDismount,
  canUndo,
  onUndo,
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
    <div className="fixed inset-0 pointer-events-none select-none z-30">
      {/* LEFT SIDE: D-Pad, Sprint & Camera Turn Left */}
      <div className="fixed bottom-3 left-3 pointer-events-auto flex flex-col items-center select-none">
        {/* Quick Turn Left & Undo buttons above D-Pad */}
        <div className="flex items-center gap-1.5 mb-2 w-full justify-start">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onRotateCamera(0.45);
              sounds.playPop();
            }}
            onClick={() => onRotateCamera(0.45)}
            className="w-8 h-8 mc-btn flex items-center justify-center text-xs font-bold active:scale-95 text-white bg-black/60 border border-white/30 rounded"
            title="Turn Camera Left"
          >
            ↺
          </button>

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
            className="w-8 h-8 mc-btn flex items-center justify-center text-xs font-bold active:scale-95 disabled:opacity-40 bg-black/60 border border-white/30 rounded"
            title="Undo Build"
          >
            ↩
          </button>

          <button
            onTouchStart={(e) => {
              e.preventDefault();
              toggleSprint();
            }}
            onClick={toggleSprint}
            className={`px-2 h-8 rounded text-[10px] font-bold border transition-all ${
              isSprinting
                ? 'bg-orange-600 text-white border-orange-300 shadow-md'
                : 'bg-black/60 text-gray-300 border-white/30'
            }`}
            title="Toggle Sprint Run"
          >
            ⚡ {isSprinting ? 'RUN' : 'WALK'}
          </button>
        </div>

        {/* Authentic Minecraft D-Pad Cluster (W, A, S, D) */}
        <div className="relative w-32 h-32 select-none touch-none">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full bg-black/45 border-2 border-white/20 backdrop-blur-xs pointer-events-none" />

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
            className={`absolute top-0 left-10 w-12 h-11 rounded-t-lg flex flex-col items-center justify-center font-bold text-white transition-all shadow-md ${
              activeKeys['w']
                ? 'bg-white/50 scale-95 border-2 border-yellow-300'
                : 'bg-[#4a4a4a]/90 hover:bg-[#5a5a5a] border-t-2 border-x-2 border-[#777]'
            }`}
          >
            <span className="text-sm leading-none">▲</span>
            <span className="text-[9px] text-yellow-300 font-mono">W</span>
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
            className={`absolute top-10 left-0 w-11 h-12 rounded-l-lg flex flex-row items-center justify-center gap-0.5 font-bold text-white transition-all shadow-md ${
              activeKeys['a']
                ? 'bg-white/50 scale-95 border-2 border-yellow-300'
                : 'bg-[#4a4a4a]/90 hover:bg-[#5a5a5a] border-l-2 border-y-2 border-[#777]'
            }`}
          >
            <span className="text-sm leading-none">◀</span>
            <span className="text-[9px] text-yellow-300 font-mono">A</span>
          </button>

          {/* CENTER BUTTON: Sneak Toggle */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              toggleSneak();
            }}
            onClick={toggleSneak}
            className={`absolute top-10 left-10 w-12 h-12 flex items-center justify-center font-bold text-[9px] transition-all ${
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
            className={`absolute top-10 right-0 w-11 h-12 rounded-r-lg flex flex-row items-center justify-center gap-0.5 font-bold text-white transition-all shadow-md ${
              activeKeys['d']
                ? 'bg-white/50 scale-95 border-2 border-yellow-300'
                : 'bg-[#4a4a4a]/90 hover:bg-[#5a5a5a] border-r-2 border-y-2 border-[#777]'
            }`}
          >
            <span className="text-[9px] text-yellow-300 font-mono">D</span>
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
            className={`absolute bottom-0 left-10 w-12 h-11 rounded-b-lg flex flex-col items-center justify-center font-bold text-white transition-all shadow-md ${
              activeKeys['s']
                ? 'bg-white/50 scale-95 border-2 border-yellow-300'
                : 'bg-[#4a4a4a]/90 hover:bg-[#5a5a5a] border-b-2 border-x-2 border-[#777]'
            }`}
          >
            <span className="text-[9px] text-yellow-300 font-mono">S</span>
            <span className="text-sm leading-none">▼</span>
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Action Buttons (Mine, Place, Jump, Fly Down) */}
      <div className="fixed bottom-3 right-3 pointer-events-auto flex flex-col items-end select-none">
        {/* Quick Turn Right & Dismount buttons above action cluster */}
        <div className="flex items-center gap-1.5 mb-2">
          {isMounted && (
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onDismount();
                sounds.playPop();
              }}
              onClick={onDismount}
              className="px-2 h-8 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] rounded border border-red-300 active:scale-95 shadow"
            >
              Exit Vehicle
            </button>
          )}

          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onRotateCamera(-0.45);
              sounds.playPop();
            }}
            onClick={() => onRotateCamera(-0.45)}
            className="w-8 h-8 mc-btn flex items-center justify-center text-xs font-bold active:scale-95 text-white bg-black/60 border border-white/30 rounded"
            title="Turn Camera Right"
          >
            ↻
          </button>
        </div>

        {/* Action Buttons Row 1: MINE & PLACE */}
        <div className="flex items-center gap-2 mb-2">
          {/* INSTANT MINE BUTTON (Tap or Hold to break block instantly in Creative) */}
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
            className={`w-13 h-13 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-xl transition-all border-2 ${
              isMiningActive
                ? 'bg-red-700/90 border-red-300 scale-95 animate-pulse'
                : 'bg-gradient-to-b from-[#7f1d1d]/90 to-[#450a0a]/90 border-red-400/80 hover:bg-red-800'
            }`}
            title="Instant Break Block / Attack"
          >
            <span className="text-base leading-none">⛏️</span>
            <span className="text-[8px] font-bold tracking-tight text-red-200">MINE</span>
          </button>

          {/* PLACE / USE BUTTON */}
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
            className="w-13 h-13 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-xl transition-all border-2 bg-gradient-to-b from-[#14532d]/90 to-[#052e16]/90 border-green-400/80 active:scale-95 hover:bg-green-800"
            title="Place Block / Interact"
          >
            <span className="text-base leading-none">🧱</span>
            <span className="text-[8px] font-bold tracking-tight text-green-200">PLACE</span>
          </button>
        </div>

        {/* Action Buttons Row 2: Fly Down & JUMP */}
        <div className="flex items-center gap-2">
          {/* Fly Down Button (shown when flying) */}
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
              className={`w-11 h-11 rounded-full flex flex-col items-center justify-center font-bold text-white border-2 transition-all shadow-md ${
                activeKeys['shift']
                  ? 'bg-cyan-500 scale-95 border-white'
                  : 'bg-black/70 border-cyan-400/60'
              }`}
              title="Fly Down"
            >
              <span className="text-xs">⮟</span>
              <span className="text-[7px] text-cyan-200">DOWN</span>
            </button>
          )}

          {/* JUMP BUTTON */}
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
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-2xl transition-all border-2 ${
              activeKeys['space']
                ? 'bg-yellow-500/90 text-black border-white scale-95'
                : 'bg-[#444]/90 border-white/60 hover:bg-[#555]'
            }`}
            title="Jump / Fly Up / Swim"
          >
            <span className="text-lg leading-none">⮝</span>
            <span className="text-[9px] font-bold tracking-wide">JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
