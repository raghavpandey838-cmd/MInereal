/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode } from '../game/types';
import { sounds } from '../game/audio';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  gameMode: GameMode;
  onToggleGameMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onSaveWorld: () => void;
  onQuitToTitle: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  gameMode,
  onToggleGameMode,
  isMuted,
  onToggleMute,
  onSaveWorld,
  onQuitToTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center pointer-events-auto select-none">
      <div className="flex flex-col items-center gap-3 w-80 text-center">
        <h2 className="mc-font text-2xl text-white font-bold mb-4 drop-shadow-[2px_2px_0px_#000]">
          Game Menu
        </h2>

        {/* Back to Game */}
        <button
          onClick={onResume}
          className="mc-btn w-full py-2.5 font-bold text-sm cursor-pointer shadow-lg"
        >
          Back to Game
        </button>

        {/* Game Mode Toggle */}
        <button
          onClick={onToggleGameMode}
          className="mc-btn w-full py-2 font-bold text-sm cursor-pointer"
        >
          Mode: <span className="text-yellow-300 uppercase">{gameMode}</span>
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={onToggleMute}
          className="mc-btn w-full py-2 font-bold text-sm cursor-pointer"
        >
          Audio: <span className={isMuted ? 'text-red-300' : 'text-green-300'}>{isMuted ? 'MUTED' : 'ON'}</span>
        </button>

        {/* Save World */}
        <button
          onClick={() => {
            onSaveWorld();
            sounds.playLevelUp();
          }}
          className="mc-btn w-full py-2 font-bold text-sm cursor-pointer"
        >
          Save World
        </button>

        {/* Quit to Title */}
        <button
          onClick={onQuitToTitle}
          className="mc-btn w-full py-2.5 font-bold text-sm text-red-100 hover:text-red-200 cursor-pointer mt-2"
        >
          Save and Quit to Title
        </button>

        <div className="mt-4 text-xs text-white/50">
          Minecraft Web Edition · 3D Three.js
        </div>
      </div>
    </div>
  );
};
