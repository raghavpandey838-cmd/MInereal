/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameMode } from '../game/types';
import { sounds } from '../game/audio';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onSaveWorld: () => void;
  onOpenAdvancements: () => void;
  onOpenSettings?: () => void;
  onQuitToTitle: () => void;
  gameMode?: GameMode;
  onChangeGameMode?: (mode: GameMode) => void;
}

const ALL_MODES: { id: GameMode; name: string; icon: string; color: string }[] = [
  { id: 'survival', name: 'Survival', icon: '⚔️', color: 'text-emerald-400' },
  { id: 'creative', name: 'Creative', icon: '⭐', color: 'text-cyan-400' },
  { id: 'adventure', name: 'Adventure', icon: '🗺️', color: 'text-amber-400' },
  { id: 'spectator', name: 'Spectator', icon: '👁️', color: 'text-purple-400' },
  { id: 'hardcore', name: 'Hardcore', icon: '💀', color: 'text-red-400' },
];

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  isMuted,
  onToggleMute,
  onSaveWorld,
  onOpenAdvancements,
  onOpenSettings,
  onQuitToTitle,
  gameMode = 'survival',
  onChangeGameMode,
}) => {
  const [showModeSwitch, setShowModeSwitch] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentModeObj = ALL_MODES.find((m) => m.id === gameMode) || ALL_MODES[0];

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center pointer-events-auto select-none p-4 backdrop-blur-xs"
    >
      <div className="flex flex-col items-center gap-2.5 w-84 max-w-full text-center bg-[#1a1a1a]/95 p-5 rounded-lg border-2 border-white/20 shadow-2xl">
        <h2 className="mc-font text-2xl text-white font-bold drop-shadow-[2px_2px_0px_#000]">
          Game Menu
        </h2>

        {/* Back to Game */}
        <button
          onClick={onResume}
          onTouchEnd={(e) => {
            e.preventDefault();
            onResume();
          }}
          className="mc-btn w-full py-3 font-bold text-sm cursor-pointer shadow-xl bg-[#3b6ea5] hover:bg-[#4b80bd] active:scale-95 text-white"
        >
          ▶ Back to Game
        </button>

        {/* Advancements Button */}
        <button
          onClick={() => {
            sounds.playPop();
            onOpenAdvancements();
          }}
          className="mc-btn w-full py-2 font-bold text-xs cursor-pointer text-yellow-300 flex items-center justify-center gap-1.5"
        >
          <span>🏆</span>
          <span>View Advancements & Trophies</span>
        </button>

        {/* Settings & Options Button */}
        {onOpenSettings && (
          <button
            onClick={() => {
              sounds.playPop();
              onOpenSettings();
            }}
            className="mc-btn w-full py-2 font-bold text-xs cursor-pointer text-cyan-300 flex items-center justify-center gap-1.5 border border-cyan-400/50"
          >
            <span>⚙️</span>
            <span>Settings & Graphics Options</span>
          </button>
        )}

        {/* In-Game Mode Switcher */}
        <div className="w-full flex flex-col gap-1">
          <button
            onClick={() => {
              sounds.playPop();
              setShowModeSwitch(!showModeSwitch);
            }}
            className="w-full py-2 px-3 font-bold text-xs bg-black/70 rounded border border-white/20 flex items-center justify-between text-gray-200 hover:border-yellow-400/80 cursor-pointer"
          >
            <span>Current Mode:</span>
            <span className={`flex items-center gap-1 uppercase font-mono ${currentModeObj.color}`}>
              <span>{currentModeObj.icon}</span>
              <span>{currentModeObj.name}</span>
              <span className="text-gray-400 text-[10px]">▼</span>
            </span>
          </button>

          {showModeSwitch && onChangeGameMode && (
            <div className="grid grid-cols-1 gap-1 p-1.5 bg-black/80 rounded border border-yellow-500/50 animate-fade-in text-xs">
              {ALL_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    sounds.playLevelUp();
                    onChangeGameMode(m.id);
                    setShowModeSwitch(false);
                  }}
                  className={`py-1.5 px-2 rounded text-left font-bold flex items-center justify-between cursor-pointer transition-colors ${
                    gameMode === m.id
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/60'
                      : 'hover:bg-white/10 text-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>{m.icon}</span>
                    <span>{m.name} Mode</span>
                  </span>
                  {gameMode === m.id && <span className="text-[10px] text-yellow-400">✓ Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Audio Mute Toggle */}
        <button
          onClick={onToggleMute}
          className="mc-btn w-full py-2 font-bold text-xs cursor-pointer"
        >
          Audio: <span className={isMuted ? 'text-red-300' : 'text-green-300'}>{isMuted ? 'MUTED' : 'ON'}</span>
        </button>

        {/* Save World */}
        <button
          onClick={() => {
            onSaveWorld();
            sounds.playLevelUp();
          }}
          className="mc-btn w-full py-2 font-bold text-xs cursor-pointer text-cyan-200"
        >
          💾 Save World to Storage
        </button>

        {/* Quit to Title */}
        <button
          onClick={onQuitToTitle}
          className="mc-btn w-full py-2.5 font-bold text-xs text-red-200 hover:text-red-100 cursor-pointer mt-1 bg-red-950/60 border-red-800"
        >
          🚪 Save & Quit to Title
        </button>

        <div className="mt-1 text-[10px] text-white/50">
          Minecraft All 5 Game Modes · Raghav Pandey
        </div>
      </div>
    </div>
  );
};
