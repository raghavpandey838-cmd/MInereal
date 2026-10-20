/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameMode } from '../game/types';

interface TitleScreenProps {
  onStartGame: (mode: GameMode, seed: number) => void;
  savedWorldAvailable: boolean;
  onLoadSavedWorld: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  savedWorldAvailable,
  onLoadSavedWorld,
}) => {
  const [seedInput, setSeedInput] = useState<string>('42817');
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);

  const handleStart = () => {
    const seed = parseInt(seedInput, 10) || Math.floor(Math.random() * 999999);
    onStartGame('creative', seed);
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-between pointer-events-auto select-none bg-gradient-to-b from-black/40 via-transparent to-black/60 p-6">
      {/* Top Lockup & Splash text */}
      <div className="flex flex-col items-center pt-8 relative">
        {/* Bespoke Minecraft 3D Stone SVG Lockup */}
        <div className="relative">
          <svg width="420" height="90" viewBox="0 0 420 90" className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
            <defs>
              <linearGradient id="mcStone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#bfbfbf" />
                <stop offset="50%" stopColor="#878787" />
                <stop offset="100%" stopColor="#4a4a4a" />
              </linearGradient>
            </defs>
            {/* Outline Shadow */}
            <text
              x="210"
              y="68"
              textAnchor="middle"
              className="mc-font"
              style={{
                fontSize: '56px',
                fontWeight: '900',
                fill: '#151515',
                stroke: '#000000',
                strokeWidth: '10px',
              }}
            >
              MINECRAFT
            </text>
            {/* Front Lettering */}
            <text
              x="210"
              y="65"
              textAnchor="middle"
              className="mc-font"
              style={{
                fontSize: '56px',
                fontWeight: '900',
                fill: 'url(#mcStone)',
                stroke: '#303030',
                strokeWidth: '2.5px',
              }}
            >
              MINECRAFT
            </text>
          </svg>

          {/* Yellow Bouncing Splash Text */}
          <div className="absolute -bottom-2 -right-8 rotate-[-18deg] animate-bounce text-yellow-300 font-bold text-sm tracking-wide drop-shadow-[2px_2px_0px_#000]">
            Creative Master Edition!
          </div>
        </div>

        {/* Developed by Raghav Pandey Banner directly below MINECRAFT */}
        <div className="mt-3 px-5 py-2 rounded-lg bg-black/75 border-2 border-[#f59e0b] shadow-[0_6px_24px_rgba(245,158,11,0.45)] flex items-center gap-2.5 backdrop-blur-sm">
          <span className="text-[#fbbf24] text-base animate-pulse">✦</span>
          <span className="mc-font text-base sm:text-lg font-bold text-[#fef08a] tracking-wider drop-shadow-[2px_2px_0px_#000000]">
            developed by Raghav Pandey
          </span>
          <span className="text-[#fbbf24] text-base animate-pulse">✦</span>
        </div>

        {/* Creative Badge */}
        <div className="mt-2.5 bg-emerald-700/90 text-white px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-emerald-400 shadow-lg">
          ⭐ Infinite Creative & Building Sandbox ⭐
        </div>
      </div>

      {/* Center CTA Menu */}
      <div className="flex flex-col items-center gap-3 w-80 max-w-full">
        {savedWorldAvailable && (
          <button
            onClick={onLoadSavedWorld}
            className="mc-btn w-full py-3 font-bold text-sm text-yellow-200 cursor-pointer shadow-xl hover:scale-102 transition-transform"
          >
            Continue Saved World
          </button>
        )}

        <button
          onClick={handleStart}
          className="mc-btn w-full py-3.5 font-bold text-base text-white cursor-pointer shadow-xl hover:scale-102 transition-transform bg-[#3b6ea5] border-2 border-[#1c3a5e]"
        >
          🎮 Play Creative World
        </button>

        <div className="flex gap-2 w-full">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="mc-btn flex-1 py-2 font-bold text-xs cursor-pointer"
          >
            🌍 World Seed & Options
          </button>
          <button
            onClick={() => setShowControls(true)}
            className="mc-btn flex-1 py-2 font-bold text-xs cursor-pointer text-white/90"
          >
            📖 Controls & Guide
          </button>
        </div>

        {showOptions && (
          <div className="bg-black/85 border border-white/20 p-3 rounded w-full flex flex-col gap-2 text-xs backdrop-blur-xs">
            <label className="text-white/80 font-bold">World Seed:</label>
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              className="bg-black/60 border border-white/40 text-yellow-300 px-2 py-1 rounded text-xs outline-none"
              placeholder="e.g. 42817"
            />
            <button
              onClick={() => setSeedInput(Math.floor(Math.random() * 999999).toString())}
              className="mc-btn py-1 text-[11px]"
            >
              🎲 Randomize Seed
            </button>
          </div>
        )}
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="text-center text-xs text-white/80 drop-shadow-[1px_1px_0px_#000]">
        WASD Move · Space Jump/Ascend · F Flight Mode · B Master Build Menu · E Inventory · Z Undo
      </div>

      {/* Controls Guide Modal */}
      {showControls && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
          <div className="mc-panel p-5 rounded text-[#3f3f3f] w-[520px] max-w-full text-xs shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-base text-[#222]">Creative Mode Controls & Powers</span>
              <button
                onClick={() => setShowControls(false)}
                className="w-6 h-6 bg-[#a53b3b] text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-[#b0b0b0] p-3 rounded border border-[#888] mb-3">
              <div><strong className="text-black">WASD:</strong> Move horizontally</div>
              <div><strong className="text-black">Mouse / Touch:</strong> Look around</div>
              <div><strong className="text-black">Space:</strong> Jump / Ascend in Flight</div>
              <div><strong className="text-black">Shift / C:</strong> Sneak / Descend in Flight</div>
              <div><strong className="text-black">F:</strong> Toggle Creative Flight</div>
              <div><strong className="text-black">B:</strong> Master Build Menu (Castles, Cars, Tools)</div>
              <div><strong className="text-black">Right Click / Tap:</strong> Instant Place Block</div>
              <div><strong className="text-black">Left Click / Hold:</strong> 1-Click Instant Break Block</div>
              <div><strong className="text-black">Z:</strong> Undo Last Build Action</div>
              <div><strong className="text-black">E:</strong> Inventory & Drive Vehicles</div>
              <div><strong className="text-black">1 - 9 / Wheel:</strong> Select Hotbar Slot</div>
              <div><strong className="text-black">📱 On Screen Keys:</strong> Full Mobile D-Pad & Actions</div>
            </div>
            <button
              onClick={() => setShowControls(false)}
              className="mc-btn w-full py-2 font-bold text-xs cursor-pointer"
            >
              Start Building!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
