import React from 'react';
import { Moon, Sun, DollarSign, User, LogOut, Globe } from 'lucide-react';
import { Button, Card, Select, Label, Input } from './UI';
import { useFirebase } from '../contexts/FirebaseContext';

/**
 * Settings Component
 * Provides user-specific configuration options.
 * Features:
 * - Display user profile information (name, email, avatar)
 * - Change preferred currency (USD, EUR, GBP, JPY, CAD)
 * - Toggle between Light and Dark themes
 * - Logout functionality
 */
export const Settings: React.FC = () => {
  const { profile, user, logout, updateProfile } = useFirebase();

  // Ensure both profile and user are loaded before rendering
  if (!profile || !user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
      <Card className="p-5 md:p-8">
        <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center overflow-hidden border-2 md:border-4 border-white dark:border-slate-800 shadow-lg md:shadow-xl">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 md:w-10 md:h-10 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">{user.displayName || 'User'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4" /> Preferred Currency
              </Label>
              <Select 
                value={profile.currency} 
                onChange={(e) => updateProfile({ currency: e.target.value })}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD (CA$)</option>
              </Select>
              <p className="text-xs text-slate-400">This will be used for all your transaction displays.</p>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                {profile.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} 
                Appearance
              </Label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${profile.theme === 'light' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                  onClick={() => updateProfile({ theme: 'light' })}
                >
                  Light
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${profile.theme === 'dark' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
                  onClick={() => updateProfile({ theme: 'dark' })}
                >
                  Dark
                </button>
              </div>
              <p className="text-xs text-slate-400">Switch between light and dark themes.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" className="w-full text-red-500 border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
