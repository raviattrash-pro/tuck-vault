'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, updateNote, deleteNote, seedInitialDataIfEmpty } from '@/lib/db';
import { AppShell } from '@/components/layout/AppShell';
import { AddNoteModal } from '@/components/notes/AddNoteModal';
import { ShareModal } from '@/components/sharing/ShareModal';
import {
  Plus,
  Pin,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  Edit3,
  Share2,
  Trash2,
  Check,
} from 'lucide-react';
import type { Note, NoteFilter, NoteChecklistItem } from '@/types';

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

export default function NotesPage() {
  const [filter, setFilter] = useState<NoteFilter>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [sharingNote, setSharingNote] = useState<Note | null>(null);

  useEffect(() => {
    seedInitialDataIfEmpty();
  }, []);

  const allNotes = useLiveQuery(async () => {
    const list = await db.notes.filter((n) => !n.isDeleted).toArray();
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, []);

  const notesList = allNotes || [];

  // Pinned items
  const pinnedNotes = notesList.filter((n) => n.isPinned && n.noteType === 'note');
  // Regular notes
  const unpinnedNotes = notesList.filter((n) => !n.isPinned && n.noteType === 'note');
  // Priority To-dos
  const todos = notesList.filter((n) => n.noteType === 'todo');
  const activeTodos = todos.filter((t) => !t.isCompleted);
  const completedTodos = todos.filter((t) => t.isCompleted);

  // Filtered view
  const displayNotes = notesList.filter((n) => {
    if (filter === 'notes') return n.noteType === 'note';
    if (filter === 'todos') return n.noteType === 'todo';
    if (filter === 'pinned') return n.isPinned;
    return true;
  });

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
    <AppShell activeTab="notes">
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
            onClick={() => {
              setSelectedNote(null);
              setIsAddOpen(true);
            }}
            className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-indigo-200 transition"
            aria-label="Add Note"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Room for your thoughts</h1>
          <p className="text-xs text-slate-500 font-medium">
            {notesList.filter((n) => n.noteType === 'note').length} notes &middot; {activeTodos.length} things to focus on today
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {(['all', 'notes', 'todos', 'pinned'] as NoteFilter[]).map((tab) => {
            const isActive = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold capitalize transition whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {tab === 'todos' ? 'To-dos' : tab}
              </button>
            );
          })}
        </div>

        {/* Keep close section (Pinned Notes) */}
        {(filter === 'all' || filter === 'notes' || filter === 'pinned') && pinnedNotes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Keep close</h2>
              <button
                onClick={() => setFilter('notes')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                All {notesList.filter((n) => n.noteType === 'note').length} notes
              </button>
            </div>

            {pinnedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNote(note);
                  setIsAddOpen(true);
                }}
                className="bg-[#FFF8EE] border border-amber-100 hover:border-amber-200 rounded-3xl p-5 space-y-3 relative shadow-sm hover:shadow-md transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">{note.title}</h3>
                  <Pin className="w-4 h-4 text-amber-700 fill-amber-700" />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{note.content}</p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800">
                    {note.category || 'PERSONAL'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingNote(note);
                      }}
                      className="p-1 text-amber-700 hover:text-amber-900 rounded-lg hover:bg-amber-100/50 transition"
                      title="Share Note"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compact Notes list */}
        {(filter === 'all' || filter === 'notes') && unpinnedNotes.length > 0 && (
          <div className="space-y-2">
            {unpinnedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNote(note);
                  setIsAddOpen(true);
                }}
                className="group flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition">{note.title}</h3>
                    <p className="text-xs text-slate-500 truncate">{note.content || 'Tap to view note'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSharingNote(note);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition"
                    title="Share Note"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <div className="p-1 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Today's priorities section */}
        {(filter === 'all' || filter === 'todos') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Today&rsquo;s priorities</h2>
              <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 cursor-pointer">
                <span>By priority</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 shadow-sm overflow-hidden">
              {activeTodos.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">All tasks completed for today!</div>
              ) : (
                activeTodos.map((todo) => {
                  const checklist = getTodoChecklist(todo);
                  const completedSubtasks = checklist.filter((i) => i.isCompleted).length;
                  const totalSubtasks = checklist.length;

                  return (
                    <div
                      key={todo.id}
                      onClick={() => {
                        setSelectedNote(todo);
                        setIsAddOpen(true);
                      }}
                      className="p-4 hover:bg-slate-50/50 transition cursor-pointer group space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTodo(todo);
                            }}
                            className="text-slate-300 hover:text-indigo-600 transition shrink-0"
                            title="Mark all completed"
                          >
                            <Circle className="w-5 h-5 rounded-md" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition">
                                {todo.title}
                              </span>
                              {totalSubtasks > 0 && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                  {completedSubtasks}/{totalSubtasks}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 truncate">{todo.dueDate || 'Today'}</div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-3 flex items-center gap-2">
                          {getPriorityBadge(todo.priority)}
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition" />
                        </div>
                      </div>

                      {/* Interactive checklist sub-tasks */}
                      {totalSubtasks > 0 && (
                        <div className="pl-8 pr-1 space-y-1.5 pt-1 border-t border-slate-100/70">
                          {checklist.map((subItem) => (
                            <div
                              key={subItem.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSubtask(todo, subItem.id);
                              }}
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
          </div>
        )}

        {/* Completed Todos line */}
        {completedTodos.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>
              {completedTodos.length} completed today &middot; {completedTodos[0].title}
            </span>
          </div>
        )}

        {/* Sync status */}
        <div className="flex items-center justify-center gap-2 pt-4 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Thoughts saved. Everything synced.</span>
        </div>
      </div>

      <AddNoteModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setSelectedNote(null);
        }}
        initialNote={selectedNote}
      />

      {sharingNote && (
        <ShareModal
          isOpen={!!sharingNote}
          onClose={() => setSharingNote(null)}
          title={sharingNote.title}
          type="note"
          data={sharingNote}
        />
      )}
    </AppShell>
  );
}
