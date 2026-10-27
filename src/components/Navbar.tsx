import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import {
  Wallet,
  LayoutDashboard,
  Receipt,
  Target,
  CreditCard,
  Tags,
  Repeat,
  Plus,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User,
  Sparkles,
  RefreshCw,
  CalendarDays,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'transactions' | 'history' | 'budgets' | 'categories' | 'recurring';
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'history' | 'budgets' | 'categories' | 'recurring') => void;
  onOpenAddModal: () => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddModal,
  isDark,
  onToggleDark,
}) => {
  const { user, isDemoMode, signInWithGoogle, enableDemoMode, signOut } = useAuth();
  const { resetToSampleData } = useFinance();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const navItems = [
    { id: 'dashboard' as const, label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'history' as const, label: 'Histori Bulanan', icon: CalendarDays },
    { id: 'transactions' as const, label: 'Semua Transaksi', icon: Receipt },
    { id: 'budgets' as const, label: 'Anggaran', icon: Target },
    { id: 'categories' as const, label: 'Kategori', icon: Tags },
    { id: 'recurring' as const, label: 'Rutin', icon: Repeat },
  ];

  const handleResetData = async () => {
    if (confirm('Muat ulang data contoh pemasukan dan pengeluaran?')) {
      setIsResetting(true);
      await resetToSampleData();
      setIsResetting(false);
      setShowUserDropdown(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 group text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  DompetKu
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-full">
                    Keuangan
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">
                  Catatan Pemasukan & Pengeluaran
                </span>
              </div>
            </button>

            {/* Desktop Navigation links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* Dark Mode toggle */}
            <button
              onClick={onToggleDark}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick Add Button */}
            <button
              onClick={onOpenAddModal}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>

            {/* User Profile / Auth Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                    {'photoURL' in user && user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" />
                    ) : (
                      user.displayName?.charAt(0) || <User className="w-4 h-4" />
                    )}
                  </div>
                  <span className="hidden md:inline text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                    {user.displayName?.split(' ')[0] || 'Akun'}
                  </span>
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {user.displayName || 'Pengguna'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {isDemoMode ? 'Mode Demo Lokal' : 'Tersinkron Cloud Firestore'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleResetData}
                      disabled={isResetting}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                      Muat Data Contoh Baru
                    </button>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        signOut();
                      }}
                      className="w-full px-4 py-2 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Keluar (Sign Out)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={enableDemoMode}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Mode Demo
                </button>
                <button
                  onClick={() => signInWithGoogle()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 rounded-xl shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Masuk
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Navigation Tabs */}
      <div className="lg:hidden border-t border-slate-200/80 dark:border-slate-800 px-4 py-2 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
