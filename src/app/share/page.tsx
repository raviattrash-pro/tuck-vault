'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, addDocument, addNote, addLink, addList } from '@/lib/db';
import { Check, Download, AlertCircle, FileText, Shield, Link2, ListChecks, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ShareReceiverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dataPayload, setDataPayload] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const rawData = searchParams.get('data');
    if (!rawData) {
      setError('No shared data found in link.');
      return;
    }

    try {
      const decodedJson = decodeURIComponent(atob(rawData));
      const parsed = JSON.parse(decodedJson);
      setDataPayload(parsed);
    } catch (e) {
      console.error(e);
      setError('Invalid or corrupted share link.');
    }
  }, [searchParams]);

  const handleSave = async () => {
    if (!dataPayload || !dataPayload.data) return;

    try {
      const { type, data } = dataPayload;
      if (type === 'document') {
        await addDocument(data);
      } else if (type === 'note') {
        await addNote(data);
      } else if (type === 'link') {
        await addLink(data);
      } else if (type === 'list') {
        await addList(data);
      }
      setSaved(true);
      setTimeout(() => {
        router.push('/home');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError('Could not import item into local storage.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-lg text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Cannot Open Shared Item</h2>
          <p className="text-sm text-slate-500">{error}</p>
          <Link
            href="/home"
            className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-semibold hover:bg-indigo-700"
          >
            Go to Tuck Home
          </Link>
        </div>
      </div>
    );
  }

  if (!dataPayload) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const { type, data, sharedAt } = dataPayload;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              {type === 'document' && <Shield className="w-5 h-5" />}
              {type === 'note' && <FileText className="w-5 h-5" />}
              {type === 'link' && <Link2 className="w-5 h-5" />}
              {type === 'list' && <ListChecks className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-600">{type}</span>
              <h2 className="text-xl font-bold text-slate-900">{data.title || data.name || 'Shared item'}</h2>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            {sharedAt ? new Date(sharedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>

        {/* Preview Content */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
          {type === 'document' && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-400">Document Number / Ref</div>
              <div className="text-base font-mono font-medium text-slate-800">{data.documentNumber}</div>
              {data.fileName && <div className="text-xs text-slate-500">File: {data.fileName}</div>}
            </div>
          )}

          {type === 'note' && (
            <div className="space-y-2">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.content}</p>
              {data.priority && (
                <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 uppercase">
                  {data.priority} Priority
                </span>
              )}
            </div>
          )}

          {type === 'link' && (
            <div className="space-y-1">
              <a
                href={data.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-indigo-600 hover:underline break-all"
              >
                {data.url}
              </a>
              {data.description && <p className="text-xs text-slate-500">{data.description}</p>}
            </div>
          )}

          {type === 'list' && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 font-semibold">{data.items?.length || 0} Items</div>
              <div className="space-y-1">
                {data.items?.slice(0, 5).map((it: any) => (
                  <div key={it.id} className="text-xs text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>{it.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" /> Saved to your Tuck!
              </>
            ) : (
              <>
                <Download className="w-5 h-5" /> Save to My Tuck Space
              </>
            )}
          </button>

          <Link
            href="/home"
            className="w-full py-3 rounded-2xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 text-sm flex items-center justify-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Tuck
          </Link>
        </div>

        {/* Viral Growth Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100 p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-indigo-700 font-bold text-xs">
            <span>✨</span>
            <span>Tuck — Your Personal Space</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed max-w-sm mx-auto">
            Store your own Aadhaar, PAN, daily routines, and budgets in a private, 100% offline-ready vault. Free forever.
          </p>
          <div className="pt-1">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm shadow-indigo-100 transition"
            >
              Get Your Free Space &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">Loading...</div>}>
      <ShareReceiverContent />
    </Suspense>
  );
}
