'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db, deleteDocument } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { ShareModal } from '@/components/sharing/ShareModal';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  MoreVertical,
  Fingerprint,
  Lock,
  Eye,
  EyeOff,
  Share2,
  Download,
  Trash2,
  Maximize2,
  FileText,
  CreditCard,
  Car,
  BadgeCheck,
  ShieldCheck,
  X,
  Layers,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';
import type { VaultDocument } from '@/types';
import { formatDateShort, formatTime } from '@/lib/utils';

/**
 * Generates a clean, high-resolution single image combining Front & Back sides
 */
async function generateCombinedDualImage(
  frontSrc: string,
  backSrc: string,
  title: string,
  docNumber: string
): Promise<string> {
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const [imgFront, imgBack] = await Promise.all([loadImage(frontSrc), loadImage(backSrc)]);

  const canvas = document.createElement('canvas');
  const pad = 36;
  const targetWidth = Math.max(imgFront.naturalWidth || 900, imgBack.naturalWidth || 900, 1100);

  // Preserve aspect ratios
  const frontH = Math.round(
    (targetWidth * (imgFront.naturalHeight || 600)) / (imgFront.naturalWidth || 900)
  );
  const backH = Math.round(
    (targetWidth * (imgBack.naturalHeight || 600)) / (imgBack.naturalWidth || 900)
  );

  const headerH = 80;
  const labelH = 34;

  canvas.width = targetWidth + pad * 2;
  canvas.height = headerH + labelH + frontH + labelH + backH + pad * 3;

  const ctx = canvas.getContext('2d');
  if (!ctx) return frontSrc;

  // Background
  ctx.fillStyle = '#FAF8F5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top Title banner
  ctx.fillStyle = '#4338CA';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(title.toUpperCase(), pad, 48);

  ctx.fillStyle = '#6B7280';
  ctx.font = '14px monospace';
  ctx.fillText(`ID: ${docNumber} · FRONT & BACK SIDES`, pad, 74);

  let currentY = headerH + pad;

  // Label: FRONT
  ctx.fillStyle = '#4338CA';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('FRONT SIDE', pad, currentY + 20);
  currentY += labelH;

  // Draw Front Image
  ctx.drawImage(imgFront, pad, currentY, targetWidth, frontH);
  currentY += frontH + pad;

  // Label: BACK
  ctx.fillStyle = '#4338CA';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('BACK SIDE', pad, currentY + 20);
  currentY += labelH;

  // Draw Back Image
  ctx.drawImage(imgBack, pad, currentY, targetWidth, backH);

  return canvas.toDataURL('image/png', 0.95);
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { user } = useAuth();
  const [doc, setDoc] = useState<VaultDocument | null>(null);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [viewMode, setViewMode] = useState<'scan' | 'card'>('scan');
  const [isRevealed, setIsRevealed] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Download selection modal state
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);
  const [downloadSuccessToast, setDownloadSuccessToast] = useState('');

  useEffect(() => {
    if (!id) return;
    db.documents.get(id).then((d) => {
      if (d) {
        setDoc(d);
        if (!d.frontImage) {
          setViewMode('card');
        }
      }
    });
  }, [id]);

  if (!doc) {
    return (
      <AppShell activeTab="vault">
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <p className="text-slate-400">Loading document...</p>
        </div>
      </AppShell>
    );
  }

  const hasFrontImage = Boolean(doc.frontImage && !doc.frontImage.startsWith('data:application/pdf'));
  const hasBackImage = Boolean(doc.backImage && !doc.backImage.startsWith('data:application/pdf'));
  const hasBothImages = hasFrontImage && hasBackImage;

  const currentFile = activeSide === 'front' ? doc.frontImage : doc.backImage;
  const isPdf = currentFile?.startsWith('data:application/pdf') || doc.fileName?.toLowerCase().endsWith('.pdf');

  const triggerDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const showToast = (msg: string) => {
    setDownloadSuccessToast(msg);
    setTimeout(() => setDownloadSuccessToast(''), 3000);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to remove this document from your vault?')) {
      await deleteDocument(doc.id!);
      router.push('/vault');
    }
  };

  // 1. Download single side (front or back)
  const handleDownloadSingle = (side: 'front' | 'back') => {
    const targetFile = side === 'front' ? doc.frontImage : doc.backImage;
    if (!targetFile) return;

    const baseName = doc.title.toLowerCase().replace(/\s+/g, '_');
    const ext = targetFile.startsWith('data:application/pdf') ? '.pdf' : '.png';
    triggerDownload(targetFile, `${baseName}_${side}${ext}`);
    setShowDownloadOptions(false);
    showToast(`Downloaded ${side} side`);
  };

  // 2. Download both sides as 2 separate files
  const handleDownloadBothFiles = () => {
    if (!doc.frontImage || !doc.backImage) return;

    const baseName = doc.title.toLowerCase().replace(/\s+/g, '_');
    // Download front
    triggerDownload(doc.frontImage, `${baseName}_front.png`);

    // Download back after short delay so browser triggers both downloads cleanly
    setTimeout(() => {
      triggerDownload(doc.backImage!, `${baseName}_back.png`);
      showToast('Downloaded both sides (2 files)');
    }, 450);

    setShowDownloadOptions(false);
  };

  // 3. Download both sides merged into a single image
  const handleDownloadCombined = async () => {
    if (!doc.frontImage || !doc.backImage) return;

    setIsProcessingDownload(true);
    try {
      const combinedDataUrl = await generateCombinedDualImage(
        doc.frontImage,
        doc.backImage,
        doc.title,
        doc.documentNumber
      );
      const baseName = doc.title.toLowerCase().replace(/\s+/g, '_');
      triggerDownload(combinedDataUrl, `${baseName}_both_sides_combined.png`);
      showToast('Downloaded combined image (both sides)');
    } catch (err) {
      console.error('Failed generating combined dual image', err);
      // Fallback to downloading both separately
      handleDownloadBothFiles();
    } finally {
      setIsProcessingDownload(false);
      setShowDownloadOptions(false);
    }
  };

  // Main Download Button Handler
  const handleDownloadClick = () => {
    if (hasBothImages) {
      setShowDownloadOptions(true);
      return;
    }

    // If only one file exists (or is PDF)
    const targetFile = (activeSide === 'back' && doc.backImage) ? doc.backImage : (doc.frontImage || doc.backImage);
    if (targetFile) {
      const baseName = doc.title.toLowerCase().replace(/\s+/g, '_');
      const ext = targetFile.startsWith('data:application/pdf') ? '.pdf' : '.png';
      triggerDownload(targetFile, `${baseName}${ext}`);
      showToast('Document downloaded');
    } else {
      const content = `Tuck Vault Document\n\nTitle: ${doc.title}\nNumber: ${doc.documentNumber}\nUpdated: ${doc.updatedAt}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${doc.title.toLowerCase().replace(/\s+/g, '_')}.txt`);
      URL.revokeObjectURL(url);
      showToast('Details downloaded');
    }
  };

  return (
    <AppShell activeTab="vault">
      <div className="max-w-md mx-auto px-4 pt-6 pb-24 sm:py-8 space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/vault"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Documents</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 animate-scale-in">
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Document
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title & Metadata */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{doc.title}</h1>
          <p className="text-xs text-slate-500 font-medium">
            Personal identity &middot; Added {formatDateShort(doc.createdAt)}
          </p>
        </div>

        {/* Side toggles and View toggle */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Front / Back Side Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveSide('front')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeSide === 'front' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Front {doc.frontImage && '✓'}
            </button>
            <button
              onClick={() => setActiveSide('back')}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeSide === 'back' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Back {doc.backImage && '✓'}
            </button>
          </div>

          {/* Quick Dual-Side Download Pill */}
          {hasBothImages && (
            <button
              onClick={() => setShowDownloadOptions(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1.5 transition active:scale-95"
              title="Download both sides"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Both</span>
            </button>
          )}

          {/* Toggle between Card / Scan view if uploaded file exists */}
          {doc.frontImage && (
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 text-xs font-semibold ml-auto">
              <button
                onClick={() => setViewMode('scan')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  viewMode === 'scan' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Scan / File
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Digital Card
              </button>
            </div>
          )}

          {currentFile && !isPdf && (
            <button
              onClick={() => setIsZoomOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              title="Expand preview"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* MAIN DISPLAY AREA: Scan View OR Digital Card View */}
        {viewMode === 'scan' && currentFile ? (
          isPdf ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{doc.fileName || 'document.pdf'}</h4>
                <p className="text-xs text-slate-500 mt-0.5">PDF Document stored in your private vault</p>
              </div>
              <button
                onClick={handleDownloadClick}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open / Download PDF</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsZoomOpen(true)}
              className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-lg cursor-pointer bg-slate-900 group aspect-[1.58/1] flex items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentFile}
                alt={`${doc.title} ${activeSide} side`}
                className="w-full h-full object-contain bg-slate-900 group-hover:scale-102 transition duration-300"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                {activeSide} Side
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <span className="px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" /> Tap to zoom
                </span>
              </div>
            </div>
          )
        ) : (
          /* Styled Digital Identity Card (Figma Style) */
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2D2A54] via-[#221F45] to-[#181635] text-white p-6 shadow-2xl shadow-indigo-950/20 aspect-[1.58/1] flex flex-col justify-between">
            {/* Subtle background decoration */}
            <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

            {/* Card Top */}
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[10px] tracking-wider uppercase text-indigo-300 font-bold">
                  {doc.organisation ? doc.organisation.toUpperCase() : 'PERSONAL IDENTITY'}
                </span>
              </div>
              <Fingerprint className="w-7 h-7 text-indigo-300/60" />
            </div>

            {/* Card Middle (Photo placeholder + Name) */}
            <div className="flex items-center gap-3 relative z-10 my-auto">
              <div className="w-12 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/70 overflow-hidden">
                {user?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold tracking-wide uppercase">
                  {isRevealed
                    ? (user?.name?.toUpperCase() || 'DOCUMENT HOLDER')
                    : (user?.name ? `${user.name.split(' ')[0]} ${'•'.repeat(5)}` : '•••••• •••••')}
                </div>
                <div className="w-20 h-1 rounded-full bg-white/20" />
                <div className="w-12 h-1 rounded-full bg-white/10" />
              </div>
            </div>

            {/* Card Bottom: Masked ID + Lock */}
            <div className="flex items-center justify-between relative z-10 pt-2 border-t border-white/10">
              <span className="font-mono text-base tracking-widest font-medium">
                {isRevealed
                  ? doc.documentNumber
                  : (doc.documentNumber.length > 4 ? `•••• •••• ${doc.documentNumber.slice(-4)}` : doc.documentNumber)}
              </span>
              <Lock className="w-4 h-4 text-white/60" />
            </div>
          </div>
        )}

        {/* Reveal Toggle */}
        <div className="text-center">
          <button
            onClick={() => setIsRevealed(!isRevealed)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-50 px-4 py-2 rounded-2xl transition"
          >
            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isRevealed ? 'Hide Details' : 'Reveal Details'}</span>
          </button>
        </div>

        {/* Document Details Block */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Document details</h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase">
              Personal
            </span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm divide-y divide-slate-100">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Document number</span>
              <span className="text-xs font-mono font-semibold text-slate-800">
                {isRevealed
                  ? doc.documentNumber
                  : (doc.documentNumber.length > 4 ? `•••• •••• ${doc.documentNumber.slice(-4)}` : doc.documentNumber)}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">File name</span>
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]">
                {doc.fileName || `${doc.title.toLowerCase().replace(/\s+/g, '_')}.pdf`}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Last updated</span>
              <span className="text-xs font-semibold text-slate-800">
                {formatDateShort(doc.updatedAt)}, {formatTime(doc.updatedAt)}
              </span>
            </div>

            {hasBothImages && (
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Scanned Sides</span>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Front &amp; Back Stored
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed px-1">
            Private and encrypted on your device. Stored offline in IndexedDB; sharing creates a direct P2P link.
          </p>
        </div>

        {/* Action Buttons: Share a copy & Download */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setIsShareOpen(true)}
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Share a copy</span>
          </button>

          <button
            onClick={handleDownloadClick}
            className="flex-1 py-3.5 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-semibold rounded-2xl text-sm border border-slate-200 flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4 text-indigo-600" />
            <span>{hasBothImages ? 'Download Options' : 'Download'}</span>
            {hasBothImages && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>

        {/* Sync Footer */}
        <div className="flex items-center justify-center gap-2 pt-4 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Synced &middot; Available on your phone &amp; web</span>
        </div>
      </div>

      {/* Success Download Toast */}
      {downloadSuccessToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-slide-up">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{downloadSuccessToast}</span>
        </div>
      )}

      {/* Download Options Modal (For Dual-Sided Documents) */}
      {showDownloadOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Download Document</h3>
                  <p className="text-[11px] text-slate-500">Choose download format for both sides</p>
                </div>
              </div>
              <button
                onClick={() => setShowDownloadOptions(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Options list */}
            <div className="space-y-2.5 pt-1">
              {/* Option 1: Both sides as 2 files */}
              <button
                onClick={handleDownloadBothFiles}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition group flex items-start gap-3"
              >
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition">
                    Download Both Sides (2 Images)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Saves both front and back as separate PNG photos
                  </div>
                </div>
              </button>

              {/* Option 2: Combined 1 image with both sides */}
              <button
                onClick={handleDownloadCombined}
                disabled={isProcessingDownload}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition group flex items-start gap-3"
              >
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-105 transition shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-purple-600 transition">
                    {isProcessingDownload ? 'Combining images...' : 'Combined Image (Both Sides in 1)'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    High-res single image with Front &amp; Back stacked for official forms
                  </div>
                </div>
              </button>

              {/* Option 3: Front only */}
              <button
                onClick={() => handleDownloadSingle('front')}
                className="w-full p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 text-left transition flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-700">Download Front Side Only</span>
                <span className="text-[10px] text-slate-400 font-mono">front.png</span>
              </button>

              {/* Option 4: Back only */}
              <button
                onClick={() => handleDownloadSingle('back')}
                className="w-full p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 text-left transition flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-700">Download Back Side Only</span>
                <span className="text-[10px] text-slate-400 font-mono">back.png</span>
              </button>
            </div>

            <button
              onClick={() => setShowDownloadOptions(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-xs transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Zoom Modal for Document Image */}
      {isZoomOpen && currentFile && !isPdf && (
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentFile} alt={doc.title} className="w-full h-full object-contain" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              {activeSide} Side
            </div>
          </div>
        </div>
      )}

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={doc.title}
        type="document"
        data={doc}
      />
    </AppShell>
  );
}
