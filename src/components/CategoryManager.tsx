import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Category } from '../types';
import { renderCategoryIcon, AVAILABLE_ICONS, AVAILABLE_COLORS } from '../utils/icons';
import { Tags, Plus, Edit2, Trash2, X, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const CategoryManager: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, transactions } = useFinance();

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [catToEdit, setCatToEdit] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState('#f97316');
  const [icon, setIcon] = useState('Utensils');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = (defaultType: 'expense' | 'income') => {
    setCatToEdit(null);
    setName('');
    setType(defaultType);
    setColor(defaultType === 'income' ? '#10b981' : '#f97316');
    setIcon(defaultType === 'income' ? 'Briefcase' : 'ShoppingBag');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setCatToEdit(c);
    setName(c.name);
    setType(c.type);
    setColor(c.color || '#f97316');
    setIcon(c.icon || 'Tag');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama kategori tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    try {
      if (catToEdit) {
        await updateCategory({
          ...catToEdit,
          name: name.trim(),
          type,
          color,
          icon,
        });
      } else {
        await addCategory({
          name: name.trim(),
          type,
          color,
          icon,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedCategories = categories.filter((c) => c.type === activeTab);

  const getUsageCount = (catId: string) => {
    return transactions.filter((t) => t.categoryId === catId).length;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tags className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Kelola Kategori Transaksi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sesuaikan kategori pemasukan dan pengeluaran dengan ikon dan warna pilihan Anda
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'expense'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
              Pengeluaran
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'income'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              Pemasukan
            </button>
          </div>

          <button
            onClick={() => openAddModal(activeTab)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Grid of categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {displayedCategories.map((c) => {
          const usage = getUsageCount(c.id);
          return (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex items-center justify-between gap-3 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                  style={{ backgroundColor: c.color }}
                >
                  {renderCategoryIcon(c.icon, 'w-5 h-5')}
                </span>
                <div className="truncate">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {c.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {usage} transaksi tercatat
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(c)}
                  className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Ubah Kategori"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus kategori "${c.name}"?`)) {
                      deleteCategory(c.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Hapus Kategori"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {catToEdit ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
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
                  Nama Kategori
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Belanja Online, Donasi, Kripto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Tipe
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      type === 'expense'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 ring-2 ring-rose-500/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      type === 'income'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 ring-2 ring-emerald-500/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Warna Kategori
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

              {/* Icon selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Pilih Ikon
                </label>
                <div className="grid grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                        icon === ic
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {renderCategoryIcon(ic, 'w-4 h-4')}
                    </button>
                  ))}
                </div>
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
                  className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
