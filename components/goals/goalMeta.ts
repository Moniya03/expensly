import { Ionicons } from '@expo/vector-icons';

/**
 * Per-icon visual identity for goals.
 * tint: soft gradient for card background
 * accent: bright color for ring/icon
 */
export const goalMeta: Record<string, { tint: [string, string]; accent: string; icon: keyof typeof Ionicons.glyphMap }> = {
  'briefcase-outline': { tint: ['#13294e', '#0f2038'], accent: '#4D9FFF', icon: 'briefcase-outline' },
  'airplane-outline': { tint: ['#3a1f5c', '#291544'], accent: '#B48CFF', icon: 'airplane-outline' },
  'home-outline': { tint: ['#0e3a3a', '#0b2a2a'], accent: '#2DE2FF', icon: 'home-outline' },
  'car-sport-outline': { tint: ['#3d2a12', '#2e1f0c'], accent: '#F5A623', icon: 'car-sport-outline' },
  'school-outline': { tint: ['#3d1f4a', '#2d1536'], accent: '#F472B6', icon: 'school-outline' },
  'medkit-outline': { tint: ['#3d1720', '#2d0f17'], accent: '#FF716C', icon: 'medkit-outline' },
  'heart-outline': { tint: ['#3d1526', '#2d0e1b'], accent: '#FB7185', icon: 'heart-outline' },
  'film-outline': { tint: ['#1f1f3d', '#16162d'], accent: '#A78BFA', icon: 'film-outline' },
};

export const getGoalMeta = (icon: string) => goalMeta[icon] ?? goalMeta['briefcase-outline'];
