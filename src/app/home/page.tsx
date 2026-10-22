'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfEmpty, updateNote } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { ShareModal } from '@/components/sharing/ShareModal';
import { AddDocumentModal } from '@/components/vault/AddDocumentModal';
import { AddNoteModal } from '@/components/notes/AddNoteModal';
import { AddLinkModal } from '@/components/links/AddLinkModal';
import { AddListModal } from '@/components/lists/AddListModal';
import { UserProfileModal } from '@/components/layout/UserProfileModal';
import {
  Shield,
  FileEdit,
  Link2,
  ListChecks,
  Radio,
  QrCode,
  ArrowUpRight,
  Circle,
  CheckCircle2,
  ChevronRight,
  Plus,
  Search,
  BookOpen,
  TrendingUp,
  Utensils,
  Lock,
  Smartphone,
  Wallet,
  Calendar,
  Globe,
  Check,
} from 'lucide-react';
import { getGreeting, formatDateLong } from '@/lib/utils';
import type { Note, NoteChecklistItem } from '@/types';

function getTodoChecklist(todo: Note): NoteChecklistItem[] {
  if (todo.checklist && todo.checklist.length > 0) {
    return todo.checklist;
  }
  if (todo.content && todo.content.trim()) {
    return todo.content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, idx) => ({
        id: `item_${idx}_${line.slice(0, 10)}`,
        text: line.replace(/^(?:[-*]\s*)?(?:\[[ x]\]\s*|✓\s*)?/i, '').trim() || line,
        isCompleted: line.startsWith('[x]') || line.startsWith('- [x]') || line.startsWith('✓') || !!todo.isCompleted,
      }));
  }
  return [];
}

export default function HomePage() {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [isTuckMenuOpen, setIsTuckMenuOpen] = useState(false);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [isAddListOpen, setIsAddListOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Authentication guard
  useEffect(() => {
    seedInitialDataIfEmpty();
    if (hydrated && !user) {
      router.replace('/login');
    }
  }, [user, hydrated, router]);

  // Reactive DB queries
  const documents = useLiveQuery(() => db.documents.filter((d) => !d.isDeleted).toArray(), []);
  const notes = useLiveQuery(() => db.notes.filter((n) => !n.isDeleted).toArray(), []);
  const links = useLiveQuery(() => db.links.filter((l) => !l.isDeleted).toArray(), []);
  const lists = useLiveQuery(() => db.lists.filter((l) => !l.isDeleted).toArray(), []);

  const docCount = documents?.length ?? 0;
  const noteItems = notes?.filter((n) => n.noteType === 'note') || [];
  const todoItems = notes?.filter((n) => n.noteType === 'todo') || [];
  const linkCount = links?.length ?? 0;
  const listCount = lists?.length ?? 0;

  const todayTodos = todoItems.filter((t) => !t.isCompleted).slice(0, 3);
  const pinnedNotes = noteItems.filter((n) => n.isPinned);
  const pinnedNote = pinnedNotes[0] || noteItems[0];
  const budgetList = lists?.find((l) => l.category === 'budget' || l.category === 'investment');
  const groceryList = lists?.find((l) => l.category === 'grocery');

  const displayName = user?.name ? user.name.split(' ')[0] : '';

  const handleToggleSubtask = async (todo: Note, subtaskId: string) => {
    const currentChecklist = getTodoChecklist(todo);
    const updatedChecklist = currentChecklist.map((item) =>
      item.id === subtaskId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    const allCompleted = updatedChecklist.length > 0 && updatedChecklist.every((i) => i.isCompleted);
    await updateNote(todo.id!, {
      checklist: updatedChecklist,
      isCompleted: allCompleted,
      content: updatedChecklist.map((c) => c.text).join('\n'),
    });
  };

  const handleToggleTodo = async (todo: Note) => {
    const newCompleted = !todo.isCompleted;
    const currentChecklist = getTodoChecklist(todo);
    const updatedChecklist = currentChecklist.map((item) => ({
      ...item,
      isCompleted: newCompleted,
    }));
    await updateNote(todo.id!, {
      isCompleted: newCompleted,
      checklist: updatedChecklist.length > 0 ? updatedChecklist : undefined,
    });
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">High</span>;
      case 'medium':
        return <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">Medium</span>;
      case 'low':
        return <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Low</span>;
      default:
        return null;
    }
  };

  return (
    <AppShell activeTab="home">
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-24 sm:py-8 space-y-7">
        {/* Top desktop header bar */}
        <div className="hidden lg:flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search your personal space   ⌘ K"
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All changes synced</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsTuckMenuOpen(!isTuckMenuOpen)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-200 transition"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Tuck something away</span>
              </button>

              {isTuckMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30 animate-scale-in">
                  <button
                    onClick={() => {
                      setIsAddDocOpen(true);
                      setIsTuckMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" /> Add Document
                  </button>
                  <button
                    onClick={() => {
                      setIsAddNoteOpen(true);
                      setIsTuckMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <FileEdit className="w-4 h-4" /> Add Note or Task
                  </button>
                  <button
                    onClick={() => {
                      setIsAddLinkOpen(true);
                      setIsTuckMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" /> Save Link
                  </button>
                  <button
                    onClick={() => {
                      setIsAddListOpen(true);
                      setIsTuckMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <ListChecks className="w-4 h-4" /> Create List
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile top bar with Add Button and Profile */}
        <div className="flex lg:hidden items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200">
              ☵
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">tuck</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Add Dropdown on Mobile */}
            <div className="relative">
              <button
                onClick={() => setIsTuckMenuOpen(!isTuckMenuOpen)}
                className="w-9 h-9 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-md shadow-indigo-200 transition"
                aria-label="Add item"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </button>

              {isTuckMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-scale-in">
                  <button
                    onClick={() => {
                      setIsAddDocOpen(true);
                      setIsTuckMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5"
                  >
                    <Shield className="w-4 h-4 text-indigo-600 shrink-0" /> Add Document
                  </button>
                  <button
                    onClick={() => {
                      setIsAddNoteOpen(true);
                      setIsTuckMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5"
                  >
                    <FileEdit className="w-4 h-4 text-amber-500 shrink-0" /> Add Note or Task
                  </button>
                  <button
                    onClick={() => {
                      setIsAddLinkOpen(true);
                      setIsTuckMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5"
                  >
                    <Link2 className="w-4 h-4 text-emerald-500 shrink-0" /> Save Link
                  </button>
                  <button
                    onClick={() => {
                      setIsAddListOpen(true);
                      setIsTuckMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5"
                  >
                    <ListChecks className="w-4 h-4 text-purple-500 shrink-0" /> Create List / Budget
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center overflow-hidden"
              title="Profile & Settings"
            >
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name ? user.name.slice(0, 2).toUpperCase() : '👤'}</span>
              )}
            </button>
          </div>
        </div>

        {/* Greeting Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
              {formatDateLong().toUpperCase()}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {getGreeting()}{displayName ? `, ${displayName}` : ''}.
            </h1>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Synced just now &middot; Private on this device</span>
            </p>
          </div>

          {/* User profile action pill (desktop) */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="hidden sm:flex items-center gap-3 bg-[#EEF2FF] hover:bg-indigo-100/70 border border-indigo-100 px-4 py-2.5 rounded-2xl text-left transition group"
          >
            <div className="w-8 h-8 rounded-full bg-white text-indigo-600 font-bold text-xs flex items-center justify-center shadow-sm overflow-hidden shrink-0">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name ? user.name.slice(0, 2).toUpperCase() : '👤'}</span>
              )}
            </div>
            <div className="text-xs">
              <div className="font-semibold text-indigo-950 group-hover:text-indigo-600 transition truncate max-w-[180px]">
                {user?.name || 'Personal Space'}
              </div>
              <div className="text-[11px] text-indigo-700/80">Click to change name or log out</div>
            </div>
          </button>
        </div>

        {/* Quick Action Buttons (Nearby & Scan QR) */}
        <div className="grid grid-cols-2 gap-3.5 sm:max-w-md">
          <button
            onClick={() => setIsNearbyModalOpen(true)}
            className="flex items-center gap-3 p-3.5 bg-[#EEF2FF] hover:bg-indigo-100/70 border border-indigo-100 rounded-2xl text-left transition group active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition">
              <Radio className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-xs sm:text-sm">Nearby</div>
              <div className="text-[11px] text-indigo-600/80 truncate">Share with a device</div>
            </div>
          </button>

          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center gap-3 p-3.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-left transition group active:scale-[0.98] shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-xs sm:text-sm">Scan QR</div>
              <div className="text-[11px] text-slate-500 truncate">Connect or save</div>
            </div>
          </button>
        </div>

        {/* "Your space" 4 Hub Cards with Real Live Counts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Your space</h2>
            <Link href="/vault" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Search all
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Documents */}
            <div className="group p-4 sm:p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Link
                  href="/vault"
                  className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition"
                >
                  <Shield className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsAddDocOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                    title="Add document"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <Link href="/vault" className="p-1">
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                  </Link>
                </div>
              </div>
              <Link href="/vault" className="mt-4 block">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-indigo-600 transition">
                  Documents
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{docCount} safely stored</p>
              </Link>
            </div>

            {/* Notes & tasks */}
            <div className="group p-4 sm:p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-100 transition duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Link
                  href="/notes"
                  className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition"
                >
                  <FileEdit className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsAddNoteOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                    title="Add note or task"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <Link href="/notes" className="p-1">
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                  </Link>
                </div>
              </div>
              <Link href="/notes" className="mt-4 block">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-amber-600 transition">
                  Notes &amp; tasks
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {noteItems.length} notes &middot; {todoItems.filter((t) => !t.isCompleted).length} tasks today
                </p>
              </Link>
            </div>

            {/* Saved links */}
            <div className="group p-4 sm:p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Link
                  href="/links"
                  className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition"
                >
                  <Link2 className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsAddLinkOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                    title="Save link"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <Link href="/links" className="p-1">
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                  </Link>
                </div>
              </div>
              <Link href="/links" className="mt-4 block">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-emerald-600 transition">
                  Saved links
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{linkCount} things worth keeping</p>
              </Link>
            </div>

            {/* Lists */}
            <div className="group p-4 sm:p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-100 transition duration-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Link
                  href="/lists"
                  className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition"
                >
                  <ListChecks className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsAddListOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition"
                    title="Create list"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <Link href="/lists" className="p-1">
                    <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                  </Link>
                </div>
              </div>
              <Link href="/lists" className="mt-4 block">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-purple-600 transition">
                  Lists
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{listCount} lists for everyday life</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Two-column layout for desktop: Focus on left, Widgets on right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column: A little focus for today */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">A little focus for today</h2>
              <Link href="/notes" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View all
              </Link>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 shadow-sm overflow-hidden">
              {todayTodos.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">No active tasks for today</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Add to-dos with priorities to keep your day focused</p>
                  </div>
                  <button
                    onClick={() => setIsAddNoteOpen(true)}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-xl transition"
                  >
                    + Add Today&rsquo;s Task
                  </button>
                </div>
              ) : (
                todayTodos.map((todo) => {
                  const checklist = getTodoChecklist(todo);
                  const completedSubtasks = checklist.filter((i) => i.isCompleted).length;
                  const totalSubtasks = checklist.length;

                  return (
                    <div
                      key={todo.id}
                      className="p-4 hover:bg-slate-50/50 transition space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleTodo(todo)}
                            className="text-slate-300 hover:text-indigo-600 transition shrink-0"
                            title="Mark all completed"
                          >
                            <Circle className="w-5 h-5 rounded-md" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900 truncate">
                                {todo.title}
                              </span>
                              {totalSubtasks > 0 && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                  {completedSubtasks}/{totalSubtasks}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 truncate">{todo.dueDate || 'Today'}</div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-3">
                          {getPriorityBadge(todo.priority)}
                        </div>
                      </div>

                      {/* Interactive checklist sub-tasks on home page */}
                      {totalSubtasks > 0 && (
                        <div className="pl-8 pr-1 space-y-1.5 pt-1 border-t border-slate-100/70">
                          {checklist.map((subItem) => (
                            <div
                              key={subItem.id}
                              onClick={() => handleToggleSubtask(todo, subItem.id)}
                              className="flex items-center gap-2.5 py-1 px-2 -mx-2 rounded-xl hover:bg-slate-100/80 transition cursor-pointer group/item"
                            >
                              <button
                                type="button"
                                className={`w-4 h-4 rounded flex items-center justify-center border transition shrink-0 ${
                                  subItem.isCompleted
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300 hover:border-indigo-500 bg-white'
                                }`}
                              >
                                {subItem.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              <span
                                className={`text-xs transition flex-1 ${
                                  subItem.isCompleted
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-700 font-medium'
                                }`}
                              >
                                {subItem.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Keep Close section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Keep close</h2>
                <Link href="/notes" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  View all &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pinned note */}
                {pinnedNote ? (
                  <div className="bg-[#FFF8EE] border border-amber-100 rounded-3xl p-5 space-y-3 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{pinnedNote.title}</h3>
                        <span className="text-amber-700 font-bold text-xs">📌</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                        {pinnedNote.content}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-amber-200/40 text-[10px] text-amber-900/60 font-semibold uppercase">
                      <span>{pinnedNote.category || 'PERSONAL'}</span>
                      <span>Pinned</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center space-y-2 flex flex-col items-center justify-center">
                    <p className="text-xs font-semibold text-slate-700">No pinned notes</p>
                    <p className="text-[11px] text-slate-400">Pin important thoughts to keep them close</p>
                    <button
                      onClick={() => setIsAddNoteOpen(true)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl"
                    >
                      + Write Note
                    </button>
                  </div>
                )}

                {/* Grocery quick card */}
                {groceryList ? (
                  <Link
                    href={`/lists/${groceryList.id}`}
                    className="bg-[#F0FDF4] border border-emerald-100 rounded-3xl p-5 space-y-3 shadow-sm hover:border-emerald-200 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{groceryList.name}</h3>
                        <span className="text-emerald-700 text-xs">🛒</span>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        {groceryList.items.slice(0, 3).map((it) => (
                          <div key={it.id} className="text-xs text-slate-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="truncate">{it.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-800 font-semibold pt-2 border-t border-emerald-200/40">
                      {groceryList.items.filter((i) => i.isChecked).length} checked off &middot;{' '}
                      {groceryList.items.filter((i) => !i.isChecked).length} left to pick up
                    </div>
                  </Link>
                ) : (
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center space-y-2 flex flex-col items-center justify-center">
                    <p className="text-xs font-semibold text-slate-700">No checklists created</p>
                    <p className="text-[11px] text-slate-400">Make everyday grocery or shopping lists</p>
                    <button
                      onClick={() => setIsAddListOpen(true)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl"
                    >
                      + Create List
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: Budget + Safely Stored Widget */}
          <div className="space-y-4">
            {/* Real Budget widget */}
            {budgetList ? (
              <Link
                href={`/lists/${budgetList.id}`}
                className="block group bg-gradient-to-br from-[#3D3A84] to-[#2B2762] text-white rounded-3xl p-5 shadow-lg shadow-indigo-950/20 hover:scale-[1.01] transition duration-200"
              >
                <div className="flex items-center justify-between text-indigo-200 text-xs font-medium">
                  <span className="truncate">{budgetList.name}</span>
                  <ArrowUpRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0" />
                </div>

                {(() => {
                  const spent = budgetList.items
                    .filter((i) => i.isChecked && i.amount)
                    .reduce((acc, i) => acc + (i.amount || 0), 0);
                  const target = budgetList.plannedAmount || 1;
                  const pct = Math.min(100, Math.round((spent / target) * 100));
                  return (
                    <>
                      <div className="text-3xl font-extrabold mt-3 tracking-tight">
                        {budgetList.currency || '₹'}{spent.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-indigo-200/80 mt-0.5">
                        of {budgetList.currency || '₹'}{target.toLocaleString('en-IN')} planned
                      </div>

                      <div className="mt-5 space-y-2">
                        <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                          <div className="bg-white h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-indigo-200 font-medium">
                          <span>
                            {budgetList.currency || '₹'}
                            {Math.max(0, target - spent).toLocaleString('en-IN')} left
                          </span>
                          <span>{pct}% used</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </Link>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Monthly Budget</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Track monthly expenses &amp; targets</p>
                </div>
                <button
                  onClick={() => setIsAddListOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition"
                >
                  + Set Up Budget
                </button>
              </div>
            )}

            {/* Safely stored card (Real Vault Documents) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Safely stored</h3>
                <Link href="/vault" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  Vault &rarr;
                </Link>
              </div>

              {documents && documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.slice(0, 3).map((d) => (
                    <Link
                      key={d.id}
                      href={`/vault/${d.id}`}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 transition group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs shrink-0">
                          🪪
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 truncate">
                            {d.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {d.documentNumber}
                          </div>
                        </div>
                      </div>
                      <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <p className="text-xs font-semibold text-slate-700">No documents stored</p>
                  <p className="text-[11px] text-slate-400">Save your PAN, Aadhaar, IDs safely</p>
                  <button
                    onClick={() => setIsAddDocOpen(true)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-xl"
                  >
                    + Add Document
                  </button>
                </div>
              )}

              <p className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-50">
                Private by default. Masked on every device.
              </p>
            </div>
          </div>
        </div>

        {/* "Worth coming back to" Real Saved Links */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Worth coming back to</h2>
            <Link href="/links" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              All {linkCount} saved links &rarr;
            </Link>
          </div>

          {links && links.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {links.slice(0, 3).map((item, idx) => (
                <a
                  key={item.id || idx}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow hover:border-indigo-100 transition group flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {item.domain || 'link'} &middot; {item.category || 'General'}
                    </p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 shrink-0" />
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center space-y-2">
              <p className="text-xs font-semibold text-slate-700">No saved links yet</p>
              <p className="text-[11px] text-slate-400">Save recipes, articles, investing guides or tools</p>
              <button
                onClick={() => setIsAddLinkOpen(true)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-xl"
              >
                + Save First Link
              </button>
            </div>
          )}
        </div>

        {/* Footer info line */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-200/50">
          <span>A place for the things that make up your life.</span>
          <span>Zero cloud leak &middot; 100% offline private</span>
        </div>
      </div>

      {/* Modals */}
      <AddDocumentModal
        isOpen={isAddDocOpen}
        onClose={() => setIsAddDocOpen(false)}
      />

      <AddNoteModal
        isOpen={isAddNoteOpen}
        onClose={() => setIsAddNoteOpen(false)}
      />

      <AddLinkModal
        isOpen={isAddLinkOpen}
        onClose={() => setIsAddLinkOpen(false)}
      />

      <AddListModal
        isOpen={isAddListOpen}
        onClose={() => setIsAddListOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Nearby Share Modal */}
      {isNearbyModalOpen && (
        <ShareModal
          isOpen={isNearbyModalOpen}
          onClose={() => setIsNearbyModalOpen(false)}
          title="Tuck Quick Sync"
          type="sync"
        />
      )}

      {/* Scan QR Modal */}
      {isQrModalOpen && (
        <ShareModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          title="Scan to Connect"
          type="sync"
        />
      )}
    </AppShell>
  );
}
