import React, { useState } from 'react';
import { Target, Plus, Trash2, Edit2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button, Card, Select, Label, Input } from './UI';
import { motion } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { CATEGORIES, CURRENCY_SYMBOLS } from '../constants';
import { format, startOfMonth } from 'date-fns';
import { cn } from '../lib/utils';
import { Category } from '../types';

/**
 * Budgets Component
 * Allows users to set monthly spending limits for specific categories.
 * Features:
 * - Create new budgets for the current month
 * - Delete existing budgets
 * - Visual progress bar showing spent vs limit
 * - Alerts for overspending
 */
export const Budgets: React.FC = () => {
  const { budgets, transactions, addBudget, deleteBudget, profile } = useFirebase();
  const [newBudgetCategory, setNewBudgetCategory] = useState<Category>('Groceries');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Current month context for filtering transactions and tagging budgets
  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth) && t.type === 'Expense');

  /**
   * Handles the creation of a new budget.
   * Budgets are stored in the 'budgets' collection in Firestore.
   */
  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudgetAmount) return;

    await addBudget({
      category: newBudgetCategory,
      amount: parseFloat(newBudgetAmount),
      month: currentMonth
    });

    setNewBudgetAmount('');
    setIsAdding(false);
  };

  /**
   * Helper function to calculate total spending for a specific category
   * within the current month.
   */
  const getSpentForCategory = (category: string) => {
    return currentMonthTransactions
      .filter(t => t.category === category)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Monthly Budgets</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Set limits for your spending categories.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setIsAdding(!isAdding)} className="sm:w-auto w-full">
          <Plus className="w-4 h-4 mr-2" /> {isAdding ? 'Cancel' : 'Set Budget'}
        </Button>
      </div>

      {isAdding && (
        <Card className="p-5 border-2 border-emerald-100 dark:border-emerald-900/30">
          <form onSubmit={handleAddBudget} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select 
                value={newBudgetCategory} 
                onChange={(e) => setNewBudgetCategory(e.target.value as Category)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Monthly Limit ({CURRENCY_SYMBOLS[profile?.currency || 'USD']})</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={newBudgetAmount} 
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="secondary" className="w-full h-12">Save Budget</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {budgets.map(budget => {
          const spent = getSpentForCategory(budget.category);
          const percent = Math.min((spent / budget.amount) * 100, 100);
          const isOver = spent > budget.amount;

          return (
            <Card key={budget.id} className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isOver ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                  )}>
                    <Target className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">{budget.category}</h4>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteBudget(budget.id)} className="h-8 w-8">
                  <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Spent: <span className="font-bold text-slate-800 dark:text-slate-100">{CURRENCY_SYMBOLS[profile?.currency || 'USD']}{spent.toFixed(2)}</span>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Limit: <span className="font-bold text-slate-800 dark:text-slate-100">{CURRENCY_SYMBOLS[profile?.currency || 'USD']}{budget.amount.toFixed(2)}</span>
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className={cn(
                      "h-full transition-all duration-500",
                      isOver ? "bg-red-500" : percent > 80 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                  />
                </div>
                {isOver && (
                  <div className="flex items-center gap-2 text-xs text-red-500 font-medium">
                    <AlertTriangle className="w-3 h-3" /> Over budget by {CURRENCY_SYMBOLS[profile?.currency || 'USD']}{(spent - budget.amount).toFixed(2)}
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {budgets.length === 0 && (
          <div className="md:col-span-2 text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No budgets set yet.</p>
            <p className="text-sm">Set category limits to keep your spending in check.</p>
          </div>
        )}
      </div>
    </div>
  );
};
