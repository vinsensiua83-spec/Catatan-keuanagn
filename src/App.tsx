import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { BudgetingView } from './components/BudgetingView';
import { MonthlyHistory } from './components/MonthlyHistory';
import { CategoryManager } from './components/CategoryManager';
import { RecurringManager } from './components/RecurringManager';
import { TransactionModal } from './components/TransactionModal';
import { ExportImportModal } from './components/ExportImportModal';
import { Transaction } from './types';
import {
  Wallet,
  LogIn,
  CheckCircle,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Plus,
  Sparkles,
} from 'lucide-react';

function MainApp() {
  const { user, loading, isDemoMode, signInWithGoogle, enableDemoMode } = useAuth();
  const { isLoading: isFinanceLoading } = useFinance();

  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'transactions' | 'history' | 'budgets' | 'categories' | 'recurring'
  >('dashboard');

  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);

  // Dark mode setup
  const [isDark, setIsDark] = useState(() => {
    return (
      localStorage.getItem('dompetku_theme') === 'dark' ||
      (!('dompetku_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dompetku_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dompetku_theme', 'light');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark(!isDark);

  const handleEditTransaction = (tx: Transaction) => {
    setTxToEdit(tx);
    setIsAddTxModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setTxToEdit(null);
    setIsAddTxModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">Memuat data DompetKu...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and hasn't started demo mode, show onboarding screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
        {/* Simple top bar */}
        <header className="px-6 py-5 max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 dark:text-white">
              DompetKu
            </span>
          </div>

          <button
            onClick={toggleDark}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </header>

        {/* Hero Section */}
        <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Aplikasi Pencatatan Keuangan Modern & Database Real-time
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Kelola Pemasukan & Pengeluaran Anda Tanpa Ribet
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Catat setiap transaksi, pantau arus kas bulanan, atur batas anggaran (budgeting), pisahkan multi-dompet rekening, dan ekspor laporan keuangan dengan mudah.
          </p>

          {/* Action CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => signInWithGoogle()}
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5"
            >
              <LogIn className="w-4 h-4" />
              Masuk dengan Akun Google
            </button>
            <button
              onClick={enableDemoMode}
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              Coba Langsung (Mode Demo)
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                CRUD Transaksi & Kategori
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Catat pemasukan dan pengeluaran harian, kustomisasi kategori, serta filter berdasarkan tanggal & kata kunci.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Grafik & Anggaran Bulanan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Visualisasi diagram lingkaran alokasi pengeluaran, tren arus kas 6 bulan, dan peringatan limit anggaran.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Histori Bulanan & Cloud Firestore
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Rekap lengkap perbandingan bulan ke bulan, alokasi pengeluaran, dan penyimpanan database cloud yang aman.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 dark:border-slate-850">
          DompetKu • Aplikasi Catatan Keuangan Pribadi
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white flex flex-col pb-20 sm:pb-10">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddModal={handleOpenAddModal}
        isDark={isDark}
        onToggleDark={toggleDark}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {currentTab === 'dashboard' && (
          <Dashboard
            onOpenAddModal={handleOpenAddModal}
            onNavigateTab={setCurrentTab}
            onEditTransaction={handleEditTransaction}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionList
            onOpenAddModal={handleOpenAddModal}
            onEditTransaction={handleEditTransaction}
            onOpenExportImport={() => setIsExportImportOpen(true)}
          />
        )}

        {currentTab === 'history' && (
          <MonthlyHistory
            onEditTransaction={handleEditTransaction}
            onOpenAddModal={handleOpenAddModal}
          />
        )}

        {currentTab === 'budgets' && <BudgetingView />}

        {currentTab === 'categories' && <CategoryManager />}

        {currentTab === 'recurring' && <RecurringManager />}
      </main>

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => {
          setIsAddTxModalOpen(false);
          setTxToEdit(null);
        }}
        transactionToEdit={txToEdit}
      />

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
      />

      {/* Mobile Floating Action Button */}
      <div className="sm:hidden fixed bottom-5 right-5 z-40">
        <button
          onClick={handleOpenAddModal}
          className="w-14 h-14 rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-600/50 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Tambah Transaksi"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainApp />
      </FinanceProvider>
    </AuthProvider>
  );
}
