'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, deleteLink, seedInitialDataIfEmpty } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { AddLinkModal } from '@/components/links/AddLinkModal';
import { ShareModal } from '@/components/sharing/ShareModal';
import {
  Plus,
  Search,
  ExternalLink,
  Share2,
  Trash2,
  BookOpen,
  TrendingUp,
  Utensils,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import type { SavedLink } from '@/types';

function getCategoryIcon(cat?: string) {
  const c = cat?.toLowerCase() || '';
  if (c.includes('reading') || c.includes('book')) return <BookOpen className="w-5 h-5 text-indigo-500" />;
  if (c.includes('money') || c.includes('finance') || c.includes('invest')) return <TrendingUp className="w-5 h-5 text-emerald-500" />;
  if (c.includes('recipe') || c.includes('food') || c.includes('cook')) return <Utensils className="w-5 h-5 text-amber-500" />;
  return <Globe className="w-5 h-5 text-blue-500" />;
}

export default function LinksPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sharingLink, setSharingLink] = useState<SavedLink | null>(null);

  useEffect(() => {
    seedInitialDataIfEmpty();
  }, []);

  const links = useLiveQuery(async () => {
    const list = await db.links.filter((l) => !l.isDeleted).toArray();
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, []);

  const list = links || [];

  const categories = ['all', ...Array.from(new Set(list.map((l) => l.category || 'General')))];

  const filtered = list.filter((l) => {
    const matchesCat = activeCategory === 'all' || l.category === activeCategory;
    const matchesSearch =
      !search.trim() ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      (l.domain && l.domain.toLowerCase().includes(search.toLowerCase())) ||
      (l.description && l.description.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Delete this saved link?')) {
      await deleteLink(id);
    }
  };

  const handleShare = (link: SavedLink, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSharingLink(link);
  };

  return (
    <AppShell activeTab="links">
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
            aria-label="Add Link"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Worth coming back to</h1>
          <p className="text-xs text-slate-500 font-medium">{list.length} things worth keeping</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search saved articles, links & tools"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
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

        {/* Links list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-100">
              <p className="text-sm text-slate-500">No links found.</p>
              <button
                onClick={() => setIsAddOpen(true)}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold text-xs rounded-xl hover:bg-indigo-100"
              >
                Save your first link
              </button>
            </div>
          ) : (
            filtered.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition duration-200 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 border border-indigo-100/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {item.domain} &middot; <span className="text-indigo-600 font-medium">{item.category}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <button
                    onClick={(e) => handleShare(item, e)}
                    className="p-2 text-slate-300 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition"
                    title="Share link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(item.id!, e)}
                    className="p-2 text-slate-300 hover:text-red-600 rounded-xl hover:bg-slate-50 transition"
                    title="Delete link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition ml-1" />
                </div>
              </a>
            ))
          )}
        </div>

        {/* Sync Footer */}
        <div className="flex items-center justify-center gap-2 pt-6 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{filtered.length} links saved &middot; Available offline</span>
        </div>
      </div>

      <AddLinkModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      {sharingLink && (
        <ShareModal
          isOpen={!!sharingLink}
          onClose={() => setSharingLink(null)}
          title={sharingLink.title}
          type="link"
          data={sharingLink}
        />
      )}
    </AppShell>
  );
}
