'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, QrCode, Wifi, Share2, RefreshCw, Smartphone, Laptop, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import type { VaultDocument, Note, SavedLink, TuckList } from '@/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: 'document' | 'note' | 'link' | 'list' | 'sync';
  data?: VaultDocument | Note | SavedLink | TuckList | any;
}

export function ShareModal({ isOpen, onClose, title, type = 'note', data }: ShareModalProps) {
  const { user } = useAuth();
  const { triggerSync, syncStatus, isSyncing, lastSynced } = useSync();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'link' | 'nearby'>('qr');
  const [networkOrigin, setNetworkOrigin] = useState('');

  // Fetch local network IP for cross-device camera QR scanning
  useEffect(() => {
    fetch('/api/network-info')
      .then((res) => res.json())
      .then((info) => {
        if (info?.origin) setNetworkOrigin(info.origin);
      })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  const isFullSync =
    title.toLowerCase().includes('sync') ||
    title.toLowerCase().includes('connect') ||
    type === 'sync';

  // Base origin: prioritize network IP so mobile phone camera scanning works over Wi-Fi
  const baseOrigin =
    typeof window !== 'undefined'
      ? (networkOrigin && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? networkOrigin
        : window.location.origin
      : '';

  // Prepare payload
  let shareUrl = `${baseOrigin}/home`;
  if (!isFullSync && data) {
    const sharePayload = {
      type,
      data,
      sharedAt: new Date().toISOString(),
    };
    const payloadString = JSON.stringify(sharePayload);
    const base64Data = typeof window !== 'undefined' ? btoa(encodeURIComponent(payloadString)) : '';
    shareUrl = `${baseOrigin}/share?data=${base64Data}`;
  }

  const handleCopy = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleManualSync = async () => {
    await triggerSync();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              {isFullSync ? <Smartphone className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg">
                {isFullSync ? 'Sync Across Devices' : `Share "${title}"`}
              </h3>
              <p className="text-xs text-slate-500">
                {isFullSync ? 'Access all your data on phone or laptop' : 'Fast, private sharing'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 text-sm font-medium">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'qr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Scan QR
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'link' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Copy className="w-4 h-4" />
            Device URL
          </button>
          <button
            onClick={() => setActiveTab('nearby')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTab === 'nearby' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wifi className="w-4 h-4" />
            Cloud Sync
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center justify-center py-2 space-y-4">
            <div className="p-4 bg-white rounded-2xl border-2 border-indigo-100 shadow-sm">
              <QRCodeSVG value={shareUrl} size={180} level="M" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-slate-800">
                {isFullSync ? 'Scan to open Tuck on your phone' : `Scan to save this ${type}`}
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                {isFullSync
                  ? 'Open on any phone camera on Wi-Fi, log in with your same Google account, and all documents, notes & lists will sync automatically!'
                  : `Scan with your phone camera to view and import this ${type}.`}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'link' && (
          <div className="space-y-4 py-2">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Open on other device:</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Type or paste this URL in Chrome / Safari on your other device:
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-slate-700 flex-1 outline-none truncate font-mono"
              />
              <button
                onClick={() => handleCopy(shareUrl)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-1">
              <p className="font-semibold">💡 Multi-Device Tip:</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Once opened on your other phone or laptop, sign in with your same Google account (<strong>{user?.email || 'your account'}</strong>) to immediately access all your details.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'nearby' && (
          <div className="space-y-4 py-3">
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">Account Synchronization</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
                  {syncStatus === 'synced' ? 'Synced' : isSyncing ? 'Syncing...' : 'Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Connected account: <span className="font-semibold text-slate-900">{user?.email || 'Not logged in'}</span>
              </p>
              {lastSynced && (
                <p className="text-[11px] text-slate-400">
                  Last cloud sync: {new Date(lastSynced).toLocaleTimeString()}
                </p>
              )}
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing with Cloud...' : 'Sync Now with Cloud'}</span>
            </button>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-1">
              <p className="text-xs font-semibold text-slate-800">Any device, anytime</p>
              <p className="text-[11px] text-slate-500">
                Whenever you add or update documents, notes, lists, or links, they sync automatically across all logged-in devices.
              </p>
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}