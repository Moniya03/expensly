import type { Ionicons } from '@expo/vector-icons';
import type { UserGoalIcon } from '../../types';

export const goalMeta: Record<
  string,
  {
    accent: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  }
> = {
  'briefcase-outline': {
    accent: '#4D9FFF',
    icon: 'briefcase-outline',
    label: 'Work',
  },
  'airplane-outline': {
    accent: '#B48CFF',
    icon: 'airplane-outline',
    label: 'Travel',
  },
  'home-outline': {
    accent: '#2DE2FF',
    icon: 'home-outline',
    label: 'Home',
  },
  'car-sport-outline': {
    accent: '#F5A623',
    icon: 'car-sport-outline',
    label: 'Car',
  },
  'school-outline': {
    accent: '#F472B6',
    icon: 'school-outline',
    label: 'Study',
  },
  'medkit-outline': {
    accent: '#FF716C',
    icon: 'medkit-outline',
    label: 'Health',
  },
  'heart-outline': {
    accent: '#FB7185',
    icon: 'heart-outline',
    label: 'Love',
  },
  'film-outline': {
    accent: '#A78BFA',
    icon: 'film-outline',
    label: 'Entertainment',
  },
};

/**
 * Resolve a goal's icon visual identity.
 * Preset icon names resolve from goalMeta; custom icon UUIDs resolve
 * from the user's icon library.
 */
export const getGoalMeta = (icon: string, customIcons?: UserGoalIcon[]) => {
  if (customIcons) {
    const custom = customIcons.find((item) => item.id === icon);
    if (custom) {
      return {
        accent: custom.color,
        icon: custom.icon_name as keyof typeof Ionicons.glyphMap,
        label: custom.label ?? 'Custom',
      };
    }
  }
  return goalMeta[icon] ?? goalMeta['briefcase-outline'];
};
