
import React from 'react';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export type ItemCategory = 'clothing' | 'kitchen' | 'trash';
export type ItemVariant = 'shirt' | 'sock' | 'plate' | 'cup' | 'bottle' | 'paper' | 'box';
export type Language = 'es' | 'fr';

export interface ItemData {
  id: string;
  type: ItemCategory;
  variant: ItemVariant;
  position: [number, number, number];
  color: string;
  scale: [number, number, number];
  rotation: [number, number, number];
  isCleaned: boolean;
  weight: number;
}

export interface LevelConfig {
  id: number;
  titleKey: string; // Key for translation
  items: ItemData[];
  timeLimit: number;
  timeOfDay: 'day' | 'night' | 'sunset'; // Updated from isNight
  dropZone: 'basket' | 'closet';
}

export enum GameState {
  MENU = 'MENU',
  STORY = 'STORY',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  LEVEL_SELECT = 'LEVEL_SELECT',
  WON = 'WON',
  LOST = 'LOST',
  FREE_ROAM = 'FREE_ROAM',
  COOKING = 'COOKING' // NEW STATE
}

export interface GameContextType {
  score: number;
  totalItems: number;
  timeLeft: number;
  gameState: GameState;
  startGame: () => void;
  itemCleaned: (id: string) => void;
  resetGame: () => void;
}

// Augment global JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
      // Explicitly add Three.js elements to satisfy TS
      group: any;
      mesh: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      meshBasicMaterial: any;
      cylinderGeometry: any;
      sphereGeometry: any;
      planeGeometry: any;
      circleGeometry: any;
      coneGeometry: any;
      torusGeometry: any;
      icosahedronGeometry: any;
      ringGeometry: any;
      pointLight: any;
      ambientLight: any;
      spotLight: any;
      hemisphereLight: any;
      fog: any;
      color: any;
    }
  }
}
