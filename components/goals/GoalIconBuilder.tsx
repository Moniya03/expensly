import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { borderRadius, type Colors, spacing, typography, useColors } from '../../constants/theme';
import { useCreateGoalIcon, useDeleteGoalIcon, useUpdateGoalIcon } from '../../hooks/useGoalIcons';
import { useGoals } from '../../hooks/useGoals';
import type { UserGoalIcon } from '../../types';

const SWATCHES = [
  '#4D9FFF', // blue
  '#B48CFF', // purple
  '#FB7185', // pink
  '#F472B6', // magenta
  '#F5A623', // orange
  '#FF716C', // red
  '#2DE2FF', // cyan
  '#34C759', // green
  '#FACC15', // yellow
  '#A78BFA', // indigo
  '#14B8A6', // teal
  '#A16207', // brown
];

const HEX_REGEX = /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;

const normalizeHex = (value: string) => {
  const trimmed = value.trim().replace(/^#/, '');
  return trimmed.length === 3
    ? `#${trimmed
        .split('')
        .map((c) => c + c)
        .join('')}`
    : `#${trimmed}`;
};

const ALL_ICONS = [
  'airplane-outline',
  'car-sport-outline',
  'home-outline',
  'briefcase-outline',
  'school-outline',
  'medkit-outline',
  'heart-outline',
  'film-outline',
  'barbell-outline',
  'fitness-outline',
  'restaurant-outline',
  'cafe-outline',
  'pizza-outline',
  'ice-cream-outline',
  'basketball-outline',
  'football-outline',
  'tennisball-outline',
  'bicycle-outline',
  'bus-outline',
  'boat-outline',
  'rocket-outline',
  'planet-outline',
  'telescope-outline',
  'umbrella-outline',
  'paw-outline',
  'flower-outline',
  'leaf-outline',
  'sunny-outline',
  'moon-outline',
  'snow-outline',
  'water-outline',
  'gift-outline',
  'diamond-outline',
  'camera-outline',
  'game-controller-outline',
  'musical-notes-outline',
  'shirt-outline',
  'laptop-outline',
  'phone-portrait-outline',
  'watch-outline',
  'wallet-outline',
  'cash-outline',
  'card-outline',
  'storefront-outline',
  'bag-handle-outline',
  'sparkles-outline',
  'flash-outline',
  'key-outline',
  'egg-outline',
  'beer-outline',
  'happy-outline',
  'body-outline',
];

export function GoalIconBuilder({
  visible,
  editing,
  onClose,
}: {
  visible: boolean;
  editing: UserGoalIcon | null;
  onClose: () => void;
}) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [iconName, setIconName] = useState(editing?.icon_name ?? 'airplane-outline');
  const [label, setLabel] = useState(editing?.label ?? '');
  const [color, setColor] = useState(editing?.color ?? '#B48CFF');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const createIcon = useCreateGoalIcon();
  const updateIcon = useUpdateGoalIcon();
  const deleteIcon = useDeleteGoalIcon();
  const { data: goals } = useGoals();
  const usedByCount = editing ? (goals?.filter((goal) => goal.icon === editing.id).length ?? 0) : 0;

  const filtered = ALL_ICONS;

  const validHex = HEX_REGEX.test(color.trim());

  const handleSave = async () => {
    if (!validHex) return;
    setSaving(true);
    try {
      const payload = {
        icon_name: iconName,
        label: label.trim() || null,
        color: normalizeHex(color.trim()),
      };
      if (editing) {
        await updateIcon.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createIcon.mutateAsync({
          icon_name: payload.icon_name,
          label: payload.label ?? undefined,
          color: payload.color,
        });
      }
      onClose();
    } catch (err) {
      console.error('Icon save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    const count = usedByCount;
    Alert.alert(
      'Delete icon?',
      count > 0
        ? `This icon is used by ${count} goal${count === 1 ? '' : 's'}. They will show the default Work icon.`
        : 'This custom icon will be removed from your library.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteIcon.mutateAsync(editing.id);
              onClose();
            } catch (err) {
              console.error('Icon delete error:', err);
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{editing ? 'Edit icon' : 'New icon'}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Icon</Text>
            <View style={styles.iconGrid}>
              {filtered.map((name) => {
                const selected = name === iconName;
                return (
                  <Pressable
                    key={name}
                    style={[styles.iconCell, selected && { borderColor: color }]}
                    onPress={() => setIconName(name)}
                  >
                    <Ionicons
                      name={name as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={selected ? color : colors.onSurfaceVariant}
                    />
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Label (optional)</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Gym, Trip to Goa"
              placeholderTextColor={colors.onSurfaceVariant}
              selectionColor={colors.primary}
              maxLength={24}
            />

            <Text style={styles.label}>Color</Text>
            <View style={styles.swatchRow}>
              {SWATCHES.map((swatch) => (
                <Pressable
                  key={swatch}
                  style={[styles.swatch, swatch === color && styles.swatchSelected]}
                  onPress={() => setColor(swatch)}
                >
                  <View style={[styles.swatchCircle, { backgroundColor: swatch }]}>
                    {swatch === color ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                  </View>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={[styles.input, !validHex && color.length > 0 && { borderColor: colors.error }]}
              value={color}
              onChangeText={setColor}
              placeholder="#B48CFF"
              placeholderTextColor={colors.onSurfaceVariant}
              selectionColor={colors.primary}
              autoCapitalize="characters"
              maxLength={7}
            />

            <View style={styles.previewRow}>
              <View style={[styles.previewBadge, { backgroundColor: color }]}>
                <Ionicons
                  name={iconName as keyof typeof Ionicons.glyphMap}
                  size={18}
                  color="#fff"
                />
              </View>
              <Text style={styles.previewText}>{label.trim() || 'Preview'}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {editing ? (
              <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                )}
              </Pressable>
            ) : null}
            <Pressable
              style={[styles.saveButton, (!validHex || saving) && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={!validHex || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.onAccent} />
              ) : (
                <Text style={styles.saveText}>Save icon</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '85%',
      backgroundColor: colors.surfaceContainer,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    title: {
      color: colors.onSurface,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
    },
    label: {
      color: colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    iconCell: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    input: {
      backgroundColor: colors.surfaceContainerHigh,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      color: colors.onSurface,
      fontSize: typography.fontSize.md,
    },
    swatchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    swatch: {
      borderRadius: 999,
      borderWidth: 2,
      borderColor: 'transparent',
      padding: 2,
    },
    swatchSelected: {
      borderColor: colors.onSurfaceVariant,
    },
    swatchCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    previewBadge: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewText: {
      color: colors.onSurface,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    deleteButton: {
      width: 52,
      height: 52,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButton: {
      flex: 1,
      height: 52,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveText: {
      color: colors.onAccent,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
  });
