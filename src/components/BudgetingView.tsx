import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Budget } from '../types';
import { formatIDR, ID_MONTHS, getCurrentMonthStr } from '../utils/formatters';
import { renderCategoryIcon } from '../utils/icons';
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

export const BudgetingView: React.FC = () => {
  const { budgets, categories, transactions, saveBudget, deleteBudget } = useFinance();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthStr());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);

  // Form states
  const [catId, setCatId] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Expense categories
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Filter budgets for selected month
  const activeBudgets = useMemo(() => {
    return budgets.filter((b) => b.month === selectedMonth);
  }, [budgets, selectedMonth]);

  // Compute spent amount per category in the selected month
  const budgetStats = useMemo(() => {
    const spentMap: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.date.startsWith(selectedMonth) && tx.categoryId) {
        spentMap[tx.categoryId] = (spentMap[tx.categoryId] || 0) + (Number(tx.amount) || 0);
      }
    });

    let totalBudgeted = 0;
    let totalSpentInBudgets = 0;

    const items = activeBudgets.map((b) => {
      const category = categories.find((c) => c.id === b.categoryId);
      const spent = spentMap[b.categoryId] || 0;
      const limit = Number(b.limitAmount) || 1;
      const percentage = (spent / limit) * 100;
      const remaining = limit - spent;
      const isOver = spent > limit;
      const isNear = !isOver && percentage >= (b.alertThreshold || 80);

      totalBudgeted += limit;
      totalSpentInBudgets += spent;

      return {
        budget: b,
        category,
        spent,
        limit,
        percentage,
        remaining,
        isOver,
        isNear,
      };
    });

    return {
      items,
      totalBudgeted,
      totalSpentInBudgets,
      totalRemaining: totalBudgeted - totalSpentInBudgets,
    };
  }, [activeBudgets, categories, transactions, selectedMonth]);

  const openAddModal = () => {
    setBudgetToEdit(null);
    setCatId(expenseCategories[0]?.id || '');
    setLimitStr('1000000');
    setAlertThreshold(80);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setBudgetToEdit(b);
    setCatId(b.categoryId);
    setLimitStr(String(b.limitAmount));
    setAlertThreshold(b.alertThreshold || 80);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limitStr.replace(/[^0-9]/g, '')) || 0;
    if (parsedLimit <= 0) {
      setErrorMsg('Batas anggaran harus lebih dari Rp 0');
      return;
    }
    if (!catId) {
      setErrorMsg('Pilih kategori pengeluaran');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveBudget({
        categoryId: catId,
        month: selectedMonth,
        limitAmount: parsedLimit,
        alertThreshold,
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan anggaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const overBudgetCnt = budgetStats.items.filter((i) => i.isOver).length;
  const nearBudgetCnt = budgetStats.items.filter((i) => i.isNear).length;

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Manajemen Anggaran (Budgeting)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tetapkan batas maksimal pengeluaran per kategori agar keuangan tetap terkendali
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
          />

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Pasang Anggaran
          </button>
        </div>
      </div>

      {/* Alerts Bar if any over/near */}
      {(overBudgetCnt > 0 || nearBudgetCnt > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <p className="font-bold">Peringatan Pemakaian Anggaran!</p>
            <p className="mt-0.5 text-amber-800 dark:text-amber-300">
              {overBudgetCnt > 0 && `${overBudgetCnt} kategori telah melebihi batas (Overbudget)! `}
              {nearBudgetCnt > 0 && `${nearBudgetCnt} kategori mendekati batas limit bulan ini.`}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Total Alokasi Anggaran
          </span>
          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatIDR(budgetStats.totalBudgeted)}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {activeBudgets.length} Kategori Ditetapkan
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Realisasi Pengeluaran
          </span>
          <p className="text-lg sm:text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {formatIDR(budgetStats.totalSpentInBudgets)}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {budgetStats.totalBudgeted > 0
              ? `${((budgetStats.totalSpentInBudgets / budgetStats.totalBudgeted) * 100).toFixed(1)}% terpakai`
              : '0% terpakai'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Sisa Kuota Anggaran
          </span>
          <p
            className={`text-lg sm:text-xl font-extrabold mt-1 ${
              budgetStats.totalRemaining >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatIDR(budgetStats.totalRemaining)}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {budgetStats.totalRemaining >= 0 ? 'Aman terkendali' : 'Defisit Anggaran!'}
          </span>
        </div>
      </div>

      {/* Budget Category Progress Cards */}
      {budgetStats.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetStats.items.map((item) => {
            const cappedPercent = Math.min(item.percentage, 100);
            return (
              <div
                key={item.budget.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4.5 shadow-xs transition-all relative overflow-hidden ${
                  item.isOver
                    ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                    : item.isNear
                    ? 'border-amber-300 dark:border-amber-900/60'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Top: Category Title & Actions */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                      style={{ backgroundColor: item.category?.color || '#6366f1' }}
                    >
                      {renderCategoryIcon(item.category?.icon, 'w-5 h-5')}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.category?.name || 'Kategori'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Batas: {formatIDR(item.limit)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item.budget)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteBudget(item.budget.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-300">
                      Terpakai: {formatIDR(item.spent)}
                    </span>
                    <span
                      className={`font-bold ${
                        item.isOver
                          ? 'text-rose-600 dark:text-rose-400'
                          : item.isNear
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${cappedPercent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.isOver
                          ? 'bg-rose-500'
                          : item.isNear
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>
                      {item.isOver ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          Melebihi anggaran {formatIDR(Math.abs(item.remaining))}
                        </span>
                      ) : (
                        <span>Sisa kuota: {formatIDR(item.remaining)}</span>
                      )}
                    </span>
                    <span className="text-[10px]">
                      Alert pada {item.budget.alertThreshold || 80}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-10 text-center shadow-xs">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
            Belum ada anggaran untuk bulan ini
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Buat batas anggaran per kategori seperti Makanan, Belanja, atau Hiburan agar pengeluaran Anda tetap terkontrol.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Buat Anggaran Sekarang
          </button>
        </div>
      )}

      {/* Modal Add / Edit Budget */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {budgetToEdit ? 'Ubah Batas Anggaran' : 'Pasang Anggaran Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Kategori Pengeluaran
                </label>
                <select
                  value={catId}
                  onChange={(e) => setCatId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Batas Maksimal Pengeluaran (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={limitStr}
                  onChange={(e) => setLimitStr(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Contoh: 1500000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                />
                {limitStr && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                    {formatIDR(parseFloat(limitStr) || 0)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Peringatan Peringatan (% batas terpakai)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 w-12 text-right">
                    {alertThreshold}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sistem akan memberi tanda waspada jika pengeluaran telah mencapai {alertThreshold}% dari batas anggaran.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Anggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
