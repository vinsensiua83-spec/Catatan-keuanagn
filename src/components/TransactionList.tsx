import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, FilterState } from '../types';
import { formatIDR, formatDateID, ID_MONTHS, getCurrentMonthStr } from '../utils/formatters';
import { renderCategoryIcon } from '../utils/icons';
import {
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Calendar,
  Edit2,
  Trash2,
  Download,
  Upload,
  Plus,
  Inbox,
  AlertCircle,
  X,
} from 'lucide-react';

interface TransactionListProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenExportImport: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  onOpenAddModal,
  onEditTransaction,
  onOpenExportImport,
}) => {
  const {
    filteredTransactions,
    wallets,
    categories,
    filters,
    setFilters,
    deleteTransaction,
    totalIncome,
    totalExpense,
    netSavings,
  } = useFinance();

  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Generate list of recent months for filter dropdown
  const monthOptions = React.useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${monthNum}`;
      const label = `${ID_MONTHS[d.getMonth()]} ${year}`;
      list.push({ key, label });
    }
    return list;
  }, []);

  const handleDeleteConfirm = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(txToDelete.id);
      setTxToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getWalletName = (wId: string) => {
    return wallets.find((w) => w.id === wId)?.name || 'Dompet';
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari transaksi, catatan, kategori, nominal..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className={`md:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                showFiltersMobile
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>

            <button
              onClick={onOpenExportImport}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              title="Ekspor & Impor Data"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ekspor / Impor</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns (Desktop & Mobile toggle) */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 ${
            showFiltersMobile ? 'block' : 'hidden md:grid'
          }`}
        >
          {/* Month Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Bulan
            </label>
            <select
              value={filters.month}
              onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value }))}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Semua Waktu</option>
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tipe Transaksi
            </label>
            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, type: e.target.value as FilterState['type'] }))
              }
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Semua Tipe</option>
              <option value="expense">Pengeluaran (-)</option>
              <option value="income">Pemasukan (+)</option>
            </select>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Kategori
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'income' ? 'Masuk' : 'Keluar'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter summary strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div>
            Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{filteredTransactions.length}</span> transaksi
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              +{formatIDR(totalIncome)}
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              -{formatIDR(totalExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction List Cards */}
      {filteredTransactions.length > 0 ? (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => {
            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';

            // Find matching category for icon & color
            const cat = categories.find((c) => c.id === tx.categoryId);

            return (
              <div
                key={tx.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 hover:shadow-md transition-all flex items-center justify-between gap-3 group"
              >
                {/* Left: Icon & Details */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xs"
                    style={{
                      backgroundColor: cat?.color || (isIncome ? '#10b981' : '#f97316'),
                    }}
                  >
                    {renderCategoryIcon(cat?.icon, 'w-5 h-5')}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {tx.categoryName || 'Transaksi'}
                      </h4>
                      {tx.isRecurring && (
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded-md">
                          Rutin
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{formatDateID(tx.date)}</span>
                      {tx.note && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 dark:text-slate-300 italic truncate max-w-xs">
                            "{tx.note}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="text-right">
                    <p
                      className={`text-xs sm:text-base font-extrabold tracking-tight ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? `+${formatIDR(tx.amount)}` : `-${formatIDR(tx.amount)}`}
                    </p>
                    <span className="text-[10px] font-semibold uppercase text-slate-400">
                      {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                      title="Ubah"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTxToDelete(tx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
            Tidak ada transaksi ditemukan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Coba sesuaikan filter pencarian atau buat catatan pemasukan dan pengeluaran baru.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Catat Transaksi Sekarang
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Hapus Transaksi Ini?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Transaksi <strong className="text-slate-700 dark:text-slate-200">{txToDelete.categoryName}</strong> senilai{' '}
              <strong className="text-rose-600">{formatIDR(txToDelete.amount)}</strong> pada {formatDateID(txToDelete.date)} akan dihapus permanen.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setTxToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-md"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
