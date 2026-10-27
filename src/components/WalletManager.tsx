import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, WalletType } from '../types';
import { formatIDR, getCurrentDateStr } from '../utils/formatters';
import { renderCategoryIcon, AVAILABLE_ICONS, AVAILABLE_COLORS } from '../utils/icons';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowRightLeft,
  Edit2,
  Trash2,
  X,
  CreditCard,
  Landmark,
  Smartphone,
  Banknote,
  Check,
} from 'lucide-react';

export const WalletManager: React.FC = () => {
  const { wallets, addWallet, updateWallet, deleteWallet, addTransaction } = useFinance();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Form states for Add/Edit
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [initialBalanceStr, setInitialBalanceStr] = useState('0');
  const [color, setColor] = useState('#2563eb');
  const [icon, setIcon] = useState('Landmark');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Transfer states
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [transferAmountStr, setTransferAmountStr] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const openAddModal = () => {
    setWalletToEdit(null);
    setName('');
    setType('bank');
    setInitialBalanceStr('0');
    setColor('#2563eb');
    setIcon('Landmark');
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (w: Wallet) => {
    setWalletToEdit(w);
    setName(w.name);
    setType(w.type);
    setInitialBalanceStr(String(w.initialBalance));
    setColor(w.color || '#2563eb');
    setIcon(w.icon || 'Wallet');
    setErrorMsg('');
    setIsAddModalOpen(true);
  };

  const openTransferModal = (sourceWalletId?: string) => {
    setFromWalletId(sourceWalletId || wallets[0]?.id || '');
    const otherWallet = wallets.find((w) => w.id !== (sourceWalletId || wallets[0]?.id));
    setToWalletId(otherWallet?.id || '');
    setTransferAmountStr('');
    setTransferNote('Pindah dana antar akun');
    setErrorMsg('');
    setIsTransferModalOpen(true);
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama dompet tidak boleh kosong');
      return;
    }
    const balance = parseFloat(initialBalanceStr.replace(/[^0-9]/g, '')) || 0;

    setIsSubmitting(true);
    try {
      if (walletToEdit) {
        await updateWallet({
          ...walletToEdit,
          name: name.trim(),
          type,
          initialBalance: balance,
          color,
          icon,
        });
      } else {
        await addWallet({
          name: name.trim(),
          type,
          initialBalance: balance,
          color,
          icon,
        });
      }
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan dompet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(transferAmountStr.replace(/[^0-9]/g, '')) || 0;
    if (amount <= 0) {
      setErrorMsg('Nominal transfer harus lebih besar dari 0');
      return;
    }
    if (!fromWalletId || !toWalletId || fromWalletId === toWalletId) {
      setErrorMsg('Pilih dompet asal dan tujuan yang berbeda');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction({
        type: 'transfer',
        amount,
        walletId: fromWalletId,
        toWalletId: toWalletId,
        categoryName: 'Transfer Saldo',
        date: getCurrentDateStr(),
        note: transferNote || 'Transfer dana',
      });
      setIsTransferModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal melakukan transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeLabel = (t: WalletType) => {
    switch (t) {
      case 'cash':
        return 'Tunai (Cash)';
      case 'bank':
        return 'Rekening Bank';
      case 'ewallet':
        return 'Dompet Digital (E-Wallet)';
      default:
        return 'Lainnya';
    }
  };

  const getTypeIcon = (t: WalletType) => {
    switch (t) {
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      case 'bank':
        return <Landmark className="w-4 h-4" />;
      case 'ewallet':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Multi-Dompet & Akun Keuangan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pisahkan dan lacak saldo rekening Bank, Uang Tunai, dan E-Wallet secara terpusat
          </p>
        </div>

        <div className="flex items-center gap-2">
          {wallets.length >= 2 && (
            <button
              onClick={() => openTransferModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 rounded-xl transition-all"
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transfer Antar Akun
            </button>
          )}

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Dompet
          </button>
        </div>
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {wallets.map((w) => {
          return (
            <div
              key={w.id}
              className="relative overflow-hidden rounded-3xl p-5 text-white shadow-lg transition-transform hover:-translate-y-1"
              style={{
                background: `linear-gradient(135deg, ${w.color || '#2563eb'}, #1e293b)`,
              }}
            >
              {/* Background watermark pattern */}
              <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                <CreditCard className="w-32 h-32" />
              </div>

              {/* Card top */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                    {getTypeIcon(w.type)}
                  </span>
                  <span className="text-xs font-semibold tracking-wide uppercase opacity-90">
                    {getTypeLabel(w.type)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(w)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                    title="Ubah Dompet"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {wallets.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Hapus dompet "${w.name}"?`)) {
                          deleteWallet(w.id);
                        }
                      }}
                      className="p-1.5 bg-white/10 hover:bg-rose-500/60 rounded-lg transition-colors text-white"
                      title="Hapus Dompet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card name & Balance */}
              <div className="my-5 relative z-10">
                <h3 className="text-base font-bold tracking-tight opacity-95">{w.name}</h3>
                <p className="text-2xl sm:text-3xl font-black mt-1 tracking-tight">
                  {formatIDR(w.currentBalance || 0)}
                </p>
              </div>

              {/* Card bottom */}
              <div className="flex items-center justify-between pt-3 border-t border-white/15 relative z-10 text-xs">
                <span className="opacity-75">
                  Saldo Awal: {formatIDR(w.initialBalance || 0)}
                </span>
                <button
                  onClick={() => openTransferModal(w.id)}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg font-bold flex items-center gap-1 transition-all"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  Transfer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Wallet Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {walletToEdit ? 'Ubah Informasi Dompet' : 'Tambah Dompet / Akun Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWallet} className="space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nama Dompet / Rekening
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BCA Tabungan, Dana, Dompet Tunai"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Jenis Akun
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bank', 'ewallet', 'cash'] as WalletType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                        type === t
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {getTypeLabel(t).split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Saldo Awal (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={initialBalanceStr}
                  onChange={(e) => setInitialBalanceStr(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                />
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                  {formatIDR(parseFloat(initialBalanceStr) || 0)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Warna Kartu
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-800 dark:ring-white' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Dompet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Saldo Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                Transfer Antar Dompet
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Dari (Asal)
                  </label>
                  <select
                    value={fromWalletId}
                    onChange={(e) => setFromWalletId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Ke (Tujuan)
                  </label>
                  <select
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id} disabled={w.id === fromWalletId}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nominal Transfer (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={transferAmountStr}
                  onChange={(e) => setTransferAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                />
                {transferAmountStr && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                    {formatIDR(parseFloat(transferAmountStr) || 0)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Catatan Transfer
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Contoh: Tarik tunai, Top up e-wallet"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Memproses...' : 'Kirim Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
