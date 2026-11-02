/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode } from '../game/types';
import { sounds } from '../game/audio';

interface DeathScreenProps {
  isOpen: boolean;
  score: number;
  gameMode?: GameMode;
  onRespawn: () => void;
  onSpectate?: () => void;
  onTitle: () => void;
}

export const DeathScreen: React.FC<DeathScreenProps> = ({
  isOpen,
  score,
  gameMode = 'survival',
  onRespawn,
  onSpectate,
  onTitle,
}) => {
  if (!isOpen) return null;

  const isHardcore = gameMode === 'hardcore';

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 bg-red-950/90 z-50 flex flex-col items-center justify-center pointer-events-auto select-none p-4 backdrop-blur-xs"
    >
      <h1 className="mc-font text-4xl sm:text-6xl text-red-500 font-bold mb-2 drop-shadow-[3px_3px_0px_#000] text-center">
        {isHardcore ? 'Game Over!' : 'You died!'}
      </h1>

      {isHardcore && (
        <div className="mb-3 px-4 py-1.5 bg-black/70 border border-red-500 rounded-full text-red-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
          <span>💀</span>
          <span>Hardcore Mode: You cannot respawn!</span>
        </div>
      )}

      <p className="text-white text-base sm:text-lg mb-6 font-bold drop-shadow">
        Score: <span className="text-yellow-400 font-mono">{score}</span>
      </p>

      <div className="flex flex-col gap-2.5 w-68 max-w-full">
        {isHardcore ? (
          <button
            onClick={() => {
              sounds.playLevelUp();
              onSpectate?.();
            }}
            className="mc-btn py-3 font-bold text-xs sm:text-sm cursor-pointer shadow-lg bg-[#6b21a8] hover:bg-[#7e22ce] text-white border-2 border-[#3b0764]"
          >
            👁️ Spectate World
          </button>
        ) : (
          <button
            onClick={() => {
              sounds.playLevelUp();
              onRespawn();
            }}
            className="mc-btn py-3 font-bold text-xs sm:text-sm cursor-pointer shadow-lg bg-[#2e6f40] hover:bg-[#3d8c52] text-white border-2 border-[#1a4a27]"
          >
            🔄 Respawn
          </button>
        )}

        <button
          onClick={onTitle}
          className="mc-btn py-2.5 font-bold text-xs sm:text-sm cursor-pointer text-gray-200"
        >
          🚪 Title Screen
        </button>
      </div>
    </div>
  );
};
