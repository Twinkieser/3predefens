/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Level = 'Beginner' | 'Explorer' | 'Recycler' | 'Eco Hero' | 'Eco Warrior';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  points: number;
  level: Level;
  badges: string[];
  createdAt: number;
  lastActive: number;
  streak: number;
}

export type WasteCategory = 'plastic' | 'glass' | 'paper' | 'metal' | 'cardboard' | 'trash';

export interface ScanRecord {
  id: string;
  uid: string;
  imageUrl: string;
  category: WasteCategory;
  confidence: number;
  instructions: string;
  tips: string;
  pointsEarned: number;
  createdAt: number;
}

export interface RecyclingLocation {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  acceptedMaterials: string[];
  hours: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export const LEVELS: { name: Level; minPoints: number }[] = [
  { name: 'Beginner', minPoints: 0 },
  { name: 'Explorer', minPoints: 101 },
  { name: 'Recycler', minPoints: 301 },
  { name: 'Eco Hero', minPoints: 601 },
  { name: 'Eco Warrior', minPoints: 1000 },
];

export const getLevel = (points: number): Level => {
  const level = [...LEVELS].reverse().find(l => points >= l.minPoints);
  return level ? level.name : 'Beginner';
};

export const getNextLevel = (points: number) => {
  const currentIdx = LEVELS.findIndex(l => points < l.minPoints);
  if (currentIdx === -1) return null;
  return LEVELS[currentIdx];
};
