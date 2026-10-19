/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Advancement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'story' | 'building' | 'exploration' | 'superpower';
  unlocked: boolean;
  unlockedAt?: number;
}

export const INITIAL_ADVANCEMENTS: Advancement[] = [
  {
    id: 'welcome',
    title: 'Creative Architect',
    description: 'Welcome to your infinite Minecraft Creative realm! Unlimited blocks & flight.',
    icon: '🌟',
    category: 'story',
    unlocked: true,
    unlockedAt: Date.now(),
  },
  {
    id: 'flight',
    title: 'I Believe I Can Fly',
    description: 'Take to the skies by activating Creative Flight mode [F].',
    icon: '🕊️',
    category: 'superpower',
    unlocked: false,
  },
  {
    id: 'sky_high',
    title: 'Sky Ascendant',
    description: 'Fly high above the world beyond altitude Y: 60 into the stratosphere.',
    icon: '☁️',
    category: 'exploration',
    unlocked: false,
  },
  {
    id: 'first_blueprint',
    title: 'Blueprint Master',
    description: 'Construct your first instant building or house from the Build Menu [B].',
    icon: '🏛️',
    category: 'building',
    unlocked: false,
  },
  {
    id: 'grand_architect',
    title: 'Kingdom Sovereign',
    description: 'Place 3 or more distinctive architectural structures in your world.',
    icon: '🏰',
    category: 'building',
    unlocked: false,
  },
  {
    id: 'world_edit',
    title: 'Terraformer Supreme',
    description: 'Use the Sphere, Highway Road, or Demolish Brush to reshape the landscape.',
    icon: '🔮',
    category: 'superpower',
    unlocked: false,
  },
  {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Drive an Offroader Car or ride a Motorcycle at over 30 km/h!',
    icon: '🏎️',
    category: 'exploration',
    unlocked: false,
  },
  {
    id: 'sea_captain',
    title: 'Captain of the Waters',
    description: 'Sail across rivers or the ocean in a wooden Rowboat.',
    icon: '🚣',
    category: 'exploration',
    unlocked: false,
  },
  {
    id: 'time_lord',
    title: 'Chrono Shifter',
    description: 'Control the celestial heavens by setting Noon, Sunset, or Midnight!',
    icon: '☀️',
    category: 'superpower',
    unlocked: false,
  },
  {
    id: 'pyrotechnic',
    title: 'Mega Detonation',
    description: 'Detonate a TNT block or TNT cluster for explosive creative effects.',
    icon: '💥',
    category: 'superpower',
    unlocked: false,
  },
  {
    id: 'life_creator',
    title: 'Fauna Whisperer',
    description: 'Spawn an animal or creature into your realm using the Creative Mob Spawner.',
    icon: '🐮',
    category: 'story',
    unlocked: false,
  },
  {
    id: 'waypoint_travel',
    title: 'Warp Master',
    description: 'Save a custom Waypoint and teleport anywhere across the vast map.',
    icon: '📍',
    category: 'exploration',
    unlocked: false,
  },
];
