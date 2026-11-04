import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmountInput } from '../../components/ui/AmountInput';
import { CategoryPicker } from '../../components/ui/CategoryPicker';
import { DatePicker } from '../../components/ui/DatePicker';
import { Input } from '../../components/ui/Input';
import {
  type AppTheme,
  borderRadius,
  spacing,
  typography,
  useAppTheme,
} from '../../constants/theme';
import { useCreateTransaction } from '../../hooks/useTransactions';
import type { Category } from '../../types';
import { toLocalDateString } from '../../utils/date';

function normalizeCategory(category: Category): Category {
  // Temporary DB compatibility: the physical schema currently does not support bills.
  return category === 'bills' ? 'other' : category;
}

export default function AddExpenseScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { mutate: createTransaction, isPending } = useCreateTransaction();

  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(new Date());
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({});

  const validate = (): boolean => {
    const newErrors: { amount?: string; category?: string } = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }
    if (!category) {
      newErrors.category = 'Select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate() || !category) return;

    createTransaction(
      {
        amount: parseInt(amount, 10),
        category: normalizeCategory(category),
        description: description || merchant || 'Manual expense',
        merchant: merchant || null,
        transaction_date: toLocalDateString(date),
        source: 'manual',
      },
      {
        onSuccess: () => router.back(),
        onError: (error) => {
          // Handle error - could show alert
          console.error('Failed to save transaction:', error);
        },
      },
    );
  };

  const isValid = Boolean(amount && parseFloat(amount) > 0 && category);

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <AmountInput value={amount} onChangeValue={setAmount} error={errors.amount} />
          <CategoryPicker
            selectedCategory={category}
            onSelectCategory={setCategory}
            error={errors.category}
          />
          <Input
            label="Description"
            placeholder="What was this for?"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Input
            label="Merchant"
            placeholder="Where did you spend?"
            value={merchant}
            onChangeText={setMerchant}
          />
          <DatePicker value={date} onChange={setDate} />

          {/* Save Button */}
          <Button
            mode="contained"
            loading={isPending}
            disabled={isPending || !isValid}
            onPress={handleSave}
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
            labelStyle={styles.saveButtonLabel}
          >
            Save Expense
          </Button>
        </ScrollView>
      </SafeAreaView>
    </Surface>
  );
}

const createStyles = (_theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    saveButton: {
      marginTop: spacing.lg,
      borderRadius: borderRadius.md,
    },
    saveButtonContent: {
      height: 48,
    },
    saveButtonLabel: {
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semiBold,
    },
  });
