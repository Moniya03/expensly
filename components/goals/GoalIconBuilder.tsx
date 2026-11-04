import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, IconButton, Modal, Portal, Surface, Text, TextInput } from 'react-native-paper';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
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
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [iconName, setIconName] = useState(editing?.icon_name ?? 'airplane-outline');
  const [label, setLabel] = useState(editing?.label ?? '');
  const [color, setColor] = useState(editing?.color ?? '#B48CFF');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (visible) {
      setIconName(editing?.icon_name ?? 'airplane-outline');
      setLabel(editing?.label ?? '');
      setColor(editing?.color ?? '#B48CFF');
      setSaving(false);
      setDeleting(false);
    }
  }, [visible, editing]);

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
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Surface elevation={3} style={styles.card}>
            <View style={styles.header}>
              <Text variant="titleMedium" style={styles.title}>
                {editing ? 'Edit icon' : 'New icon'}
              </Text>
              <IconButton
                icon="close"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                containerColor={theme.colors.surfaceContainer}
                onPress={onClose}
                style={styles.closeButton}
                accessibilityLabel="Close"
              />
            </View>

            <ScrollView
              contentContainerStyle={styles.form}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text variant="bodySmall" style={styles.sectionLabel}>
                Icon
              </Text>
              <View style={styles.iconGrid}>
                {filtered.map((name) => {
                  const selected = name === iconName;
                  return (
                    <Pressable
                      key={name}
                      style={[styles.iconCell, selected && { borderColor: color, borderWidth: 2 }]}
                      onPress={() => setIconName(name)}
                    >
                      <Ionicons
                        name={name as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color={selected ? color : theme.colors.onSurfaceVariant}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                mode="outlined"
                label="Label (optional)"
                value={label}
                onChangeText={setLabel}
                placeholder="e.g. Gym, Trip to Goa"
                maxLength={24}
                style={styles.input}
              />

              <Text variant="bodySmall" style={styles.sectionLabel}>
                Color
              </Text>
              <View style={styles.swatchRow}>
                {SWATCHES.map((swatch) => (
                  <Pressable
                    key={swatch}
                    style={[styles.swatch, swatch === color && styles.swatchSelected]}
                    onPress={() => setColor(swatch)}
                  >
                    <View style={[styles.swatchCircle, { backgroundColor: swatch }]}>
                      {swatch === color ? (
                        <Ionicons name="checkmark" size={14} color={theme.colors.onPrimary} />
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
              <TextInput
                mode="outlined"
                label="Hex color"
                value={color}
                onChangeText={setColor}
                placeholder="#B48CFF"
                autoCapitalize="characters"
                maxLength={7}
                error={!validHex && color.length > 0}
                style={styles.input}
              />

              <View style={styles.previewRow}>
                <View style={[styles.previewBadge, { backgroundColor: color }]}>
                  <Ionicons
                    name={iconName as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={theme.colors.onPrimary}
                  />
                </View>
                <Text variant="titleSmall" style={styles.previewText}>
                  {label.trim() || 'Preview'}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              {editing ? (
                <Button
                  mode="outlined"
                  textColor={theme.colors.error}
                  icon="trash-can-outline"
                  loading={deleting}
                  disabled={deleting || saving}
                  onPress={handleDelete}
                  style={styles.deleteButton}
                >
                  Delete
                </Button>
              ) : null}
              <Button
                mode="contained"
                loading={saving}
                disabled={!validHex || saving || deleting}
                onPress={handleSave}
                style={styles.saveButton}
                contentStyle={styles.saveButtonContent}
                labelStyle={styles.saveButtonLabel}
              >
                Save icon
              </Button>
            </View>
          </Surface>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      paddingHorizontal: spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keyboardView: {
      width: '100%',
      maxWidth: 420,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '88%',
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      gap: spacing.md,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.bold,
    },
    closeButton: {
      margin: 0,
    },
    form: {
      gap: spacing.sm,
      paddingBottom: spacing.xs,
    },
    sectionLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.medium,
      marginTop: spacing.xs,
      marginBottom: 2,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    iconCell: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    input: {
      backgroundColor: theme.colors.surfaceContainerHigh,
    },
    swatchRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginVertical: spacing.xs,
    },
    swatch: {
      borderRadius: 999,
      borderWidth: 2,
      borderColor: 'transparent',
      padding: 2,
    },
    swatchSelected: {
      borderColor: theme.colors.onSurfaceVariant,
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
      marginTop: spacing.sm,
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.surfaceContainer,
    },
    previewBadge: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewText: {
      color: theme.colors.onSurface,
      fontWeight: typography.fontWeight.semiBold,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    deleteButton: {
      borderColor: theme.colors.error,
      borderRadius: borderRadius.lg,
    },
    saveButton: {
      flex: 1,
      borderRadius: borderRadius.lg,
    },
    saveButtonContent: {
      minHeight: 48,
    },
    saveButtonLabel: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
  });
