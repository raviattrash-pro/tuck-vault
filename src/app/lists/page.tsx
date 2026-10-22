'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfEmpty } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { AddListModal } from '@/components/lists/AddListModal';
import {
  Plus,
  ShoppingCart,
  ShoppingBag,
  TrendingUp,
  Wallet,
  List,
  ChevronRight,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import type { ListCategory, TuckList } from '@/types';
import { formatCurrency } from '@/lib/utils';

function getListCategoryIcon(category: ListCategory) {
  switch (category) {
    case 'grocery':
      return <ShoppingCart className="w-5 h-5 text-emerald-500" />;
    case 'shopping':
      return <ShoppingBag className="w-5 h-5 text-purple-500" />;
    case 'investment':
      return <TrendingUp className="w-5 h-5 text-blue-500" />;
    case 'budget':
      return <Wallet className="w-5 h-5 text-amber-500" />;
    default:
      return <List className="w-5 h-5 text-slate-500" />;
  }
}

export default function ListsOverviewPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    seedInitialDataIfEmpty();
  }, []);

  const lists = useLiveQuery(async () => {
    const list = await db.lists.filter((l) => !l.isDeleted).toArray();
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, []);

  const allLists = lists || [];

  const filtered = allLists.filter((l) => {
    if (activeCategory === 'all') return true;
    return l.category === activeCategory;
  });

  return (
    <AppShell activeTab="lists">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200">
              ☵
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">tuck</span>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-indigo-200 transition"
            aria-label="Add List"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lists &amp; budgets</h1>
          <p className="text-xs text-slate-500 font-medium">{allLists.length} lists for everyday life</p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {['all', 'grocery', 'budget', 'shopping', 'investment'].map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold capitalize transition whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-100">
              <p className="text-sm text-slate-500">No lists found in this category.</p>
              <button
                onClick={() => setIsAddOpen(true)}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold text-xs rounded-xl hover:bg-indigo-100"
              >
                Create your first list
              </button>
            </div>
          ) : (
            filtered.map((list) => {
              const checkedCount = list.items.filter((i) => i.isChecked).length;
              const remainingCount = list.items.length - checkedCount;

              // If it's a budget or investment list
              const isBudget = list.category === 'budget' || list.category === 'investment';
              const spentTotal = list.items
                .filter((i) => i.isChecked && i.amount)
                .reduce((acc, i) => acc + (i.amount || 0), 0);
              const target = list.plannedAmount || 45000;
              const percentUsed = Math.min(100, Math.round((spentTotal / target) * 100));

              if (isBudget) {
                return (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className="group bg-gradient-to-br from-[#3D3A84] to-[#2B2762] text-white rounded-3xl p-5 shadow-lg shadow-indigo-950/20 hover:scale-[1.01] transition duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-indigo-200 text-xs font-medium">
                        <span className="capitalize">{list.name}</span>
                        <ChevronRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition" />
                      </div>

                      <div className="text-3xl font-extrabold mt-3 tracking-tight">
                        {list.currency || '₹'}
                        {spentTotal ? spentTotal.toLocaleString('en-IN') : '32,450'}
                      </div>
                      <div className="text-xs text-indigo-200/80 mt-0.5">
                        of {list.currency || '₹'}
                        {target.toLocaleString('en-IN')} planned this month
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-white h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentUsed || 72}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-indigo-200 font-medium">
                        <span>
                          {list.currency || '₹'}
                          {Math.max(0, target - (spentTotal || 32450)).toLocaleString('en-IN')} left
                        </span>
                        <span>{percentUsed || 72}% used</span>
                      </div>
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={list.id}
                  href={`/lists/${list.id}`}
                  className="group bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition duration-200 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        {getListCategoryIcon(list.category)}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition">
                        {list.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {checkedCount} checked off &middot; {remainingCount} left to pick up
                      </p>
                    </div>

                    {/* Preview first 3 items */}
                    <div className="space-y-1.5 pt-1">
                      {list.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs text-slate-600">
                          {item.isChecked ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                          <span className={`truncate ${item.isChecked ? 'line-through text-slate-400' : ''}`}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 text-[11px] text-slate-400 font-medium flex items-center justify-between">
                    <span className="capitalize text-indigo-600 font-semibold">{list.category}</span>
                    <span>{list.items.length} items total</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Sync Footer */}
        <div className="flex items-center justify-center gap-2 pt-6 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{allLists.length} lists synced &middot; Mobile &amp; web</span>
        </div>
      </div>

      <AddListModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />
    </AppShell>
  );
}
