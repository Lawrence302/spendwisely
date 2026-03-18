import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Calendar, 
  Plus, 
  LayoutDashboard, 
  ListOrdered,
  Settings as SettingsIcon,
  Target,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  LogIn,
  Info,
  Download,
  X,
  Menu,
  ChevronDown,
  LogOut,
  MoreHorizontal
} from 'lucide-react';
import { Button, Card } from './components/UI';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { Charts } from './components/Charts';
import { Settings } from './components/Settings';
import { Budgets } from './components/Budgets';
import { Transaction, CategoryData, TrendData } from './types';
import { CURRENCY_SYMBOLS } from './constants';
import { 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  isWithinInterval, 
  format, 
  subDays,
  parseISO,
  isSameDay,
  isAfter,
  isBefore
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from './contexts/FirebaseContext';
import { cn } from './lib/utils';

/**
 * Main Application Component
 * This is the primary shell of SpendWisely. It handles navigation, PWA installation logic,
 * global state aggregation (summaries, charts), and renders the various tabs.
 */
export default function App() {
  // Access global Firebase state and functions
  const { 
    user, 
    profile, 
    transactions, 
    budgets,
    loading, 
    signIn, 
    logout, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction 
  } = useFirebase();

  // Local UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'budgets' | 'settings'>('dashboard');
  const [showAbout, setShowAbout] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  /**
   * PWA Installation Logic
   * Monitors the 'beforeinstallprompt' event to show a custom install banner.
   * Also checks if the app is already running in 'standalone' mode.
   */
  useEffect(() => {
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('pwa-dismissed');
    
    if (!isInstalled && !dismissed) {
      setShowInstallPrompt(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  /**
   * Triggers the PWA installation prompt when the user clicks 'Install'.
   */
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  /**
   * Dismisses the install banner and saves the preference to localStorage.
   */
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-dismissed', 'true');
  };
  
  // Filtering state for the History tab
  const [filterCategory, setFilterCategory] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  /**
   * Wrapper for adding a transaction via the Firebase context.
   */
  const handleAddTransaction = async (newTransaction: Omit<Transaction, 'id' | 'uid'>) => {
    await addTransaction(newTransaction);
    setIsFormOpen(false);
  };

  /**
   * Wrapper for editing a transaction via the Firebase context.
   */
  const handleEditTransaction = async (updatedTransaction: Transaction) => {
    await updateTransaction(updatedTransaction);
    setEditingTransaction(null);
    setIsFormOpen(false);
  };

  /**
   * Wrapper for deleting a transaction via the Firebase context.
   */
  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
  };

  /**
   * Opens the transaction form in 'edit' mode.
   */
  const startEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  /**
   * Filtered Transactions Memo
   * Calculates the list of transactions based on the current category and date filters.
   */
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = parseISO(t.date);
      const start = parseISO(dateRange.start);
      const end = parseISO(dateRange.end);
      
      const categoryMatch = filterCategory === 'all' || t.category === filterCategory;
      const dateMatch = isAfter(date, startOfDay(start)) && isBefore(date, startOfDay(subDays(end, -1)));
      
      return categoryMatch && dateMatch;
    });
  }, [transactions, filterCategory, dateRange]);

  /**
   * Summaries Memo
   * Calculates high-level stats (Today, This Week, This Month) for the dashboard.
   */
  const summaries = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const week = startOfWeek(now);
    const month = startOfMonth(now);

    return transactions.reduce((acc, t) => {
      const date = parseISO(t.date);
      const amount = t.amount;
      
      if (t.type === 'Expense') {
        if (isSameDay(date, today)) acc.today += amount;
        if (isAfter(date, week)) acc.thisWeek += amount;
        if (isAfter(date, month)) acc.thisMonth += amount;
      } else {
        if (isAfter(date, month)) acc.incomeThisMonth += amount;
      }
      return acc;
    }, { today: 0, thisWeek: 0, thisMonth: 0, incomeThisMonth: 0 });
  }, [transactions]);

  /**
   * Category Data Memo
   * Aggregates expenses by category for the pie chart.
   */
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'Expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  /**
   * Trend Data Memo
   * Aggregates daily expenses for the spending trend line chart.
   */
  const trendData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'Expense').forEach(t => {
      const dateKey = format(parseISO(t.date), 'MMM dd');
      data[dateKey] = (data[dateKey] || 0) + t.amount;
    });

    return Object.entries(data)
      .map(([date, amount]) => ({ date, amount }))
      .reverse();
  }, [filteredTransactions]);

  /**
   * Surplus & Cumulative Data Memo
   * Calculates monthly income vs expense and the long-term net worth trajectory.
   */
  const surplusData = useMemo(() => {
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach(t => {
      const monthKey = format(parseISO(t.date), 'yyyy-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'Income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    let cumulative = 0;
    
    return sortedMonths.map(month => {
      const { income, expense } = monthlyData[month];
      const surplus = income - expense;
      cumulative += surplus;
      return {
        month: format(parseISO(`${month}-01`), 'MMM yy'),
        income,
        expense,
        surplus,
        cumulative
      };
    });
  }, [transactions]);

  /**
   * Data Export Logic
   * Generates and downloads a CSV or JSON file of the filtered transactions.
   */
  const handleExport = (formatType: 'csv' | 'json') => {
    let content = '';
    let mimeType = '';
    let fileName = `transactions_${format(new Date(), 'yyyy-MM-dd')}`;

    if (formatType === 'json') {
      content = JSON.stringify(filteredTransactions, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else {
      const headers = ['Date', 'Type', 'Amount', 'Category', 'Method', 'Description'];
      const rows = filteredTransactions.map(t => [
        format(parseISO(t.date), 'yyyy-MM-dd'),
        t.type,
        t.amount.toFixed(2),
        t.category,
        t.paymentMethod,
        `"${t.description || ''}"`
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      mimeType = 'text/csv';
      fileName += '.csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-8">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/20">
            <Wallet className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">SpendWisely</h1>
            <p className="text-slate-500 dark:text-slate-400">Your personal finance, simplified and secure.</p>
          </div>
          <Button className="w-full h-14 text-lg" variant="secondary" onClick={signIn}>
            <LogIn className="w-5 h-5 mr-3" /> Sign in with Google
          </Button>
          <p className="text-xs text-slate-400">By signing in, you agree to our terms of service and privacy policy.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-50 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/20">
            <Wallet className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">SpendWisely</h1>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("w-10 h-10", activeTab === 'dashboard' && "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20")}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("w-10 h-10", activeTab === 'history' && "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20")}
            onClick={() => setActiveTab('history')}
          >
            <ListOrdered className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("w-10 h-10", activeTab === 'budgets' && "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20")}
            onClick={() => setActiveTab('budgets')}
          >
            <Target className="w-5 h-5" />
          </Button>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-10 h-10"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-1.5">
                      <button 
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors",
                          activeTab === 'settings' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                        onClick={() => {
                          setActiveTab('settings');
                          setIsDropdownOpen(false);
                        }}
                      >
                        <SettingsIcon className="w-4 h-4" />
                        Settings
                      </button>
                      <button 
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => {
                          setShowAbout(true);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <Info className="w-4 h-4" />
                        About
                      </button>
                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1.5" />
                      <button 
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Sidebar / Nav (Desktop Only) */}
      <nav className="hidden md:block fixed top-0 left-0 w-64 h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 z-50">
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
              <Wallet className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">SpendWisely</h1>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              variant={activeTab === 'dashboard' ? 'primary' : 'ghost'} 
              className={cn(
                "justify-start w-full transition-all duration-200 px-4",
                activeTab === 'dashboard' ? "text-white" : "text-slate-500 dark:text-slate-400"
              )}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" />
              Dashboard
            </Button>
            <Button 
              variant={activeTab === 'history' ? 'primary' : 'ghost'} 
              className={cn(
                "justify-start w-full transition-all duration-200 px-4",
                activeTab === 'history' ? "text-white" : "text-slate-500 dark:text-slate-400"
              )}
              onClick={() => setActiveTab('history')}
            >
              <ListOrdered className="w-5 h-5 mr-3" />
              History
            </Button>
            <Button 
              variant={activeTab === 'budgets' ? 'primary' : 'ghost'} 
              className={cn(
                "justify-start w-full transition-all duration-200 px-4",
                activeTab === 'budgets' ? "text-white" : "text-slate-500 dark:text-slate-400"
              )}
              onClick={() => setActiveTab('budgets')}
            >
              <Target className="w-5 h-5 mr-3" />
              Budgets
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start w-full transition-all duration-200 px-4 text-slate-500 dark:text-slate-400"
              onClick={() => setShowAbout(true)}
            >
              <Info className="w-5 h-5 mr-3" />
              About
            </Button>
            <Button 
              variant={activeTab === 'settings' ? 'primary' : 'ghost'} 
              className={cn(
                "justify-start w-full transition-all duration-200 px-4",
                activeTab === 'settings' ? "text-white" : "text-slate-500 dark:text-slate-400"
              )}
              onClick={() => setActiveTab('settings')}
            >
              <SettingsIcon className="w-5 h-5 mr-3" />
              Settings
            </Button>
          </div>

          <div className="mt-auto px-2 space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Monthly Balance</p>
              <div className="flex items-end gap-1">
                <span className={cn(
                  "text-lg font-bold",
                  summaries.incomeThisMonth - summaries.thisMonth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                )}>
                  {CURRENCY_SYMBOLS[profile?.currency || 'USD']}{(summaries.incomeThisMonth - summaries.thisMonth).toFixed(0)}
                </span>
                <span className="text-xs text-slate-400 mb-1">left</span>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 pt-20 md:pt-8 pb-10 p-4 md:p-8 max-w-7xl mx-auto">
        <AnimatePresence>
          {showInstallPrompt && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-emerald-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg mb-8 overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">Install SpendWisely</p>
                  <p className="text-xs text-white/80">Access your finances faster from your home screen.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={handleInstall} className="text-xs h-8">
                  Install
                </Button>
                <Button size="sm" variant="ghost" onClick={dismissInstallPrompt} className="text-white hover:bg-white/10 p-1 h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {activeTab === 'dashboard' ? 'Overview' : 
               activeTab === 'history' ? 'History' : 
               activeTab === 'budgets' ? 'Budgets' : 'Settings'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {format(new Date(), 'EEEE, MMM do')}
            </p>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => {
              setEditingTransaction(null);
              setIsFormOpen(true);
            }}
            className="hidden md:flex shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Record
          </Button>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{CURRENCY_SYMBOLS[profile?.currency || 'USD']}{summaries.today.toFixed(2)}</h3>
                  <p className="text-sm text-slate-500 mt-1">Daily spending</p>
                </Card>
                <Card className="p-6 border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Income (Month)</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{CURRENCY_SYMBOLS[profile?.currency || 'USD']}{summaries.incomeThisMonth.toFixed(2)}</h3>
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium mt-1">
                    <ArrowUpRight className="w-3 h-3" /> Total earnings
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-violet-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-violet-600 dark:text-violet-400">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Spent (Month)</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{CURRENCY_SYMBOLS[profile?.currency || 'USD']}{summaries.thisMonth.toFixed(2)}</h3>
                  <div className="flex items-center gap-1 text-red-500 text-xs font-medium mt-1">
                    <ArrowDownRight className="w-3 h-3" /> Total expenses
                  </div>
                </Card>
              </div>

              {/* Budget Alerts */}
              {budgets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Budget Watch</h4>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('budgets')} className="text-xs text-emerald-600">View All</Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const currentMonth = format(new Date(), 'yyyy-MM');
                      const alerts = budgets.map(budget => {
                        const spent = transactions
                          .filter(t => t.date.startsWith(currentMonth) && t.type === 'Expense' && t.category === budget.category)
                          .reduce((sum, t) => sum + t.amount, 0);
                        const percent = (spent / budget.amount) * 100;
                        
                        if (percent < 80) return null;

                        return (
                          <Card key={budget.id} className={cn("p-4 border-l-4", percent >= 100 ? "border-l-red-500" : "border-l-amber-500")}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Target className={cn("w-4 h-4", percent >= 100 ? "text-red-500" : "text-amber-500")} />
                                <span className="font-bold text-sm">{budget.category}</span>
                              </div>
                              <span className={cn("text-xs font-bold", percent >= 100 ? "text-red-500" : "text-amber-500")}>
                                {percent >= 100 ? 'Over Limit' : 'Nearing Limit'}
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all duration-500", percent >= 100 ? "bg-red-500" : "bg-amber-500")}
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">
                              {CURRENCY_SYMBOLS[profile?.currency || 'USD']}{spent.toFixed(2)} of {CURRENCY_SYMBOLS[profile?.currency || 'USD']}{budget.amount.toFixed(2)} spent
                            </p>
                          </Card>
                        );
                      }).filter(Boolean);

                      return alerts.length > 0 ? alerts : (
                        <div className="md:col-span-2 py-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 text-sm italic">
                          All budgets are healthy! Keep it up. ✨
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Charts */}
              <Charts 
                categoryData={categoryData} 
                trendData={trendData} 
                surplusData={surplusData}
              />

              {/* Recent Transactions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Recent Transactions</h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('history')}>
                    View All
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {transactions.slice(0, 5).map((t) => (
                    <Card key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => startEdit(t)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold">
                          {t.category[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{t.category}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{format(parseISO(t.date), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold",
                          t.type === 'Income' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-100"
                        )}>
                          {t.type === 'Income' ? '+' : '-'}{profile?.currency || '$'}{t.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{t.paymentMethod}</p>
                      </div>
                    </Card>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">No transactions yet.</p>
                      <p className="text-sm">Add your first income or expense to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <TransactionList 
                transactions={filteredTransactions}
                onDelete={handleDeleteTransaction}
                onEdit={startEdit}
                filterCategory={filterCategory}
                setFilterCategory={setFilterCategory}
                dateRange={dateRange}
                setDateRange={setDateRange}
                onExport={handleExport}
              />
            </motion.div>
          )}

          {activeTab === 'budgets' && (
            <motion.div 
              key="budgets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Budgets />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Settings />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-40">
        <Button
          variant="secondary"
          size="icon"
          className="w-14 h-14 rounded-full shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/40 active:scale-90 transition-transform"
          onClick={() => {
            setEditingTransaction(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="w-8 h-8" />
        </Button>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg"
            >
              <TransactionForm 
                onSubmit={handleAddTransaction}
                onEdit={handleEditTransaction}
                editTransaction={editingTransaction}
                onCancel={() => setIsFormOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <Button variant="ghost" size="icon" onClick={() => setShowAbout(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20 mx-auto">
                  <Wallet className="w-8 h-8" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">About SpendWisely</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    SpendWisely is your ultimate companion for personal finance management. 
                    Designed with simplicity and security in mind, it helps you track every penny, 
                    set realistic budgets, and visualize your financial growth over time.
                  </p>
                </div>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <span>Real-time dashboard and analytics</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600">
                      <Target className="w-4 h-4" />
                    </div>
                    <span>Smart budgeting and overspending alerts</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <div className="w-8 h-8 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center text-violet-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span>Cumulative balance and surplus tracking</span>
                  </div>
                </div>
                <Button className="w-full mt-4" onClick={() => setShowAbout(false)}>
                  Got it!
                </Button>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
