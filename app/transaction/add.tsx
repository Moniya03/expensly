import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AmountInput } from '../../components/ui/AmountInput';
import { CategoryPicker } from '../../components/ui/CategoryPicker';
import { Input } from '../../components/ui/Input';
import { DatePicker } from '../../components/ui/DatePicker';
import { useCreateTransaction } from '../../hooks/useTransactions';
import { Category } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

function normalizeCategory(category: Category): Category {
  // Temporary DB compatibility: the physical schema currently does not support bills.
  return category === 'bills' ? 'other' : category;
}

export default function AddExpenseScreen() {
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
    if (!validate()) return;
    
    createTransaction({
      amount: parseInt(amount),
      category: normalizeCategory(category!),
      description: description || merchant || 'Manual expense',
      merchant: merchant || null,
      transaction_date: date.toISOString(),
      source: 'manual',
    }, {
      onSuccess: () => router.back(),
      onError: (error) => {
        // Handle error - could show alert
        console.error('Failed to save transaction:', error);
      }
    });
  };

  const isValid = amount && parseFloat(amount) > 0 && category;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <AmountInput value={amount} onChangeValue={setAmount} error={errors.amount} />
        <CategoryPicker selectedCategory={category} onSelectCategory={setCategory} error={errors.category} />
        <Input label="Description" placeholder="What was this for?" value={description} onChangeText={setDescription} multiline />
        <Input label="Merchant" placeholder="Where did you spend?" value={merchant} onChangeText={setMerchant} />
        <DatePicker value={date} onChange={setDate} />
        
        {/* Save Button */}
        <TouchableOpacity onPress={handleSave} disabled={isPending || !isValid} activeOpacity={0.8}>
          <LinearGradient
            colors={isValid ? [colors.primary, colors.secondary] : [colors.outlineVariant, colors.outlineVariant]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButton}
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isPending ? 'Saving...' : 'Save Expense'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.surface 
  },
  scrollView: { 
    flex: 1 
  },
  content: { 
    padding: spacing.md, 
    paddingBottom: spacing.xxl 
  },
  saveButton: { 
    paddingVertical: spacing.md, 
    borderRadius: borderRadius.md, 
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontSize: typography.fontSize.md, 
    fontWeight: typography.fontWeight.semiBold 
  },
});
