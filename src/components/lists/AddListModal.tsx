'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, ShoppingBag, TrendingUp, Wallet, List } from 'lucide-react';
import { addList } from '@/lib/db';
import type { ListCategory } from '@/types';
import { LIST_CATEGORY_META } from '@/types';

interface AddListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

const CATEGORY_NAME_PLACEHOLDERS: Record<ListCategory, string> = {
  grocery: 'e.g. Weekly groceries',
  shopping: 'e.g. Shopping wishlist',
  investment: 'e.g. Investment targets',
  budget: 'e.g. Monthly budget',
  custom: 'e.g. Packing checklist',
};

const CATEGORY_ITEM_PLACEHOLDERS: Record<ListCategory, string> = {
  grocery: 'Milk & Greek yoghurt\nBananas & seasonal fruit\nRolled oats',
  shopping: 'Noise-cancelling headphones\nRunning shoes\nWinter jacket',
  investment: 'Index fund SIP\nSovereign gold bond\nEmergency reserve buffer',
  budget: 'House rent\nElectricity & Wi-Fi\nGroceries allowance',
  custom: 'First item\nSecond item\nThird item',
};

export function AddListModal({ isOpen, onClose, onAdded }: AddListModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ListCategory>('grocery');
  const [plannedAmount, setPlannedAmount] = useState<number | undefined>();
  const [currency, setCurrency] = useState('₹');
  const [initialItemText, setInitialItemText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset fields whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setName('');
      setInitialItemText('');
      setPlannedAmount(undefined);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const items = initialItemText.trim()
        ? initialItemText
            .split('\n')
            .map((t) => t.trim())
            .filter(Boolean)
            .map((text, i) => {
              let cleanText = text;
              let amount: number | undefined = undefined;

              if (category === 'budget' || category === 'investment') {
                const match = cleanText.match(/^(.*?)(?:[:\-\–\—\s]+)(?:[₹$€£]?\s*)(\d+(?:\.\d+)?)$/);
                if (match && match[1].trim()) {
                  cleanText = match[1].trim();
                  amount = Number(match[2]);
                }
              }

              return {
                id: `item-${Date.now()}-${i}`,
                text: cleanText,
                isChecked: false,
                amount,
                sortOrder: i,
              };
            })
        : [];

      await addList({
        name: name.trim(),
        category,
        plannedAmount: category === 'budget' || category === 'investment' ? plannedAmount : undefined,
        currency: currency || '₹',
        items,
      });

      setName('');
      setInitialItemText('');
      setPlannedAmount(undefined);
      onAdded?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to add list', err);
      setErrorMessage(err?.message || 'Failed to create list. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-in">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <List className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-lg">Create New List</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(LIST_CATEGORY_META) as ListCategory[]).map((cat) => {
                const meta = LIST_CATEGORY_META[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`p-2.5 rounded-2xl text-left border text-xs font-semibold flex items-center gap-2 transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="capitalize">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">List Name</label>
            <input
              type="text"
              placeholder={CATEGORY_NAME_PLACEHOLDERS[category]}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {(category === 'budget' || category === 'investment') && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="₹">₹ INR</option>
                  <option value="$">$ USD</option>
                  <option value="€">€ EUR</option>
                  <option value="£">£ GBP</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Planned Target Amount</label>
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={plannedAmount || ''}
                  onChange={(e) => setPlannedAmount(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Add Initial Items <span className="font-normal text-slate-400">(Optional)</span>
              </label>
              <span className="text-[11px] text-slate-400">One per line</span>
            </div>
            <textarea
              rows={3}
              placeholder={CATEGORY_ITEM_PLACEHOLDERS[category]}
              value={initialItemText}
              onChange={(e) => setInitialItemText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-sans whitespace-pre-wrap placeholder:whitespace-pre-wrap placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              You can also leave this empty and add items directly to your list anytime.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm shadow-md shadow-indigo-200"
            >
              {isSubmitting ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
