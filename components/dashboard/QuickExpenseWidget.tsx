import React, { useState } from 'react';
import { IndianRupee, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function QuickExpenseWidget() {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount) return;

    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, amount, description })
      });

      if (!res.ok) throw new Error('Failed to save expense');
      
      toast.success('Expense saved successfully!');
      setCategory('');
      setAmount('');
      setDescription('');
    } catch (error) {
      toast.error('Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-50 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
          <IndianRupee size={16} />
        </div>
        <h3 className="font-semibold text-gray-900">Quick Expense</h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 space-y-3 bg-gray-50/50">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm border-gray-200 rounded-lg p-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Select...</option>
              <option value="Tea/Snacks">Tea/Snacks</option>
              <option value="Stationery">Stationery</option>
              <option value="Electricity">Electricity</option>
              <option value="Rent">Rent</option>
              <option value="Internet">Internet</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Amount (₹)</label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full text-sm border-gray-200 rounded-lg p-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this for?"
            className="w-full text-sm border-gray-200 rounded-lg p-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !category || !amount}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white p-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add Expense
        </button>
      </form>
    </div>
  );
}
