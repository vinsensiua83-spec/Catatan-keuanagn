import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  Home,
  Briefcase,
  Award,
  TrendingUp,
  Landmark,
  Gift,
  PlusCircle,
  MoreHorizontal,
  Wallet as WalletIcon,
  Smartphone,
  Banknote,
  CreditCard,
  Coffee,
  Plane,
  Tv,
  HelpCircle,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Tag,
  Shield,
  BookOpen,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  HeartPulse,
  GraduationCap,
  Home,
  Briefcase,
  Award,
  TrendingUp,
  Landmark,
  Gift,
  PlusCircle,
  MoreHorizontal,
  Wallet: WalletIcon,
  Smartphone,
  Banknote,
  CreditCard,
  Coffee,
  Plane,
  Tv,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Tag,
  Shield,
  BookOpen,
};

export const AVAILABLE_ICONS = [
  'Utensils',
  'Coffee',
  'Car',
  'ShoppingBag',
  'Zap',
  'Film',
  'Tv',
  'HeartPulse',
  'GraduationCap',
  'Home',
  'Briefcase',
  'Award',
  'TrendingUp',
  'Landmark',
  'Gift',
  'Wallet',
  'Smartphone',
  'Banknote',
  'CreditCard',
  'Plane',
  'MoreHorizontal',
];

export const AVAILABLE_COLORS = [
  '#f97316', // orange
  '#0284c7', // sky
  '#2563eb', // blue
  '#10b981', // emerald
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#eab308', // amber
  '#ef4444', // red
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#64748b', // slate
];

export function renderCategoryIcon(iconName?: string, className: string = 'w-5 h-5') {
  const IconComponent = (iconName && ICON_MAP[iconName]) || HelpCircle;
  return <IconComponent className={className} />;
}
