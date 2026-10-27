import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatIDR, ID_MONTHS } from '../utils/formatters';
import { PieChart, BarChart3, TrendingUp, TrendingDown, Layers } from 'lucide-react';

export const AnalyticsCharts: React.FC = () => {
  const { filteredTransactions, transactions, filters } = useFinance();
  const [activeTab, setActiveTab] = useState<'category' | 'trend'>('category');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Group expenses by category for current filtered transactions
  const expenseByCategory = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string; count: number }> = {};
    let total = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const catName = tx.categoryName || 'Lain-lain';
        const amount = Number(tx.amount) || 0;
        total += amount;

        if (!map[catName]) {
          map[catName] = {
            name: catName,
            amount: 0,
            color: '#64748b',
            count: 0,
          };
        }
        map[catName].amount += amount;
        map[catName].count += 1;
      }
    });

    const colors = [
      '#f97316', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6',
      '#eab308', '#ef4444', '#06b6d4', '#14b8a6', '#6366f1'
    ];

    const list = Object.values(map)
      .sort((a, b) => b.amount - a.amount)
      .map((item, idx) => ({
        ...item,
        color: colors[idx % colors.length],
        percentage: total > 0 ? (item.amount / total) * 100 : 0,
      }));

    return { list, total };
  }, [filteredTransactions]);

  // Monthly trend for the last 6 months (based on all transactions)
  const monthlyTrends = useMemo(() => {
    const monthsData: { monthKey: string; label: string; income: number; expense: number; net: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${monthNum}`;
      const label = `${ID_MONTHS[d.getMonth()].slice(0, 3)} ${year.toString().slice(-2)}`;

      let inc = 0;
      let exp = 0;
      transactions.forEach((tx) => {
        if (tx.date.startsWith(key)) {
          if (tx.type === 'income') inc += Number(tx.amount) || 0;
          if (tx.type === 'expense') exp += Number(tx.amount) || 0;
        }
      });

      monthsData.push({
        monthKey: key,
        label,
        income: inc,
        expense: exp,
        net: inc - exp,
      });
    }

    const maxVal = Math.max(...monthsData.map((m) => Math.max(m.income, m.expense)), 1000000);

    return { data: monthsData, maxVal };
  }, [transactions]);

  // Donut chart SVG path math
  const donutPaths = useMemo(() => {
    const { list, total } = expenseByCategory;
    if (total === 0 || list.length === 0) return [];

    let currentAngle = -90; // start at top
    const radius = 80;
    const innerRadius = 52;
    const cx = 100;
    const cy = 100;

    return list.map((item) => {
      const sliceAngle = (item.amount / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle += sliceAngle;

      const toRad = (deg: number) => (deg * Math.PI) / 180;
      const x1 = cx + radius * Math.cos(toRad(startAngle));
      const y1 = cy + radius * Math.sin(toRad(startAngle));
      const x2 = cx + radius * Math.cos(toRad(endAngle));
      const y2 = cy + radius * Math.sin(toRad(endAngle));

      const ix1 = cx + innerRadius * Math.cos(toRad(endAngle));
      const iy1 = cy + innerRadius * Math.sin(toRad(endAngle));
      const ix2 = cx + innerRadius * Math.cos(toRad(startAngle));
      const iy2 = cy + innerRadius * Math.sin(toRad(startAngle));

      const largeArcFlag = sliceAngle > 180 ? 1 : 0;

      const pathData = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        L ${ix1} ${iy1}
        A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}
        Z
      `;

      return {
        ...item,
        pathData,
      };
    });
  }, [expenseByCategory]);

  const activeHighlighted = expenseByCategory.list.find((c) => c.name === hoveredCategory);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Visualisasi & Analisis Arus Kas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Grafik komparasi pemasukan vs pengeluaran dan distribusi alokasi dana
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('category')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'category'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Kategori Pengeluaran
          </button>
          <button
            onClick={() => setActiveTab('trend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'trend'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Tren 6 Bulan
          </button>
        </div>
      </div>

      {activeTab === 'category' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Chart SVG */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            {expenseByCategory.total > 0 ? (
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full transform transition-all duration-300">
                  {donutPaths.map((slice) => {
                    const isHovered = hoveredCategory === slice.name;
                    return (
                      <path
                        key={slice.name}
                        d={slice.pathData}
                        fill={slice.color}
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`cursor-pointer transition-all duration-200 text-white dark:text-slate-900 ${
                          isHovered ? 'scale-105 origin-center opacity-100 filter drop-shadow-md' : 'opacity-90 hover:opacity-100'
                        }`}
                        onMouseEnter={() => setHoveredCategory(slice.name)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      />
                    );
                  })}
                </svg>

                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                  {activeHighlighted ? (
                    <>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                        {activeHighlighted.name}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {formatIDR(activeHighlighted.amount)}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full mt-1">
                        {activeHighlighted.percentage.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
                        Total Keluar
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                        {formatIDR(expenseByCategory.total)}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {expenseByCategory.list.length} Kategori
                      </span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-full">
                <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Belum ada pengeluaran di periode ini
                </p>
              </div>
            )}
          </div>

          {/* Legend and breakdown list */}
          <div className="lg:col-span-7">
            {expenseByCategory.total > 0 ? (
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {expenseByCategory.list.map((item) => {
                  const isHovered = hoveredCategory === item.name;
                  return (
                    <div
                      key={item.name}
                      onMouseEnter={() => setHoveredCategory(item.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                        isHovered
                          ? 'bg-slate-100 dark:bg-slate-800/80 translate-x-1'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            {item.count} transaksi
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {formatIDR(item.amount)}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {item.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Pencatatan pengeluaran yang Anda buat akan otomatis dikelompokkan dan ditampilkan persentasenya di sini.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Trend Arus Kas 6 Bulan Terakhir */
        <div>
          <div className="flex items-center justify-end gap-4 mb-4 text-xs font-medium text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Pemasukan
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500" /> Pengeluaran
            </span>
          </div>

          <div className="h-60 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-200 dark:border-slate-800">
            {monthlyTrends.data.map((m, idx) => {
              const incPercent = Math.max((m.income / monthlyTrends.maxVal) * 100, 4);
              const expPercent = Math.max((m.expense / monthlyTrends.maxVal) * 100, 4);
              const isHovered = hoveredBarIndex === idx;

              return (
                <div
                  key={m.monthKey}
                  className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  onMouseEnter={() => setHoveredBarIndex(idx)}
                  onMouseLeave={() => setHoveredBarIndex(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-16 z-20 bg-slate-900 text-white text-[11px] p-2 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                      <p className="font-bold text-slate-200 mb-1">{m.label}</p>
                      <p className="text-emerald-400 font-medium">Masuk: {formatIDR(m.income)}</p>
                      <p className="text-rose-400 font-medium">Keluar: {formatIDR(m.expense)}</p>
                      <p className="text-slate-300 font-semibold mt-0.5 border-t border-slate-700 pt-0.5">
                        Net: {formatIDR(m.net)}
                      </p>
                    </div>
                  )}

                  {/* Dual Bar (Income & Expense) */}
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-44">
                    <div
                      style={{ height: `${incPercent}%` }}
                      className="w-1/2 max-w-[24px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                    />
                    <div
                      style={{ height: `${expPercent}%` }}
                      className="w-1/2 max-w-[24px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                    />
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2 truncate max-w-full">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-xs">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
              <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> Pemasukan Tertinggi
              </span>
              <p className="font-bold text-slate-900 dark:text-white mt-1">
                {formatIDR(Math.max(...monthlyTrends.data.map((d) => d.income)))}
              </p>
            </div>
            <div className="bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/50">
              <span className="text-rose-700 dark:text-rose-300 flex items-center gap-1 font-medium">
                <TrendingDown className="w-3.5 h-3.5" /> Pengeluaran Tertinggi
              </span>
              <p className="font-bold text-slate-900 dark:text-white mt-1">
                {formatIDR(Math.max(...monthlyTrends.data.map((d) => d.expense)))}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                <BarChart3 className="w-3.5 h-3.5" /> Rata-rata Bulanan
              </span>
              <p className="font-bold text-slate-900 dark:text-white mt-1">
                {formatIDR(
                  monthlyTrends.data.reduce((acc, m) => acc + m.expense, 0) / (monthlyTrends.data.length || 1)
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
