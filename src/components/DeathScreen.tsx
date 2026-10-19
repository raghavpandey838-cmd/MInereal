/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface DeathScreenProps {
  isOpen: boolean;
  score: number;
  onRespawn: () => void;
  onTitle: () => void;
}

export const DeathScreen: React.FC<DeathScreenProps> = ({
  isOpen,
  score,
  onRespawn,
  onTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-red-950/85 z-50 flex flex-col items-center justify-center pointer-events-auto select-none">
      <h1 className="mc-font text-5xl md:text-6xl text-red-500 font-bold mb-2 drop-shadow-[3px_3px_0px_#000]">
        You died!
      </h1>
      <p className="text-white text-lg mb-8 font-bold drop-shadow">
        Score: <span className="text-yellow-400">{score}</span>
      </p>

      <div className="flex flex-col gap-3 w-64">
        <button
          onClick={onRespawn}
          className="mc-btn py-2.5 font-bold text-sm cursor-pointer shadow-lg"
        >
          Respawn
        </button>
        <button
          onClick={onTitle}
          className="mc-btn py-2.5 font-bold text-sm cursor-pointer"
        >
          Title Screen
        </button>
      </div>
    </div>
  );
};
