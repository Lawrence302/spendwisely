export const CATEGORIES: string[] = [
  'Groceries',
  'Electronics',
  'Household',
  'Dining Out',
  'Transportation',
  'Entertainment',
  'Health',
  'Utilities',
  'Income',
  'Other'
];

export const PAYMENT_METHODS: string[] = ['Cash', 'Card', 'Online'];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
};

export const CATEGORY_COLORS: Record<string, string> = {
  Groceries: '#10b981', // emerald-500
  Electronics: '#3b82f6', // blue-500
  Household: '#f59e0b', // amber-500
  'Dining Out': '#ef4444', // red-500
  Transportation: '#8b5cf6', // violet-500
  Entertainment: '#ec4899', // pink-500
  Health: '#06b6d4', // cyan-500
  Utilities: '#64748b', // slate-500
  Income: '#10b981', // emerald-500
  Other: '#94a3b8', // slate-400
};
