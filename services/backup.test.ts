import { describe, expect, it } from 'bun:test';
import { normalizeCategory, parseAndValidateBackupJson } from './backupParser';

describe('normalizeCategory', () => {
  it('recognizes valid categories case-insensitively', () => {
    expect(normalizeCategory('Food')).toBe('food');
    expect(normalizeCategory('TRANSPORT')).toBe('transport');
    expect(normalizeCategory('shopping')).toBe('shopping');
    expect(normalizeCategory('entertainment')).toBe('entertainment');
    expect(normalizeCategory('bills')).toBe('bills');
    expect(normalizeCategory('health')).toBe('health');
    expect(normalizeCategory('education')).toBe('education');
    expect(normalizeCategory('other')).toBe('other');
  });

  it('falls back to other for unknown or non-string categories', () => {
    expect(normalizeCategory('cryptocurrency')).toBe('other');
    expect(normalizeCategory('')).toBe('other');
    expect(normalizeCategory(null)).toBe('other');
    expect(normalizeCategory(123)).toBe('other');
  });
});

describe('parseAndValidateBackupJson', () => {
  it('parses valid versioned Expensly backup JSON', () => {
    const raw = JSON.stringify({
      version: 1,
      app: 'Expensly',
      exported_at: '2026-11-10T12:00:00.000Z',
      data: {
        transactions: [
          {
            amount: 450,
            category: 'food',
            note: 'Dinner · Swiggy',
            input_method: 'manual',
            date: '2026-11-10',
          },
          {
            amount: 120.4,
            category: 'transport',
            note: 'Metro',
            date: '2026-11-09T10:00:00.000Z',
          },
        ],
        budgets: [
          {
            category: 'food',
            amount: 10000,
            month: 11,
            year: 2026,
          },
        ],
        savings_goals: [
          {
            name: 'New Phone',
            target_amount: 50000,
            saved_amount: 15000,
            emoji: 'phone-portrait-outline',
          },
        ],
        user_goal_icons: [
          {
            icon_name: 'phone-portrait-outline',
            color: '#10b981',
          },
        ],
      },
    });

    const result = parseAndValidateBackupJson(raw, 'test-backup.json');
    expect(result.fileName).toBe('test-backup.json');
    expect(result.counts.transactions).toBe(2);
    expect(result.counts.budgets).toBe(1);
    expect(result.counts.goals).toBe(1);
    expect(result.counts.icons).toBe(1);

    expect(result.backup.data.transactions[0].amount).toBe(450);
    expect(result.backup.data.transactions[0].category).toBe('food');
    expect(result.backup.data.transactions[1].amount).toBe(120);
    expect(result.backup.data.transactions[1].date).toBe('2026-11-09');
    expect(result.backup.data.savings_goals?.[0].name).toBe('New Phone');
  });

  it('parses flat transaction array format', () => {
    const raw = JSON.stringify([
      {
        amount: 300,
        category: 'shopping',
        description: 'T-shirt',
        merchant: 'Zara',
        transaction_date: '2026-11-08',
      },
      {
        amount: 80,
        category: 'unknown_cat',
        note: 'Coffee',
        date: '2026-11-07',
      },
    ]);

    const result = parseAndValidateBackupJson(raw);
    expect(result.counts.transactions).toBe(2);
    expect(result.counts.budgets).toBe(0);
    expect(result.counts.goals).toBe(0);

    expect(result.backup.data.transactions[0].amount).toBe(300);
    expect(result.backup.data.transactions[0].note).toBe('T-shirt · Zara');
    expect(result.backup.data.transactions[1].category).toBe('other'); // Fallback unknown
  });

  it('filters out invalid transaction and budget rows gracefully', () => {
    const raw = JSON.stringify({
      version: 1,
      app: 'Expensly',
      data: {
        transactions: [
          { amount: -50, category: 'food', date: '2026-11-01' }, // invalid negative amount
          { amount: 'invalid', category: 'food', date: '2026-11-01' }, // invalid non-number
          { amount: 150, category: 'food' }, // valid (defaults date)
        ],
        budgets: [
          { amount: 5000, month: 13, year: 2026 }, // invalid month > 12
          { amount: 5000, month: 0, year: 2026 }, // invalid month < 1
          { amount: 5000, month: 5, year: 1990 }, // invalid year < 2000
          { amount: 8000, month: 11, year: 2026 }, // valid
        ],
        savings_goals: [
          { name: '   ', target_amount: 5000 }, // empty name
          { name: 'Trip', target_amount: -100 }, // invalid target
          { name: 'Emergency Fund', target_amount: 100000, saved_amount: 25000 }, // valid
        ],
      },
    });

    const result = parseAndValidateBackupJson(raw);
    expect(result.counts.transactions).toBe(1);
    expect(result.backup.data.transactions[0].amount).toBe(150);
    expect(result.counts.budgets).toBe(1);
    expect(result.backup.data.budgets?.[0].amount).toBe(8000);
    expect(result.counts.goals).toBe(1);
    expect(result.backup.data.savings_goals?.[0].name).toBe('Emergency Fund');
  });

  it('throws error for corrupted JSON', () => {
    expect(() => parseAndValidateBackupJson('{ corrupt json')).toThrow(
      'Selected file is not valid JSON',
    );
  });

  it('throws error for empty or non-record JSON', () => {
    expect(() => parseAndValidateBackupJson('{}')).toThrow(
      'This backup file does not contain any valid Expensly data to restore.',
    );
    expect(() => parseAndValidateBackupJson('null')).toThrow('Invalid backup file format.');
  });
});
