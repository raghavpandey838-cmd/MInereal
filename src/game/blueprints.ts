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
  {
    id: 'royal_castle',
    name: 'Royal Medieval Fortress',
    description: 'Grand 11x11 stone fortress with 4 defensive corner towers, gatehouse, battlements & inner courtyard.',
    icon: '🏰',
    width: 11,
    height: 9,
    depth: 11,
    generate: () => {
      const blocks: StructureBlock[] = [];
      const size = 11;
      const wallH = 5;
      const towerH = 8;

      // 1. Cobblestone Courtyard Floor
      for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
          blocks.push({ dx: x, dy: 0, dz: z, type: BlockType.COBBLESTONE });
        }
      }

      // 2. Outer Curtain Walls
      for (let y = 1; y <= wallH; y++) {
        for (let x = 0; x < size; x++) {
          for (let z = 0; z < size; z++) {
            const isOuter = x === 0 || x === size - 1 || z === 0 || z === size - 1;
            const isGate = (x === 4 || x === 5 || x === 6) && z === 0 && (y === 1 || y === 2 || y === 3);
            if (isGate) continue;
            if (isOuter) {
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.BRICKS });
            }
          }
        }
      }

      // 3. Four Corner Defensive Towers (3x3 at each corner)
      const corners = [
        { cx: 0, cz: 0 },
        { cx: size - 3, cz: 0 },
        { cx: 0, cz: size - 3 },
        { cx: size - 3, cz: size - 3 },
      ];

      for (const { cx, cz } of corners) {
        for (let y = 1; y <= towerH; y++) {
          for (let dx = 0; dx < 3; dx++) {
            for (let dz = 0; dz < 3; dz++) {
              const isTowerWall = dx === 0 || dx === 2 || dz === 0 || dz === 2;
              if (isTowerWall || y === towerH) {
                blocks.push({ dx: cx + dx, dy: y, dz: cz + dz, type: BlockType.COBBLESTONE });
              }
            }
          }
        }
        // Tower parapets and torch
        for (let dx = 0; dx < 3; dx++) {
          for (let dz = 0; dz < 3; dz++) {
            if ((dx + dz) % 2 === 0) {
              blocks.push({ dx: cx + dx, dy: towerH + 1, dz: cz + dz, type: BlockType.BRICKS });
            }
          }
        }
        blocks.push({ dx: cx + 1, dy: towerH + 1, dz: cz + 1, type: BlockType.TORCH });
      }

      // 4. Center Royal Throne / Monument in Courtyard
      blocks.push({ dx: 5, dy: 1, dz: 5, type: BlockType.GOLD_ORE });
      blocks.push({ dx: 5, dy: 2, dz: 5, type: BlockType.TORCH });
      blocks.push({ dx: 4, dy: 1, dz: 5, type: BlockType.OAK_PLANKS });
      blocks.push({ dx: 6, dy: 1, dz: 5, type: BlockType.OAK_PLANKS });
      blocks.push({ dx: 5, dy: 1, dz: 7, type: BlockType.CHEST });

      return blocks;
    },
  },
  {
    id: 'modern_villa',
    name: 'Modern Glass Villa & Pool',
    description: 'Sleek 9x9 contemporary mansion with floor-to-ceiling glass panoramic walls, wood decking & pool.',
    icon: '🏡',
    width: 9,
    height: 6,
    depth: 9,
    generate: () => {
      const blocks: StructureBlock[] = [];
      const size = 9;

      // 1. Foundation: Smooth stone with oak wood patio
      for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
          if (x >= 6 && z >= 2 && z <= 6) {
            // Outdoor pool
            blocks.push({ dx: x, dy: 0, dz: z, type: BlockType.WATER });
          } else {
            blocks.push({ dx: x, dy: 0, dz: z, type: BlockType.OAK_PLANKS });
          }
        }
      }

      // 2. Villa Structure (x: 0..5, z: 0..8)
      for (let y = 1; y <= 4; y++) {
        for (let x = 0; x <= 5; x++) {
          for (let z = 0; z <= 8; z++) {
            const isExterior = x === 0 || x === 5 || z === 0 || z === 8;
            const isEntrance = x === 2 && z === 0 && (y === 1 || y === 2);
            if (isEntrance) continue;

            if (isExterior) {
              const isGlassWall = (y === 2 || y === 3) && (z === 4 || z === 5 || x === 5 || x === 0);
              blocks.push({
                dx: x,
                dy: y,
                dz: z,
                type: isGlassWall ? BlockType.GLASS : BlockType.SNOW,
              });
            } else {
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.AIR });
            }
          }
        }
      }

      // 3. Flat Modern Roof with Overhang
      for (let x = -1; x <= 6; x++) {
        for (let z = -1; z <= 9; z++) {
          blocks.push({ dx: x, dy: 5, dz: z, type: BlockType.SNOW });
        }
      }

      // 4. Interior Luxury Furnishings
      blocks.push({ dx: 1, dy: 1, dz: 7, type: BlockType.BOOKSHELF });
      blocks.push({ dx: 1, dy: 2, dz: 7, type: BlockType.BOOKSHELF });
      blocks.push({ dx: 2, dy: 1, dz: 7, type: BlockType.CHEST });
      blocks.push({ dx: 4, dy: 1, dz: 1, type: BlockType.CRAFTING_TABLE });
      blocks.push({ dx: 4, dy: 1, dz: 2, type: BlockType.FURNACE });
      blocks.push({ dx: 2, dy: 3, dz: 4, type: BlockType.TORCH });

      return blocks;
    },
  },
  {
    id: 'pagoda_temple',
    name: 'Japanese Pagoda Shrine',
    description: 'Traditional 7x7 multi-tiered Asian pagoda with flared roofs, wooden pillars & meditation sanctuary.',
    icon: '⛩️',
    width: 7,
    height: 11,
    depth: 7,
    generate: () => {
      const blocks: StructureBlock[] = [];
      const size = 7;

      // Base stone platform
      for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
          blocks.push({ dx: x, dy: 0, dz: z, type: BlockType.COBBLESTONE });
        }
      }

      // Tier 1: Oak logs and red brick walls
      for (let y = 1; y <= 4; y++) {
        for (let x = 1; x <= 5; x++) {
          for (let z = 1; z <= 5; z++) {
            const isCorner = (x === 1 || x === 5) && (z === 1 || z === 5);
            const isBorder = x === 1 || x === 5 || z === 1 || z === 5;
            const isDoor = x === 3 && z === 1 && (y === 1 || y === 2);
            if (isDoor) continue;
            if (isCorner) {
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.OAK_LOG });
            } else if (isBorder) {
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.BRICKS });
            }
          }
        }
      }

      // Tier 1 Flared Eaves Roof
      for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
          blocks.push({ dx: x, dy: 5, dz: z, type: BlockType.NETHERRACK });
        }
      }

      // Tier 2: Smaller upper sanctum
      for (let y = 6; y <= 8; y++) {
        for (let x = 2; x <= 4; x++) {
          for (let z = 2; z <= 4; z++) {
            const isBorder = x === 2 || x === 4 || z === 2 || z === 4;
            if (isBorder) {
              blocks.push({ dx: x, dy: y, dz: z, type: BlockType.OAK_PLANKS });
            }
          }
        }
      }

      // Top Peak Roof & Spire
      for (let x = 1; x <= 5; x++) {
        for (let z = 1; z <= 5; z++) {
          blocks.push({ dx: x, dy: 9, dz: z, type: BlockType.NETHERRACK });
        }
      }
      blocks.push({ dx: 3, dy: 10, dz: 3, type: BlockType.GOLD_ORE });
      blocks.push({ dx: 3, dy: 11, dz: 3, type: BlockType.TORCH });

      return blocks;
    },
  },
  {
    id: 'sky_island',
    name: 'Floating Sky Island',
    description: 'Floating celestial biome with ancient stone base, lush grass plateau, oak tree & gold ore.',
    icon: '🛸',
    width: 9,
    height: 9,
    depth: 9,
    generate: () => {
      const blocks: StructureBlock[] = [];
      const radius = 4;
      const centerY = 3;

      // Inverted cone / organic floating island base
      for (let dy = -3; dy <= 0; dy++) {
        const curR = radius + dy * 0.8;
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dz = -radius; dz <= radius; dz++) {
            if (dx * dx + dz * dz <= curR * curR) {
              const block = dy === 0 ? BlockType.GRASS : dy === -1 ? BlockType.DIRT : BlockType.STONE;
              blocks.push({ dx: 4 + dx, dy: centerY + dy, dz: 4 + dz, type: block });
            }
          }
        }
      }

      // Center Oak Tree on top of island
      for (let ty = 1; ty <= 4; ty++) {
        blocks.push({ dx: 4, dy: centerY + ty, dz: 4, type: BlockType.OAK_LOG });
      }
      // Tree Leaves
      for (let lx = -2; lx <= 2; lx++) {
        for (let lz = -2; lz <= 2; lz++) {
          for (let ly = 3; ly <= 5; ly++) {
            if (Math.abs(lx) + Math.abs(lz) <= 3) {
              blocks.push({ dx: 4 + lx, dy: centerY + ly, dz: 4 + lz, type: BlockType.OAK_LEAVES });
            }
          }
        }
      }

      // Treasure on island
      blocks.push({ dx: 3, dy: centerY + 1, dz: 3, type: BlockType.CHEST });
      blocks.push({ dx: 5, dy: centerY + 1, dz: 5, type: BlockType.TORCH });
      blocks.push({ dx: 2, dy: centerY + 1, dz: 4, type: BlockType.POPPY });
      blocks.push({ dx: 6, dy: centerY + 1, dz: 3, type: BlockType.DANDELION });

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
