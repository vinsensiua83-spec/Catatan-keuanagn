import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { formatIDR, formatDateID, getCurrentMonthStr, formatMonthYear, ID_MONTHS } from '../utils/formatters';
import { renderCategoryIcon } from '../utils/icons';
import { AnalyticsCharts } from './AnalyticsCharts';
import { Transaction } from '../types';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertTriangle,
  ChevronRight,
  CalendarDays,
  Receipt,
} from 'lucide-react';

interface DashboardProps {
  onOpenAddModal: () => void;
  onNavigateTab: (tab: 'dashboard' | 'transactions' | 'history' | 'budgets' | 'categories' | 'recurring') => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenAddModal,
  onNavigateTab,
  onEditTransaction,
}) => {
  const { user, isDemoMode } = useAuth();
  const {
    transactions,
    budgets,
    categories,
    totalIncome,
    totalExpense,
    netSavings,
    filters,
  } = useFinance();

  const activeMonth = filters.month === 'all' ? getCurrentMonthStr() : filters.month;
  const currentMonthBudgets = budgets.filter((b) => b.month === activeMonth);

  // Calculate budget alerts for current month
  const budgetAlerts = React.useMemo(() => {
    const alerts: { categoryName: string; spent: number; limit: number; percent: number }[] = [];
    currentMonthBudgets.forEach((b) => {
      const cat = categories.find((c) => c.id === b.categoryId);
      const spent = transactions
        .filter((t) => t.type === 'expense' && t.date.startsWith(activeMonth) && t.categoryId === b.categoryId)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const percent = (spent / (b.limitAmount || 1)) * 100;
      if (percent >= (b.alertThreshold || 80)) {
        alerts.push({
          categoryName: cat?.name || 'Kategori',
          spent,
          limit: b.limitAmount,
          percent,
        });
      }
    });
    return alerts;
  }, [currentMonthBudgets, categories, transactions, activeMonth]);

  // Mini summary of last 4 months for quick history snippet
  const recentMonthsSummary = React.useMemo(() => {
    const list: { key: string; label: string; income: number; expense: number; net: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const label = `${ID_MONTHS[d.getMonth()].slice(0, 3)} ${y}`;

      let inc = 0;
      let exp = 0;
      transactions.forEach((tx) => {
        if (tx.date.startsWith(key)) {
          if (tx.type === 'income') inc += Number(tx.amount) || 0;
          if (tx.type === 'expense') exp += Number(tx.amount) || 0;
        }
      });

      list.push({ key, label, income: inc, expense: exp, net: inc - exp });
    }
    return list;
  }, [transactions]);

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);
  const currentMonthTxCount = transactions.filter((t) => t.date.startsWith(activeMonth)).length;

  return (
    <div className="space-y-6">
      {/* Welcome / Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-bold uppercase tracking-wider">
                {formatMonthYear(activeMonth)}
              </span>
              {isDemoMode && (
                <span className="px-2.5 py-0.5 bg-amber-400 text-amber-950 rounded-full text-[11px] font-bold">
                  Mode Demo
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Halo, {user?.displayName || 'Pengguna'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
              Catatan keuangan Anda tersinkronisasi aman. Pantau arus pemasukan dan pengeluaran setiap bulan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateTab('history')}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white active:scale-95 font-bold text-xs sm:text-sm rounded-2xl backdrop-blur-md transition-all flex items-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              Histori Bulanan
            </button>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              Catat Transaksi
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards (No Bank, No Saldo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pemasukan Bulan Ini */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pemasukan Bulan Ini
            </span>
            <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            +{formatIDR(totalIncome)}
          </p>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            <span>Total dana masuk</span>
          </div>
        </div>

        {/* Total Pengeluaran Bulan Ini */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pengeluaran Bulan Ini
            </span>
            <span className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl">
              <TrendingDown className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            -{formatIDR(totalExpense)}
          </p>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            <span>Total biaya & konsumsi</span>
          </div>
        </div>

        {/* Selisih Arus Kas Bersih */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Selisih Bersih
            </span>
            <span className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
              <PiggyBank className="w-5 h-5" />
            </span>
          </div>
          <p
            className={`text-xl sm:text-2xl font-black mt-2 ${
              netSavings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {formatIDR(netSavings)}
          </p>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1">
            <span>{netSavings >= 0 ? 'Pemasukan > Pengeluaran' : 'Pengeluaran > Pemasukan'}</span>
          </div>
        </div>

        {/* Total Catatan Transaksi */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Catatan Bulan Ini
            </span>
            <span className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl">
              <Receipt className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
            {currentMonthTxCount} <span className="text-sm font-semibold text-slate-400">Transaksi</span>
          </p>
          <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Total: {transactions.length} riwayat</span>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Lihat
            </button>
          </div>
        </div>
      </div>

      {/* Budget warning bar if applicable */}
      {budgetAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Peringatan Anggaran: Kategori {budgetAlerts[0].categoryName} sudah terpakai {budgetAlerts[0].percent.toFixed(0)}%!
              </p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Pengeluaran {formatIDR(budgetAlerts[0].spent)} dari batas kuota {formatIDR(budgetAlerts[0].limit)}.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('budgets')}
            className="text-xs font-bold text-amber-900 dark:text-amber-200 underline hover:opacity-80 shrink-0"
          >
            Lihat Anggaran
          </button>
        </div>
      )}

      {/* Histori Bulanan Quick Snapshot */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            Histori & Rekap Bulanan
          </h3>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            Buka Histori Lengkap <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {recentMonthsSummary.map((m) => (
            <button
              key={m.key}
              onClick={() => onNavigateTab('history')}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-left transition-all"
            >
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {m.label}
              </span>
              <div className="mt-1.5 space-y-0.5 text-[11px]">
                <p className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                  +{formatIDR(m.income)}
                </p>
                <p className="text-rose-600 dark:text-rose-400 font-semibold truncate">
                  -{formatIDR(m.expense)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Charts Section */}
      <AnalyticsCharts />

      {/* Recent Transactions & Quick Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Transaksi Terbaru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Catatan pemasukan & pengeluaran yang baru saja ditambahkan
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            Semua Transaksi <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  onClick={() => onEditTransaction(tx)}
                  className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                      style={{
                        backgroundColor: cat?.color || (isIncome ? '#10b981' : '#f97316'),
                      }}
                    >
                      {renderCategoryIcon(cat?.icon, 'w-4 h-4')}
                    </span>
                    <div className="truncate">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {tx.categoryName || 'Transaksi'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDateID(tx.date)} {tx.note ? `• "${tx.note}"` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs sm:text-sm font-extrabold ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? `+${formatIDR(tx.amount)}` : `-${formatIDR(tx.amount)}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Belum ada transaksi. Klik "Catat Transaksi" untuk menambahkan catatan pertama.
          </div>
        )}
      </div>
    </div>
  );
};
