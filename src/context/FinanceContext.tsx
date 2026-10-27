import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  Transaction,
  Category,
  Wallet,
  Budget,
  RecurringTransaction,
  FilterState
} from '../types';
import { generateSeedData } from './defaultData';
import { getCurrentMonthStr, getCurrentDateStr } from '../utils/formatters';

interface FinanceContextType {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  recurring: RecurringTransaction[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  isLoading: boolean;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  totalBalance: number;
  filteredTransactions: Transaction[];
  // CRUD Transaksi
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // CRUD Dompet
  addWallet: (wallet: Omit<Wallet, 'id' | 'userId' | 'createdAt' | 'currentBalance'>) => Promise<void>;
  updateWallet: (wallet: Wallet) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  // CRUD Kategori
  addCategory: (category: Omit<Category, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // CRUD Anggaran
  saveBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  // CRUD Transaksi Berulang
  addRecurring: (rec: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateRecurring: (rec: RecurringTransaction) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  triggerRecurringNow: (rec: RecurringTransaction) => Promise<void>;
  // Import/Export helper
  importTransactionsBatch: (newTxs: Omit<Transaction, 'id' | 'userId' | 'createdAt'>[]) => Promise<number>;
  resetToSampleData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();

  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [rawWallets, setRawWallets] = useState<Wallet[]>([]);
  const [rawCategories, setRawCategories] = useState<Category[]>([]);
  const [rawBudgets, setRawBudgets] = useState<Budget[]>([]);
  const [rawRecurring, setRawRecurring] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    month: getCurrentMonthStr(),
    type: 'all',
    categoryId: 'all',
    walletId: 'all',
  });

  // Load / Sync Data
  useEffect(() => {
    if (!user) {
      setRawTransactions([]);
      setRawWallets([]);
      setRawCategories([]);
      setRawBudgets([]);
      setRawRecurring([]);
      setIsLoading(false);
      return;
    }

    if (isDemoMode) {
      // Load demo data from localStorage or seed
      const storageKey = `dompetku_demo_data_${user.uid}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRawTransactions(parsed.transactions || []);
          setRawWallets(parsed.wallets || []);
          setRawCategories(parsed.categories || []);
          setRawBudgets(parsed.budgets || []);
          setRawRecurring(parsed.recurring || []);
        } catch {
          seedLocalDemo();
        }
      } else {
        seedLocalDemo();
      }
      setIsLoading(false);
      return;
    }

    // Live Firebase Cloud Firestore listeners
    setIsLoading(true);
    const userId = user.uid;

    // 1. Wallets Listener
    const qWallets = query(collection(db, 'wallets'), where('userId', '==', userId));
    const unsubWallets = onSnapshot(
      qWallets,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => doc.data() as Wallet);
        setRawWallets(items);
        // If user has zero wallets, seed default data
        if (snapshot.empty) {
          seedFirebaseNewUser(userId);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'wallets');
      }
    );

    // 2. Categories Listener
    const qCategories = query(collection(db, 'categories'), where('userId', '==', userId));
    const unsubCategories = onSnapshot(
      qCategories,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => doc.data() as Category);
        setRawCategories(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'categories');
      }
    );

    // 3. Transactions Listener
    const qTransactions = query(collection(db, 'transactions'), where('userId', '==', userId));
    const unsubTransactions = onSnapshot(
      qTransactions,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => doc.data() as Transaction);
        // sort by date descending
        items.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''));
        setRawTransactions(items);
        setIsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'transactions');
      }
    );

    // 4. Budgets Listener
    const qBudgets = query(collection(db, 'budgets'), where('userId', '==', userId));
    const unsubBudgets = onSnapshot(
      qBudgets,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => doc.data() as Budget);
        setRawBudgets(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'budgets');
      }
    );

    // 5. Recurring Listener
    const qRecurring = query(collection(db, 'recurring'), where('userId', '==', userId));
    const unsubRecurring = onSnapshot(
      qRecurring,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => doc.data() as RecurringTransaction);
        setRawRecurring(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'recurring');
      }
    );

    return () => {
      unsubWallets();
      unsubCategories();
      unsubTransactions();
      unsubBudgets();
      unsubRecurring();
    };
  }, [user, isDemoMode]);

  // Seed local demo helper
  const seedLocalDemo = () => {
    if (!user) return;
    const { categories, wallets, sampleTransactions } = generateSeedData(user.uid);
    setRawCategories(categories);
    setRawWallets(wallets);
    setRawTransactions(sampleTransactions);
    setRawBudgets([
      {
        id: 'bg_1',
        userId: user.uid,
        categoryId: categories.find(c => c.name === 'Makanan & Minuman')?.id || '',
        month: getCurrentMonthStr(),
        limitAmount: 2000000,
        alertThreshold: 80,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'bg_2',
        userId: user.uid,
        categoryId: categories.find(c => c.name === 'Hiburan & Hobi')?.id || '',
        month: getCurrentMonthStr(),
        limitAmount: 500000,
        alertThreshold: 80,
        createdAt: new Date().toISOString(),
      }
    ]);
    setRawRecurring([
      {
        id: 'rec_1',
        userId: user.uid,
        walletId: wallets[1]?.id || 'wallet_2',
        type: 'expense',
        amount: 1500000,
        categoryId: categories.find(c => c.name === 'Tempat Tinggal / Kos')?.id || '',
        categoryName: 'Tempat Tinggal / Kos',
        frequency: 'monthly',
        startDate: `${getCurrentMonthStr()}-01`,
        note: 'Sewa Kos Bulanan',
        active: true,
        createdAt: new Date().toISOString(),
      }
    ]);
  };

  // Seed Cloud Firestore helper for newly logged in Firebase user
  const seedFirebaseNewUser = async (userId: string) => {
    try {
      const { categories, wallets, sampleTransactions } = generateSeedData(userId);
      const batch = writeBatch(db);

      categories.forEach((cat) => {
        const ref = doc(db, 'categories', cat.id);
        batch.set(ref, cat);
      });

      wallets.forEach((w) => {
        const ref = doc(db, 'wallets', w.id);
        batch.set(ref, w);
      });

      sampleTransactions.forEach((tx) => {
        const ref = doc(db, 'transactions', tx.id);
        batch.set(ref, tx);
      });

      // Default budget for Food
      const foodCat = categories.find(c => c.name === 'Makanan & Minuman');
      if (foodCat) {
        const bId = `budget_default_${Date.now()}`;
        batch.set(doc(db, 'budgets', bId), {
          id: bId,
          userId,
          categoryId: foodCat.id,
          month: getCurrentMonthStr(),
          limitAmount: 2500000,
          alertThreshold: 80,
          createdAt: new Date().toISOString(),
        });
      }

      await batch.commit();
    } catch (error) {
      console.warn('Initial seed error:', error);
    }
  };

  // Sync demo mode to localStorage whenever changes happen
  useEffect(() => {
    if (isDemoMode && user) {
      const storageKey = `dompetku_demo_data_${user.uid}`;
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          transactions: rawTransactions,
          wallets: rawWallets,
          categories: rawCategories,
          budgets: rawBudgets,
          recurring: rawRecurring,
        })
      );
    }
  }, [isDemoMode, user, rawTransactions, rawWallets, rawCategories, rawBudgets, rawRecurring]);

  // Compute live wallet balances dynamically
  const computedWallets = useMemo(() => {
    return rawWallets.map((wallet) => {
      let balance = Number(wallet.initialBalance) || 0;
      rawTransactions.forEach((tx) => {
        const amount = Number(tx.amount) || 0;
        if (tx.type === 'income' && tx.walletId === wallet.id) {
          balance += amount;
        } else if (tx.type === 'expense' && tx.walletId === wallet.id) {
          balance -= amount;
        } else if (tx.type === 'transfer') {
          if (tx.walletId === wallet.id) {
            balance -= amount; // sent from this wallet
          }
          if (tx.toWalletId === wallet.id) {
            balance += amount; // received in this wallet
          }
        }
      });
      return {
        ...wallet,
        currentBalance: balance,
      };
    });
  }, [rawWallets, rawTransactions]);

  // Filtered transactions for view / tables
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter((tx) => {
      // Month filter
      if (filters.month !== 'all') {
        if (!tx.date.startsWith(filters.month)) return false;
      }
      // Type filter
      if (filters.type !== 'all' && tx.type !== filters.type) return false;
      // Category filter
      if (filters.categoryId !== 'all' && tx.categoryId !== filters.categoryId) return false;
      // Wallet filter
      if (filters.walletId !== 'all') {
        if (tx.walletId !== filters.walletId && tx.toWalletId !== filters.walletId) return false;
      }
      // Search filter
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const noteMatch = (tx.note || '').toLowerCase().includes(q);
        const catMatch = (tx.categoryName || '').toLowerCase().includes(q);
        const amountMatch = String(tx.amount).includes(q);
        if (!noteMatch && !catMatch && !amountMatch) return false;
      }
      return true;
    });
  }, [rawTransactions, filters]);

  // Summary totals for selected month (or all)
  const { totalIncome, totalExpense, netSavings } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') inc += Number(tx.amount) || 0;
      if (tx.type === 'expense') exp += Number(tx.amount) || 0;
    });
    return {
      totalIncome: inc,
      totalExpense: exp,
      netSavings: inc - exp,
    };
  }, [filteredTransactions]);

  // Total balance across all wallets
  const totalBalance = useMemo(() => {
    return computedWallets.reduce((acc, w) => acc + (w.currentBalance || 0), 0);
  }, [computedWallets]);

  // === Transaction CRUD ===
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('Pengguna belum masuk');
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTx: Transaction = {
      ...txData,
      id,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setRawTransactions((prev) => [newTx, ...prev]);
      return;
    }

    try {
      await setDoc(doc(db, 'transactions', id), newTx);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `transactions/${id}`);
    }
  };

  const updateTransaction = async (tx: Transaction) => {
    if (!user) throw new Error('Pengguna belum masuk');
    const updated: Transaction = {
      ...tx,
      updatedAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setRawTransactions((prev) => prev.map((t) => (t.id === tx.id ? updated : t)));
      return;
    }

    try {
      await setDoc(doc(db, 'transactions', tx.id), updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `transactions/${tx.id}`);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error('Pengguna belum masuk');

    if (isDemoMode) {
      setRawTransactions((prev) => prev.filter((t) => t.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  // === Wallet CRUD ===
  const addWallet = async (walletData: Omit<Wallet, 'id' | 'userId' | 'createdAt' | 'currentBalance'>) => {
    if (!user) throw new Error('Pengguna belum masuk');
    const id = `wallet_${Date.now()}`;
    const newWallet: Wallet = {
      ...walletData,
      id,
      userId: user.uid,
      currentBalance: walletData.initialBalance,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setRawWallets((prev) => [...prev, newWallet]);
      return;
    }

    try {
      await setDoc(doc(db, 'wallets', id), newWallet);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `wallets/${id}`);
    }
  };

  const updateWallet = async (wallet: Wallet) => {
    if (!user) throw new Error('Pengguna belum masuk');
    const updated: Wallet = {
      ...wallet,
      updatedAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setRawWallets((prev) => prev.map((w) => (w.id === wallet.id ? updated : w)));
      return;
    }

    try {
      await setDoc(doc(db, 'wallets', wallet.id), updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `wallets/${wallet.id}`);
    }
  };

  const deleteWallet = async (id: string) => {
    if (!user) throw new Error('Pengguna belum masuk');
    if (rawWallets.length <= 1) {
      throw new Error('Minimal harus memiliki satu dompet aktif');
    }

    if (isDemoMode) {
      setRawWallets((prev) => prev.filter((w) => w.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'wallets', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `wallets/${id}`);
    }
  };

  // === Category CRUD ===
  const addCategory = async (catData: Omit<Category, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('Pengguna belum masuk');
    const id = `cat_${Date.now()}`;
    const newCat: Category = {
      ...catData,
      id,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setRawCategories((prev) => [...prev, newCat]);
      return;
    }

    try {
      await setDoc(doc(db, 'categories', id), newCat);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `categories/${id}`);
    }
  };

  const updateCategory = async (category: Category) => {
    if (!user) throw new Error('Pengguna belum masuk');
    if (isDemoMode) {
      setRawCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));
      return;
    }

    try {
      await setDoc(doc(db, 'categories', category.id), category);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${category.id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) throw new Error('Pengguna belum masuk');
    if (isDemoMode) {
      setRawCategories((prev) => prev.filter((c) => c.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
    }
  };

  // === Budget CRUD ===
  const saveBudget = async (budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('Pengguna belum masuk');
    // Check if budget for category and month already exists
    const existing = rawBudgets.find(
      (b) => b.categoryId === budgetData.categoryId && b.month === budgetData.month
    );
    const id = existing ? existing.id : `bg_${Date.now()}`;
    const budgetObj: Budget = {
      ...budgetData,
      id,
      userId: user.uid,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
    };

    if (isDemoMode) {
      setRawBudgets((prev) => {
        const filtered = prev.filter((b) => b.id !== id);
        return [...filtered, budgetObj];
      });
      return;
    }

    try {
      await setDoc(doc(db, 'budgets', id), budgetObj);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `budgets/${id}`);
    }
  };

  const deleteBudget = async (id: string) => {
    if (!user) throw new Error('Pengguna belum masuk');
    if (isDemoMode) {
      setRawBudgets((prev) => prev.filter((b) => b.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'budgets', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `budgets/${id}`);
    }
  };

  // === Recurring CRUD ===
  const addRecurring = async (recData: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('Pengguna belum masuk');
    const id = `rec_${Date.now()}`;
    const item: RecurringTransaction = {
      ...recData,
      id,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    if (isDemoMode) {
      setRawRecurring((prev) => [...prev, item]);
      return;
    }

    try {
      await setDoc(doc(db, 'recurring', id), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `recurring/${id}`);
    }
  };

  const updateRecurring = async (rec: RecurringTransaction) => {
    if (!user) throw new Error('Pengguna belum masuk');
    if (isDemoMode) {
      setRawRecurring((prev) => prev.map((r) => (r.id === rec.id ? rec : r)));
      return;
    }

    try {
      await setDoc(doc(db, 'recurring', rec.id), rec);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `recurring/${rec.id}`);
    }
  };

  const deleteRecurring = async (id: string) => {
    if (!user) throw new Error('Pengguna belum masuk');
    if (isDemoMode) {
      setRawRecurring((prev) => prev.filter((r) => r.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'recurring', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `recurring/${id}`);
    }
  };

  const triggerRecurringNow = async (rec: RecurringTransaction) => {
    const today = getCurrentDateStr();
    await addTransaction({
      walletId: rec.walletId,
      type: rec.type,
      amount: rec.amount,
      categoryId: rec.categoryId,
      categoryName: rec.categoryName,
      date: today,
      note: `[Otomatis] ${rec.note}`,
      isRecurring: true,
      recurringId: rec.id,
    });

    await updateRecurring({
      ...rec,
      lastProcessedDate: today,
    });
  };

  // Import batch of transactions
  const importTransactionsBatch = async (newTxs: Omit<Transaction, 'id' | 'userId' | 'createdAt'>[]) => {
    if (!user) throw new Error('Pengguna belum masuk');
    if (isDemoMode) {
      const createdItems: Transaction[] = newTxs.map((t, idx) => ({
        ...t,
        id: `tx_imp_${Date.now()}_${idx}`,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      }));
      setRawTransactions((prev) => [...createdItems, ...prev]);
      return createdItems.length;
    }

    const batch = writeBatch(db);
    newTxs.forEach((t, idx) => {
      const id = `tx_imp_${Date.now()}_${idx}`;
      const item: Transaction = {
        ...t,
        id,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };
      batch.set(doc(db, 'transactions', id), item);
    });

    await batch.commit();
    return newTxs.length;
  };

  const resetToSampleData = async () => {
    if (!user) return;
    if (isDemoMode) {
      seedLocalDemo();
      return;
    }
    await seedFirebaseNewUser(user.uid);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions: rawTransactions,
        wallets: computedWallets,
        categories: rawCategories,
        budgets: rawBudgets,
        recurring: rawRecurring,
        filters,
        setFilters,
        isLoading,
        totalIncome,
        totalExpense,
        netSavings,
        totalBalance,
        filteredTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addWallet,
        updateWallet,
        deleteWallet,
        addCategory,
        updateCategory,
        deleteCategory,
        saveBudget,
        deleteBudget,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        triggerRecurringNow,
        importTransactionsBatch,
        resetToSampleData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
