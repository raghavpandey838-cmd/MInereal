/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  BlockType,
  ItemId,
  ItemStack,
  PlayerStats,
  GameMode,
  VehicleType,
} from './game/types';
import { BLOCK_DEFS, ITEM_ATTACK_DAMAGE, FOOD_RESTORE } from './game/constants';
import { VoxelWorld } from './game/world';
import { PhysicsEngine } from './game/physics';
import { EntityManager } from './game/mobs';
import { HandRenderer, BlockHighlightManager } from './game/handRenderer';
import { DayNightCycle } from './game/sky';
import { sounds } from './game/audio';
import { StructureTemplate, placeStructure } from './game/blueprints';
import { VehicleManager } from './game/vehicles';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { InventoryModal } from './components/InventoryModal';
import { CraftingTableModal } from './components/CraftingTableModal';
import { FurnaceModal } from './components/FurnaceModal';
import { ChestModal } from './components/ChestModal';
import { BuildMenuModal } from './components/BuildMenuModal';
import { PauseMenu } from './components/PauseMenu';
import { DeathScreen } from './components/DeathScreen';
import { F3DebugScreen } from './components/F3DebugScreen';
import { MobileControls } from './components/MobileControls';
import { AdvancementsModal } from './components/AdvancementsModal';
import { CreativeToolType } from './components/BuildMenuModal';
import { Advancement, INITIAL_ADVANCEMENTS } from './game/advancements';

type ModalType = 'none' | 'inventory' | 'crafting' | 'furnace' | 'chest' | 'build' | 'advancements';

interface HistoryStep {
  x: number;
  y: number;
  z: number;
  oldType: BlockType;
  newType: BlockType;
}

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // Touch look-around refs for mobile
  const lookTouchId = useRef<number | null>(null);
  const lastTouchX = useRef<number>(0);
  const lastTouchY = useRef<number>(0);

  // Game UI States (Pure Creative Mode!)
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'dead'>('title');
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [gameMode, setGameMode] = useState<GameMode>('creative');
  const [selectedHotbarIndex, setSelectedHotbarIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showF3, setShowF3] = useState<boolean>(false);
  const [hurtFlash, setHurtFlash] = useState<boolean>(false);
  const [fpsDisplay, setFpsDisplay] = useState<number>(60);
  const [savedWorldAvailable, setSavedWorldAvailable] = useState<boolean>(false);
  const [showMobileControls, setShowMobileControls] = useState<boolean>(true);

  // Advancements & Creative Achievements
  const [advancements, setAdvancements] = useState<Advancement[]>(INITIAL_ADVANCEMENTS);
  const [recentAdvancement, setRecentAdvancement] = useState<Advancement | null>(null);
  const structuresBuiltCount = useRef<number>(0);

  // Navigation, Flight & Vehicle States
  const [isFlying, setIsFlying] = useState<boolean>(true);
  const [flySpeedMultiplier, setFlySpeedMultiplier] = useState<number>(1);
  const [customWaypoint, setCustomWaypoint] = useState<{ x: number; y: number; z: number } | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [compassHeading, setCompassHeading] = useState<string>('N (0°)');
  const [playerCoords, setPlayerCoords] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 30, z: 0 });
  const [mountedVehicleState, setMountedVehicleState] = useState<{ type: VehicleType; speed: number } | null>(null);

  // Undo / Build History Stack
  const [buildHistory, setBuildHistory] = useState<HistoryStep[][]>([]);

  // Unlock an Advancement helper with sound and toast banner
  const unlockAdvancement = useCallback((id: string) => {
    setAdvancements((prev) => {
      const adv = prev.find((a) => a.id === id);
      if (!adv || adv.unlocked) return prev;
      sounds.playLevelUp();
      const updated = { ...adv, unlocked: true, unlockedAt: Date.now() };
      setRecentAdvancement(updated);
      setTimeout(() => {
        setRecentAdvancement((curr) => (curr?.id === id ? null : curr));
      }, 4500);
      return prev.map((a) => (a.id === id ? updated : a));
    });
  }, []);

  // Player Stats (Preserved for compatibility, damage disabled in Creative)
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 20,
    maxHealth: 20,
    hunger: 20,
    maxHunger: 20,
    saturation: 20,
    oxygen: 20,
    maxOxygen: 20,
    experience: 0,
    level: 1,
    armor: 0,
  });

  // 36-slot Player Inventory (Equipped with rich Creative blocks & tools!)
  const [inventory, setInventory] = useState<(ItemStack | null)[]>(() => {
    const inv: (ItemStack | null)[] = new Array(36).fill(null);
    inv[0] = { id: 'diamond_pickaxe', count: 1 };
    inv[1] = { id: 'diamond_sword', count: 1 };
    inv[2] = { id: 'oak_planks', count: 64 };
    inv[3] = { id: 'bricks', count: 64 };
    inv[4] = { id: 'glass', count: 64 };
    inv[5] = { id: 'stone', count: 64 };
    inv[6] = { id: 'bookshelf', count: 64 };
    inv[7] = { id: 'tnt', count: 64 };
    inv[8] = { id: 'torch', count: 64 };
    return inv;
  });

  // Chest storage 27 slots
  const [chestSlots, setChestSlots] = useState<(ItemStack | null)[]>(() => new Array(27).fill(null));

  // Mutable Game Engine References
  const engineRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    world: VoxelWorld;
    sky: DayNightCycle;
    entities: EntityManager;
    vehicles: VehicleManager;
    hand: HandRenderer;
    highlighter: BlockHighlightManager;
    playerPos: THREE.Vector3;
    playerVel: THREE.Vector3;
    cameraYaw: number;
    cameraPitch: number;
    keys: Record<string, boolean>;
    isMining: boolean;
    miningBlock: { x: number; y: number; z: number; type: BlockType } | null;
    miningProgress: number;
    lastStepTime: number;
    lastHurtTime: number;
    fallDistance: number;
    titlePanAngle: number;
    lastTime: number;
    frameCount: number;
    lastFpsUpdate: number;
    torchLights: THREE.PointLight[];
  } | null>(null);

  // Check saved game in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mc_save_world');
      if (saved) {
        setSavedWorldAvailable(true);
      }
    } catch {
      // Storage blocked or restricted
    }
  }, []);

  // Update held item visual in hand when hotbar selection or inventory changes
  useEffect(() => {
    if (engineRef.current) {
      const currentItem = inventory[selectedHotbarIndex]?.id || null;
      engineRef.current.hand.updateHeldItem(currentItem);
    }
  }, [selectedHotbarIndex, inventory]);

  // Main Three.js Initialization
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 600);
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    mountRef.current.appendChild(renderer.domElement);

    // 2. Voxel World with seed
    const world = new VoxelWorld(scene, 42817);
    world.generateInitialWorld(0, 0);

    // 3. Day / Night Cycle with Sun, Moon, Stars
    const sky = new DayNightCycle(scene);

    // 4. Mobs & Entity Manager
    const entities = new EntityManager(scene);

    // 5. Vehicles Manager (Car, Bike, Boat)
    const vehicles = new VehicleManager(scene);

    // Guaranteed dry land landing area
    const safeSpawn = world.findSafeDryLandSpawn(0, 0);
    const spawnY = safeSpawn.y;

    // Spawn starter vehicles on dry land: Offroader Car and Motorcycle near spawn, Rowboat in nearby water
    vehicles.spawnVehicle('car', safeSpawn.x + 3, spawnY + 1, safeSpawn.z + 3, 0);
    vehicles.spawnVehicle('bike', safeSpawn.x - 3, spawnY + 1, safeSpawn.z + 3, Math.PI / 4);
    vehicles.spawnVehicle('boat', safeSpawn.x + 15, 24, safeSpawn.z + 15, 0);

    // Starter mobs on dry land
    entities.spawnMob('pig', safeSpawn.x + 4, spawnY + 1, safeSpawn.z + 2);
    entities.spawnMob('pig', safeSpawn.x - 4, spawnY + 1, safeSpawn.z + 3);
    entities.spawnMob('zombie', safeSpawn.x + 14, world.findHighestSolidY(safeSpawn.x + 14, safeSpawn.z + 14) + 1, safeSpawn.z + 14);
    entities.spawnMob('creeper', safeSpawn.x - 12, world.findHighestSolidY(safeSpawn.x - 12, safeSpawn.z - 10) + 1, safeSpawn.z - 10);

    // 6. Hand Renderer & Block Highlighter
    const hand = new HandRenderer(camera);
    const highlighter = new BlockHighlightManager(scene, world.opaqueMaterial.map as THREE.CanvasTexture);

    const playerPos = new THREE.Vector3(safeSpawn.x + 0.5, spawnY + 1.6, safeSpawn.z + 0.5);
    const playerVel = new THREE.Vector3(0, 0, 0);

    camera.position.set(playerPos.x, playerPos.y + 1.62, playerPos.z);

    // Start ambient music
    sounds.startAmbientMusic();

    engineRef.current = {
      renderer,
      scene,
      camera,
      world,
      sky,
      entities,
      vehicles,
      hand,
      highlighter,
      playerPos,
      playerVel,
      cameraYaw: 0,
      cameraPitch: 0,
      keys: {},
      isMining: false,
      miningBlock: null,
      miningProgress: 0,
      lastStepTime: 0,
      lastHurtTime: 0,
      fallDistance: 0,
      titlePanAngle: 0,
      lastTime: performance.now(),
      frameCount: 0,
      lastFpsUpdate: performance.now(),
      torchLights: [],
    };

    // Resize Handler
    const handleResize = () => {
      if (!engineRef.current) return;
      const { camera, renderer } = engineRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Pointer Lock Listener
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === renderer.domElement;
      setIsPointerLocked(isLocked);
      if (!isLocked) {
        setGameState((curr) => (curr === 'playing' ? 'paused' : curr));
      }
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    // Window Blur: Clear all keys so player never gets stuck moving
    const handleWindowBlur = () => {
      if (engineRef.current) {
        engineRef.current.keys = {};
      }
    };
    window.addEventListener('blur', handleWindowBlur);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('blur', handleWindowBlur);
      sounds.stopAmbientMusic();
      world.dispose();
      sky.dispose();
      entities.dispose();
      vehicles.dispose();
      hand.dispose();
      highlighter.dispose();
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      engineRef.current = null;
    };
  }, []);

  // Damage Player function
  const applyPlayerDamage = useCallback(
    (amount: number) => {
      if (gameMode === 'creative' || isFlying) return;
      sounds.playPlayerHurt();
      setHurtFlash(true);
      setTimeout(() => setHurtFlash(false), 250);

      setPlayerStats((prev) => {
        const nextHealth = Math.max(0, prev.health - amount);
        if (nextHealth <= 0) {
          setGameState('dead');
          document.exitPointerLock?.();
        }
        return { ...prev, health: nextHealth };
      });
    },
    [gameMode, isFlying]
  );

  // Consume / Eat Food
  const handleEatFood = useCallback((foodId: ItemId) => {
    const restore = FOOD_RESTORE[foodId];
    if (!restore) return;

    setPlayerStats((prev) => ({
      ...prev,
      hunger: Math.min(prev.maxHunger, prev.hunger + restore.hunger),
      saturation: Math.min(prev.hunger + restore.hunger, prev.saturation + restore.saturation),
    }));

    // Deduct 1 food from hotbar
    setInventory((prev) => {
      const newInv = [...prev];
      const slot = newInv[selectedHotbarIndex];
      if (slot) {
        if (slot.count > 1) {
          newInv[selectedHotbarIndex] = { ...slot, count: slot.count - 1 };
        } else {
          newInv[selectedHotbarIndex] = null;
        }
      }
      return newInv;
    });

    sounds.playCraft();
  }, [selectedHotbarIndex]);

  // Rotate camera horizontally (for trackpad buttons or arrow keys)
  const handleRotateCamera = (deltaYaw: number) => {
    if (engineRef.current) {
      engineRef.current.cameraYaw += deltaYaw;
    }
  };

  // Teleport Home / Guaranteed Dry Land Spawn
  const handleTeleportHome = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const safeSpawn = engine.world.findSafeDryLandSpawn(0, 0);
    engine.playerPos.set(safeSpawn.x + 0.5, safeSpawn.y + 1.6, safeSpawn.z + 0.5);
    engine.playerVel.set(0, 0, 0);
    sounds.playLevelUp();
  };

  // Undo last build action
  const handleUndo = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || buildHistory.length === 0) return;

    const lastStep = buildHistory[buildHistory.length - 1];
    for (const b of lastStep) {
      engine.world.setBlock(b.x, b.y, b.z, b.oldType);
    }
    engine.world.rebuildDirtyChunks();
    setBuildHistory((prev) => prev.slice(0, -1));
    sounds.playBlockBreak(BlockType.STONE);
  }, [buildHistory]);

  // Select Structure from Build Menu
  const handleSelectStructure = (template: StructureTemplate) => {
    const engine = engineRef.current;
    if (!engine) return;

    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(engine.camera.quaternion);
    const buildDistance = Math.max(3, Math.floor(Math.max(template.width, template.depth) / 2));
    const originX = Math.floor(engine.playerPos.x + forwardDir.x * buildDistance);
    const originZ = Math.floor(engine.playerPos.z + forwardDir.z * buildDistance);
    const originY = Math.max(1, Math.floor(engine.playerPos.y));

    placeStructure(engine.world, originX, originY, originZ, template, (history) => {
      setBuildHistory((prev) => [...prev.slice(-49), history]);
    });

    structuresBuiltCount.current += 1;
    unlockAdvancement('first_blueprint');
    if (structuresBuiltCount.current >= 3) {
      unlockAdvancement('grand_architect');
    }
  };

  // Select Super Tool / Multi-Block WorldEdit
  const handleSelectTool = (toolType: CreativeToolType) => {
    const engine = engineRef.current;
    if (!engine) return;

    const currentHeld = inventory[selectedHotbarIndex];
    let blockType = BlockType.OAK_PLANKS;
    if (currentHeld) {
      const def = Object.values(BLOCK_DEFS).find((d) => d.id === currentHeld.id);
      if (def && def.type !== BlockType.AIR) {
        blockType = def.type;
      }
    }

    const history: HistoryStep[] = [];
    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(engine.camera.quaternion);

    if (toolType === 'sphereDome') {
      // 7x7 Glass Biodome around target
      const cx = Math.floor(engine.playerPos.x + forwardDir.x * 5);
      const cz = Math.floor(engine.playerPos.z + forwardDir.z * 5);
      const cy = Math.floor(engine.playerPos.y);
      const radius = 3.5;

      for (let dx = -4; dx <= 4; dx++) {
        for (let dy = 0; dy <= 4; dy++) {
          for (let dz = -4; dz <= 4; dz++) {
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist >= radius - 0.7 && dist <= radius + 0.3) {
              const wx = cx + dx;
              const wy = cy + dy;
              const wz = cz + dz;
              if (wy >= 0 && wy < 64) {
                const oldType = engine.world.getBlock(wx, wy, wz);
                history.push({ x: wx, y: wy, z: wz, oldType, newType: BlockType.GLASS });
                engine.world.setBlock(wx, wy, wz, BlockType.GLASS);
              }
            }
          }
        }
      }
      unlockAdvancement('world_edit');
    } else if (toolType === 'highway') {
      // 3-wide smooth stone road extending 12 blocks ahead
      const startX = Math.floor(engine.playerPos.x);
      const startZ = Math.floor(engine.playerPos.z);
      const groundY = Math.floor(engine.playerPos.y) - 1;

      const stepX = Math.abs(forwardDir.x) > Math.abs(forwardDir.z) ? Math.sign(forwardDir.x) : 0;
      const stepZ = stepX === 0 ? Math.sign(forwardDir.z) : 0;
      const perpX = stepZ !== 0 ? 1 : 0;
      const perpZ = stepX !== 0 ? 1 : 0;

      for (let dist = 1; dist <= 12; dist++) {
        for (let p = -1; p <= 1; p++) {
          const wx = startX + stepX * dist + perpX * p;
          const wz = startZ + stepZ * dist + perpZ * p;
          if (groundY >= 0 && groundY < 64) {
            const oldType = engine.world.getBlock(wx, groundY, wz);
            history.push({ x: wx, y: groundY, z: wz, oldType, newType: BlockType.STONE });
            engine.world.setBlock(wx, groundY, wz, BlockType.STONE);
          }
        }
      }
      unlockAdvancement('world_edit');
    } else if (toolType === 'demolish') {
      // Clear 5x5x5 cubic area in front of player
      const cx = Math.floor(engine.playerPos.x + forwardDir.x * 3.5);
      const cz = Math.floor(engine.playerPos.z + forwardDir.z * 3.5);
      const cy = Math.floor(engine.playerPos.y);

      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -1; dy <= 3; dy++) {
          for (let dz = -2; dz <= 2; dz++) {
            const wx = cx + dx;
            const wy = cy + dy;
            const wz = cz + dz;
            if (wy >= 0 && wy < 64) {
              const oldType = engine.world.getBlock(wx, wy, wz);
              if (oldType !== BlockType.AIR) {
                history.push({ x: wx, y: wy, z: wz, oldType, newType: BlockType.AIR });
                engine.world.setBlock(wx, wy, wz, BlockType.AIR);
              }
            }
          }
        }
      }
      unlockAdvancement('world_edit');
    } else if (toolType === 'tntCluster') {
      // 3x3 TNT Cluster
      const cx = Math.floor(engine.playerPos.x + forwardDir.x * 3.5);
      const cz = Math.floor(engine.playerPos.z + forwardDir.z * 3.5);
      const cy = Math.floor(engine.playerPos.y);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const wx = cx + dx;
          const wy = cy;
          const wz = cz + dz;
          if (wy >= 0 && wy < 64) {
            const oldType = engine.world.getBlock(wx, wy, wz);
            history.push({ x: wx, y: wy, z: wz, oldType, newType: BlockType.TNT });
            engine.world.setBlock(wx, wy, wz, BlockType.TNT);
          }
        }
      }
      unlockAdvancement('world_edit');
    } else if (toolType === 'wall3x3') {
      const centerX = Math.floor(engine.playerPos.x + forwardDir.x * 2.5);
      const centerZ = Math.floor(engine.playerPos.z + forwardDir.z * 2.5);
      const baseY = Math.floor(engine.playerPos.y);
      const isFacingZ = Math.abs(forwardDir.z) > Math.abs(forwardDir.x);

      for (let offset = -1; offset <= 1; offset++) {
        for (let dy = 0; dy <= 2; dy++) {
          const wx = isFacingZ ? centerX + offset : centerX;
          const wz = isFacingZ ? centerZ : centerZ + offset;
          const wy = baseY + dy;
          if (wy >= 0 && wy < 64) {
            const oldType = engine.world.getBlock(wx, wy, wz);
            history.push({ x: wx, y: wy, z: wz, oldType, newType: blockType });
            engine.world.setBlock(wx, wy, wz, blockType);
          }
        }
      }
      unlockAdvancement('world_edit');
    } else if (toolType === 'floor5x5') {
      const centerX = Math.floor(engine.playerPos.x);
      const centerZ = Math.floor(engine.playerPos.z);
      const baseY = Math.floor(engine.playerPos.y) - 1;

      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const wx = centerX + dx;
          const wz = centerZ + dz;
          if (baseY >= 0 && baseY < 64) {
            const oldType = engine.world.getBlock(wx, baseY, wz);
            history.push({ x: wx, y: baseY, z: wz, oldType, newType: blockType });
            engine.world.setBlock(wx, baseY, wz, blockType);
          }
        }
      }
      unlockAdvancement('world_edit');
    } else if (toolType === 'column4') {
      const targetX = Math.floor(engine.playerPos.x + forwardDir.x * 1.5);
      const targetZ = Math.floor(engine.playerPos.z + forwardDir.z * 1.5);
      const baseY = Math.floor(engine.playerPos.y);

      for (let dy = 0; dy < 4; dy++) {
        const wy = baseY + dy;
        if (wy >= 0 && wy < 64) {
          const oldType = engine.world.getBlock(targetX, wy, targetZ);
          history.push({ x: targetX, y: wy, z: targetZ, oldType, newType: blockType });
          engine.world.setBlock(targetX, wy, targetZ, blockType);
        }
      }
      unlockAdvancement('world_edit');
    }

    if (history.length > 0) {
      engine.world.rebuildDirtyChunks();
      sounds.playBlockPlace();
      setBuildHistory((prev) => [...prev.slice(-49), history]);
    }
  };

  // Spawn a driveable vehicle (Car, Bike, Boat)
  const handleSpawnDriveableVehicle = (type: VehicleType) => {
    const engine = engineRef.current;
    if (!engine) return;

    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(engine.camera.quaternion);
    const spawnDist = 3.0;
    const sx = engine.playerPos.x + forwardDir.x * spawnDist;
    const sz = engine.playerPos.z + forwardDir.z * spawnDist;

    // If boat, spawn on water level Y=24
    let sy = engine.playerPos.y;
    if (type === 'boat') {
      sy = 24.0;
      unlockAdvancement('sea_captain');
    } else {
      sy = engine.world.findHighestSolidY(Math.floor(sx), Math.floor(sz)) + 0.5;
    }

    engine.vehicles.spawnVehicle(type, sx, sy, sz, engine.cameraYaw);
  };

  // Spawn an interactive mob in creative mode
  const handleSpawnMob = (type: 'pig' | 'cow' | 'sheep' | 'zombie' | 'skeleton' | 'creeper') => {
    const engine = engineRef.current;
    if (!engine) return;

    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(engine.camera.quaternion);
    const sx = engine.playerPos.x + forwardDir.x * 3.0;
    const sz = engine.playerPos.z + forwardDir.z * 3.0;
    const sy = engine.world.findHighestSolidY(Math.floor(sx), Math.floor(sz)) + 1;

    engine.entities.spawnMob(type, sx, sy, sz);
    engine.entities.spawnParticleBurst(sx, sy + 0.5, sz, '#ffffff', 8);
    sounds.playPop();
    unlockAdvancement('life_creator');
  };

  // Set Celestial Time of Day (0.5 = Noon, 0.75 = Sunset, 0.0 = Night, 0.25 = Morning)
  const handleSetTimeOfDay = (timeVal: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.sky.setTimeOfDay(timeVal);
    unlockAdvancement('time_lord');
  };

  // Save current location as a custom Waypoint
  const handleSaveWaypoint = () => {
    const engine = engineRef.current;
    if (!engine) return;
    setCustomWaypoint({
      x: engine.playerPos.x,
      y: engine.playerPos.y,
      z: engine.playerPos.z,
    });
    sounds.playLevelUp();
  };

  // Teleport to custom Waypoint
  const handleTeleportWaypoint = () => {
    const engine = engineRef.current;
    if (!engine || !customWaypoint) return;
    engine.playerPos.set(customWaypoint.x, customWaypoint.y, customWaypoint.z);
    engine.playerVel.set(0, 0, 0);
    sounds.playLevelUp();
    unlockAdvancement('waypoint_travel');
  };

  // Select Item from Creative Block Palette
  const handleSelectCreativeItem = (itemId: ItemId) => {
    setInventory((prev) => {
      const newInv = [...prev];
      newInv[selectedHotbarIndex] = { id: itemId, count: 64 };
      return newInv;
    });
  };

  // Main Render & Game Loop
  useEffect(() => {
    let animId: number;

    const gameLoop = (time: number) => {
      animId = requestAnimationFrame(gameLoop);
      const engine = engineRef.current;
      if (!engine) return;

      const rawDt = (time - engine.lastTime) / 1000;
      engine.lastTime = time;
      const dt = Math.min(rawDt, 0.05);

      // FPS tracking
      engine.frameCount++;
      if (time - engine.lastFpsUpdate > 1000) {
        setFpsDisplay(engine.frameCount);
        engine.frameCount = 0;
        engine.lastFpsUpdate = time;
      }

      // Title Screen: Panoramic camera rotation
      if (gameState === 'title') {
        engine.titlePanAngle += dt * 0.1;
        const radius = 25;
        const panX = Math.sin(engine.titlePanAngle) * radius;
        const panZ = Math.cos(engine.titlePanAngle) * radius;
        engine.camera.position.set(panX, 35, panZ);
        engine.camera.lookAt(0, 26, 0);

        engine.sky.update(dt, new THREE.Vector3(0, 26, 0));
        engine.renderer.render(engine.scene, engine.camera);
        return;
      }

      // Pause or Dead state: keep sky moving slowly
      if (gameState === 'paused' || gameState === 'dead' || activeModal !== 'none') {
        engine.sky.update(dt * 0.2, engine.playerPos);
        engine.renderer.render(engine.scene, engine.camera);
        return;
      }

      // --- PLAYING STATE ---
      const {
        world,
        sky,
        entities,
        vehicles,
        hand,
        highlighter,
        playerPos,
        playerVel,
        camera,
        keys,
      } = engine;

      // 1. Day / Night cycle
      sky.update(dt, playerPos);

      // 2. Dynamic Wide Map Streaming: stream chunks around player as they explore
      world.updateChunksAroundPlayer(playerPos.x, playerPos.z);

      // 3. Update Vehicles Physics & Driving
      vehicles.updateVehicles(world, dt, keys, (wx, wy, wz) => {
        entities.spawnParticleBurst(wx, wy + 0.1, wz, '#88ccff', 4);
      });

      // 4. Keyboard Arrow Turning (smooth turning without mouse)
      if (keys['ArrowLeft']) engine.cameraYaw += 2.4 * dt;
      if (keys['ArrowRight']) engine.cameraYaw -= 2.4 * dt;

      // 5. Check if Player is Mounted on a Vehicle
      const mounted = vehicles.mountedVehicle;
      if (mounted) {
        setMountedVehicleState({ type: mounted.entity.type, speed: mounted.entity.speed });
        // Lock player position to vehicle seat
        const seatYOffset = mounted.entity.type === 'bike' ? 0.75 : 0.45;
        playerPos.set(mounted.entity.x, mounted.entity.y + seatYOffset, mounted.entity.z);
        playerVel.set(mounted.entity.vx, mounted.entity.vy, mounted.entity.vz);

        // Camera position tracks vehicle
        camera.position.set(playerPos.x, playerPos.y + 1.3, playerPos.z);
        camera.rotation.order = 'YXZ';
        camera.rotation.y = engine.cameraYaw;
        camera.rotation.x = engine.cameraPitch;

        setPlayerCoords({ x: playerPos.x, y: playerPos.y, z: playerPos.z });
      } else {
        setMountedVehicleState(null);

        // Standard On-Foot / Flying Movement:
        // Key W: moves forward EVERY TIME
        // Key S: moves backward EVERY TIME
        // Key A: moves left EVERY TIME
        // Key D: moves right EVERY TIME
        const isW = !!(keys['KeyW'] || keys['w']);
        const isS = !!(keys['KeyS'] || keys['s']);
        const isA = !!(keys['KeyA'] || keys['a']);
        const isD = !!(keys['KeyD'] || keys['d']);

        let moveForward = (isW ? 1 : 0) - (isS ? 1 : 0);
        let moveRight = (isD ? 1 : 0) - (isA ? 1 : 0);

        const len = Math.hypot(moveForward, moveRight);
        if (len > 0) {
          moveForward /= len;
          moveRight /= len;
        }

        const isSprinting = !!(keys['ControlLeft'] || keys['ControlRight']);
        const isSneaking = !!(keys['ShiftLeft'] || keys['ShiftRight']);
        const moveSpeed = isFlying
          ? (isSprinting ? 20.0 : 12.0) * flySpeedMultiplier
          : isSprinting
          ? PhysicsEngine.SPRINT_SPEED
          : isSneaking
          ? PhysicsEngine.SNEAK_SPEED
          : PhysicsEngine.WALK_SPEED;

        // Exact Camera Look Direction Vectors:
        // Always moves in the exact direction the player is facing!
        const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const horizForward = new THREE.Vector3(cameraForward.x, 0, cameraForward.z);
        if (horizForward.lengthSq() > 0.0001) {
          horizForward.normalize();
        } else {
          horizForward.set(-Math.sin(engine.cameraYaw), 0, -Math.cos(engine.cameraYaw)).normalize();
        }
        // Right vector is perpendicular to forward on XZ plane
        const horizRight = new THREE.Vector3(-horizForward.z, 0, horizForward.x);

        const targetVx = (horizForward.x * moveForward + horizRight.x * moveRight) * moveSpeed;
        const targetVz = (horizForward.z * moveForward + horizRight.z * moveRight) * moveSpeed;

        const accel = (isFlying ? 22.0 : 15.0) * dt;
        playerVel.x += (targetVx - playerVel.x) * accel;
        playerVel.z += (targetVz - playerVel.z) * accel;

        // Water check & buoyancy
        const feetBlock = world.getBlock(Math.floor(playerPos.x), Math.floor(playerPos.y + 0.1), Math.floor(playerPos.z));
        const headBlock = world.getBlock(Math.floor(playerPos.x), Math.floor(playerPos.y + 1.5), Math.floor(playerPos.z));
        const inWater = feetBlock === BlockType.WATER || headBlock === BlockType.WATER;

        // Vertical Movement: Flight vs Gravity
        if (isFlying) {
          engine.fallDistance = 0;
          let targetVy = 0;
          // When flying forward/backward, also glide vertically if looking up/down
          if (moveForward !== 0 && Math.abs(cameraForward.y) > 0.15) {
            targetVy += cameraForward.y * moveForward * moveSpeed * 0.75;
          }
          if (keys['Space']) targetVy += 9.5 * flySpeedMultiplier;
          if (keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyC'] || keys['c']) targetVy -= 9.5 * flySpeedMultiplier;
          playerVel.y += (targetVy - playerVel.y) * 16.0 * dt;
        } else if (inWater) {
          playerVel.y -= PhysicsEngine.GRAVITY * 0.3 * dt;
          playerVel.y *= 0.85;
          if (keys['Space']) {
            playerVel.y = PhysicsEngine.SWIM_SPEED;
          }
        } else {
          playerVel.y -= PhysicsEngine.GRAVITY * dt;
          if (playerVel.y < -PhysicsEngine.TERMINAL_VELOCITY) {
            playerVel.y = -PhysicsEngine.TERMINAL_VELOCITY;
          }
        }

        // Void Rescue Protection (Never die from falling into void)
        if (playerPos.y < -15) {
          const spawnY = world.findHighestSolidY(0, 0) + 2;
          playerPos.set(0.5, spawnY, 0.5);
          playerVel.set(0, 0, 0);
          sounds.playLevelUp();
        }

        // Sky High Altitude Advancement
        if (playerPos.y > 60) {
          unlockAdvancement('sky_high');
        }

        // Move entity with physics
        const preMoveY = playerPos.y;
        const moveRes = PhysicsEngine.moveEntity(world, playerPos, playerVel, 0.3, 1.8, dt, !isFlying);

        // Jump
        if (!isFlying && keys['Space'] && moveRes.isGrounded && !inWater) {
          playerVel.y = PhysicsEngine.JUMP_SPEED;
          sounds.playStep(BlockType.GRASS);
        }

        // Fall damage
        if (!moveRes.isGrounded) {
          if (playerVel.y < 0 && !isFlying && gameMode === 'survival') {
            engine.fallDistance += Math.abs(playerPos.y - preMoveY);
          }
        } else {
          if (engine.fallDistance > 3.5 && gameMode === 'survival' && !isFlying) {
            const damage = Math.floor(engine.fallDistance - 3);
            if (damage > 0) {
              applyPlayerDamage(damage);
            }
          }
          engine.fallDistance = 0;
        }

        // Footsteps
        const isMovingHoriz = Math.hypot(playerVel.x, playerVel.z) > 1.2;
        if (moveRes.isGrounded && isMovingHoriz && !isFlying) {
          if (time - engine.lastStepTime > (isSprinting ? 300 : 450)) {
            engine.lastStepTime = time;
            const groundBlock = world.getBlock(Math.floor(playerPos.x), Math.floor(playerPos.y - 0.2), Math.floor(playerPos.z));
            sounds.playStep(groundBlock);
          }
        }

        // Camera position (eye height = 1.62m)
        camera.position.set(playerPos.x, playerPos.y + 1.62, playerPos.z);
        camera.rotation.order = 'YXZ';
        camera.rotation.y = engine.cameraYaw;
        camera.rotation.x = engine.cameraPitch;

        setPlayerCoords({ x: playerPos.x, y: playerPos.y, z: playerPos.z });
      }

      // Compass calculation
      const deg = ((-engine.cameraYaw * 180) / Math.PI + 360) % 360;
      let heading = 'N';
      if (deg >= 22.5 && deg < 67.5) heading = 'NE';
      else if (deg >= 67.5 && deg < 112.5) heading = 'E';
      else if (deg >= 112.5 && deg < 157.5) heading = 'SE';
      else if (deg >= 157.5 && deg < 202.5) heading = 'S';
      else if (deg >= 202.5 && deg < 247.5) heading = 'SW';
      else if (deg >= 247.5 && deg < 292.5) heading = 'W';
      else if (deg >= 292.5 && deg < 337.5) heading = 'NW';
      setCompassHeading(`${heading} (${Math.round(deg)}°)`);

      // 6. Update Hand / Tool Model
      const isMoving = Math.hypot(playerVel.x, playerVel.z) > 0.5;
      hand.update(dt, isMoving);

      // 7. Raycast Voxel Target & Ghost Block Placement Preview
      const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const hit = world.raycast(camera.position, forwardDir, 5.5);

      if (hit.hit) {
        highlighter.setHighlight(hit.x, hit.y, hit.z, true);

        // Ghost placement preview
        const currentHeld = inventory[selectedHotbarIndex];
        const isPlaceable =
          currentHeld &&
          Object.values(BLOCK_DEFS).some((d) => d.id === currentHeld.id && d.type !== BlockType.AIR);

        if (isPlaceable) {
          const placeX = hit.x + hit.normal[0];
          const placeY = hit.y + hit.normal[1];
          const placeZ = hit.z + hit.normal[2];

          const overlapsPlayer =
            playerPos.x - 0.3 < placeX + 1 &&
            playerPos.x + 0.3 > placeX &&
            playerPos.y < placeY + 1 &&
            playerPos.y + 1.8 > placeY &&
            playerPos.z - 0.3 < placeZ + 1 &&
            playerPos.z + 0.3 > placeZ;

          highlighter.setGhostPlacement(placeX, placeY, placeZ, true, overlapsPlayer ? 0xff4444 : 0x55ff77);
        } else {
          highlighter.setGhostPlacement(0, 0, 0, false);
        }

        // Mining with left click
        if (engine.isMining) {
          const blockDef = BLOCK_DEFS[hit.block];

          if (
            !engine.miningBlock ||
            engine.miningBlock.x !== hit.x ||
            engine.miningBlock.y !== hit.y ||
            engine.miningBlock.z !== hit.z
          ) {
            engine.miningBlock = { x: hit.x, y: hit.y, z: hit.z, type: hit.block };
            engine.miningProgress = 0;
          }

          let speedMultiplier = 1.0;
          if (gameMode === 'creative') {
            speedMultiplier = 100.0;
          } else if (blockDef && blockDef.requiredToolType && currentHeld) {
            if (currentHeld.id.includes(blockDef.requiredToolType)) {
              speedMultiplier = currentHeld.id.includes('diamond')
                ? 8.0
                : currentHeld.id.includes('iron')
                ? 6.0
                : currentHeld.id.includes('stone')
                ? 4.0
                : 2.0;
            }
          }

          const hardness = blockDef?.hardness ?? 1.0;
          const breakRate = speedMultiplier / Math.max(0.1, hardness);
          engine.miningProgress += dt * breakRate;

          if (Math.random() < 0.25) {
            sounds.playBlockHit(hit.block);
            entities.spawnParticleBurst(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, '#777777', 2);
          }

          highlighter.setCrackStage(hit.x, hit.y, hit.z, engine.miningProgress);

          if (engine.miningProgress >= 1.0) {
            const oldType = hit.block;
            world.setBlock(hit.x, hit.y, hit.z, BlockType.AIR);
            world.rebuildDirtyChunks();
            sounds.playBlockBreak(hit.block);
            entities.spawnParticleBurst(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, '#888888', 14);

            setBuildHistory((prev) => [
              ...prev.slice(-49),
              [{ x: hit.x, y: hit.y, z: hit.z, oldType, newType: BlockType.AIR }],
            ]);

            if (gameMode === 'survival' && blockDef && blockDef.drops.length > 0) {
              blockDef.drops.forEach((drop) => {
                if (!drop.chance || Math.random() <= drop.chance) {
                  entities.spawnDroppedItem(
                    { id: drop.id, count: drop.count },
                    hit.x + 0.5,
                    hit.y + 0.5,
                    hit.z + 0.5
                  );
                }
              });
            }

            if (currentHeld && currentHeld.durability !== undefined) {
              setInventory((prev) => {
                const newInv = [...prev];
                const tool = newInv[selectedHotbarIndex];
                if (tool && tool.durability !== undefined) {
                  tool.durability -= 1;
                  if (tool.durability <= 0) {
                    newInv[selectedHotbarIndex] = null;
                    sounds.playBlockBreak(BlockType.STONE);
                  }
                }
                return newInv;
              });
            }

            engine.miningProgress = 0;
            engine.miningBlock = null;
            highlighter.setCrackStage(0, 0, 0, 0);
          }
        } else {
          engine.miningProgress = 0;
          highlighter.setCrackStage(0, 0, 0, 0);
        }
      } else {
        highlighter.setHighlight(0, 0, 0, false);
        highlighter.setCrackStage(0, 0, 0, 0);
        highlighter.setGhostPlacement(0, 0, 0, false);
        engine.miningProgress = 0;
      }

      // 8. Update Mobs AI & Combat
      entities.updateMobs(world, playerPos, dt, (damage) => {
        applyPlayerDamage(damage);
      });

      // 9. Update Dropped Items (vacuum pickup)
      entities.updateDroppedItems(world, playerPos, dt, (dropped) => {
        setInventory((prev) => {
          const newInv = [...prev];
          const existing = newInv.find((s) => s && s.id === dropped.id && s.count < 64);
          if (existing) {
            existing.count += dropped.count;
          } else {
            const emptyIdx = newInv.findIndex((s) => s === null);
            if (emptyIdx !== -1) {
              newInv[emptyIdx] = { id: dropped.id, count: dropped.count };
            }
          }
          return newInv;
        });

        setPlayerStats((prev) => {
          const nextXP = prev.experience + 0.1;
          if (nextXP >= 1.0) {
            sounds.playLevelUp();
            return { ...prev, experience: 0, level: prev.level + 1 };
          }
          return { ...prev, experience: nextXP };
        });
      });

      // 10. Update Particles
      entities.updateParticles(dt);

      // 11. Render 3D Scene
      engine.renderer.render(engine.scene, engine.camera);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, activeModal, gameMode, selectedHotbarIndex, applyPlayerDamage, inventory, isFlying]);

  // Action: Start Mining block or attack mob (Shared between Mouse and Mobile button)
  const handleMineStart = () => {
    const engine = engineRef.current;
    if (!engine || gameState !== 'playing' || activeModal !== 'none') return;

    engine.hand.swing();
    sounds.playSwing();
    engine.isMining = true;

    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(engine.camera.quaternion);

    // 1. Check if hitting any mob first
    for (let i = 0; i < engine.entities.mobs.length; i++) {
      const mob = engine.entities.mobs[i];
      const dist = Math.hypot(
        engine.playerPos.x - mob.entity.x,
        engine.playerPos.y - mob.entity.y,
        engine.playerPos.z - mob.entity.z
      );

      if (dist < 4.5) {
        const toMob = new THREE.Vector3(
          mob.entity.x - engine.playerPos.x,
          mob.entity.y + 0.8 - (engine.playerPos.y + 1.62),
          mob.entity.z - engine.playerPos.z
        ).normalize();

        const dot = forwardDir.dot(toMob);
        if (dot > 0.85) {
          const held = inventory[selectedHotbarIndex];
          const damage = (held && ITEM_ATTACK_DAMAGE[held.id]) || 4;
          engine.entities.damageMob(i, damage, forwardDir);
          engine.isMining = false;
          return;
        }
      }
    }

    // 2. Creative Mode: Instant 1-Click Break on targeted block
    if (gameMode === 'creative') {
      const hit = engine.world.raycast(engine.camera.position, forwardDir, 6.0);
      if (hit.hit && hit.block !== BlockType.BEDROCK && hit.block !== BlockType.AIR) {
        const oldType = hit.block;
        engine.world.setBlock(hit.x, hit.y, hit.z, BlockType.AIR);
        engine.world.rebuildDirtyChunks();
        sounds.playBlockBreak(hit.block);
        engine.entities.spawnParticleBurst(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, '#888888', 12);
        setBuildHistory((prev) => [
          ...prev.slice(-49),
          [{ x: hit.x, y: hit.y, z: hit.z, oldType, newType: BlockType.AIR }],
        ]);
        engine.highlighter.setCrackStage(0, 0, 0, 0);
      }
    }
  };

  // Action: Stop Mining (Shared between Mouse and Mobile button)
  const handleMineStop = () => {
    if (engineRef.current) {
      engineRef.current.isMining = false;
      engineRef.current.miningProgress = 0;
      engineRef.current.highlighter.setCrackStage(0, 0, 0, 0);
    }
  };

  // Action: Place block, eat, interact with tables/chests/vehicles (Shared between Mouse and Mobile)
  const handleInteract = () => {
    const engine = engineRef.current;
    if (!engine || gameState !== 'playing' || activeModal !== 'none') return;

    engine.hand.swing();
    sounds.playSwing();

    // Check mounting vehicle with right click/tap if within 3.5 blocks
    const mounted = engine.vehicles.toggleMountNearest(engine.playerPos);
    if (mounted) {
      setMountedVehicleState({ type: mounted.entity.type, speed: mounted.entity.speed });
      return;
    }

    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(engine.camera.quaternion);
    const hit = engine.world.raycast(engine.camera.position, forwardDir, 5.5);

    if (hit.hit) {
      if (hit.block === BlockType.CRAFTING_TABLE) {
        setActiveModal('crafting');
        document.exitPointerLock?.();
        return;
      }
      if (hit.block === BlockType.FURNACE) {
        setActiveModal('furnace');
        document.exitPointerLock?.();
        return;
      }
      if (hit.block === BlockType.CHEST) {
        setActiveModal('chest');
        document.exitPointerLock?.();
        return;
      }
      if (hit.block === BlockType.TNT) {
        engine.world.setBlock(hit.x, hit.y, hit.z, BlockType.AIR);
        engine.world.rebuildDirtyChunks();
        sounds.playCreeperHiss();
        setTimeout(() => {
          engine.entities.explodeAt(engine.world, hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, 4.0);
        }, 1800);
        return;
      }

      const held = inventory[selectedHotbarIndex];
      if (held && FOOD_RESTORE[held.id] && playerStats.hunger < 20) {
        handleEatFood(held.id);
        return;
      }

      const placeX = hit.x + hit.normal[0];
      const placeY = hit.y + hit.normal[1];
      const placeZ = hit.z + hit.normal[2];

      const playerBox = {
        minX: engine.playerPos.x - 0.3,
        maxX: engine.playerPos.x + 0.3,
        minY: engine.playerPos.y,
        maxY: engine.playerPos.y + 1.8,
        minZ: engine.playerPos.z - 0.3,
        maxZ: engine.playerPos.z + 0.3,
      };

      const blockBox = {
        minX: placeX,
        maxX: placeX + 1,
        minY: placeY,
        maxY: placeY + 1,
        minZ: placeZ,
        maxZ: placeZ + 1,
      };

      const overlaps =
        playerBox.minX < blockBox.maxX &&
        playerBox.maxX > blockBox.minX &&
        playerBox.minY < blockBox.maxY &&
        playerBox.maxY > blockBox.minY &&
        playerBox.minZ < blockBox.maxZ &&
        playerBox.maxZ > blockBox.minZ;

      if (overlaps) return;

      let placeBlockType: BlockType | null = null;
      if (held) {
        const def = Object.values(BLOCK_DEFS).find((d) => d.id === held.id);
        if (def && def.type !== BlockType.AIR) {
          placeBlockType = def.type;
        }
      }

      if (placeBlockType !== null) {
        const oldType = engine.world.getBlock(placeX, placeY, placeZ);
        engine.world.setBlock(placeX, placeY, placeZ, placeBlockType);
        engine.world.rebuildDirtyChunks();
        sounds.playBlockPlace();

        setBuildHistory((prev) => [
          ...prev.slice(-49),
          [{ x: placeX, y: placeY, z: placeZ, oldType, newType: placeBlockType! }],
        ]);

        if (placeBlockType === BlockType.TORCH && engine.torchLights.length < 20) {
          const torchLight = new THREE.PointLight(0xffaa44, 1.2, 12);
          torchLight.position.set(placeX + 0.5, placeY + 0.8, placeZ + 0.5);
          engine.scene.add(torchLight);
          engine.torchLights.push(torchLight);
        }

        if (gameMode === 'survival') {
          setInventory((prev) => {
            const newInv = [...prev];
            const slot = newInv[selectedHotbarIndex];
            if (slot) {
              if (slot.count > 1) {
                newInv[selectedHotbarIndex] = { ...slot, count: slot.count - 1 };
              } else {
                newInv[selectedHotbarIndex] = null;
              }
            }
            return newInv;
          });
        }
      }
    }
  };

  // Mouse Down Event
  const handleMouseDown = (e: React.MouseEvent) => {
    const engine = engineRef.current;
    if (!engine) return;

    // Lock pointer on first click if desktop
    if (document.pointerLockElement !== engine.renderer.domElement) {
      engine.renderer.domElement.requestPointerLock?.();
      if (gameState === 'title') {
        setGameState('playing');
      }
      return;
    }

    if (e.button === 0) {
      handleMineStart();
    } else if (e.button === 2) {
      e.preventDefault();
      handleInteract();
    }
  };

  const handleMouseUp = () => {
    handleMineStop();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const engine = engineRef.current;
    if (!engine || document.pointerLockElement !== engine.renderer.domElement) return;

    const sensitivity = 0.0022;
    engine.cameraYaw -= e.movementX * sensitivity;
    engine.cameraPitch -= e.movementY * sensitivity;

    const maxPitch = Math.PI / 2 - 0.05;
    engine.cameraPitch = Math.max(-maxPitch, Math.min(maxPitch, engine.cameraPitch));
  };

  // Mobile Touch Look & Navigation Handlers
  const handleTouchSetKey = (key: string, code: string, pressed: boolean) => {
    if (engineRef.current) {
      engineRef.current.keys[key] = pressed;
      engineRef.current.keys[code] = pressed;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, [data-interactive], input, select, textarea')) {
      return;
    }
    if (gameState !== 'playing' || activeModal !== 'none') return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (lookTouchId.current === null) {
        lookTouchId.current = touch.identifier;
        lastTouchX.current = touch.clientX;
        lastTouchY.current = touch.clientY;
        break;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (lookTouchId.current === null || gameState !== 'playing' || activeModal !== 'none') return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        const dx = touch.clientX - lastTouchX.current;
        const dy = touch.clientY - lastTouchY.current;
        lastTouchX.current = touch.clientX;
        lastTouchY.current = touch.clientY;

        if (engineRef.current) {
          const sensitivity = 0.0035;
          engineRef.current.cameraYaw -= dx * sensitivity;
          engineRef.current.cameraPitch -= dy * sensitivity;
          const maxPitch = Math.PI / 2 - 0.05;
          engineRef.current.cameraPitch = Math.max(-maxPitch, Math.min(maxPitch, engineRef.current.cameraPitch));
        }
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
        break;
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 0) {
      setSelectedHotbarIndex((prev) => (prev + 1) % 9);
    } else {
      setSelectedHotbarIndex((prev) => (prev - 1 + 9) % 9);
    }
  };

  // Keyboard Listeners (W, S, A, D moving everytime & shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      const code = e.code;
      const key = e.key.toLowerCase();

      // Number keys 1..9 (Single click equipment)
      if (code.startsWith('Digit')) {
        const num = parseInt(code.replace('Digit', ''), 10);
        if (num >= 1 && num <= 9) {
          setSelectedHotbarIndex(num - 1);
          sounds.playPop();
          return;
        }
      }

      // F3 Debug Screen Toggle
      if (code === 'F3') {
        e.preventDefault();
        setShowF3((prev) => !prev);
        return;
      }

      // Toggle Flight Mode [Key F]
      if ((code === 'KeyF' || key === 'f') && gameState === 'playing' && activeModal === 'none') {
        e.preventDefault();
        setIsFlying((prev) => {
          sounds.playPop();
          return !prev;
        });
        return;
      }

      // Build Menu Toggle [Key B]
      if ((code === 'KeyB' || key === 'b') && gameState === 'playing') {
        e.preventDefault();
        if (activeModal === 'build') {
          setActiveModal('none');
          engine.renderer.domElement.requestPointerLock();
        } else {
          setActiveModal('build');
          document.exitPointerLock?.();
        }
        return;
      }

      // Quick Undo [Key Z]
      if (code === 'KeyZ' || key === 'z') {
        if (gameState === 'playing' && activeModal === 'none') {
          handleUndo();
          return;
        }
      }

      // Teleport Home [Key H]
      if ((code === 'KeyH' || key === 'h') && gameState === 'playing' && activeModal === 'none') {
        handleTeleportHome();
        return;
      }

      // Mount / Dismount Vehicle OR Open Inventory [Key E]
      if (code === 'KeyE' || key === 'e') {
        if (gameState === 'playing' && activeModal === 'none') {
          // If riding vehicle or near vehicle, mount/dismount
          if (engine.vehicles.mountedVehicle) {
            engine.vehicles.toggleMountNearest(engine.playerPos);
            setMountedVehicleState(null);
            return;
          }

          const nearVehicle = engine.vehicles.vehicles.some((v) =>
            Math.hypot(engine.playerPos.x - v.entity.x, engine.playerPos.y - v.entity.y, engine.playerPos.z - v.entity.z) < 3.2
          );

          if (nearVehicle) {
            const mounted = engine.vehicles.toggleMountNearest(engine.playerPos);
            if (mounted) {
              setMountedVehicleState({ type: mounted.entity.type, speed: mounted.entity.speed });
              return;
            }
          }

          setActiveModal('inventory');
          document.exitPointerLock?.();
        } else if (activeModal !== 'none') {
          setActiveModal('none');
          engine.renderer.domElement.requestPointerLock();
        }
        return;
      }

      // Escape Menu Toggle
      if (code === 'Escape') {
        if (activeModal !== 'none') {
          setActiveModal('none');
          engine.renderer.domElement.requestPointerLock();
        } else if (gameState === 'playing') {
          setGameState('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
          engine.renderer.domElement.requestPointerLock();
        }
        return;
      }

      // Register key state by both code and character
      engine.keys[code] = true;
      engine.keys[key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (engineRef.current) {
        engineRef.current.keys[e.code] = false;
        engineRef.current.keys[e.key.toLowerCase()] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, activeModal, handleUndo]);

  // World Persistence Save
  const handleSaveWorld = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const data = {
      worldData: engine.world.serializeWorld(),
      inventory,
      playerPos: { x: engine.playerPos.x, y: engine.playerPos.y, z: engine.playerPos.z },
      playerStats,
      gameMode,
    };

    localStorage.setItem('mc_save_world', JSON.stringify(data));
    setSavedWorldAvailable(true);
  }, [inventory, playerStats, gameMode]);

  // Load Saved World
  const handleLoadSavedWorld = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const saved = localStorage.getItem('mc_save_world');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      if (data.worldData) {
        engine.world.deserializeWorld(data.worldData);
        engine.world.rebuildDirtyChunks();
      }
      if (data.inventory) setInventory(data.inventory);
      if (data.playerStats) setPlayerStats(data.playerStats);
      if (data.gameMode) setGameMode(data.gameMode);
      if (data.playerPos) {
        engine.playerPos.set(data.playerPos.x, data.playerPos.y, data.playerPos.z);
      }

      setGameState('playing');
      engine.renderer.domElement.requestPointerLock();
      sounds.playLevelUp();
    } catch {
      // error loading save
    }
  }, []);

  // Start New World
  const handleStartGame = (mode: GameMode, seed: number) => {
    const engine = engineRef.current;
    if (!engine) return;

    setGameMode(mode);
    setIsFlying(mode === 'creative');
    engine.world.seed = seed;
    engine.world.modifiedBlocks.clear();
    engine.world.generateInitialWorld(0, 0);

    const safeSpawn = engine.world.findSafeDryLandSpawn(0, 0);
    engine.playerPos.set(safeSpawn.x + 0.5, safeSpawn.y + 1.6, safeSpawn.z + 0.5);
    engine.playerVel.set(0, 0, 0);

    setGameState('playing');
    engine.renderer.domElement.requestPointerLock();
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-black select-none font-mono touch-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Authentic Minecraft Vignette Atmosphere Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.38)_100%)]" />

      {/* Title Screen */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          savedWorldAvailable={savedWorldAvailable}
          onLoadSavedWorld={handleLoadSavedWorld}
        />
      )}

      {/* Main Playing HUD */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <GameHUD
          hotbar={inventory.slice(0, 9)}
          selectedIndex={selectedHotbarIndex}
          onSelectSlot={(idx) => setSelectedHotbarIndex(idx)}
          isFlying={isFlying}
          onToggleFly={() => setIsFlying((f) => !f)}
          flySpeedMultiplier={flySpeedMultiplier}
          onToggleFlySpeed={() => setFlySpeedMultiplier((s) => (s >= 3 ? 1 : s + 1))}
          onOpenBuildMenu={() => {
            setActiveModal('build');
            document.exitPointerLock?.();
          }}
          onOpenAdvancements={() => {
            setActiveModal('advancements');
            document.exitPointerLock?.();
          }}
          onSetTimeOfDay={handleSetTimeOfDay}
          onTeleportHome={handleTeleportHome}
          onSaveWaypoint={handleSaveWaypoint}
          onTeleportWaypoint={handleTeleportWaypoint}
          hasCustomWaypoint={!!customWaypoint}
          canUndo={buildHistory.length > 0}
          onUndo={handleUndo}
          isLocked={isPointerLocked}
          playerCoords={playerCoords}
          compassHeading={compassHeading}
          onRotateCamera={handleRotateCamera}
          mountedVehicle={mountedVehicleState}
          onDismountVehicle={() => {
            if (engineRef.current) {
              engineRef.current.vehicles.toggleMountNearest(engineRef.current.playerPos);
              setMountedVehicleState(null);
            }
          }}
          isMuted={isMuted}
          onToggleMute={() => {
            const muted = sounds.toggleMute();
            setIsMuted(muted);
          }}
          onOpenInventory={() => {
            setActiveModal('inventory');
            document.exitPointerLock?.();
          }}
          showMobileControls={showMobileControls}
          onToggleMobileControls={() => setShowMobileControls((s) => !s)}
          recentAdvancement={recentAdvancement}
          onSpawnVehicle={handleSpawnDriveableVehicle}
        />
      )}

      {/* On-Screen Mobile Navigation Keys & Action Cluster */}
      {(gameState === 'playing' || gameState === 'paused') &&
        showMobileControls &&
        activeModal === 'none' && (
          <MobileControls
            onSetKey={handleTouchSetKey}
            onMineStart={handleMineStart}
            onMineStop={handleMineStop}
            onInteract={handleInteract}
            onRotateCamera={handleRotateCamera}
            isFlying={isFlying}
            onToggleFly={() => setIsFlying((f) => !f)}
            flySpeedMultiplier={flySpeedMultiplier}
            onToggleFlySpeed={() => setFlySpeedMultiplier((s) => (s >= 3 ? 1 : s + 1))}
            isMounted={!!mountedVehicleState}
            onDismount={() => {
              if (engineRef.current) {
                engineRef.current.vehicles.toggleMountNearest(engineRef.current.playerPos);
                setMountedVehicleState(null);
              }
            }}
            onOpenInventory={() => {
              setActiveModal('inventory');
              document.exitPointerLock?.();
            }}
            onOpenBuildMenu={() => {
              setActiveModal('build');
              document.exitPointerLock?.();
            }}
            onOpenAdvancements={() => {
              setActiveModal('advancements');
              document.exitPointerLock?.();
            }}
            canUndo={buildHistory.length > 0}
            onUndo={handleUndo}
            onTeleportHome={handleTeleportHome}
          />
        )}

      {/* F3 Debug Screen */}
      {showF3 && engineRef.current && (
        <F3DebugScreen
          visible={showF3}
          playerPos={engineRef.current.playerPos}
          yaw={engineRef.current.cameraYaw}
          pitch={engineRef.current.cameraPitch}
          fps={fpsDisplay}
          entitiesCount={engineRef.current.entities.mobs.length + engineRef.current.vehicles.vehicles.length}
          timeOfDay={engineRef.current.sky.timeOfDay}
          biome={
            engineRef.current.playerPos.y > 46
              ? 'Towering Snow Mountain'
              : engineRef.current.playerPos.y <= 24
              ? 'Ocean / River Channel'
              : engineRef.current.world.getBlock(Math.floor(engineRef.current.playerPos.x), Math.floor(engineRef.current.playerPos.y - 1), Math.floor(engineRef.current.playerPos.z)) === BlockType.SAND
              ? 'Expansive Desert Dunes'
              : 'Plains & Forest'
          }
        />
      )}

      {/* Master Builder Modal (Blueprints, Vehicles, Multi-Tools & Infinite Block Palette) */}
      <BuildMenuModal
        isOpen={activeModal === 'build'}
        onClose={() => {
          setActiveModal('none');
          engineRef.current?.renderer.domElement.requestPointerLock();
        }}
        onSelectStructure={handleSelectStructure}
        onSelectTool={handleSelectTool}
        onSelectCreativeItem={handleSelectCreativeItem}
        onSpawnDriveableVehicle={handleSpawnDriveableVehicle}
        onSpawnMob={handleSpawnMob}
        canUndo={buildHistory.length > 0}
        onUndo={handleUndo}
      />

      {/* Advancements Trophies Modal */}
      <AdvancementsModal
        isOpen={activeModal === 'advancements'}
        onClose={() => {
          setActiveModal('none');
          engineRef.current?.renderer.domElement.requestPointerLock();
        }}
        advancements={advancements}
      />

      {/* Inventory & 2x2 Crafting Modal */}
      <InventoryModal
        isOpen={activeModal === 'inventory'}
        onClose={() => {
          setActiveModal('none');
          engineRef.current?.renderer.domElement.requestPointerLock();
        }}
        inventory={inventory}
        onUpdateInventory={setInventory}
      />

      {/* 3x3 Crafting Table Modal */}
      <CraftingTableModal
        isOpen={activeModal === 'crafting'}
        onClose={() => {
          setActiveModal('none');
          engineRef.current?.renderer.domElement.requestPointerLock();
        }}
        inventory={inventory}
        onUpdateInventory={setInventory}
      />

      {/* Furnace Smelting Modal */}
      <FurnaceModal
        isOpen={activeModal === 'furnace'}
        onClose={() => {
          setActiveModal('none');
          engineRef.current?.renderer.domElement.requestPointerLock();
        }}
        inventory={inventory}
        onUpdateInventory={setInventory}
      />

      {/* Chest Storage Modal */}
      <ChestModal
        isOpen={activeModal === 'chest'}
        onClose={() => {
          setActiveModal('none');
          engineRef.current?.renderer.domElement.requestPointerLock();
        }}
        inventory={inventory}
        onUpdateInventory={setInventory}
        chestSlots={chestSlots}
        onUpdateChestSlots={setChestSlots}
      />

      {/* Pause Menu */}
      <PauseMenu
        isOpen={gameState === 'paused' && activeModal === 'none'}
        onResume={() => {
          setGameState('playing');
          engineRef.current?.renderer.domElement.requestPointerLock();
        }}
        isMuted={isMuted}
        onToggleMute={() => {
          const muted = sounds.toggleMute();
          setIsMuted(muted);
        }}
        onSaveWorld={handleSaveWorld}
        onOpenAdvancements={() => {
          setActiveModal('advancements');
        }}
        onQuitToTitle={() => {
          handleSaveWorld();
          setGameState('title');
        }}
      />

      {/* Death Screen */}
      <DeathScreen
        isOpen={gameState === 'dead'}
        score={playerStats.level * 100}
        onRespawn={() => {
          if (engineRef.current) {
            const spawnY = engineRef.current.world.findHighestSolidY(0, 0) + 2;
            engineRef.current.playerPos.set(0.5, spawnY, 0.5);
            engineRef.current.playerVel.set(0, 0, 0);
          }
          setPlayerStats((prev) => ({
            ...prev,
            health: prev.maxHealth,
            hunger: prev.maxHunger,
            oxygen: prev.maxOxygen,
          }));
          setGameState('playing');
          engineRef.current?.renderer.domElement.requestPointerLock();
        }}
        onTitle={() => setGameState('title')}
      />
    </div>
  );
}
