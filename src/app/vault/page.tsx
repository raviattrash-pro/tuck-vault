'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfEmpty } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { AddDocumentModal } from '@/components/vault/AddDocumentModal';
import {
  Plus,
  Lock,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Fingerprint,
  CreditCard,
  ShieldCheck,
  Car,
  BadgeCheck,
  Files,
  Cloud,
} from 'lucide-react';
import { formatDateShort } from '@/lib/utils';
import type { DocumentType } from '@/types';

function getDocIcon(type: DocumentType) {
  switch (type) {
    case 'aadhaar':
      return <Fingerprint className="w-5 h-5 text-indigo-500" />;
    case 'pan':
      return <CreditCard className="w-5 h-5 text-purple-500" />;
    case 'voter_id':
      return <ShieldCheck className="w-5 h-5 text-blue-500" />;
    case 'driving_licence':
      return <Car className="w-5 h-5 text-emerald-500" />;
    case 'office_id':
      return <BadgeCheck className="w-5 h-5 text-amber-500" />;
    default:
      return <Files className="w-5 h-5 text-indigo-400" />;
  }
}

export default function VaultPage() {
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    seedInitialDataIfEmpty();
  }, []);

  const documents = useLiveQuery(async () => {
    const list = await db.documents.filter((d) => !d.isDeleted).toArray();
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, []);

  const filtered = (documents || []).filter((doc) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.documentNumber.toLowerCase().includes(query) ||
      (doc.organisation && doc.organisation.toLowerCase().includes(query))
    );
  });

  return (
    <AppShell activeTab="vault">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 sm:py-8 space-y-6">
        {/* Top bar with Brand & Add button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200">
              ☵
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">tuck</span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-indigo-200 transition"
            aria-label="Add Document"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Header Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your personal vault</h1>
          <p className="text-sm text-slate-500 font-medium">Important documents. Always within reach.</p>
        </div>

        {/* Private by default notice */}
        <div className="bg-[#EEF2FF] border border-indigo-100 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-950">Private by default</h4>
            <p className="text-xs text-indigo-700/80">Details stay masked until you reveal them.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Find a document"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition"
          />
        </div>

        {/* Section title & count */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            All Documents &middot; {filtered.length}
          </span>
          <button className="text-slate-400 hover:text-slate-600 p-1">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Document Cards List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-slate-100">
              <p className="text-sm text-slate-500">No documents found.</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold text-xs rounded-xl hover:bg-indigo-100"
              >
                Add your first document
              </button>
            </div>
          ) : (
            filtered.map((doc) => (
              <Link
                key={doc.id}
                href={`/vault/${doc.id}`}
                className="group flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition duration-200 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50/70 border border-indigo-100/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition overflow-hidden">
                    {doc.frontImage && !doc.frontImage.startsWith('data:application/pdf') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={doc.frontImage} alt={doc.title} className="w-full h-full object-cover" />
                    ) : (
                      getDocIcon(doc.type)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition truncate">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                      {doc.documentNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatDateShort(doc.updatedAt)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Sync footer line */}
        <div className="flex items-center justify-center gap-2 pt-6 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{filtered.length} documents synced &middot; Mobile &amp; web</span>
        </div>
      </div>

      <AddDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </AppShell>
  );
}
