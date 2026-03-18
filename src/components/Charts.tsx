import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';
import { Card } from './UI';
import { CategoryData, TrendData, SurplusData } from '@/src/types';
import { CATEGORY_COLORS, CURRENCY_SYMBOLS } from '@/src/constants';
import { useFirebase } from '../contexts/FirebaseContext';

interface ChartsProps {
  categoryData: CategoryData[];
  trendData: TrendData[];
  surplusData: SurplusData[];
}

export const Charts: React.FC<ChartsProps> = ({ categoryData, trendData, surplusData }) => {
  const { profile } = useFirebase();
  const isDark = profile?.theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const currencySymbol = CURRENCY_SYMBOLS[profile?.currency || 'USD'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Spending by Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: isDark ? '#0f172a' : '#fff',
                    color: isDark ? '#f1f5f9' : '#0f172a'
                  }}
                  itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                  formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Amount']}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Spending Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: textColor }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: textColor }}
                  tickFormatter={(value) => `${currencySymbol}${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: isDark ? '#0f172a' : '#fff',
                    color: isDark ? '#f1f5f9' : '#0f172a'
                  }}
                  itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                  formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Spending']}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Monthly Surplus/Deficit</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={surplusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: textColor }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: textColor }}
                  tickFormatter={(value) => `${currencySymbol}${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: isDark ? '#0f172a' : '#fff',
                    color: isDark ? '#f1f5f9' : '#0f172a'
                  }}
                  itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                  formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Surplus/Deficit']}
                />
                <Bar dataKey="surplus">
                  {surplusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.surplus >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Cumulative Balance Over Time</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={surplusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: textColor }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: textColor }}
                  tickFormatter={(value) => `${currencySymbol}${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: isDark ? '#0f172a' : '#fff',
                    color: isDark ? '#f1f5f9' : '#0f172a'
                  }}
                  itemStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                  formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Cumulative Balance']}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: isDark ? '#0f172a' : '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
