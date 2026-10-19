/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockType } from './types';
import { VoxelWorld } from './world';
import { sounds } from './audio';

export interface StructureBlock {
  dx: number;
  dy: number;
  dz: number;
  type: BlockType;
}

export interface StructureTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  width: number;
  height: number;
  depth: number;
  generate: () => StructureBlock[];
}

export const STRUCTURES: StructureTemplate[] = [
  {
    id: 'starter_cottage',
    name: 'Wooden Cottage',
    description: 'Cozy 7x5 wooden house with glass windows, plank roof, chest & crafting table.',
    icon: '🏡',
    width: 7,
    height: 5,
    depth: 6,
    generate: () => {
      const blocks: StructureBlock[] = [];
      const w = 7;
      const d = 6;
      const h = 4;

      // 1. Cobblestone Foundation floor
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
          blocks.push({ dx: x, dy: 0, dz: z, type: BlockType.COBBLESTONE });
        }
      }

      // 2. Wooden Plank Walls with corner logs
      for (let y = 1; y <= h; y++) {
        for (let x = 0; x < w; x++) {
          for (let z = 0; z < d; z++) {
            const isBorder = x === 0 || x === w - 1 || z === 0 || z === d - 1;
            const isCorner = (x === 0 || x === w - 1) && (z === 0 || z === d - 1);
            const isDoor = x === Math.floor(w / 2) && z === 0 && (y === 1 || y === 2);
            const isWindow =
              (y === 2 || y === 3) &&
              ((z === 0 && (x === 2 || x === 4)) ||
                (z === d - 1 && (x === 2 || x === 4)) ||
                (x === 0 && z === 3) ||
                (x === w - 1 && z === 3));

            if (isDoor) {
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.AIR });
            } else if (isCorner) {
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.OAK_LOG });
            } else if (isWindow) {
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.GLASS });
            } else if (isBorder) {
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.OAK_PLANKS });
            } else {
              // Air interior
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.AIR });
            }
          }
        }
      }

      // 3. Furniture inside
      blocks.push({ dx: 1, dy: 1, dz: d - 2, type: BlockType.CRAFTING_TABLE });
      blocks.push({ dx: 2, dy: 1, dz: d - 2, type: BlockType.FURNACE });
      blocks.push({ dx: w - 2, dy: 1, dz: d - 2, type: BlockType.CHEST });
      blocks.push({ dx: 1, dy: 3, dz: 1, type: BlockType.TORCH });
      blocks.push({ dx: w - 2, dy: 3, dz: 1, type: BlockType.TORCH });

      // 4. Peaked Roof
      for (let x = -1; x <= w; x++) {
        for (let z = -1; z <= d; z++) {
          blocks.push({ dx: x, dy: h + 1, dz: z, type: BlockType.OAK_PLANKS });
        }
      }
      for (let x = 1; x <= w - 2; x++) {
        for (let z = 1; z <= d - 2; z++) {
          blocks.push({ dx: x, dy: h + 2, dz: z, type: BlockType.OAK_PLANKS });
        }
      }

      return blocks;
    },
  },
  {
    id: 'watchtower',
    name: 'Castle Watchtower',
    description: 'Tall 5x5 stone brick defense tower with battlements and lookout platform.',
    icon: '🏰',
    width: 5,
    height: 10,
    depth: 5,
    generate: () => {
      const blocks: StructureBlock[] = [];
      const size = 5;
      const height = 9;

      // Base to tower platform
      for (let y = 0; y <= height; y++) {
        for (let x = 0; x < size; x++) {
          for (let z = 0; z < size; z++) {
            const isBorder = x === 0 || x === size - 1 || z === 0 || z === size - 1;
            const isDoor = x === 2 && z === 0 && (y === 1 || y === 2);

            if (y === 0 || y === height) {
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.BRICKS });
            } else if (isDoor) {
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.AIR });
            } else if (isBorder) {
              // Arrow slit windows
              const isSlit = y % 3 === 0 && (x === 2 || z === 2);
              blocks.push({
                dx: x,
                dy: y,
                dz: z,
                type: isSlit ? BlockType.GLASS : BlockType.BRICKS,
              });
            } else {
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.AIR });
            }
          }
        }
      }

      // Parapet / Battlements at top
      const topY = height + 1;
      for (let x = -1; x <= size; x++) {
        for (let z = -1; z <= size; z++) {
          const isOuterBorder = x === -1 || x === size || z === -1 || z === size;
          if (isOuterBorder) {
            // Crenels / alternating battlements
            if ((x + z) % 2 === 0) {
              blocks.push({ dx: x, dy: topY, dz: z, type: BlockType.COBBLESTONE });
            }
          }
        }
      }

      // Torches at 4 corners
      blocks.push({ dx: 0, dy: topY, dz: 0, type: BlockType.TORCH });
      blocks.push({ dx: size - 1, dy: topY, dz: 0, type: BlockType.TORCH });
      blocks.push({ dx: 0, dy: topY, dz: size - 1, type: BlockType.TORCH });
      blocks.push({ dx: size - 1, dy: topY, dz: size - 1, type: BlockType.TORCH });

      return blocks;
    },
  },
  {
    id: 'desert_pyramid',
    name: 'Desert Pyramid',
    description: 'Mystical tiered sandstone pyramid with hidden treasure chamber inside.',
    icon: '🔺',
    width: 9,
    height: 5,
    depth: 9,
    generate: () => {
      const blocks: StructureBlock[] = [];
      const baseSize = 9;

      for (let tier = 0; tier < 5; tier++) {
        const min = tier;
        const max = baseSize - 1 - tier;
        for (let x = min; x <= max; x++) {
          for (let z = min; z <= max; z++) {
            // Hollow inner center for treasure
            if (tier === 1 && x >= 3 && x <= 5 && z >= 3 && z <= 5) {
              blocks.push({ dx: x, dy: tier, dz: z, type: BlockType.AIR });
            } else {
              blocks.push({ dx: x, dy: tier, dz: z, type: BlockType.SAND });
            }
          }
        }
      }

      // Secret treasure chest inside
      blocks.push({ dx: 4, dy: 1, dz: 4, type: BlockType.CHEST });
      blocks.push({ dx: 4, dy: 0, dz: 4, type: BlockType.TNT }); // classic trap!
      blocks.push({ dx: 4, dy: 2, dz: 4, type: BlockType.TORCH });

      return blocks;
    },
  },
  {
    id: 'wheat_farm',
    name: 'Irrigated Farm Plot',
    description: '7x7 farming field with central water irrigation, dirt beds and surrounding torches.',
    icon: '🌾',
    width: 7,
    height: 2,
    depth: 7,
    generate: () => {
      const blocks: StructureBlock[] = [];
      for (let x = 0; x < 7; x++) {
        for (let z = 0; z < 7; z++) {
          const isCenter = x === 3 && z === 3;
          if (isCenter) {
            blocks.push({ dx: x, dy: 0, dz: z, type: BlockType.WATER });
          } else {
            blocks.push({ dx: x, dy: 0, dz: z, type: BlockType.DIRT });
            // Crop / flower on top
            if (Math.random() > 0.4) {
              blocks.push({ dx: x, dy: 1, dz: z, type: BlockType.DANDELION });
            }
          }
        }
      }
      // Corner torches
      blocks.push({ dx: 0, dy: 1, dz: 0, type: BlockType.TORCH });
      blocks.push({ dx: 6, dy: 1, dz: 0, type: BlockType.TORCH });
      blocks.push({ dx: 0, dy: 1, dz: 6, type: BlockType.TORCH });
      blocks.push({ dx: 6, dy: 1, dz: 6, type: BlockType.TORCH });

      return blocks;
    },
  },
  {
    id: 'bridge_walkway',
    name: 'Elevated Bridge',
    description: 'Long sturdy wooden walkway with supporting stone pillars and safety railings.',
    icon: '🌉',
    width: 3,
    height: 4,
    depth: 12,
    generate: () => {
      const blocks: StructureBlock[] = [];
      // Deck at y=3
      for (let z = 0; z < 12; z++) {
        // Floor
        blocks.push({ dx: 0, dy: 3, dz: z, type: BlockType.OAK_PLANKS });
        blocks.push({ dx: 1, dy: 3, dz: z, type: BlockType.OAK_PLANKS });
        blocks.push({ dx: 2, dy: 3, dz: z, type: BlockType.OAK_PLANKS });

        // Railings
        blocks.push({ dx: 0, dy: 4, dz: z, type: BlockType.OAK_LOG });
        blocks.push({ dx: 2, dy: 4, dz: z, type: BlockType.OAK_LOG });

        // Pillars at z=0, z=6, z=11
        if (z === 0 || z === 6 || z === 11) {
          for (let y = 0; y < 3; y++) {
            blocks.push({ dx: 0, dy: y, dz: z, type: BlockType.COBBLESTONE });
            blocks.push({ dx: 2, dy: y, dz: z, type: BlockType.COBBLESTONE });
          }
        }
      }
      // Torches along walkway
      blocks.push({ dx: 0, dy: 5, dz: 2, type: BlockType.TORCH });
      blocks.push({ dx: 2, dy: 5, dz: 6, type: BlockType.TORCH });
      blocks.push({ dx: 0, dy: 5, dz: 10, type: BlockType.TORCH });

      return blocks;
    },
  },
  {
    id: 'voxel_car_build',
    name: 'Voxel Offroader Car',
    description: '3D full-scale offroad car build with obsidian tires, red brick body, glass cockpit & torch lights.',
    icon: '🚗',
    width: 5,
    height: 4,
    depth: 6,
    generate: () => {
      const blocks: StructureBlock[] = [];
      // 4 Obsidian Tires at corners
      const tires = [
        [0, 0, 0], [4, 0, 0],
        [0, 0, 4], [4, 0, 4]
      ];
      for (const [tx, ty, tz] of tires) {
        blocks.push({ dx: tx, dy: ty, dz: tz, type: BlockType.OBSIDIAN });
        blocks.push({ dx: tx, dy: ty + 1, dz: tz, type: BlockType.OBSIDIAN });
      }

      // Chassis frame
      for (let x = 1; x <= 3; x++) {
        for (let z = 0; z <= 5; z++) {
          blocks.push({ dx: x, dy: 1, dz: z, type: BlockType.COBBLESTONE });
        }
      }

      // Red Brick Body & hood
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 5; z++) {
          if ((x === 0 || x === 4) && (z === 0 || z === 4)) continue; // tire cutouts
          blocks.push({ dx: x, dy: 2, dz: z, type: BlockType.BRICKS });
        }
      }

      // Cabin with Glass Windshield & Windows
      for (let x = 1; x <= 3; x++) {
        for (let z = 1; z <= 3; z++) {
          const isWindshield = z === 3;
          blocks.push({ dx: x, dy: 3, dz: z, type: isWindshield ? BlockType.GLASS : BlockType.BRICKS });
        }
      }

      // Roof
      for (let x = 1; x <= 3; x++) {
        for (let z = 1; z <= 3; z++) {
          blocks.push({ dx: x, dy: 4, dz: z, type: BlockType.BRICKS });
        }
      }

      // Headlight Torches
      blocks.push({ dx: 1, dy: 2, dz: 6, type: BlockType.TORCH });
      blocks.push({ dx: 3, dy: 2, dz: 6, type: BlockType.TORCH });
      // Interior seat & chest in trunk
      blocks.push({ dx: 2, dy: 2, dz: 2, type: BlockType.OAK_PLANKS });
      blocks.push({ dx: 2, dy: 2, dz: 0, type: BlockType.CHEST });

      return blocks;
    },
  },
  {
    id: 'voxel_bike_build',
    name: 'Voxel Motorcycle / Bike',
    description: 'Sleek custom motorcycle build with dual obsidian wheels, engine block & torch beam.',
    icon: '🏍️',
    width: 3,
    height: 3,
    depth: 5,
    generate: () => {
      const blocks: StructureBlock[] = [];
      // Front and Rear 2-block high wheels
      blocks.push({ dx: 1, dy: 0, dz: 0, type: BlockType.OBSIDIAN });
      blocks.push({ dx: 1, dy: 1, dz: 0, type: BlockType.OBSIDIAN });
      blocks.push({ dx: 1, dy: 0, dz: 4, type: BlockType.OBSIDIAN });
      blocks.push({ dx: 1, dy: 1, dz: 4, type: BlockType.OBSIDIAN });

      // Frame & Engine
      blocks.push({ dx: 1, dy: 1, dz: 1, type: BlockType.IRON_ORE });
      blocks.push({ dx: 1, dy: 1, dz: 2, type: BlockType.STONE });
      blocks.push({ dx: 1, dy: 1, dz: 3, type: BlockType.IRON_ORE });

      // Seat & Gas tank
      blocks.push({ dx: 1, dy: 2, dz: 1, type: BlockType.OAK_PLANKS });
      blocks.push({ dx: 1, dy: 2, dz: 2, type: BlockType.BRICKS });
      blocks.push({ dx: 1, dy: 2, dz: 3, type: BlockType.BRICKS });

      // Handlebars
      blocks.push({ dx: 0, dy: 2, dz: 4, type: BlockType.TORCH });
      blocks.push({ dx: 2, dy: 2, dz: 4, type: BlockType.TORCH });
      blocks.push({ dx: 1, dy: 3, dz: 4, type: BlockType.TORCH });

      return blocks;
    },
  },
  {
    id: 'voxel_boat_build',
    name: 'Large Ocean Clipper Boat',
    description: 'Full-scale water ship with oak hull, tall mast with snow sail, deck & lanterns.',
    icon: '⛵',
    width: 5,
    height: 8,
    depth: 10,
    generate: () => {
      const blocks: StructureBlock[] = [];
      const w = 5;
      const d = 10;

      // Curved Hull in water (y=0 to y=2)
      for (let z = 0; z < d; z++) {
        for (let x = 0; x < w; x++) {
          const isEdge = x === 0 || x === w - 1 || z === 0 || z === d - 1;
          blocks.push({ dx: x, dy: 0, dz: z, type: BlockType.OAK_PLANKS });
          if (isEdge) {
            blocks.push({ dx: x, dy: 1, dz: z, type: BlockType.OAK_LOG });
            blocks.push({ dx: x, dy: 2, dz: z, type: BlockType.OAK_PLANKS });
          } else {
            blocks.push({ dx: x, dy: 1, dz: z, type: BlockType.OAK_PLANKS });
          }
        }
      }

      // Mast at z=5
      for (let y = 2; y <= 7; y++) {
        blocks.push({ dx: 2, dy: y, dz: 5, type: BlockType.OAK_LOG });
      }

      // Big White Snow Sail
      for (let y = 4; y <= 6; y++) {
        for (let x = 0; x <= 4; x++) {
          blocks.push({ dx: x, dy: y, dz: 5, type: BlockType.SNOW });
        }
      }

      // Torches on bow and stern
      blocks.push({ dx: 2, dy: 3, dz: 0, type: BlockType.TORCH });
      blocks.push({ dx: 2, dy: 3, dz: d - 1, type: BlockType.TORCH });
      blocks.push({ dx: 2, dy: 2, dz: 2, type: BlockType.CHEST });

      return blocks;
    },
  },
  {
    id: 'ocean_lighthouse',
    name: 'Ocean Lighthouse',
    description: 'Towering red & white striped seaside beacon with panoramic observation dome.',
    icon: '🗼',
    width: 5,
    height: 14,
    depth: 5,
    generate: () => {
      const blocks: StructureBlock[] = [];
      const h = 13;
      for (let y = 0; y <= h; y++) {
        // Alternating red bricks and white snow bands
        const blockType = Math.floor(y / 2) % 2 === 0 ? BlockType.BRICKS : BlockType.SNOW;
        for (let x = 0; x < 5; x++) {
          for (let z = 0; z < 5; z++) {
            const isBorder = x === 0 || x === 4 || z === 0 || z === 4;
            const isDoor = x === 2 && z === 0 && (y === 1 || y === 2);
            if (isDoor) continue;
            if (isBorder || y === 0 || y === h) {
              blocks.push({ dx: x, dy: y, dz: z, type: blockType });
            }
          }
        }
      }
      // Glass Lamp Room at top
      for (let x = 1; x <= 3; x++) {
        for (let z = 1; z <= 3; z++) {
          blocks.push({ dx: x, dy: h + 1, dz: z, type: BlockType.GLASS });
        }
      }
      // Bright central beacon fire
      blocks.push({ dx: 2, dy: h + 1, dz: 2, type: BlockType.TORCH });
      blocks.push({ dx: 2, dy: h + 2, dz: 2, type: BlockType.BRICKS });
      return blocks;
    },
  },
];

// Spawns a structure into the world with history recorded for undo
export function placeStructure(
  world: VoxelWorld,
  originX: number,
  originY: number,
  originZ: number,
  template: StructureTemplate,
  onHistoryRecord?: (historyEntry: { x: number; y: number; z: number; oldType: BlockType; newType: BlockType }[]) => void
) {
  const blocks = template.generate();
  const history: { x: number; y: number; z: number; oldType: BlockType; newType: BlockType }[] = [];

  for (const b of blocks) {
    const wx = originX + b.dx;
    const wy = originY + b.dy;
    const wz = originZ + b.dz;

    if (wy >= 0 && wy < 64) {
      const oldType = world.getBlock(wx, wy, wz);
      history.push({ x: wx, y: wy, z: wz, oldType, newType: b.type });
      world.setBlock(wx, wy, wz, b.type);
    }
  }

  world.rebuildDirtyChunks();
  sounds.playBlockPlace();

  if (onHistoryRecord && history.length > 0) {
    onHistoryRecord(history);
  }
}
