'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { clearAllData } from '@/lib/db';
import { X, User, LogOut, Trash2, Check, Shield, Star, ExternalLink } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const router = useRouter();
  const { user, updateName, logout } = useAuth();
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    updateName(nameInput.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleLogout = () => {
    logout();
    onClose();
    router.replace('/login');
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear all documents, notes, links and lists? This cannot be undone.')) {
      await clearAllData();
      alert('All local space data has been cleared.');
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-in">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-slate-900 text-base">Your Profile &amp; Space</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base shrink-0 overflow-hidden">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.name ? user.name.slice(0, 2).toUpperCase() : '👤'}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-sm truncate">{user?.name || 'Guest User'}</h3>
            <p className="text-xs text-slate-500 truncate">{user?.email || 'Offline account'}</p>
          </div>
        </div>

        {/* Edit Display Name Form */}
        <form onSubmit={handleSaveName} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Change Display Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 transition"
          >
            {saved ? <Check className="w-4 h-4" /> : null}
            <span>{saved ? 'Name Updated!' : 'Save Display Name'}</span>
          </button>
        </form>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <a
            href="https://github.com/raviattrash-pro/tuck-vault"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100/90 text-amber-900 border border-amber-200/80 font-semibold rounded-2xl text-xs flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
              <span>Star tuck-vault on GitHub</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 transition" />
          </a>

          <button
            type="button"
            onClick={handleClearAll}
            className="w-full py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-2xl flex items-center justify-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset / Clear All Stored Data</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-2xl flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
