/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { sounds } from '../game/audio';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onSaveWorld: () => void;
  onOpenAdvancements: () => void;
  onQuitToTitle: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  isMuted,
  onToggleMute,
  onSaveWorld,
  onOpenAdvancements,
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
          className="mc-btn w-full py-2.5 font-bold text-sm cursor-pointer shadow-lg bg-[#3b6ea5]"
        >
          Back to Game
        </button>

        {/* Advancements Button */}
        <button
          onClick={() => {
            sounds.playPop();
            onOpenAdvancements();
          }}
          className="mc-btn w-full py-2 font-bold text-sm cursor-pointer text-yellow-300 flex items-center justify-center gap-1.5"
        >
          <span>🏆</span>
          <span>View Advancements & Trophies</span>
        </button>

        {/* Mode Indicator */}
        <div className="w-full py-2 font-bold text-xs bg-black/60 rounded border border-white/20 text-yellow-400">
          Mode: <span className="text-white uppercase font-mono">Creative (Master Builder)</span>
        </div>

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
          Save World to Storage
        </button>

        {/* Quit to Title */}
        <button
          onClick={onQuitToTitle}
          className="mc-btn w-full py-2.5 font-bold text-sm text-red-100 hover:text-red-200 cursor-pointer mt-2"
        >
          Save and Quit to Title
        </button>

        <div className="mt-4 text-xs text-white/50">
          Minecraft Creative Edition · 3D Three.js
        </div>
      </div>
    </div>
  );
};
