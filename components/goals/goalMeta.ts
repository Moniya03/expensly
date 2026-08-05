import type { Ionicons } from '@expo/vector-icons';
import type { UserGoalIcon } from '../../types';

/**
 * Per-icon visual identity for goals.
 * tint: soft gradient for card background
 * accent: bright color for ring/icon
 */
export const goalMeta: Record<
  string,
  {
    tint: [string, string];
    accent: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }
> = {
  'briefcase-outline': {
    tint: ['#13294e', '#0f2038'],
    accent: '#4D9FFF',
    icon: 'briefcase-outline',
    label: 'Work',
  },
  'airplane-outline': {
    tint: ['#3a1f5c', '#291544'],
    accent: '#B48CFF',
    icon: 'airplane-outline',
    label: 'Travel',
  },
  'home-outline': {
    tint: ['#0e3a3a', '#0b2a2a'],
    accent: '#2DE2FF',
    icon: 'home-outline',
    label: 'Home',
  },
  'car-sport-outline': {
    tint: ['#3d2a12', '#2e1f0c'],
    accent: '#F5A623',
    icon: 'car-sport-outline',
    label: 'Car',
  },
  'school-outline': {
    tint: ['#3d1f4a', '#2d1536'],
    accent: '#F472B6',
    icon: 'school-outline',
    label: 'Study',
  },
  'medkit-outline': {
    tint: ['#3d1720', '#2d0f17'],
    accent: '#FF716C',
    icon: 'medkit-outline',
    label: 'Health',
  },
  'heart-outline': {
    tint: ['#3d1526', '#2d0e1b'],
    accent: '#FB7185',
    icon: 'heart-outline',
    label: 'Love',
  },
  'film-outline': {
    tint: ['#1f1f3d', '#16162d'],
    accent: '#A78BFA',
    icon: 'film-outline',
    label: 'Entertainment',
  },
};

const darken = (hex: string, factor: number): string => {
  const normalized = hex.replace('#', '');
  const fullHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;
  const value = Number.parseInt(fullHex, 16);
  const red = Math.round(((value >> 16) & 255) * factor);
  const green = Math.round(((value >> 8) & 255) * factor);
  const blue = Math.round((value & 255) * factor);
  const channel = (n: number) => n.toString(16).padStart(2, '0');
  return `#${channel(red)}${channel(green)}${channel(blue)}`;
};

/**
 * Resolve a goal's icon visual identity.
 * Preset icon names resolve from goalMeta; custom icon UUIDs resolve
 * from the user's icon library (tint = darkened color, accent = color).
 */
export const getGoalMeta = (icon: string, customIcons?: UserGoalIcon[]) => {
  if (customIcons) {
    const custom = customIcons.find((item) => item.id === icon);
    if (custom) {
      return {
        tint: [darken(custom.color, 0.22), darken(custom.color, 0.13)] as [string, string],
        accent: custom.color,
        icon: custom.icon_name as keyof typeof Ionicons.glyphMap,
        label: custom.label ?? 'Custom',
      };
    }
  }
  return goalMeta[icon] ?? goalMeta['briefcase-outline'];
};
