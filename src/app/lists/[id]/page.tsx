'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, updateList, deleteList } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { ShareModal } from '@/components/sharing/ShareModal';
import {
  ArrowLeft,
  MoreVertical,
  Plus,
  CheckCircle2,
  Circle,
  Share2,
  Trash2,
  DollarSign,
} from 'lucide-react';
import type { TuckList, ListItem } from '@/types';

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [list, setList] = useState<TuckList | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [newItemAmount, setNewItemAmount] = useState<number | undefined>();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!id) return;
    db.lists.get(id).then((l) => {
      if (l) setList(l);
    });
  }, [id]);

  if (!list) {
    return (
      <AppShell activeTab="lists">
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-slate-400">Loading list...</p>
        </div>
      </AppShell>
    );
  }

  const isBudget = list.category === 'budget' || list.category === 'investment';

  const handleToggleItem = async (itemId: string) => {
    const updatedItems = list.items.map((it) =>
      it.id === itemId ? { ...it, isChecked: !it.isChecked } : it
    );
    await updateList(list.id!, { items: updatedItems });
    setList({ ...list, items: updatedItems });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: ListItem = {
      id: `item-${Date.now()}`,
      text: newItemText.trim(),
      isChecked: false,
      amount: isBudget ? newItemAmount : undefined,
      sortOrder: list.items.length,
    };

    const updatedItems = [...list.items, newItem];
    await updateList(list.id!, { items: updatedItems });
    setList({ ...list, items: updatedItems });
    setNewItemText('');
    setNewItemAmount(undefined);
  };

  const handleDeleteItem = async (itemId: string) => {
    const updatedItems = list.items.filter((it) => it.id !== itemId);
    await updateList(list.id!, { items: updatedItems });
    setList({ ...list, items: updatedItems });
  };

  const handleDeleteList = async () => {
    if (confirm('Delete this whole list?')) {
      await deleteList(list.id!);
      router.push('/lists');
    }
  };

  const checkedCount = list.items.filter((i) => i.isChecked).length;
  const remainingCount = list.items.length - checkedCount;
  const totalSpent = list.items
    .filter((i) => i.isChecked && i.amount)
    .reduce((acc, i) => acc + (i.amount || 0), 0);

  return (
    <AppShell activeTab="lists">
      <div className="max-w-md mx-auto px-4 pt-6 pb-28 sm:py-8 space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/lists"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lists</span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsShareOpen(true)}
              className="p-2 text-slate-500 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition"
              title="Share list"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 animate-scale-in">
                  <button
                    onClick={handleDeleteList}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete List
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
              {list.category}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{list.name}</h1>
          <p className="text-xs text-slate-500 font-medium">
            {checkedCount} completed &middot; {remainingCount} remaining
          </p>
        </div>

        {/* Budget summary card if applicable */}
        {isBudget && (
          <div className="bg-gradient-to-br from-[#3D3A84] to-[#2B2762] text-white rounded-3xl p-5 shadow-lg shadow-indigo-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-200">Total Spent</span>
              <span className="text-xs text-indigo-200">
                Target: {list.currency || '₹'}{(list.plannedAmount || 45000).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight">
              {list.currency || '₹'}{totalSpent.toLocaleString('en-IN')}
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((totalSpent / (list.plannedAmount || 45000)) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {list.items.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              This list is empty. Add your first item below!
            </div>
          ) : (
            list.items.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between p-4 hover:bg-slate-50/50 transition"
              >
                <div
                  onClick={() => handleToggleItem(item.id)}
                  className="flex items-center gap-3.5 min-w-0 cursor-pointer flex-1"
                >
                  <button className="text-slate-300 hover:text-indigo-600 transition shrink-0">
                    {item.isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                  <span
                    className={`text-sm font-medium truncate ${
                      item.isChecked ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {item.text}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                  {item.amount && (
                    <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                      {list.currency || '₹'}{item.amount.toLocaleString('en-IN')}
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 p-1 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Item form */}
        <form onSubmit={handleAddItem} className="space-y-2">
          <div className="flex items-center gap-2 bg-white rounded-2xl p-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
            <input
              type="text"
              placeholder="Add item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-sm bg-transparent outline-none placeholder:text-slate-400"
            />

            {isBudget && (
              <input
                type="number"
                placeholder="Amount"
                value={newItemAmount || ''}
                onChange={(e) => setNewItemAmount(e.target.value ? Number(e.target.value) : undefined)}
                className="w-24 px-2 py-1.5 text-xs bg-slate-50 rounded-xl outline-none font-mono border border-slate-200"
              />
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-200 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </form>
      </div>

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={list.name}
        type="list"
        data={list}
      />
    </AppShell>
  );
}
