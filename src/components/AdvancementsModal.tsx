/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Advancement } from '../game/advancements';
import { sounds } from '../game/audio';

interface AdvancementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  advancements: Advancement[];
}

export const AdvancementsModal: React.FC<AdvancementsModalProps> = ({
  isOpen,
  onClose,
  advancements,
}) => {
  if (!isOpen) return null;

  const unlockedCount = advancements.filter((a) => a.unlocked).length;
  const progressPercent = Math.round((unlockedCount / advancements.length) * 100);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center pointer-events-auto select-none p-4">
      <div className="mc-panel p-5 rounded text-[#222] w-[620px] max-w-full flex flex-col max-h-[85vh] shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 pb-2 border-b-2 border-[#888]">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="font-bold text-lg text-[#111] leading-tight">
                Creative Advancements & Achievements
              </h2>
              <span className="text-xs text-[#555]">
                Unlocked: <strong className="text-yellow-700">{unlockedCount} / {advancements.length}</strong> ({progressPercent}%)
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="w-8 h-8 bg-[#a53b3b] text-white border-2 border-[#551111] hover:bg-[#c24646] font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-[#555] h-3 rounded-full overflow-hidden mb-4 p-0.5 border border-[#333]">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 via-green-400 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Advancements List */}
        <div className="overflow-y-auto flex-1 space-y-2.5 pr-1">
          {advancements.map((adv) => (
            <div
              key={adv.id}
              className={`p-3 rounded border-2 flex items-start gap-3 transition-all ${
                adv.unlocked
                  ? 'bg-gradient-to-r from-[#d4edda] to-[#c3e6cb] border-[#28a745] shadow-xs'
                  : 'bg-[#b8b8b8] border-[#999] opacity-70'
              }`}
            >
              <div
                className={`w-12 h-12 rounded flex items-center justify-center text-2xl shrink-0 border-2 ${
                  adv.unlocked
                    ? 'bg-yellow-300/60 border-yellow-500 shadow-sm'
                    : 'bg-[#999] border-[#777]'
                }`}
              >
                {adv.icon}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#111] flex items-center gap-1.5">
                    {adv.title}
                    {adv.unlocked && (
                      <span className="text-[10px] bg-green-700 text-white px-1.5 py-0.5 rounded font-mono uppercase">
                        Completed ✓
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] text-[#666] uppercase font-mono tracking-wider">
                    {adv.category}
                  </span>
                </div>
                <p className="text-xs text-[#333] mt-0.5 leading-snug">
                  {adv.description}
                </p>
                {adv.unlocked && adv.unlockedAt && (
                  <span className="text-[10px] text-green-800 font-mono mt-1 block">
                    Unlocked: {new Date(adv.unlockedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-2 border-t border-[#999] flex justify-between items-center text-xs text-[#555]">
          <span>Complete tasks in Creative Mode to unlock all trophies!</span>
          <button
            onClick={() => {
              sounds.playPop();
              onClose();
            }}
            className="mc-btn px-4 py-1.5 font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
