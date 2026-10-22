'use client';

import React, { useState } from 'react';
import { X, Upload, Shield, Building2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { addDocument } from '@/lib/db';
import type { DocumentType } from '@/types';
import { DOCUMENT_TYPE_META } from '@/types';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

/**
 * Safely converts file to base64 with auto-compression for large images (> 1.5MB)
 */
async function processUploadFile(file: File): Promise<{ base64: string; fileName: string }> {
  // If it's a PDF or small file, read directly
  if (file.type === 'application/pdf' || file.size < 1.5 * 1024 * 1024) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ base64: reader.result as string, fileName: file.name });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Compress large images using canvas
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({ base64: e.target?.result as string, fileName: file.name });
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ base64: compressedBase64, fileName: file.name });
      };
      img.onerror = () => resolve({ base64: e.target?.result as string, fileName: file.name });
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AddDocumentModal({ isOpen, onClose, onAdded }: AddDocumentModalProps) {
  const [type, setType] = useState<DocumentType>('aadhaar');
  const [title, setTitle] = useState('Aadhaar card');
  const [docNumber, setDocNumber] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [frontImage, setFrontImage] = useState<string | undefined>();
  const [backImage, setBackImage] = useState<string | undefined>();
  const [fileName, setFileName] = useState('');
  const [backFileName, setBackFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleTypeChange = (selected: DocumentType) => {
    setType(selected);
    setTitle(DOCUMENT_TYPE_META[selected]?.label || 'Document');
    setErrorMessage('');
  };

  const handleFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processUploadFile(file);
      setFileName(processed.fileName);
      setFrontImage(processed.base64);
      setErrorMessage('');
    } catch (err) {
      console.error('Front file upload failed', err);
      setErrorMessage('Could not process the uploaded file. Please try a different image or PDF.');
    }
  };

  const handleBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processUploadFile(file);
      setBackFileName(processed.fileName);
      setBackImage(processed.base64);
      setErrorMessage('');
    } catch (err) {
      console.error('Back file upload failed', err);
      setErrorMessage('Could not process the uploaded file. Please try a different image or PDF.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const resolvedTitle = title.trim() || DOCUMENT_TYPE_META[type]?.label || 'Document';
    const resolvedNumber = docNumber.trim() || `DOC-${Math.floor(100000 + Math.random() * 900000)}`;

    setIsSubmitting(true);
    try {
      await addDocument({
        type,
        title: resolvedTitle,
        documentNumber: resolvedNumber,
        organisation: type === 'office_id' ? organisation.trim() : undefined,
        frontImage,
        backImage,
        fileName: fileName || `${resolvedTitle.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        tags: [type, 'personal'],
      });

      // Clear state
      setType('aadhaar');
      setTitle('Aadhaar card');
      setDocNumber('');
      setOrganisation('');
      setFrontImage(undefined);
      setBackImage(undefined);
      setFileName('');
      setBackFileName('');

      onAdded?.();
      onClose();
    } catch (err) {
      console.error('Failed to add document', err);
      setErrorMessage('Failed to save document. Please check your storage or try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPdf = (dataUrl?: string, name?: string) => {
    return dataUrl?.startsWith('data:application/pdf') || name?.toLowerCase().endsWith('.pdf');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Add to Personal Vault</h2>
              <p className="text-xs text-slate-500">Stored privately &amp; offline in your browser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Document Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(DOCUMENT_TYPE_META) as DocumentType[]).map((key) => {
                const meta = DOCUMENT_TYPE_META[key];
                const isSelected = type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTypeChange(key)}
                    className={`p-2.5 rounded-2xl text-left border text-xs font-semibold flex items-center gap-2 transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Aadhaar, Driving License"
              required
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Document number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Document Number / Card ID
              </label>
              <span className="text-[11px] text-slate-400">Optional</span>
            </div>
            <input
              type="text"
              placeholder="e.g. 4821 9923 1102 (auto-generated if empty)"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Organisation for office ID */}
          {type === 'office_id' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Studio</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Northstar Studio"
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Image & Document Uploads */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Front upload */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Front Scan / File</label>
                {frontImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setFrontImage(undefined);
                      setFileName('');
                    }}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl cursor-pointer bg-slate-50 overflow-hidden relative group">
                {frontImage ? (
                  isPdf(frontImage, fileName) ? (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-indigo-700">
                      <FileText className="w-8 h-8 text-indigo-600 mb-1" />
                      <span className="text-[11px] font-semibold truncate max-w-[120px]">{fileName}</span>
                      <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> PDF ready
                      </span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={frontImage} alt="Front preview" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="flex flex-col items-center text-slate-400 text-xs text-center px-2">
                    <Upload className="w-5 h-5 mb-1 text-slate-400" />
                    <span>Upload image or PDF</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFrontUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Back upload */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Back Scan (Optional)</label>
                {backImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setBackImage(undefined);
                      setBackFileName('');
                    }}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl cursor-pointer bg-slate-50 overflow-hidden relative group">
                {backImage ? (
                  isPdf(backImage, backFileName) ? (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-indigo-700">
                      <FileText className="w-8 h-8 text-indigo-600 mb-1" />
                      <span className="text-[11px] font-semibold truncate max-w-[120px]">{backFileName}</span>
                      <span className="text-[10px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> PDF ready
                      </span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={backImage} alt="Back preview" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="flex flex-col items-center text-slate-400 text-xs text-center px-2">
                    <Upload className="w-5 h-5 mb-1 text-slate-400" />
                    <span>Upload back</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleBackUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-sm shadow-md shadow-indigo-200 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
