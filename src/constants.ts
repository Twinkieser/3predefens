/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RecyclingLocation } from './types';

export const RECYCLING_LOCATIONS: RecyclingLocation[] = [
  {
    id: '1',
    name: 'EcoCenter Astana',
    address: 'Turan Ave 24',
    coordinates: [51.135, 71.405], // Approx coordinates for Turan Ave
    acceptedMaterials: ['plastic', 'glass', 'paper', 'metal'],
    hours: '09:00 - 18:00'
  },
  {
    id: '2',
    name: 'Green Point',
    address: 'Kabanbay Batyr 11',
    coordinates: [51.161, 71.428],
    acceptedMaterials: ['plastic', 'paper', 'cardboard'],
    hours: '10:00 - 20:00'
  },
  {
    id: '3',
    name: 'RecyclePro',
    address: 'Respublika Ave 67',
    coordinates: [51.176, 71.438],
    acceptedMaterials: ['metal', 'glass', 'electronics'],
    hours: '09:00 - 19:00'
  },
  {
    id: '4',
    name: 'EcoBox Mega Silk Way',
    address: 'Kabanbay Batyr Ave 62',
    coordinates: [51.088, 71.413],
    acceptedMaterials: ['plastic', 'glass', 'paper', 'metal', 'cardboard', 'electronics'],
    hours: '10:00 - 22:00'
  },
  {
    id: '5',
    name: 'Zhasyl Nur',
    address: 'Saryarka Ave 14',
    coordinates: [51.168, 71.411],
    acceptedMaterials: ['plastic', 'glass'],
    hours: '08:00 - 17:00'
  }
];

export const APP_NAME = 'EcoSort AI';
export const PRIMARY_COLOR = '#16a34a'; // tailwind green-600
