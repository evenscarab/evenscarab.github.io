
import { ItemData, LevelConfig } from './types';

export const GAME_DURATION = 45; 

// PHYSICS COLLISION GROUPS
export const GROUP_SCENE = 1;
export const GROUP_PLAYER = 2;
export const GROUP_ITEMS = 4;

// --- CENTRALIZED LAYOUT CONFIGURATION ---
export const ROOM_LAYOUT = {
  WIDTH: 6,
  DEPTH: 6,
  HEIGHT: 3,
  WALL_THICKNESS: 0.2,
  // Furniture Definitions { pos: [x,y,z], size: [w,h,d], rot: [x,y,z] }
  BED: {
    pos: [-1.5, 0.3, 2.2] as [number, number, number], 
    size: [1.6, 0.6, 2.8] as [number, number, number], 
    rot: [0, Math.PI / 2, 0] as [number, number, number]
  },
  NIGHTSTAND: {
    pos: [-2.5, 0.3, 1.0] as [number, number, number],
    size: [0.6, 0.6, 0.6] as [number, number, number],
    rot: [0, Math.PI / 2, 0] as [number, number, number]
  },
  CLOSET_LEFT: {
    pos: [-1.9, 1.25, -2.4] as [number, number, number],
    size: [1.8, 2.5, 0.8] as [number, number, number],
    rot: [0, 0, 0] as [number, number, number]
  },
  CLOSET_MIDDLE: {
    pos: [0.0, 1.25, -2.4] as [number, number, number],
    size: [1.8, 2.5, 0.8] as [number, number, number],
    rot: [0, 0, 0] as [number, number, number]
  },
  CLOSET_RIGHT: {
    pos: [1.9, 1.25, -2.4] as [number, number, number],
    size: [1.8, 2.5, 0.8] as [number, number, number],
    rot: [0, 0, 0] as [number, number, number]
  },
  DESK: {
    pos: [2.4, 0.375, 1.0] as [number, number, number],
    size: [1.2, 0.75, 1.8] as [number, number, number],
    rot: [0, 0, 0] as [number, number, number]
  },
  CHAIR: {
    pos: [1.4, 0.4, 1.0] as [number, number, number],
    size: [0.5, 0.8, 0.5] as [number, number, number],
    rot: [0, 0, 0] as [number, number, number]
  },
  BASKET: {
    pos: [2.2, 0.3, -1.2] as [number, number, number],
  },
  RADIO: {
    // On top of desk (Desk Y=0.375, Height=0.75 -> Surface=0.75)
    // Position relative to desk center or world. Desk is at x=2.4, z=1.0. 
    // Let's put it on the back corner.
    pos: [2.6, 0.85, 0.5] as [number, number, number],
    rot: [0, -Math.PI / 4, 0] as [number, number, number]
  }
};

export const BASKET_POSITION = ROOM_LAYOUT.BASKET.pos;

// CLOSET DROP ZONES (For Level 3)
// EXPANDED ZONES: Width increased to cover edges, Depth increased to 1.5 to cover shelves and front area.
export const CLOSET_ZONES = [
  { x: -1.9, z: -2.4, width: 2.2, depth: 2.0 }, // Left Closet - Very forgiving zone
  { x: 0.0, z: -2.4, width: 2.2, depth: 2.0 }   // Middle Closet - Very forgiving zone
];

// --- LEVEL 1 ITEMS (Standard Mess) ---
const LEVEL_1_ITEMS: ItemData[] = [
  // Clothing (On Bed)
  { id: 'c1', type: 'clothing', variant: 'shirt', position: [-1.5, 0.9, 2.3], color: '#60a5fa', scale: [0.35, 0.35, 0.35], rotation: [0, 0.5, 0], isCleaned: false, weight: 0.8 },
  { id: 'c2', type: 'clothing', variant: 'shirt', position: [-1.9, 0.9, 2.0], color: '#f87171', scale: [0.35, 0.35, 0.35], rotation: [0.2, 1, 0], isCleaned: false, weight: 0.8 },
  // Socks (Clear Floor Area)
  { id: 'c3', type: 'clothing', variant: 'sock', position: [0.0, 0.2, 1.5], color: '#e5e7eb', scale: [0.15, 0.15, 0.15], rotation: [0, 0, 0], isCleaned: false, weight: 0.2 },
  { id: 'c4', type: 'clothing', variant: 'sock', position: [0.5, 0.2, 1.0], color: '#e5e7eb', scale: [0.15, 0.15, 0.15], rotation: [0, 2, 0], isCleaned: false, weight: 0.2 },
  
  // Kitchen (Desk)
  { id: 'k1', type: 'kitchen', variant: 'cup', position: [2.5, 0.85, 0.8], color: '#ef4444', scale: [0.15, 0.2, 0.15], rotation: [0, 0, 0], isCleaned: false, weight: 0.4 },
  { id: 'k2', type: 'kitchen', variant: 'plate', position: [2.3, 0.8, 1.2], color: '#ffffff', scale: [0.3, 0.05, 0.3], rotation: [0, 0, 0], isCleaned: false, weight: 0.5 },
  // Bottle (Center Floor - Visible)
  { id: 'k3', type: 'kitchen', variant: 'bottle', position: [0.0, 0.5, 0.0], color: '#10b981', scale: [0.12, 0.4, 0.12], rotation: [Math.PI/2, 0, 0.5], isCleaned: false, weight: 0.6 },
  
  // Trash (Floor - Clear areas)
  { id: 't1', type: 'trash', variant: 'paper', position: [1.8, 0.2, 2.0], color: '#f3f4f6', scale: [0.2, 0.2, 0.2], rotation: [0, 0, 0], isCleaned: false, weight: 0.1 },
  { id: 't2', type: 'trash', variant: 'paper', position: [1.2, 0.2, 0.8], color: '#fffac1', scale: [0.18, 0.18, 0.18], rotation: [0, 1, 0], isCleaned: false, weight: 0.1 },
  { id: 't3', type: 'trash', variant: 'box', position: [0.0, 0.3, -1.0], color: '#d4a373', scale: [0.4, 0.3, 0.4], rotation: [0, 0.5, 0], isCleaned: false, weight: 0.5 },
  { id: 't4', type: 'trash', variant: 'box', position: [1.5, 0.2, -1.5], color: '#a8a29e', scale: [0.25, 0.15, 0.25], rotation: [0, 0.2, 0], isCleaned: false, weight: 0.3 },
];

// --- LEVEL 2 ITEMS (Trash & Bottles Nightmare) ---
const LEVEL_2_ITEMS: ItemData[] = [
  // 3 Bottles
  { id: 'l2_k1', type: 'kitchen', variant: 'bottle', position: [-0.5, 0.2, 1.5], color: '#10b981', scale: [0.12, 0.4, 0.12], rotation: [Math.PI/2, 0, 0.2], isCleaned: false, weight: 0.6 },
  { id: 'l2_k2', type: 'kitchen', variant: 'bottle', position: [-1.0, 0.2, 1.0], color: '#3b82f6', scale: [0.12, 0.4, 0.12], rotation: [Math.PI/2, 0, 2], isCleaned: false, weight: 0.6 },
  { id: 'l2_k3', type: 'kitchen', variant: 'bottle', position: [0.5, 0.2, 0.5], color: '#ef4444', scale: [0.12, 0.4, 0.12], rotation: [Math.PI/2, 0, 1], isCleaned: false, weight: 0.6 },

  // 10 Papers
  { id: 'l2_t1', type: 'trash', variant: 'paper', position: [-1.5, 0.9, 2.2], color: '#f3f4f6', scale: [0.2, 0.2, 0.2], rotation: [0, 0, 0], isCleaned: false, weight: 0.1 },
  { id: 'l2_t2', type: 'trash', variant: 'paper', position: [-1.3, 0.9, 2.4], color: '#fffac1', scale: [0.2, 0.2, 0.2], rotation: [0.2, 1, 0], isCleaned: false, weight: 0.1 },
  { id: 'l2_t3', type: 'trash', variant: 'paper', position: [-1.7, 0.9, 2.0], color: '#f3f4f6', scale: [0.2, 0.2, 0.2], rotation: [0.5, 0, 0], isCleaned: false, weight: 0.1 },
  { id: 'l2_t4', type: 'trash', variant: 'paper', position: [-1.5, 1.0, 2.3], color: '#e5e7eb', scale: [0.2, 0.2, 0.2], rotation: [0, 2, 0.5], isCleaned: false, weight: 0.1 },
  { id: 'l2_t5', type: 'trash', variant: 'paper', position: [-1.2, 0.95, 1.8], color: '#fffac1', scale: [0.2, 0.2, 0.2], rotation: [1, 0, 1], isCleaned: false, weight: 0.1 },
  { id: 'l2_t6', type: 'trash', variant: 'paper', position: [0.0, 0.2, 1.0], color: '#f3f4f6', scale: [0.2, 0.2, 0.2], rotation: [0, 1, 0], isCleaned: false, weight: 0.1 },
  { id: 'l2_t7', type: 'trash', variant: 'paper', position: [1.5, 0.2, 2.0], color: '#fffac1', scale: [0.2, 0.2, 0.2], rotation: [0, 2, 0], isCleaned: false, weight: 0.1 },
  { id: 'l2_t8', type: 'trash', variant: 'paper', position: [-0.5, 0.2, -1.0], color: '#f3f4f6', scale: [0.2, 0.2, 0.2], rotation: [0, 0.5, 0], isCleaned: false, weight: 0.1 },
  { id: 'l2_t9', type: 'trash', variant: 'paper', position: [2.0, 0.2, -0.5], color: '#e5e7eb', scale: [0.2, 0.2, 0.2], rotation: [0.5, 0.5, 0], isCleaned: false, weight: 0.1 },
  { id: 'l2_t10', type: 'trash', variant: 'paper', position: [0.5, 0.2, 1.5], color: '#fffac1', scale: [0.2, 0.2, 0.2], rotation: [0, 0, 0.5], isCleaned: false, weight: 0.1 },
];

// --- LEVEL 3 ITEMS (Clothing Only - Closet Mission) ---
const LEVEL_3_ITEMS: ItemData[] = [
  // Shirts everywhere
  { id: 'l3_c1', type: 'clothing', variant: 'shirt', position: [-1.5, 0.9, 2.3], color: '#60a5fa', scale: [0.35, 0.35, 0.35], rotation: [0, 0.5, 0], isCleaned: false, weight: 0.8 },
  { id: 'l3_c2', type: 'clothing', variant: 'shirt', position: [0.0, 0.2, 1.0], color: '#f87171', scale: [0.35, 0.35, 0.35], rotation: [0.2, 1, 0], isCleaned: false, weight: 0.8 },
  { id: 'l3_c3', type: 'clothing', variant: 'shirt', position: [1.4, 0.6, 1.0], color: '#fbbf24', scale: [0.35, 0.35, 0.35], rotation: [0.5, 0.2, 0], isCleaned: false, weight: 0.8 }, // On chair
  { id: 'l3_c4', type: 'clothing', variant: 'shirt', position: [2.4, 0.8, 1.0], color: '#a78bfa', scale: [0.35, 0.35, 0.35], rotation: [0, 2, 0], isCleaned: false, weight: 0.8 }, // On desk
  { id: 'l3_c5', type: 'clothing', variant: 'shirt', position: [-0.5, 0.2, -0.5], color: '#34d399', scale: [0.35, 0.35, 0.35], rotation: [0, 1, 0], isCleaned: false, weight: 0.8 },

  // Socks
  { id: 'l3_s1', type: 'clothing', variant: 'sock', position: [-2.0, 0.2, 1.0], color: '#e5e7eb', scale: [0.15, 0.15, 0.15], rotation: [0, 0, 0], isCleaned: false, weight: 0.2 },
  { id: 'l3_s2', type: 'clothing', variant: 'sock', position: [1.0, 0.2, 2.0], color: '#9ca3af', scale: [0.15, 0.15, 0.15], rotation: [0, 2, 0], isCleaned: false, weight: 0.2 },
  { id: 'l3_s3', type: 'clothing', variant: 'sock', position: [2.0, 0.2, -1.0], color: '#e5e7eb', scale: [0.15, 0.15, 0.15], rotation: [0.5, 0, 0], isCleaned: false, weight: 0.2 },
  { id: 'l3_s4', type: 'clothing', variant: 'sock', position: [0.0, 0.2, -1.0], color: '#6b7280', scale: [0.15, 0.15, 0.15], rotation: [0, 1, 1], isCleaned: false, weight: 0.2 },
];


export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    titleKey: "title_l1",
    items: LEVEL_1_ITEMS,
    timeLimit: 60,
    timeOfDay: 'day',
    dropZone: 'basket'
  },
  {
    id: 2,
    titleKey: "title_l2",
    items: LEVEL_2_ITEMS,
    timeLimit: 60, 
    timeOfDay: 'night',
    dropZone: 'basket'
  },
  {
    id: 3,
    titleKey: "title_l3",
    items: LEVEL_3_ITEMS,
    timeLimit: 90,
    timeOfDay: 'sunset', // NEW SUNSET MODE
    dropZone: 'closet'
  }
];

export const INITIAL_ITEMS = LEVEL_1_ITEMS;
