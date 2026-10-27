import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types';
import { formatIDR, formatDateID, getCurrentDateStr } from '../utils/formatters';
import {
  Download,
  Upload,
  Printer,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({ isOpen, onClose }) => {
  const { filteredTransactions, transactions, wallets, categories, importTransactionsBatch } = useFinance();

  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'print'>('export');
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');

  // Import states
  const [importRows, setImportRows] = useState<Omit<Transaction, 'id' | 'userId' | 'createdAt'>[]>([]);
  const [importError, setImportError] = useState('');
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const getTxsToExport = () => {
    return exportScope === 'filtered' ? filteredTransactions : transactions;
  };

  // Export to CSV
  const handleExportCSV = () => {
    const list = getTxsToExport();
    const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Catatan'];

    const rows = list.map((tx) => {
      const cleanNote = (tx.note || '').replace(/"/g, '""');
      return [
        `"${tx.id}"`,
        `"${tx.date}"`,
        `"${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}"`,
        `"${tx.categoryName || '-'}"`,
        tx.amount,
        `"${cleanNote}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Keuangan_DompetKu_${getCurrentDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccessCount(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setImportError('File CSV kosong atau tidak memiliki baris data');
          return;
        }

        const parsed: Omit<Transaction, 'id' | 'userId' | 'createdAt'>[] = [];
        const defaultWalletId = wallets[0]?.id || 'wallet_1';
        const defaultCat = categories[0]?.id || 'cat_1';

        // Skip header if first line contains text like Tanggal/Date
        const startIdx = lines[0].toLowerCase().includes('tanggal') || lines[0].toLowerCase().includes('date') ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
          const rawLine = lines[i];
          // Simple CSV splitter handling quoted values
          const cols = rawLine.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 3) {
            // Heuristic detection:
            // Check for date pattern (YYYY-MM-DD or DD/MM/YYYY)
            let dateVal = getCurrentDateStr();
            let amountVal = 0;
            let typeVal: 'income' | 'expense' = 'expense';
            let catNameVal = 'Lain-lain';
            let noteVal = '';

            for (const col of cols) {
              if (col.match(/^\d{4}-\d{2}-\d{2}$/)) {
                dateVal = col;
              } else if (!isNaN(Number(col)) && Number(col) > 0) {
                amountVal = Number(col);
              } else if (col.toLowerCase() === 'pemasukan' || col.toLowerCase() === 'income') {
                typeVal = 'income';
              } else if (col.toLowerCase() === 'pengeluaran' || col.toLowerCase() === 'expense') {
                typeVal = 'expense';
              } else if (col.length > 1 && !noteVal) {
                noteVal = col;
              }
            }

            if (amountVal > 0) {
              parsed.push({
                date: dateVal,
                amount: amountVal,
                type: typeVal,
                walletId: defaultWalletId,
                categoryId: defaultCat,
                categoryName: noteVal || (typeVal === 'income' ? 'Pemasukan' : 'Pengeluaran'),
                note: noteVal,
              });
            }
          }
        }

        if (parsed.length === 0) {
          setImportError('Tidak dapat membaca baris transaksi yang valid dari file CSV');
        } else {
          setImportRows(parsed);
        }
      } catch (err) {
        console.error(err);
        setImportError('Gagal membaca file CSV. Pastikan format teks UTF-8 valid');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (importRows.length === 0) return;
    setIsImporting(true);
    try {
      const count = await importTransactionsBatch(importRows);
      setImportSuccessCount(count);
      setImportRows([]);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Gagal mengimpor transaksi');
    } finally {
      setIsImporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Ekspor, Cetak & Impor Data
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Download className="w-4 h-4" />
            Ekspor CSV / Excel
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'print'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Printer className="w-4 h-4" />
            Cetak / PDF
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            Impor dari CSV
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Unduh seluruh rekaman transaksi Anda ke dalam berkas format CSV yang kompatibel dengan Microsoft Excel, Google Sheets, dan Numbers.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Cakupan Data yang Diekspor:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'filtered'}
                      onChange={() => setExportScope('filtered')}
                      className="accent-emerald-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Sesuai Filter Aktif ({filteredTransactions.length} Transaksi)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Hanya mengekspor transaksi sesuai bulan, kategori, atau dompet yang sedang Anda saring
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                      className="accent-emerald-600"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Seluruh Riwayat Transaksi ({transactions.length} Transaksi)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Mengekspor seluruh data dari awal hingga saat ini
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExportCSV}
                  className="w-full py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Unduh Berkas CSV ({getTxsToExport().length} Baris)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'print' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Pratinjau laporan ringkasan transaksi siap cetak atau simpan sebagai dokumen PDF melalui dialog cetak peramban.
              </p>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Laporan Keuangan DompetKu
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Dicetak pada: {formatDateID(getCurrentDateStr())}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Jumlah Transaksi:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {filteredTransactions.length} Data
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Selisih Arus Kas Bersih:</span>
                    <p className="font-bold text-emerald-600">
                      {formatIDR(
                        filteredTransactions.reduce(
                          (acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount),
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePrint}
                className="w-full py-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Printer className="w-4 h-4" />
                Buka Dialog Cetak / Simpan PDF
              </button>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Unggah berkas CSV yang berisi baris tanggal, nominal, dan catatan untuk menambahkan transaksi secara massal.
              </p>

              {importError && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {importError}
                </div>
              )}

              {importSuccessCount !== null && (
                <div className="p-3 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Berhasil mengimpor {importSuccessCount} transaksi ke dalam akun!
                </div>
              )}

              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <label className="cursor-pointer">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                    Pilih File CSV
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  Format baris yang didukung: Tanggal (YYYY-MM-DD), Tipe, Kategori, Nominal, Keterangan
                </p>
              </div>

              {/* Preview table of imported rows */}
              {importRows.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Pratinjau ({importRows.length} transaksi siap diimpor):
                  </span>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {importRows.slice(0, 10).map((r, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {r.note || r.categoryName}
                          </p>
                          <span className="text-[10px] text-slate-400">{r.date}</span>
                        </div>
                        <span
                          className={`font-bold ${
                            r.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {r.type === 'income' ? '+' : '-'}
                          {formatIDR(r.amount)}
                        </span>
                      </div>
                    ))}
                    {importRows.length > 10 && (
                      <div className="p-2 text-center text-[11px] text-slate-400 font-medium">
                        ... dan {importRows.length - 10} transaksi lainnya
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleExecuteImport}
                    disabled={isImporting}
                    className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all"
                  >
                    {isImporting ? 'Mengimpor Data...' : `Simpan ${importRows.length} Transaksi Sekarang`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
