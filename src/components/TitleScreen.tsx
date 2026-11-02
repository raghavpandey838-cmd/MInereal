/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameMode } from '../game/types';
import { sounds } from '../game/audio';

interface TitleScreenProps {
  onStartGame: (mode: GameMode, seed: number) => void;
  savedWorldAvailable: boolean;
  onLoadSavedWorld: () => void;
}

interface ModeInfo {
  id: GameMode;
  name: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  icon: string;
  accentColor: string;
  buttonClass: string;
  features: string[];
}

const MODES: ModeInfo[] = [
  {
    id: 'survival',
    name: 'Survival Mode',
    tagline: 'Classic Minecraft Experience',
    badge: 'SURVIVE',
    badgeColor: 'bg-emerald-600/90 text-emerald-100 border-emerald-400',
    icon: '⚔️',
    accentColor: '#10b981',
    buttonClass: 'bg-[#2e6f40] hover:bg-[#3d8c52] border-2 border-[#1a4a27]',
    features: [
      'Collect wood, stone, iron & diamonds',
      'Craft weapons, tools & armour',
      'Manage health, hunger & oxygen',
      'Fight zombies, skeletons & creepers',
    ],
  },
  {
    id: 'creative',
    name: 'Creative Mode',
    tagline: 'Unlimited Creativity & Building',
    badge: 'INFINITE',
    badgeColor: 'bg-cyan-600/90 text-cyan-100 border-cyan-400',
    icon: '⭐',
    accentColor: '#06b6d4',
    buttonClass: 'bg-[#3b6ea5] hover:bg-[#4b80bd] border-2 border-[#1c3a5e]',
    features: [
      'Unlimited building blocks & items',
      'Fly freely around the world [F]',
      '1-click instant block break',
      'Master build studio & vehicles [B]',
    ],
  },
  {
    id: 'adventure',
    name: 'Adventure Mode',
    tagline: 'Custom Maps & Story Exploration',
    badge: 'ADVENTURE',
    badgeColor: 'bg-amber-600/90 text-amber-100 border-amber-400',
    icon: '🗺️',
    accentColor: '#f59e0b',
    buttonClass: 'bg-[#b45309] hover:bg-[#d97706] border-2 border-[#78350f]',
    features: [
      'Normal breaking of blocks is restricted',
      'Requires matching tool (Axe for wood, Pickaxe for stone)',
      'Explore puzzles, structures & quests',
      'Health & hunger active',
    ],
  },
  {
    id: 'spectator',
    name: 'Spectator Mode',
    tagline: 'Free Exploration & Noclip',
    badge: 'NOCLIP',
    badgeColor: 'bg-purple-600/90 text-purple-100 border-purple-400',
    icon: '👁️',
    accentColor: '#a855f7',
    buttonClass: 'bg-[#6b21a8] hover:bg-[#7e22ce] border-2 border-[#3b0764]',
    features: [
      'Noclip: Fly directly through solid blocks',
      'Explore underground caves & ores without mining',
      'Invisible: Hostile mobs cannot see or attack you',
      'Pure observer without gameplay interactions',
    ],
  },
  {
    id: 'hardcore',
    name: 'Hardcore Mode',
    tagline: 'Extreme Challenge · 1 Life Only',
    badge: '1 LIFE',
    badgeColor: 'bg-red-700/90 text-red-100 border-red-500',
    icon: '💀',
    accentColor: '#ef4444',
    buttonClass: 'bg-[#881337] hover:bg-[#9f1239] border-2 border-[#4c0519]',
    features: [
      'Locked to highest difficulty: +50% mob damage',
      'Faster creeper fuses & quicker hunger decay',
      'You get only one life (evil hardcore hearts)',
      'Permanent death: world converts to Spectator only',
    ],
  },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  savedWorldAvailable,
  onLoadSavedWorld,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('survival');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [seedInput, setSeedInput] = useState<string>('42817');
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(false);

  const currentModeInfo = MODES.find((m) => m.id === selectedMode) || MODES[0];

  const handleStart = () => {
    sounds.playLevelUp();
    const seed = parseInt(seedInput, 10) || Math.floor(Math.random() * 999999);
    onStartGame(selectedMode, seed);
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-40 flex flex-col items-center justify-between pointer-events-auto select-none bg-gradient-to-b from-black/50 via-transparent to-black/75 p-3 sm:p-6 overflow-y-auto"
    >
      {/* Top Lockup & Splash text */}
      <div className="flex flex-col items-center pt-2 sm:pt-6 relative">
        {/* Bespoke Minecraft 3D Stone SVG Lockup */}
        <div className="relative scale-90 sm:scale-100">
          <svg width="420" height="85" viewBox="0 0 420 85" className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]">
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
              y="64"
              textAnchor="middle"
              className="mc-font"
              style={{
                fontSize: '54px',
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
              y="61"
              textAnchor="middle"
              className="mc-font"
              style={{
                fontSize: '54px',
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
          <div className="absolute -bottom-2 -right-4 rotate-[-15deg] animate-bounce text-yellow-300 font-bold text-xs sm:text-sm tracking-wide drop-shadow-[2px_2px_0px_#000]">
            All 5 Authentic Modes!
          </div>
        </div>

        {/* Developed by Raghav Pandey Banner directly below MINECRAFT */}
        <div className="mt-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-lg bg-black/80 border-2 border-[#f59e0b] shadow-[0_6px_24px_rgba(245,158,11,0.45)] flex items-center gap-2 backdrop-blur-sm">
          <span className="text-[#fbbf24] text-xs sm:text-base animate-pulse">✦</span>
          <span className="mc-font text-xs sm:text-base font-bold text-[#fef08a] tracking-wider drop-shadow-[2px_2px_0px_#000000]">
            developed by Raghav Pandey
          </span>
          <span className="text-[#fbbf24] text-xs sm:text-base animate-pulse">✦</span>
        </div>

        {/* Active Mode Pill Badge */}
        <div className={`mt-2 ${currentModeInfo.badgeColor} px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase border shadow-md flex items-center gap-1.5`}>
          <span>{currentModeInfo.icon}</span>
          <span>{currentModeInfo.name} Active</span>
        </div>
      </div>

      {/* Center CTA Menu: Mode Selector Dropdown & Primary Play Button */}
      <div className="flex flex-col items-center gap-2.5 w-96 max-w-full my-auto py-2">
        {/* Saved World quick load */}
        {savedWorldAvailable && (
          <button
            onClick={onLoadSavedWorld}
            className="mc-btn w-full py-2.5 font-bold text-xs sm:text-sm text-yellow-200 cursor-pointer shadow-xl hover:scale-102 transition-transform"
          >
            ▶ Continue Saved World
          </button>
        )}

        {/* Primary Play Button (Dynamically plays the selected mode) */}
        <button
          onClick={handleStart}
          className={`mc-btn w-full py-3.5 font-bold text-sm sm:text-base text-white cursor-pointer shadow-2xl hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 ${currentModeInfo.buttonClass}`}
        >
          <span className="text-xl">{currentModeInfo.icon}</span>
          <span className="drop-shadow-[1px_1px_0px_#000]">Play {currentModeInfo.name}</span>
        </button>

        {/* Game Mode Dropdown Selector */}
        <div className="relative w-full">
          <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1 block drop-shadow flex items-center justify-between">
            <span>Select Game Mode:</span>
            <span className="text-[10px] text-yellow-400 font-mono">5 MODES READY</span>
          </label>

          {/* Dropdown Toggle Header */}
          <button
            onClick={() => {
              sounds.playPop();
              setIsDropdownOpen((prev) => !prev);
            }}
            className="w-full bg-[#1e1e1e]/95 hover:bg-[#2a2a2a] border-2 border-white/30 hover:border-yellow-400/80 p-2.5 rounded text-left flex items-center justify-between cursor-pointer transition-colors shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl p-1 bg-black/40 rounded border border-white/10">
                {currentModeInfo.icon}
              </span>
              <div>
                <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                  <span>{currentModeInfo.name}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${currentModeInfo.badgeColor}`}>
                    {currentModeInfo.badge}
                  </span>
                </div>
                <div className="text-[10px] text-gray-300 line-clamp-1">
                  {currentModeInfo.tagline}
                </div>
              </div>
            </div>
            <span className="text-yellow-400 text-sm font-bold ml-2">
              {isDropdownOpen ? '▲' : '▼'}
            </span>
          </button>

          {/* Dropdown Menu Options */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#121212]/98 border-2 border-yellow-500/80 rounded-lg shadow-2xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-md max-h-72 overflow-y-auto">
              {MODES.map((mode) => {
                const isSelected = selectedMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      sounds.playPop();
                      setSelectedMode(mode.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full p-2 rounded text-left flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-400'
                        : 'hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{mode.icon}</span>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{mode.name}</span>
                          <span className={`text-[8px] px-1 py-0.2 rounded border font-mono ${mode.badgeColor}`}>
                            {mode.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-300">
                          {mode.tagline}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-yellow-400 font-bold text-xs">✓ Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Mode Summary Card */}
        <div className="w-full bg-black/75 border border-white/20 p-2.5 rounded-lg text-left backdrop-blur-xs shadow-md">
          <div className="text-[10px] uppercase font-bold text-yellow-300 tracking-wider mb-1 flex items-center gap-1">
            <span>{currentModeInfo.icon}</span>
            <span>{currentModeInfo.name} Rules & Mechanics:</span>
          </div>
          <ul className="text-[10px] sm:text-[11px] text-gray-200 space-y-0.5">
            {currentModeInfo.features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-1.5 leading-snug">
                <span className="text-yellow-400 shrink-0 font-bold">•</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* World Seed & Controls Sub-buttons */}
        <div className="flex gap-2 w-full">
          <button
            onClick={() => {
              sounds.playPop();
              setShowOptions(!showOptions);
            }}
            className="mc-btn flex-1 py-2 font-bold text-xs cursor-pointer text-gray-100"
          >
            🌍 Seed & Options
          </button>
          <button
            onClick={() => {
              sounds.playPop();
              setShowControls(true);
            }}
            className="mc-btn flex-1 py-2 font-bold text-xs cursor-pointer text-white/90"
          >
            📖 Controls & Guide
          </button>
        </div>

        {showOptions && (
          <div className="bg-black/90 border border-white/20 p-3 rounded w-full flex flex-col gap-2 text-xs backdrop-blur-sm animate-fade-in">
            <label className="text-white/80 font-bold">World Generation Seed:</label>
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              className="bg-black/60 border border-white/40 text-yellow-300 px-2.5 py-1.5 rounded text-xs outline-none font-mono"
              placeholder="e.g. 42817"
            />
            <button
              onClick={() => {
                sounds.playPop();
                setSeedInput(Math.floor(Math.random() * 999999).toString());
              }}
              className="mc-btn py-1 text-[11px]"
            >
              🎲 Randomize Seed
            </button>
          </div>
        )}
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="text-center text-[10px] sm:text-xs text-white/80 drop-shadow-[1px_1px_0px_#000] pb-1">
        WASD Move · Space Jump · 1-9 Slots · Left Click Break · Right Click Place · B Build Menu · ESC Pause
      </div>

      {/* Controls Guide Modal */}
      {showControls && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="mc-panel p-4 sm:p-5 rounded text-[#3f3f3f] w-[560px] max-w-full text-xs shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-sm sm:text-base text-[#222]">
                Minecraft Complete Controls & All 5 Game Modes
              </span>
              <button
                onClick={() => setShowControls(false)}
                className="w-6 h-6 bg-[#a53b3b] text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#b0b0b0] p-3 rounded border border-[#888] mb-3">
              <div><strong className="text-black">WASD:</strong> Move horizontally</div>
              <div><strong className="text-black">Mouse / Touch:</strong> Look around freely</div>
              <div><strong className="text-black">Space:</strong> Jump / Ascend in Flight</div>
              <div><strong className="text-black">Shift / C:</strong> Sneak / Descend in Flight</div>
              <div><strong className="text-black">F:</strong> Toggle Flight (Creative/Spectator)</div>
              <div><strong className="text-black">B:</strong> Master Build Studio & Vehicles</div>
              <div><strong className="text-black">Left Click:</strong> Break Block / Attack Mob</div>
              <div><strong className="text-black">Right Click:</strong> Place Block / Interact / Eat</div>
              <div><strong className="text-black">E:</strong> Open Inventory & Crafting</div>
              <div><strong className="text-black">Z:</strong> Undo Last Build Action</div>
              <div><strong className="text-black">1 - 9 / Wheel:</strong> Select Hotbar Item</div>
              <div><strong className="text-black">📱 Mobile D-Pad:</strong> Clean screen controls</div>
            </div>
            <button
              onClick={() => setShowControls(false)}
              className="mc-btn w-full py-2 font-bold text-xs cursor-pointer"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
