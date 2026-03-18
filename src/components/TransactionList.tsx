import React, { useState } from 'react';
import { Trash2, Edit2, Filter, Download, Search, Eye, Repeat } from 'lucide-react';
import { Button, Card, Input, Select, Label } from './UI';
import { Transaction, Category } from '@/src/types';
import { CATEGORIES } from '@/src/constants';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { cn } from '../lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  onExport: (format: 'csv' | 'json') => void;
}

/**
 * TransactionList Component
 * Displays a searchable, filterable list of transactions in both table (desktop)
 * and card (mobile) formats.
 * Features:
 * - Search by description or category
 * - Filter by category and date range
 * - Export data to CSV or JSON
 * - Edit and Delete actions for each transaction
 * - Receipt viewing via external link
 */
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDelete,
  onEdit,
  filterCategory,
  setFilterCategory,
  dateRange,
  setDateRange,
  onExport,
}) => {
  const { profile } = useFirebase();
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Local filtering logic for the search query.
   * Note: Category and Date filtering is handled by the parent (App.tsx)
   * to keep the global state consistent.
   */
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Filter & Export</h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExport('json')}>
              <Download className="w-4 h-4 mr-2" /> JSON
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search description..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>From</Label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>To</Label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-none md:border md:border-slate-100 dark:md:border-slate-800">
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-bottom border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      No records found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <motion.tr
                      key={t.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {format(new Date(t.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            t.type === 'Income' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          )}>
                            {t.category}
                          </span>
                          {t.isRecurring && <Repeat className="w-3 h-3 text-slate-400" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                        {t.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-500">
                        {t.paymentMethod}
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-sm font-bold text-right",
                        t.type === 'Income' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"
                      )}>
                        {t.type === 'Income' ? '+' : '-'}{profile?.currency || '$'}{t.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {t.receiptUrl && (
                            <Button variant="ghost" size="icon" onClick={() => window.open(t.receiptUrl, '_blank')}>
                              <Eye className="w-4 h-4 text-slate-400 hover:text-emerald-500" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => onEdit(t)}>
                            <Edit2 className="w-4 h-4 text-slate-400 hover:text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onDelete(t.id)}>
                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>

          {/* Mobile List */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            <AnimatePresence mode="popLayout">
              {filteredTransactions.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-400 italic">
                  No records found matching your search.
                </div>
              ) : (
                filteredTransactions.map((t) => (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 space-y-3 active:bg-slate-50 dark:active:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={cn(
                          "font-bold text-lg",
                          t.type === 'Income' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"
                        )}>
                          {t.type === 'Income' ? '+' : '-'}{profile?.currency || '$'}{t.amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{format(new Date(t.date), 'MMM dd, yyyy')}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          t.type === 'Income' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}>
                          {t.category}
                        </span>
                        {t.isRecurring && <Repeat className="w-3 h-3 text-slate-400" />}
                      </div>
                    </div>
                    {t.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{t.description}</p>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-slate-400 dark:text-slate-500">{t.paymentMethod}</span>
                      <div className="flex gap-1">
                        {t.receiptUrl && (
                          <Button variant="ghost" size="sm" onClick={() => window.open(t.receiptUrl, '_blank')}>
                            <Eye className="w-4 h-4 text-slate-400" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => onEdit(t)}>
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(t.id)}>
                          <Trash2 className="w-4 h-4 text-slate-400" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </Card>
    </div>
  );
};
