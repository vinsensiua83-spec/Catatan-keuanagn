import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { RecurringTransaction, RecurringFrequency } from '../types';
import { formatIDR, getCurrentDateStr } from '../utils/formatters';
import { renderCategoryIcon } from '../utils/icons';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit2,
  X,
  Calendar,
  CheckCircle,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const RecurringManager: React.FC = () => {
  const {
    recurring,
    wallets,
    categories,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    triggerRecurringNow,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<RecurringTransaction | null>(null);

  // Form states
  const [note, setNote] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(getCurrentDateStr());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const openAddModal = () => {
    setItemToEdit(null);
    setNote('');
    setType('expense');
    setAmountStr('');
    setWalletId(wallets[0]?.id || '');
    const firstCat = categories.find((c) => c.type === 'expense');
    setCategoryId(firstCat?.id || '');
    setFrequency('monthly');
    setStartDate(getCurrentDateStr());
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (rec: RecurringTransaction) => {
    setItemToEdit(rec);
    setNote(rec.note);
    setType(rec.type);
    setAmountStr(String(rec.amount));
    setWalletId(rec.walletId);
    setCategoryId(rec.categoryId);
    setFrequency(rec.frequency);
    setStartDate(rec.startDate);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr.replace(/[^0-9]/g, '')) || 0;
    if (amount <= 0) {
      setErrorMsg('Nominal harus lebih dari 0');
      return;
    }
    if (!walletId) {
      setErrorMsg('Pilih dompet pembayaran');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Pilih kategori');
      return;
    }
    if (!note.trim()) {
      setErrorMsg('Tulis nama atau catatan pengeluaran rutin');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);
      const categoryName = selectedCategory?.name || 'Lain-lain';

      if (itemToEdit) {
        await updateRecurring({
          ...itemToEdit,
          note: note.trim(),
          type,
          amount,
          walletId,
          categoryId,
          categoryName,
          frequency,
          startDate,
        });
      } else {
        await addRecurring({
          note: note.trim(),
          type,
          amount,
          walletId,
          categoryId,
          categoryName,
          frequency,
          startDate,
          active: true,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan transaksi rutin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTriggerNow = async (rec: RecurringTransaction) => {
    try {
      await triggerRecurringNow(rec);
      setActionSuccessMsg(`Transaksi "${rec.note}" berhasil dicatat ke pembukuan!`);
      confetti({ particleCount: 30, spread: 50 });
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (rec: RecurringTransaction) => {
    await updateRecurring({
      ...rec,
      active: !rec.active,
    });
  };

  const getFreqLabel = (f: RecurringFrequency) => {
    switch (f) {
      case 'daily':
        return 'Harian';
      case 'weekly':
        return 'Mingguan';
      case 'monthly':
        return 'Bulanan';
      case 'yearly':
        return 'Tahunan';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Transaksi Rutin & Berulang
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Otomatisasi pencatatan biaya rutin seperti sewa kos, langganan internet/streaming, atau gaji
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-xl shadow-md shadow-teal-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Jadwalkan Rutin
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {actionSuccessMsg}
        </div>
      )}

      {/* List of Recurring Rules */}
      {recurring.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurring.map((rec) => {
            const cat = categories.find((c) => c.id === rec.categoryId);
            const wal = wallets.find((w) => w.id === rec.walletId);
            const isIncome = rec.type === 'income';

            return (
              <div
                key={rec.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4.5 shadow-xs transition-all relative ${
                  rec.active
                    ? 'border-slate-200/80 dark:border-slate-800'
                    : 'border-dashed border-slate-300 dark:border-slate-700 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                      style={{ backgroundColor: cat?.color || '#14b8a6' }}
                    >
                      {renderCategoryIcon(cat?.icon, 'w-5 h-5')}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {rec.note}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {rec.categoryName}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      rec.active
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rec.active ? 'Aktif' : 'Dijeda'}
                  </span>
                </div>

                <div className="my-3.5 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Nominal Berulang
                    </span>
                    <p
                      className={`text-lg font-extrabold ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? `+${formatIDR(rec.amount)}` : `-${formatIDR(rec.amount)}`}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Frekuensi
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Setiap {getFreqLabel(rec.frequency)}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Terakhir: {rec.lastProcessedDate || 'Belum dijalankan'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTriggerNow(rec)}
                      className="px-2.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 rounded-lg flex items-center gap-1 transition-colors"
                      title="Catat Sekarang"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Jalankan
                    </button>
                    <button
                      onClick={() => toggleActive(rec)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                      title={rec.active ? 'Jeda Jadwal' : 'Aktifkan'}
                    >
                      {rec.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => openEditModal(rec)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteRecurring(rec.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-10 text-center shadow-xs">
          <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950/60 rounded-2xl flex items-center justify-center mx-auto mb-3 text-teal-600 dark:text-teal-400">
            <Repeat className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
            Belum ada jadwal transaksi berulang
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Daftarkan tagihan rutin seperti langganan bulanan, sewa tempat, cicilan, atau gaji agar tidak lupa dicatat.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            Buat Jadwal Rutin
          </button>
        </div>
      )}

      {/* Modal Add/Edit Recurring */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {itemToEdit ? 'Ubah Transaksi Rutin' : 'Jadwalkan Transaksi Rutin'}
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
                  Nama Tagihan / Transaksi Rutin
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sewa Kos, Spotify, Gaji Pokok"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    type === 'expense'
                      ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600'
                  }`}
                >
                  Pengeluaran Rutin
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    type === 'income'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600'
                  }`}
                >
                  Pemasukan Rutin
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                />
                {amountStr && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mt-1">
                    {formatIDR(parseFloat(amountStr) || 0)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Frekuensi Pengulangan
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="daily">Setiap Hari</option>
                    <option value="weekly">Setiap Minggu</option>
                    <option value="monthly">Setiap Bulan</option>
                    <option value="yearly">Setiap Tahun</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  {categories
                    .filter((c) => c.type === type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
