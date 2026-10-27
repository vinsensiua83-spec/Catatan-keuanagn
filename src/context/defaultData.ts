import { Category, Wallet, Transaction } from '../types';

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Makanan & Minuman', icon: 'Utensils', color: '#f97316' },
  { name: 'Transportasi', icon: 'Car', color: '#0284c7' },
  { name: 'Belanja & Keperluan', icon: 'ShoppingBag', color: '#ec4899' },
  { name: 'Tagihan & Utilitas', icon: 'Zap', color: '#eab308' },
  { name: 'Hiburan & Hobi', icon: 'Film', color: '#8b5cf6' },
  { name: 'Kesehatan & Medis', icon: 'HeartPulse', color: '#ef4444' },
  { name: 'Pendidikan', icon: 'GraduationCap', color: '#14b8a6' },
  { name: 'Tempat Tinggal / Kos', icon: 'Home', color: '#6366f1' },
  { name: 'Lain-lain', icon: 'MoreHorizontal', color: '#64748b' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Gaji Pokok', icon: 'Briefcase', color: '#10b981' },
  { name: 'Bonus & THR', icon: 'Award', color: '#06b6d4' },
  { name: 'Freelance & Usaha', icon: 'TrendingUp', color: '#3b82f6' },
  { name: 'Investasi & Dividen', icon: 'Landmark', color: '#8b5cf6' },
  { name: 'Hadiah & Transfer Masuk', icon: 'Gift', color: '#f59e0b' },
  { name: 'Pendapatan Lain', icon: 'PlusCircle', color: '#14b8a6' },
];

export const DEFAULT_WALLETS_TEMPLATE = [
  { name: 'Dompet Tunai', type: 'cash' as const, initialBalance: 500000, color: '#10b981', icon: 'Banknote' },
  { name: 'Bank BCA', type: 'bank' as const, initialBalance: 7500000, color: '#2563eb', icon: 'Landmark' },
  { name: 'GoPay / E-Wallet', type: 'ewallet' as const, initialBalance: 350000, color: '#0284c7', icon: 'Smartphone' },
];

export function generateSeedData(userId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthStr = `${year}-${month}`;

  const categories: Category[] = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({
      id: `cat_exp_${i + 1}`,
      userId,
      name: c.name,
      type: 'expense' as const,
      icon: c.icon,
      color: c.color,
      isDefault: true,
      createdAt: now.toISOString(),
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({
      id: `cat_inc_${i + 1}`,
      userId,
      name: c.name,
      type: 'income' as const,
      icon: c.icon,
      color: c.color,
      isDefault: true,
      createdAt: now.toISOString(),
    })),
  ];

  const wallets: Wallet[] = DEFAULT_WALLETS_TEMPLATE.map((w, i) => ({
    id: `wallet_${i + 1}`,
    userId,
    name: w.name,
    type: w.type,
    initialBalance: w.initialBalance,
    currentBalance: w.initialBalance,
    color: w.color,
    icon: w.icon,
    createdAt: now.toISOString(),
  }));

  const sampleTransactions: Transaction[] = [
    {
      id: 'tx_seed_1',
      userId,
      walletId: 'wallet_2', // Bank BCA
      type: 'income',
      amount: 8500000,
      categoryId: categories.find(c => c.name === 'Gaji Pokok')?.id,
      categoryName: 'Gaji Pokok',
      date: `${monthStr}-01`,
      note: 'Gaji Bulanan',
      createdAt: now.toISOString(),
    },
    {
      id: 'tx_seed_2',
      userId,
      walletId: 'wallet_2',
      type: 'expense',
      amount: 1500000,
      categoryId: categories.find(c => c.name === 'Tempat Tinggal / Kos')?.id,
      categoryName: 'Tempat Tinggal / Kos',
      date: `${monthStr}-02`,
      note: 'Sewa Kos Bulanan',
      createdAt: now.toISOString(),
    },
    {
      id: 'tx_seed_3',
      userId,
      walletId: 'wallet_3', // GoPay
      type: 'expense',
      amount: 85000,
      categoryId: categories.find(c => c.name === 'Makanan & Minuman')?.id,
      categoryName: 'Makanan & Minuman',
      date: `${monthStr}-05`,
      note: 'Makan siang & kopi',
      createdAt: now.toISOString(),
    },
    {
      id: 'tx_seed_4',
      userId,
      walletId: 'wallet_1', // Tunai
      type: 'expense',
      amount: 50000,
      categoryId: categories.find(c => c.name === 'Transportasi')?.id,
      categoryName: 'Transportasi',
      date: `${monthStr}-06`,
      note: 'Bensin motor & parkir',
      createdAt: now.toISOString(),
    },
    {
      id: 'tx_seed_5',
      userId,
      walletId: 'wallet_2',
      type: 'expense',
      amount: 350000,
      categoryId: categories.find(c => c.name === 'Tagihan & Utilitas')?.id,
      categoryName: 'Tagihan & Utilitas',
      date: `${monthStr}-08`,
      note: 'Tagihan Listrik & WiFi',
      createdAt: now.toISOString(),
    },
    {
      id: 'tx_seed_6',
      userId,
      walletId: 'wallet_3',
      type: 'expense',
      amount: 120000,
      categoryId: categories.find(c => c.name === 'Hiburan & Hobi')?.id,
      categoryName: 'Hiburan & Hobi',
      date: `${monthStr}-12`,
      note: 'Langganan Netflix & Spotify',
      createdAt: now.toISOString(),
    },
    {
      id: 'tx_seed_7',
      userId,
      walletId: 'wallet_2',
      type: 'income',
      amount: 1200000,
      categoryId: categories.find(c => c.name === 'Freelance & Usaha')?.id,
      categoryName: 'Freelance & Usaha',
      date: `${monthStr}-15`,
      note: 'Project Desain Web',
      createdAt: now.toISOString(),
    },
  ];

  return { categories, wallets, sampleTransactions };
}
