export type TransactionType = 'income' | 'expense' | 'transfer';
export type WalletType = 'cash' | 'bank' | 'ewallet' | 'other';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  currentBalance: number;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  categoryId?: string;
  categoryName?: string;
  date: string; // YYYY-MM-DD
  note?: string;
  toWalletId?: string; // used when type === 'transfer'
  isRecurring?: boolean;
  recurringId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  month: string; // YYYY-MM
  limitAmount: number;
  alertThreshold: number; // percentage, e.g. 80
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  walletId: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  categoryName: string;
  frequency: RecurringFrequency;
  startDate: string;
  lastProcessedDate?: string;
  note: string;
  active: boolean;
  createdAt: string;
}

export interface FilterState {
  search: string;
  month: string; // YYYY-MM or 'all'
  type: 'all' | 'income' | 'expense' | 'transfer';
  categoryId: string; // 'all' or id
  walletId: string; // 'all' or id
  startDate?: string;
  endDate?: string;
}
