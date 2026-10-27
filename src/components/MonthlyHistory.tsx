import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';
import { formatIDR, formatDateID, ID_MONTHS, getCurrentMonthStr } from '../utils/formatters';
import { renderCategoryIcon } from '../utils/icons';
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Calendar,
  Receipt,
  Edit2,
  Trash2,
  Download,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface MonthlyHistoryProps {
  onEditTransaction: (tx: Transaction) => void;
  onOpenAddModal: () => void;
}

export const MonthlyHistory: React.FC<MonthlyHistoryProps> = ({
  onEditTransaction,
  onOpenAddModal,
}) => {
  const { transactions, categories, deleteTransaction } = useFinance();
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Group all transactions by month (YYYY-MM)
  const allMonthsData = useMemo(() => {
    const monthMap: Record<
      string,
      {
        monthKey: string;
        year: number;
        monthIndex: number;
        totalIncome: number;
        totalExpense: number;
        net: number;
        txCount: number;
      }
    > = {};

    // Ensure last 6 months exist even if 0 transactions
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      monthMap[key] = {
        monthKey: key,
        year: y,
        monthIndex: d.getMonth(),
        totalIncome: 0,
        totalExpense: 0,
        net: 0,
        txCount: 0,
      };
    }

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const key = tx.date.substring(0, 7); // YYYY-MM
      if (!monthMap[key]) {
        const [yStr, mStr] = key.split('-');
        const y = parseInt(yStr, 10);
        const mIdx = parseInt(mStr, 10) - 1;
        monthMap[key] = {
          monthKey: key,
          year: y,
          monthIndex: mIdx,
          totalIncome: 0,
          totalExpense: 0,
          net: 0,
          txCount: 0,
        };
      }
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        monthMap[key].totalIncome += amount;
      } else if (tx.type === 'expense') {
        monthMap[key].totalExpense += amount;
      }
      monthMap[key].txCount += 1;
    });

    // Compute net for each month
    Object.values(monthMap).forEach((m) => {
      m.net = m.totalIncome - m.totalExpense;
    });

    // Sort descending by monthKey
    return Object.values(monthMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [transactions]);

  // Current selected month details
  const currentMonthSummary = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const monthTxs = transactions.filter((t) => t.date.startsWith(selectedMonth));

    monthTxs.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') inc += amt;
      if (t.type === 'expense') exp += amt;
    });

    return {
      income: inc,
      expense: exp,
      net: inc - exp,
      count: monthTxs.length,
    };
  }, [transactions, selectedMonth]);

  // Previous month summary for comparison
  const prevMonthComparison = useMemo(() => {
    if (!selectedMonth || !selectedMonth.includes('-')) return null;
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    let prevExp = 0;
    transactions.forEach((t) => {
      if (t.date.startsWith(prevKey) && t.type === 'expense') {
        prevExp += Number(t.amount) || 0;
      }
    });

    if (prevExp === 0) return null;
    const diff = currentMonthSummary.expense - prevExp;
    const percent = ((diff) / prevExp) * 100;
    return {
      diff,
      percent,
      prevExp,
    };
  }, [selectedMonth, transactions, currentMonthSummary.expense]);

  // Category breakdown for selected month
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { id: string; name: string; amount: number; color: string; count: number; icon: string }> = {};

    transactions.forEach((tx) => {
      if (tx.date.startsWith(selectedMonth) && tx.type === 'expense') {
        const catId = tx.categoryId || 'cat_other';
        const cat = categories.find((c) => c.id === catId);
        const name = cat?.name || tx.categoryName || 'Lain-lain';
        const color = cat?.color || '#64748b';
        const icon = cat?.icon || 'Tag';
        const amt = Number(tx.amount) || 0;

        if (!map[catId]) {
          map[catId] = { id: catId, name, amount: 0, color, count: 0, icon };
        }
        map[catId].amount += amt;
        map[catId].count += 1;
      }
    });

    const total = currentMonthSummary.expense;
    return Object.values(map)
      .sort((a, b) => b.amount - a.amount)
      .map((item) => ({
        ...item,
        percentage: total > 0 ? (item.amount / total) * 100 : 0,
      }));
  }, [transactions, selectedMonth, categories, currentMonthSummary.expense]);

  // Group transactions for selected month by date (YYYY-MM-DD)
  const groupedTransactionsByDay = useMemo(() => {
    let list = transactions.filter((t) => t.date.startsWith(selectedMonth));
    if (selectedCategoryFilter !== 'all') {
      list = list.filter((t) => t.categoryId === selectedCategoryFilter);
    }

    const dayMap: Record<string, { date: string; items: Transaction[]; dayIncome: number; dayExpense: number }> = {};

    list.forEach((tx) => {
      if (!dayMap[tx.date]) {
        dayMap[tx.date] = { date: tx.date, items: [], dayIncome: 0, dayExpense: 0 };
      }
      dayMap[tx.date].items.push(tx);
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') dayMap[tx.date].dayIncome += amt;
      if (tx.type === 'expense') dayMap[tx.date].dayExpense += amt;
    });

    return Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedMonth, selectedCategoryFilter]);

  const handleMonthChange = (step: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const newDate = new Date(y, m - 1 + step, 1);
    const newMonthStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const getMonthDisplayName = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    return `${ID_MONTHS[m - 1] || ''} ${y}`;
  };

  const handleDeleteConfirm = async () => {
    if (!txToDelete) return;
    try {
      await deleteTransaction(txToDelete.id);
      setTxToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            Histori & Rekap Bulanan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Lihat riwayat perbandingan pemasukan dan pengeluaran dari bulan ke bulan secara mendalam
          </p>
        </div>

        {/* Month selector with prev/next buttons */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 px-2 py-1 outline-none text-center cursor-pointer"
          />

          <button
            onClick={() => handleMonthChange(1)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Month Timeline Tabs */}
      <div className="overflow-x-auto pb-2 flex items-center gap-2.5 no-scrollbar">
        {allMonthsData.map((m) => {
          const isSelected = m.monthKey === selectedMonth;
          return (
            <button
              key={m.monthKey}
              onClick={() => setSelectedMonth(m.monthKey)}
              className={`p-3 rounded-2xl border text-left shrink-0 min-w-[145px] transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                <span>{ID_MONTHS[m.monthIndex]?.slice(0, 3)} {m.year}</span>
                <span className="text-[10px] text-slate-400 font-normal">{m.txCount} tx</span>
              </div>
              <div className="mt-2 space-y-0.5 text-[11px]">
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                  +{formatIDR(m.totalIncome)}
                </div>
                <div className="text-rose-600 dark:text-rose-400 font-semibold truncate">
                  -{formatIDR(m.totalExpense)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Month Summary 3 Big Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pemasukan Bulan Terpilih */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pemasukan ({getMonthDisplayName(selectedMonth)})
            </span>
            <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            +{formatIDR(currentMonthSummary.income)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Total penerimaan uang masuk di bulan ini
          </p>
        </div>

        {/* Pengeluaran Bulan Terpilih */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pengeluaran ({getMonthDisplayName(selectedMonth)})
            </span>
            <span className="p-2.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl">
              <TrendingDown className="w-5 h-5" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            -{formatIDR(currentMonthSummary.expense)}
          </p>
          {prevMonthComparison ? (
            <p className="text-[11px] mt-1 font-semibold flex items-center gap-1">
              <span
                className={prevMonthComparison.diff > 0 ? 'text-rose-600' : 'text-emerald-600'}
              >
                {prevMonthComparison.diff > 0 ? '▲ Naik' : '▼ Hemat'}{' '}
                {Math.abs(prevMonthComparison.percent).toFixed(1)}%
              </span>
              <span className="text-slate-400 font-normal">vs bulan lalu</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1">Total pengeluaran tercatat</p>
          )}
        </div>

        {/* Selisih Bersih (Pemasukan - Pengeluaran) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Selisih Bersih (Arus Kas)
            </span>
            <span
              className={`p-2.5 rounded-2xl ${
                currentMonthSummary.net >= 0
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
              }`}
            >
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </div>
          <p
            className={`text-xl sm:text-2xl font-black mt-2 ${
              currentMonthSummary.net >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {formatIDR(currentMonthSummary.net)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {currentMonthSummary.net >= 0
              ? 'Arus kas positif (Surplus pemasukan)'
              : 'Defisit (Pengeluaran lebih besar dari pemasukan)'}
          </p>
        </div>
      </div>

      {/* Breakdown Pengeluaran per Kategori di Bulan Ini */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              Alokasi Pengeluaran {getMonthDisplayName(selectedMonth)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rincian pos pengeluaran berdasarkan kategori pada bulan ini
            </p>
          </div>

          {categoryBreakdown.length > 0 && (
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="all">Tampilkan Semua Kategori</option>
              {categoryBreakdown.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatIDR(c.amount)})
                </option>
              ))}
            </select>
          )}
        </div>

        {categoryBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      {renderCategoryIcon(cat.icon, 'w-4 h-4')}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {cat.name}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {cat.count} transaksi
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {formatIDR(cat.amount)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: cat.color }}
                    className="h-full rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">
            Belum ada catatan pengeluaran di bulan {getMonthDisplayName(selectedMonth)}.
          </p>
        )}
      </div>

      {/* Daily Grouped Ledger for Selected Month */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Daftar Transaksi Harian ({getMonthDisplayName(selectedMonth)})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dikelompokkan per tanggal transaksi
            </p>
          </div>

          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
          >
            + Catat Transaksi
          </button>
        </div>

        {groupedTransactionsByDay.length > 0 ? (
          <div className="space-y-4 pt-2">
            {groupedTransactionsByDay.map((group) => (
              <div
                key={group.date}
                className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs"
              >
                {/* Day Header */}
                <div className="bg-slate-50 dark:bg-slate-800/70 px-4 py-2.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDateID(group.date)}</span>
                    <span className="text-[10px] font-normal text-slate-400">
                      ({group.items.length} transaksi)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-bold text-[11px]">
                    {group.dayIncome > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        +{formatIDR(group.dayIncome)}
                      </span>
                    )}
                    {group.dayExpense > 0 && (
                      <span className="text-rose-600 dark:text-rose-400">
                        -{formatIDR(group.dayExpense)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items in that day */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {group.items.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.categoryId);
                    const isIncome = tx.type === 'income';

                    return (
                      <div
                        key={tx.id}
                        className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                            style={{ backgroundColor: cat?.color || (isIncome ? '#10b981' : '#f97316') }}
                          >
                            {renderCategoryIcon(cat?.icon, 'w-4 h-4')}
                          </span>

                          <div className="truncate">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {tx.categoryName || 'Transaksi'}
                            </p>
                            {tx.note && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 italic truncate">
                                "{tx.note}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p
                              className={`text-xs sm:text-sm font-extrabold ${
                                isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isIncome ? `+${formatIDR(tx.amount)}` : `-${formatIDR(tx.amount)}`}
                            </p>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setTxToDelete(tx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            Tidak ada transaksi di bulan {getMonthDisplayName(selectedMonth)}.
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Hapus Transaksi Ini?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Transaksi <strong className="text-slate-700 dark:text-slate-200">{txToDelete.categoryName}</strong> senilai{' '}
              <strong className="text-rose-600">{formatIDR(txToDelete.amount)}</strong> pada {formatDateID(txToDelete.date)} akan dihapus.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
