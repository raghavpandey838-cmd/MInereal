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
      {/* LEFT SIDE: Compact Authentic Minecraft D-Pad Cluster */}
      <div className="fixed bottom-2 left-2 sm:bottom-3 sm:left-3 pointer-events-auto flex flex-col items-start select-none">
        {/* Quick Micro Turn Left, Undo, Sprint */}
        <div className="flex items-center gap-1 mb-1.5">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onRotateCamera(0.45);
              sounds.playPop();
            }}
            onClick={() => onRotateCamera(0.45)}
            className="w-7 h-7 mc-btn flex items-center justify-center text-[10px] font-bold active:scale-95 text-white/90 bg-black/40 border border-white/20 rounded shadow-xs backdrop-blur-[2px]"
            title="Turn Camera Left"
          >
            ↺
          </button>

          {canUndo && (
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onUndo();
                sounds.playPop();
              }}
              onClick={() => onUndo()}
              className="w-7 h-7 mc-btn flex items-center justify-center text-[10px] font-bold active:scale-95 text-white/90 bg-black/40 border border-white/20 rounded shadow-xs backdrop-blur-[2px]"
              title="Undo Build"
            >
              ↩
            </button>
          )}

          <button
            onTouchStart={(e) => {
              e.preventDefault();
              toggleSprint();
            }}
            onClick={toggleSprint}
            className={`px-1.5 h-7 rounded text-[9px] font-bold border transition-all backdrop-blur-[2px] ${
              isSprinting
                ? 'bg-orange-600/80 text-white border-orange-300 shadow-xs'
                : 'bg-black/40 text-gray-300 border-white/20'
            }`}
            title="Toggle Sprint Run"
          >
            ⚡ {isSprinting ? 'RUN' : 'WALK'}
          </button>
        </div>

        {/* Compact Translucent D-Pad (24x24 = 96px on mobile, leaving maximum game visibility) */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 select-none touch-none">
          {/* Subtle translucent background circle */}
          <div className="absolute inset-0 rounded-full bg-black/25 border border-white/15 backdrop-blur-[2px] pointer-events-none" />

          {/* FORWARD (W) */}
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
            className={`absolute top-0 left-7 sm:left-9 w-10 sm:w-10 h-8 sm:h-9 rounded-t-md flex flex-col items-center justify-center font-bold text-white transition-all shadow-xs ${
              activeKeys['w']
                ? 'bg-white/40 scale-95 border-2 border-yellow-300'
                : 'bg-black/40 hover:bg-black/50 border-t border-x border-white/25'
            }`}
          >
            <span className="text-xs leading-none">▲</span>
          </button>

          {/* STRAFE LEFT (A) */}
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
            className={`absolute top-7 sm:top-9 left-0 w-8 sm:w-9 h-10 sm:h-10 rounded-l-md flex items-center justify-center font-bold text-white transition-all shadow-xs ${
              activeKeys['a']
                ? 'bg-white/40 scale-95 border-2 border-yellow-300'
                : 'bg-black/40 hover:bg-black/50 border-l border-y border-white/25'
            }`}
          >
            <span className="text-xs leading-none">◀</span>
          </button>

          {/* SNEAK CENTER BUTTON */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              toggleSneak();
            }}
            onClick={toggleSneak}
            className={`absolute top-7 sm:top-9 left-7 sm:left-9 w-10 sm:w-10 h-10 sm:h-10 flex items-center justify-center font-bold text-[8px] transition-all rounded-xs ${
              isSneaking
                ? 'bg-yellow-500/80 text-black border border-white'
                : 'bg-black/50 text-gray-300 hover:bg-black/60 border border-white/20'
            }`}
            title="Sneak / Crouch Toggle"
          >
            {isSneaking ? 'SNEAK' : '●'}
          </button>

          {/* STRAFE RIGHT (D) */}
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
            className={`absolute top-7 sm:top-9 right-0 w-8 sm:w-9 h-10 sm:h-10 rounded-r-md flex items-center justify-center font-bold text-white transition-all shadow-xs ${
              activeKeys['d']
                ? 'bg-white/40 scale-95 border-2 border-yellow-300'
                : 'bg-black/40 hover:bg-black/50 border-r border-y border-white/25'
            }`}
          >
            <span className="text-xs leading-none">▶</span>
          </button>

          {/* BACKWARD (S) */}
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
            className={`absolute bottom-0 left-7 sm:left-9 w-10 sm:w-10 h-8 sm:h-9 rounded-b-md flex flex-col items-center justify-center font-bold text-white transition-all shadow-xs ${
              activeKeys['s']
                ? 'bg-white/40 scale-95 border-2 border-yellow-300'
                : 'bg-black/40 hover:bg-black/50 border-b border-x border-white/25'
            }`}
          >
            <span className="text-xs leading-none">▼</span>
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Compact Action Buttons (Mine, Place, Jump, Fly Down) */}
      <div className="fixed bottom-2 right-2 sm:bottom-3 sm:right-3 pointer-events-auto flex flex-col items-end select-none">
        {/* Turn Right & Vehicle Exit mini bar */}
        <div className="flex items-center gap-1 mb-1.5">
          {isMounted && (
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onDismount();
                sounds.playPop();
              }}
              onClick={onDismount}
              className="px-1.5 h-7 bg-red-600/80 hover:bg-red-500 text-white font-bold text-[9px] rounded border border-red-300 active:scale-95 shadow-xs"
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
            className="w-7 h-7 mc-btn flex items-center justify-center text-[10px] font-bold active:scale-95 text-white/90 bg-black/40 border border-white/20 rounded shadow-xs backdrop-blur-[2px]"
            title="Turn Camera Right"
          >
            ↻
          </button>
        </div>

        {/* Row 1: MINE & PLACE Buttons (Compact 40px translucent discs) */}
        <div className="flex items-center gap-1.5 mb-1.5">
          {/* MINE BUTTON */}
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
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-lg transition-all border backdrop-blur-[2px] ${
              isMiningActive
                ? 'bg-red-700/80 border-red-300 scale-95 animate-pulse'
                : 'bg-red-950/50 hover:bg-red-900/60 border-red-400/50'
            }`}
            title="Instant Break Block / Attack"
          >
            <span className="text-sm leading-none">⛏️</span>
            <span className="text-[7px] font-bold tracking-tight text-red-200">MINE</span>
          </button>

          {/* PLACE BUTTON */}
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
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-lg transition-all border bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-400/50 active:scale-95 backdrop-blur-[2px]"
            title="Place Block / Interact"
          >
            <span className="text-sm leading-none">🧱</span>
            <span className="text-[7px] font-bold tracking-tight text-green-200">PLACE</span>
          </button>
        </div>

        {/* Row 2: Fly Down & JUMP */}
        <div className="flex items-center gap-1.5">
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
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex flex-col items-center justify-center font-bold text-white border transition-all shadow-xs backdrop-blur-[2px] ${
                activeKeys['shift']
                  ? 'bg-cyan-600/80 scale-95 border-white'
                  : 'bg-black/40 border-cyan-400/40'
              }`}
              title="Fly Down"
            >
              <span className="text-xs leading-none">▼</span>
              <span className="text-[6px] text-cyan-200">DOWN</span>
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
            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full flex flex-col items-center justify-center font-bold text-white shadow-xl transition-all border backdrop-blur-[2px] ${
              activeKeys['space']
                ? 'bg-yellow-500/80 text-black border-white scale-95'
                : 'bg-black/45 border-white/40 hover:bg-black/60'
            }`}
            title="Jump / Fly Up / Swim"
          >
            <span className="text-sm sm:text-base leading-none">▲</span>
            <span className="text-[7px] sm:text-[8px] font-bold tracking-wide">JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
