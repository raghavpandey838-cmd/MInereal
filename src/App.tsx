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

type ModalType = 'none' | 'inventory' | 'crafting' | 'furnace' | 'chest' | 'build';

interface HistoryStep {
  x: number;
  y: number;
  z: number;
  oldType: BlockType;
  newType: BlockType;
}

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // Game UI States
  const [gameState, setGameState] = useState<'title' | 'playing' | 'paused' | 'dead'>('title');
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [gameMode, setGameMode] = useState<GameMode>('survival');
  const [selectedHotbarIndex, setSelectedHotbarIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showF3, setShowF3] = useState<boolean>(false);
  const [hurtFlash, setHurtFlash] = useState<boolean>(false);
  const [fpsDisplay, setFpsDisplay] = useState<number>(60);
  const [savedWorldAvailable, setSavedWorldAvailable] = useState<boolean>(false);

  // Navigation, Flight & Vehicle States
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [compassHeading, setCompassHeading] = useState<string>('N (0°)');
  const [playerCoords, setPlayerCoords] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 30, z: 0 });
  const [mountedVehicleState, setMountedVehicleState] = useState<{ type: VehicleType; speed: number } | null>(null);

  // Undo / Build History Stack
  const [buildHistory, setBuildHistory] = useState<HistoryStep[][]>([]);

  // Player Stats
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 20,
    maxHealth: 20,
    hunger: 20,
    maxHunger: 20,
    saturation: 5,
    oxygen: 20,
    maxOxygen: 20,
    experience: 0,
    level: 1,
    armor: 0,
  });

  // 36-slot Player Inventory (0..8 is Hotbar, 9..35 is Main Inventory)
  const [inventory, setInventory] = useState<(ItemStack | null)[]>(() => {
    const inv: (ItemStack | null)[] = new Array(36).fill(null);
    inv[0] = { id: 'wooden_pickaxe', count: 1, durability: 60, maxDurability: 60 };
    inv[1] = { id: 'wooden_sword', count: 1, durability: 60, maxDurability: 60 };
    inv[2] = { id: 'wooden_axe', count: 1, durability: 60, maxDurability: 60 };
    inv[3] = { id: 'torch', count: 64 };
    inv[4] = { id: 'bread', count: 16 };
    inv[5] = { id: 'oak_planks', count: 64 };
    inv[6] = { id: 'bricks', count: 64 };
    inv[7] = { id: 'glass', count: 64 };
    inv[8] = { id: 'cobblestone', count: 64 };
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

    // Spawn starter vehicles: Offroader Car and Motorcycle near spawn, Rowboat near water!
    const spawnY = world.findHighestSolidY(0, 0) + 1;
    vehicles.spawnVehicle('car', 4, spawnY, 4, 0);
    vehicles.spawnVehicle('bike', -4, spawnY, 4, Math.PI / 4);
    vehicles.spawnVehicle('boat', 18, 24, 18, 0);

    // Starter mobs
    entities.spawnMob('pig', 6, world.findHighestSolidY(6, 6) + 1, 6);
    entities.spawnMob('pig', -8, world.findHighestSolidY(-8, 6) + 1, 6);
    entities.spawnMob('zombie', 16, world.findHighestSolidY(16, 16) + 1, 16);
    entities.spawnMob('creeper', -12, world.findHighestSolidY(-12, -10) + 1, -10);

    // 6. Hand Renderer & Block Highlighter
    const hand = new HandRenderer(camera);
    const highlighter = new BlockHighlightManager(scene, world.opaqueMaterial.map as THREE.CanvasTexture);

    const playerPos = new THREE.Vector3(0.5, spawnY + 1.5, 0.5);
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

  // Teleport Home / Spawn
  const handleTeleportHome = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const spawnY = engine.world.findHighestSolidY(0, 0) + 2;
    engine.playerPos.set(0.5, spawnY, 0.5);
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
  };

  // Select Multi-Block Tool
  const handleSelectTool = (toolType: 'wall3x3' | 'floor5x5' | 'column4') => {
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

    if (toolType === 'wall3x3') {
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
    } else {
      sy = engine.world.findHighestSolidY(Math.floor(sx), Math.floor(sz)) + 0.5;
    }

    engine.vehicles.spawnVehicle(type, sx, sy, sz, engine.cameraYaw);
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

        const isSprinting = !!(keys['ControlLeft'] || keys['ControlRight']);
        const isSneaking = !!(keys['ShiftLeft'] || keys['ShiftRight']);
        const moveSpeed = isFlying
          ? (isSprinting ? 14.0 : 8.0)
          : isSprinting
          ? PhysicsEngine.SPRINT_SPEED
          : isSneaking
          ? PhysicsEngine.SNEAK_SPEED
          : PhysicsEngine.WALK_SPEED;

        let moveForward = (isW ? 1 : 0) - (isS ? 1 : 0);
        let moveRight = (isD ? 1 : 0) - (isA ? 1 : 0);

        const len = Math.hypot(moveForward, moveRight);
        if (len > 0) {
          moveForward /= len;
          moveRight /= len;
        }

        const sinYaw = Math.sin(engine.cameraYaw);
        const cosYaw = Math.cos(engine.cameraYaw);

        const targetVx = (moveRight * cosYaw - moveForward * sinYaw) * moveSpeed;
        const targetVz = (moveRight * sinYaw + moveForward * cosYaw) * moveSpeed;

        const accel = (isFlying ? 18.0 : 14.0) * dt;
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
          if (keys['Space']) targetVy += 7.0;
          if (keys['ShiftLeft'] || keys['ShiftRight'] || keys['KeyC'] || keys['c']) targetVy -= 7.0;
          playerVel.y += (targetVy - playerVel.y) * 14.0 * dt;
        } else if (inWater) {
          playerVel.y -= PhysicsEngine.GRAVITY * 0.3 * dt;
          playerVel.y *= 0.85;
          if (keys['Space']) {
            playerVel.y = PhysicsEngine.SWIM_SPEED;
          }
          if (headBlock === BlockType.WATER) {
            setPlayerStats((prev) => {
              const nextOx = Math.max(0, prev.oxygen - dt * 2.5);
              if (nextOx <= 0 && time - engine.lastHurtTime > 1500) {
                engine.lastHurtTime = time;
                applyPlayerDamage(2);
              }
              return { ...prev, oxygen: nextOx };
            });
          }
        } else {
          setPlayerStats((prev) => ({
            ...prev,
            oxygen: Math.min(prev.maxOxygen, prev.oxygen + dt * 10),
          }));

          playerVel.y -= PhysicsEngine.GRAVITY * dt;
          if (playerVel.y < -PhysicsEngine.TERMINAL_VELOCITY) {
            playerVel.y = -PhysicsEngine.TERMINAL_VELOCITY;
          }
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

  // Mouse Down: Mine Block or Attack Mob or Place Block
  const handleMouseDown = (e: React.MouseEvent) => {
    const engine = engineRef.current;
    if (!engine) return;

    // Lock pointer on first click
    if (document.pointerLockElement !== engine.renderer.domElement) {
      engine.renderer.domElement.requestPointerLock();
      if (gameState === 'title') {
        setGameState('playing');
      }
      return;
    }

    if (gameState !== 'playing' || activeModal !== 'none') return;

    engine.hand.swing();
    sounds.playSwing();

    const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(engine.camera.quaternion);

    if (e.button === 0) {
      // LEFT CLICK: Attack mob OR Mine block
      engine.isMining = true;

      // Check if hitting any mob first
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
            const damage = (held && ITEM_ATTACK_DAMAGE[held.id]) || 2;
            engine.entities.damageMob(i, damage, forwardDir);
            engine.isMining = false;
            return;
          }
        }
      }
    } else if (e.button === 2) {
      // RIGHT CLICK: Place block or interact
      e.preventDefault();

      // Check mounting vehicle with right click if within 3 blocks
      const mounted = engine.vehicles.toggleMountNearest(engine.playerPos);
      if (mounted) {
        setMountedVehicleState({ type: mounted.entity.type, speed: mounted.entity.speed });
        return;
      }

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
    }
  };

  const handleMouseUp = () => {
    if (engineRef.current) {
      engineRef.current.isMining = false;
      engineRef.current.miningProgress = 0;
      engineRef.current.highlighter.setCrackStage(0, 0, 0, 0);
    }
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

    const spawnY = engine.world.findHighestSolidY(0, 0) + 2;
    engine.playerPos.set(0.5, spawnY, 0.5);
    engine.playerVel.set(0, 0, 0);

    setGameState('playing');
    engine.renderer.domElement.requestPointerLock();
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-black select-none font-mono"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

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
          stats={playerStats}
          hotbar={inventory.slice(0, 9)}
          selectedIndex={selectedHotbarIndex}
          gameMode={gameMode}
          onSelectSlot={(idx) => setSelectedHotbarIndex(idx)}
          hurtFlash={hurtFlash}
          isFlying={isFlying}
          onToggleFly={() => setIsFlying((f) => !f)}
          onOpenBuildMenu={() => {
            setActiveModal('build');
            document.exitPointerLock?.();
          }}
          onTeleportHome={handleTeleportHome}
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
        canUndo={buildHistory.length > 0}
        onUndo={handleUndo}
        currentMode={gameMode}
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
        gameMode={gameMode}
        onToggleGameMode={() =>
          setGameMode((m) => (m === 'survival' ? 'creative' : 'survival'))
        }
        isMuted={isMuted}
        onToggleMute={() => {
          const muted = sounds.toggleMute();
          setIsMuted(muted);
        }}
        onSaveWorld={handleSaveWorld}
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
