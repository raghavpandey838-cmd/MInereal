/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import * as THREE from 'three';

interface F3DebugScreenProps {
  visible: boolean;
  playerPos: THREE.Vector3;
  yaw: number;
  pitch: number;
  fps: number;
  entitiesCount: number;
  timeOfDay: number;
  biome: string;
}

export const F3DebugScreen: React.FC<F3DebugScreenProps> = ({
  visible,
  playerPos,
  yaw,
  pitch,
  fps,
  entitiesCount,
  timeOfDay,
  biome,
}) => {
  if (!visible) return null;

  // Calculate facing direction
  const deg = ((-yaw * 180) / Math.PI + 360) % 360;
  let facing = 'South (+Z)';
  if (deg >= 45 && deg < 135) facing = 'West (-X)';
  else if (deg >= 135 && deg < 225) facing = 'North (-Z)';
  else if (deg >= 225 && deg < 315) facing = 'East (+X)';

  return (
    <div className="absolute top-2 left-2 text-[11px] font-mono text-white bg-black/60 p-2.5 rounded pointer-events-none z-20 space-y-0.5 leading-tight">
      <div className="text-yellow-300 font-bold">Minecraft Web Edition (Three.js WebGL)</div>
      <div>FPS: {fps} · Voxel Chunks active</div>
      <div>
        XYZ: {playerPos.x.toFixed(2)} / {playerPos.y.toFixed(2)} / {playerPos.z.toFixed(2)}
      </div>
      <div>
        Block: {Math.floor(playerPos.x)} {Math.floor(playerPos.y)} {Math.floor(playerPos.z)}
      </div>
      <div>
        Chunk: {Math.floor(playerPos.x / 16)} {Math.floor(playerPos.z / 16)} in sub-chunk [16x64x16]
      </div>
      <div>Facing: {facing} (Pitch: {((pitch * 180) / Math.PI).toFixed(1)}°)</div>
      <div>Biome: {biome}</div>
      <div>Entities: {entitiesCount} active</div>
      <div>Time: {(timeOfDay * 24).toFixed(1)}:00 (Day/Night cycle)</div>
      <div className="text-gray-400 text-[10px] mt-1">Press F3 to toggle this screen</div>
    </div>
  );
};
