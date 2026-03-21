import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Upload, Loader2, Check } from 'lucide-react';
import { Button, Input, Select, Card, Label } from './UI';
import { CATEGORIES, PAYMENT_METHODS } from '@/src/constants';
import { Transaction, Category, PaymentMethod, TransactionType, RecurringInterval } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { cn } from '../lib/utils';

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id' | 'uid'>) => void;
  onEdit?: (transaction: Transaction) => void;
  editTransaction?: Transaction | null;
  onCancel?: () => void;
}

/**
 * TransactionForm Component
 * A modal form used for creating and editing financial records (Income or Expense).
 * Features:
 * - Toggle between Income and Expense
 * - Amount, Date, Category, and Payment Method selection
 * - Optional description and receipt image upload
 * - Recurring transaction support (Daily, Weekly, Monthly, Yearly)
 */
export const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit, onEdit, editTransaction, onCancel }) => {
  const { profile, uploadReceipt } = useFirebase();
  
  // Form State
  const [type, setType] = useState<TransactionType>('Expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Groceries');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card');
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>('monthly');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Effect to populate the form when in 'edit' mode.
   * Runs whenever the editTransaction prop changes.
   */
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount.toString());
      setCategory(editTransaction.category);
      setDate(editTransaction.date.split('T')[0]);
      setPaymentMethod(editTransaction.paymentMethod);
      setDescription(editTransaction.description || '');
      setIsRecurring(editTransaction.isRecurring || false);
      setRecurringInterval(editTransaction.recurringInterval || 'monthly');
      setReceiptUrl(editTransaction.receiptUrl || '');
    }
  }, [editTransaction]);

  /**
   * Handles file selection and uploads the receipt image to Firebase Storage.
   * Updates the receiptUrl state with the resulting download URL.
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadReceipt(file);
      setReceiptUrl(url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Validates and submits the transaction data.
   * Calls either onEdit or onSubmit depending on the current mode.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // const transactionData = {
    //   amount: parseFloat(amount),
    //   category,
    //   date: new Date(date).toISOString(),
    //   paymentMethod,
    //   description: description.trim() ,
    //   type,
    //   isRecurring,
    //   recurringInterval: isRecurring ? recurringInterval : null,
    //   receiptUrl: receiptUrl ,
    //   currency: profile?.currency || 'USD',
    // };

    // Create the base object with required fields
  const transactionData: any = {
    amount: parseFloat(amount),
    category,
    date: new Date(date).toISOString(),
    paymentMethod,
    type,
    currency: profile?.currency || 'USD',
  };

  // Only add optional fields if they actually have a value
  if (description.trim()) transactionData.description = description.trim();
  if (isRecurring) {
    transactionData.isRecurring = true;
    if (recurringInterval) transactionData.recurringInterval = recurringInterval;
  }
  if (receiptUrl) transactionData.receiptUrl = receiptUrl;

    

    if (editTransaction && onEdit) {
      onEdit({ ...transactionData, id: editTransaction.id, uid: editTransaction.uid });
    } else {
      onSubmit(transactionData);
    }

    // Reset form fields after successful submission
    setAmount('');
    setCategory('Groceries');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Card');
    setDescription('');
    setIsRecurring(false);
    setReceiptUrl('');
  };

  return (
    <Card className="p-4 md:p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100">
          {editTransaction ? 'Edit Record' : 'Add Record'}
        </h2>
        {onCancel && (
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-10 w-10">
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4 md:mb-6">
        <button
          type="button"
          className={cn(
            "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
            type === 'Expense' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
          )}
          onClick={() => setType('Expense')}
        >
          Expense
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
            type === 'Income' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
          )}
          onClick={() => setType('Income')}
        >
          Income
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="space-y-1.5">
            <Label>Amount ({profile?.currency || 'USD'})</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              {type === 'Income' && <option value="Income">Income</option>}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Description (Optional)</Label>
          <Input
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-3 md:space-y-4 pt-1 md:pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="recurring" className="normal-case tracking-normal text-sm">Recurring</Label>
            </div>
            {isRecurring && (
              <Select
                className="w-28 h-9 text-xs"
                value={recurringInterval}
                onChange={(e) => setRecurringInterval(e.target.value as RecurringInterval)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-dashed h-10 md:h-12 text-xs md:text-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : receiptUrl ? (
                <Check className="w-4 h-4 mr-2 text-emerald-500" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? 'Uploading...' : receiptUrl ? 'Attached' : 'Receipt'}
            </Button>
            {receiptUrl && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setReceiptUrl('')}
              >
                <X className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full h-12 md:h-14 text-base md:text-lg" variant="secondary">
          {editTransaction ? 'Update Record' : 'Add Record'}
        </Button>
      </form>
    </Card>
  );
};
