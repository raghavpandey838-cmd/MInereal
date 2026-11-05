/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WeatherType } from '../game/weather';
import { sounds } from '../game/audio';

export type GraphicsPreset = 'low' | 'medium' | 'high' | 'ultra' | 'cinematic';
export type CameraMode = 'first-person' | 'third-person-back' | 'third-person-front';

export interface GameSettings {
  preset: GraphicsPreset;
  renderDistance: number; // 2, 3, 4
  shadows: 'off' | 'low' | 'high' | 'ultra';
  waterWaves: boolean;
  windSway: boolean;
  particleQuality: 'low' | 'medium' | 'high';
  fov: number;
  pixelRatio: number; // 0.75, 1.0, 1.25, 1.5
  isAutoDayNight: boolean;
  weather: WeatherType;
  cameraMode: CameraMode;
  masterVol: number;
  musicVol: number;
  weatherVol: number;
  sfxVol: number;
  natureVol: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  preset: 'high',
  renderDistance: 3,
  shadows: 'high',
  waterWaves: true,
  windSway: true,
  particleQuality: 'high',
  fov: 75,
  pixelRatio: 1.25,
  isAutoDayNight: true,
  weather: 'clear',
  cameraMode: 'first-person',
  masterVol: 0.8,
  musicVol: 0.5,
  weatherVol: 0.7,
  sfxVol: 0.8,
  natureVol: 0.6,
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'graphics' | 'audio' | 'camera' | 'controls'>('graphics');

  if (!isOpen) return null;

  const handleApplyPreset = (preset: GraphicsPreset) => {
    sounds.playPop();
    let updated: Partial<GameSettings> = {};
    if (preset === 'low') {
      updated = {
        preset: 'low',
        renderDistance: 2,
        shadows: 'off',
        waterWaves: false,
        windSway: false,
        particleQuality: 'low',
        pixelRatio: 1.0,
      };
    } else if (preset === 'medium') {
      updated = {
        preset: 'medium',
        renderDistance: 3,
        shadows: 'low',
        waterWaves: true,
        windSway: true,
        particleQuality: 'medium',
        pixelRatio: 1.0,
      };
    } else if (preset === 'high') {
      updated = {
        preset: 'high',
        renderDistance: 3,
        shadows: 'high',
        waterWaves: true,
        windSway: true,
        particleQuality: 'high',
        pixelRatio: 1.25,
      };
    } else if (preset === 'ultra') {
      updated = {
        preset: 'ultra',
        renderDistance: 4,
        shadows: 'ultra',
        waterWaves: true,
        windSway: true,
        particleQuality: 'high',
        pixelRatio: 1.5,
      };
    } else if (preset === 'cinematic') {
      updated = {
        preset: 'cinematic',
        renderDistance: 4,
        shadows: 'ultra',
        waterWaves: true,
        windSway: true,
        particleQuality: 'high',
        pixelRatio: 1.5,
      };
    }
    onUpdateSettings({ ...settings, ...updated });
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center pointer-events-auto select-none p-3 backdrop-blur-xs"
    >
      <div className="flex flex-col w-[540px] max-w-[96vw] max-h-[90vh] bg-[#1e1e1e] border-2 border-white/20 rounded-lg shadow-2xl overflow-hidden animate-fade-in text-white text-xs">
        {/* Header */}
        <div className="bg-[#2a2a2a] px-4 py-2.5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-base">⚙️</span>
            <h2 className="mc-font text-base font-bold text-yellow-300 drop-shadow">Game Settings & Options</h2>
          </div>
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="w-6 h-6 rounded bg-red-600/80 hover:bg-red-500 text-white font-bold flex items-center justify-center cursor-pointer shadow"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/40 px-2 pt-2 gap-1 overflow-x-auto">
          {[
            { id: 'graphics', label: '🎨 Graphics & World', icon: '🖥️' },
            { id: 'audio', label: '🔊 Audio & Volumes', icon: '🎵' },
            { id: 'camera', label: '🎥 Camera & View', icon: '👁️' },
            { id: 'controls', label: '⌨️ Controls Guide', icon: '🎮' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playPop();
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`px-3 py-1.5 rounded-t font-bold transition-colors cursor-pointer text-[11px] sm:text-xs flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#3b6ea5] text-white border-t border-x border-cyan-300/40'
                  : 'bg-black/20 text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 max-h-[62vh]">
          {/* TAB 1: GRAPHICS & WORLD */}
          {activeTab === 'graphics' && (
            <div className="space-y-4">
              {/* Presets Bar */}
              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1.5 uppercase tracking-wide">
                  Graphics Quality Preset
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['low', 'medium', 'high', 'ultra', 'cinematic'] as GraphicsPreset[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleApplyPreset(p)}
                      className={`py-1.5 px-1 rounded text-center font-bold uppercase text-[10px] sm:text-xs transition-all cursor-pointer border ${
                        settings.preset === p
                          ? 'bg-yellow-500 text-black border-yellow-200 shadow-md font-extrabold scale-102'
                          : 'bg-black/50 text-gray-300 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Render Distance & FOV */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/10">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-300 mb-1">
                    <span>Render Distance:</span>
                    <span className="text-yellow-300">
                      {settings.renderDistance} Chunks ({settings.renderDistance * 2 + 1}x{settings.renderDistance * 2 + 1})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="4"
                    step="1"
                    value={settings.renderDistance}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, renderDistance: Number(e.target.value), preset: 'custom' as any })
                    }
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-300 mb-1">
                    <span>Field of View (FOV):</span>
                    <span className="text-yellow-300">{settings.fov}°</span>
                  </div>
                  <input
                    type="range"
                    min="65"
                    max="100"
                    step="5"
                    value={settings.fov}
                    onChange={(e) => onUpdateSettings({ ...settings, fov: Number(e.target.value) })}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Visual Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[11px]">
                {/* Water Waves */}
                <label className="flex items-center justify-between p-2 bg-black/40 rounded border border-white/10 cursor-pointer">
                  <span>🌊 Animated Water Waves & Shimmer</span>
                  <input
                    type="checkbox"
                    checked={settings.waterWaves}
                    onChange={(e) => onUpdateSettings({ ...settings, waterWaves: e.target.checked })}
                    className="w-4 h-4 accent-cyan-400"
                  />
                </label>

                {/* Foliage Wind Sway */}
                <label className="flex items-center justify-between p-2 bg-black/40 rounded border border-white/10 cursor-pointer">
                  <span>🍃 Foliage Wind Breeze Sway</span>
                  <input
                    type="checkbox"
                    checked={settings.windSway}
                    onChange={(e) => onUpdateSettings({ ...settings, windSway: e.target.checked })}
                    className="w-4 h-4 accent-green-400"
                  />
                </label>

                {/* Dynamic Shadows */}
                <div className="p-2 bg-black/40 rounded border border-white/10 flex items-center justify-between">
                  <span>🌓 Dynamic Shadows:</span>
                  <select
                    value={settings.shadows}
                    onChange={(e) => onUpdateSettings({ ...settings, shadows: e.target.value as any })}
                    className="bg-[#2c2c2c] border border-white/20 rounded px-1.5 py-0.5 text-xs text-yellow-300 cursor-pointer"
                  >
                    <option value="off">Off (Fastest)</option>
                    <option value="low">Low (512)</option>
                    <option value="high">High (1024 PCF)</option>
                    <option value="ultra">Ultra (2048 PCF)</option>
                  </select>
                </div>

                {/* Resolution Scale */}
                <div className="p-2 bg-black/40 rounded border border-white/10 flex items-center justify-between">
                  <span>📐 Render Resolution:</span>
                  <select
                    value={settings.pixelRatio}
                    onChange={(e) => onUpdateSettings({ ...settings, pixelRatio: Number(e.target.value) })}
                    className="bg-[#2c2c2c] border border-white/20 rounded px-1.5 py-0.5 text-xs text-yellow-300 cursor-pointer"
                  >
                    <option value="0.75">0.75x (Performance)</option>
                    <option value="1.0">1.0x (Standard)</option>
                    <option value="1.25">1.25x (Crisp)</option>
                    <option value="1.5">1.5x (Ultra Sharp)</option>
                  </select>
                </div>
              </div>

              {/* Environment & Weather */}
              <div className="p-2.5 bg-black/40 rounded border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-yellow-200">☀️ Dynamic 24-Hour Day/Night Cycle:</span>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, isAutoDayNight: !settings.isAutoDayNight })}
                    className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] cursor-pointer ${
                      settings.isAutoDayNight
                        ? 'bg-green-600 text-white border border-green-400'
                        : 'bg-gray-700 text-gray-300 border border-gray-500'
                    }`}
                  >
                    {settings.isAutoDayNight ? 'Dynamic 24h Cycle' : 'Locked High Noon'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-200">🌦️ Active Weather System:</span>
                  <select
                    value={settings.weather}
                    onChange={(e) => onUpdateSettings({ ...settings, weather: e.target.value as WeatherType })}
                    className="bg-[#2c2c2c] border border-white/20 rounded px-2 py-1 text-xs text-cyan-300 font-bold cursor-pointer"
                  >
                    <option value="clear">☀️ Clear Sunny</option>
                    <option value="rain">🌧️ Rain Shower</option>
                    <option value="thunderstorm">⛈️ Thunderstorm & Lightning</option>
                    <option value="snow">❄️ Snowfall</option>
                    <option value="foggy">🌫️ Dense Mountain Fog</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO */}
          {activeTab === 'audio' && (
            <div className="space-y-3.5">
              {[
                { label: 'Master Volume', key: 'masterVol', icon: '🔊' },
                { label: 'Music Volume (Ambient C418 Melody)', key: 'musicVol', icon: '🎵' },
                { label: 'Weather (Rain, Wind, Thunder)', key: 'weatherVol', icon: '⛈️' },
                { label: 'Sound Effects (Blocks, Footsteps, Hurt)', key: 'sfxVol', icon: '⛏️' },
                { label: 'Nature & Wildlife (Birds, Crickets)', key: 'natureVol', icon: '🐦' },
              ].map((ch) => (
                <div key={ch.key} className="p-2.5 bg-black/40 rounded border border-white/10">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <span>{ch.icon}</span>
                      <span>{ch.label}</span>
                    </span>
                    <span className="text-yellow-300 font-mono">
                      {Math.round(((settings as any)[ch.key] || 0) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={(settings as any)[ch.key] ?? 0.8}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onUpdateSettings({ ...settings, [ch.key]: val });
                    }}
                    className="w-full accent-yellow-400 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: CAMERA */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <label className="block text-[11px] font-bold text-gray-300 mb-1 uppercase tracking-wide">
                Camera Perspective (Toggle anytime with F5 key)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'first-person', label: '1st Person', desc: 'Eyes of Steve', icon: '👤' },
                  { id: 'third-person-back', label: '3rd Person Back', desc: 'Over-shoulder view', icon: '🏃' },
                  { id: 'third-person-front', label: '3rd Person Front', desc: 'Facing camera view', icon: '🤳' },
                ].map((cm) => (
                  <button
                    key={cm.id}
                    onClick={() => {
                      sounds.playPop();
                      onUpdateSettings({ ...settings, cameraMode: cm.id as CameraMode });
                    }}
                    className={`p-3 rounded text-center cursor-pointer border flex flex-col items-center gap-1 transition-all ${
                      settings.cameraMode === cm.id
                        ? 'bg-[#3b6ea5] border-cyan-300 text-white shadow-lg font-bold scale-102'
                        : 'bg-black/50 border-white/10 text-gray-300 hover:border-white/30'
                    }`}
                  >
                    <span className="text-2xl">{cm.icon}</span>
                    <span className="text-xs font-bold">{cm.label}</span>
                    <span className="text-[10px] text-gray-400">{cm.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CONTROLS */}
          {activeTab === 'controls' && (
            <div className="space-y-2 text-[11px]">
              <div className="p-3 bg-black/40 rounded border border-white/10 space-y-2">
                <div className="font-bold text-yellow-300 text-xs mb-1">🎮 Keyboard & Mouse Bindings</div>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-gray-300">
                  <div><kbd className="px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-white font-mono">W A S D</kbd> Move</div>
                  <div><kbd className="px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-white font-mono">Space</kbd> Jump / Swim / Fly Up</div>
                  <div><kbd className="px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-white font-mono">Left Shift</kbd> Sneak / Fly Down</div>
                  <div><kbd className="px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-white font-mono">Left Ctrl</kbd> Sprint</div>
                  <div><kbd className="px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-white font-mono">L-Click</kbd> Mine / Attack</div>
                  <div><kbd className="px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-white font-mono">R-Click</kbd> Place / Interact</div>
                  <div><kbd className="px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-white font-mono">F5</kbd> Switch 1st/3rd Camera</div>
                  <div><kbd className="px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-white font-mono">E</kbd> Open Inventory & Bag</div>
                  <div><kbd className="px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-white font-mono">B</kbd> Master Build Studio</div>
                  <div><kbd className="px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-white font-mono">Z</kbd> Quick Undo Placement</div>
                  <div><kbd className="px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-white font-mono">H</kbd> Teleport to Spawn</div>
                  <div><kbd className="px-1.5 py-0.5 bg-black/80 rounded border border-white/20 text-white font-mono">Esc</kbd> Pause Menu & Settings</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#2a2a2a] p-3 flex justify-end border-t border-white/10">
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="mc-btn px-6 py-1.5 font-bold text-xs bg-[#3b6ea5] hover:bg-[#4b80bd] text-white cursor-pointer shadow"
          >
            Done & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
