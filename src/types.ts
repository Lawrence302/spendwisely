export type Category = 
  | 'Groceries' 
  | 'Electronics' 
  | 'Household' 
  | 'Dining Out' 
  | 'Transportation' 
  | 'Entertainment' 
  | 'Health' 
  | 'Utilities' 
  | 'Income'
  | 'Other';

export type PaymentMethod = 'Cash' | 'Card' | 'Online';
export type TransactionType = 'Income' | 'Expense';
export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Transaction {
  id: string;
  uid: string;
  date: string; // ISO string
  amount: number;
  category: Category;
  paymentMethod: PaymentMethod;
  description?: string;
  type: TransactionType;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  lastGenerated?: string; // ISO date string
  receiptUrl?: string;
  currency: string;
}

export interface Budget {
  id: string;
  uid: string;
  category: Category;
  amount: number;
  month: string; // YYYY-MM
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  currency: string;
  theme: 'light' | 'dark';
}

export interface SpendingSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  incomeThisMonth: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface TrendData {
  date: string;
  amount: number;
}

export interface SurplusData {
  month: string;
  income: number;
  expense: number;
  surplus: number;
  cumulative: number;
}
