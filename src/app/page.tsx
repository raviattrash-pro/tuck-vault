'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tuck_user');
      if (stored) {
        router.replace('/home');
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-4 py-12 text-center selection:bg-indigo-100">
      <div className="w-full max-w-md mx-auto space-y-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 mx-auto">
          <span className="text-2xl font-bold">☵</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">tuck</h1>
          <p className="text-sm text-slate-600 font-medium max-w-sm mx-auto">
            A calm, private personal vault for identity cards, daily routine checklists, monthly budgets, and curated links.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-600 font-medium">Entering your personal space...</span>
        </div>

        {/* Search Engine Crawlable Fallback & NoScript Navigation */}
        <noscript>
          <div className="pt-6 space-y-3">
            <p className="text-xs text-slate-700">
              JavaScript is required for local offline encryption.
            </p>
            <div className="flex justify-center gap-4 text-xs font-semibold text-indigo-800">
              <Link href="/login" className="underline">Go to Login &amp; Vault</Link>
              <Link href="/share" className="underline">Public Share Portal</Link>
            </div>
          </div>
        </noscript>
      </div>
    </main>
  );
}
