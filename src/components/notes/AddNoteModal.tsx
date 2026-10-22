'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, CheckSquare, Pin, Trash2, Plus, Check, ListChecks } from 'lucide-react';
import { addNote, updateNote, deleteNote } from '@/lib/db';
import type { Note, Priority, NoteChecklistItem } from '@/types';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: () => void;
  initialNote?: Note | null;
}

export function AddNoteModal({ isOpen, onClose, onAdded, initialNote }: AddNoteModalProps) {
  const [noteType, setNoteType] = useState<'note' | 'todo'>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('Today');
  const [category, setCategory] = useState('Personal');
  const [isPinned, setIsPinned] = useState(false);
  const [checklist, setChecklist] = useState<NoteChecklistItem[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state whenever initialNote or isOpen changes
  useEffect(() => {
    if (initialNote) {
      setNoteType(initialNote.noteType || 'note');
      setTitle(initialNote.title || '');
      setContent(initialNote.content || '');
      setPriority(initialNote.priority || 'medium');
      setDueDate(initialNote.dueDate || 'Today');
      setCategory(initialNote.category || 'Personal');
      setIsPinned(!!initialNote.isPinned);

      // Parse checklist
      if (initialNote.checklist && initialNote.checklist.length > 0) {
        setChecklist(initialNote.checklist);
      } else if (initialNote.content && initialNote.content.trim()) {
        const parsed = initialNote.content
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, idx) => ({
            id: `item_${Date.now()}_${idx}`,
            text: line.replace(/^(?:[-*]\s*)?(?:\[[ x]\]\s*|✓\s*)?/i, '').trim() || line,
            isCompleted: line.startsWith('[x]') || line.startsWith('- [x]') || line.startsWith('✓') || !!initialNote.isCompleted,
          }));
        setChecklist(parsed);
      } else {
        setChecklist([]);
      }
    } else {
      setNoteType('note');
      setTitle('');
      setContent('');
      setPriority('medium');
      setDueDate('Today');
      setCategory('Personal');
      setIsPinned(false);
      setChecklist([]);
      setBulkText('');
    }
    setNewChecklistText('');
    setIsBulkMode(false);
    setErrorMessage('');
  }, [initialNote, isOpen]);

  if (!isOpen) return null;

  // Add individual task item
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: NoteChecklistItem = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: newChecklistText.trim(),
      isCompleted: false,
    };
    setChecklist([...checklist, newItem]);
    setNewChecklistText('');
  };

  // Toggle item completed in modal
  const handleToggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, isCompleted: !item.isCompleted } : item))
    );
  };

  // Remove checklist item
  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  // Convert bulk text lines into checklist items
  const handleApplyBulkText = () => {
    if (!bulkText.trim()) {
      setIsBulkMode(false);
      return;
    }
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const newItems: NoteChecklistItem[] = lines.map((line, idx) => ({
      id: `bulk_${Date.now()}_${idx}`,
      text: line,
      isCompleted: false,
    }));
    setChecklist([...checklist, ...newItems]);
    setBulkText('');
    setIsBulkMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      // Determine final content and checklist for todos
      let finalContent = content.trim();
      let finalChecklist = checklist;

      if (noteType === 'todo') {
        // If user typed into the quick add box and clicked submit without pressing enter
        if (newChecklistText.trim()) {
          finalChecklist = [
            ...finalChecklist,
            {
              id: `task_${Date.now()}`,
              text: newChecklistText.trim(),
              isCompleted: false,
            },
          ];
        }

        if (finalChecklist.length > 0) {
          finalContent = finalChecklist.map((c) => c.text).join('\n');
        }
      }

      const allCompleted =
        noteType === 'todo' && finalChecklist.length > 0
          ? finalChecklist.every((c) => c.isCompleted)
          : initialNote?.isCompleted || false;

      if (initialNote && initialNote.id) {
        // Update existing note
        await updateNote(initialNote.id, {
          title: title.trim(),
          content: finalContent,
          noteType,
          priority: noteType === 'todo' ? priority : undefined,
          dueDate: noteType === 'todo' ? dueDate : undefined,
          isPinned,
          isCompleted: allCompleted,
          category: category || 'Personal',
          checklist: noteType === 'todo' ? finalChecklist : undefined,
        });
      } else {
        // Create new note
        await addNote({
          title: title.trim(),
          content: finalContent,
          noteType,
          priority: noteType === 'todo' ? priority : undefined,
          dueDate: noteType === 'todo' ? dueDate : undefined,
          isPinned,
          isCompleted: allCompleted,
          category: category || 'Personal',
          checklist: noteType === 'todo' ? finalChecklist : undefined,
        });
      }

      onAdded?.();
      onClose();
    } catch (err: any) {
      console.error('Failed to save note', err);
      setErrorMessage(err?.message || 'Failed to save note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialNote?.id) return;
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(initialNote.id);
        onAdded?.();
        onClose();
      } catch (err: any) {
        console.error('Failed to delete note', err);
        setErrorMessage(err?.message || 'Failed to delete note.');
      }
    }
  };

  const isEditing = !!initialNote;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              {noteType === 'note' ? <FileText className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
            </div>
            <h2 className="font-bold text-slate-900 text-lg">
              {isEditing
                ? noteType === 'note'
                  ? 'Edit Note'
                  : 'Edit Task'
                : noteType === 'note'
                ? 'Write Note'
                : 'Add To-do Task'}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Type toggle */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setNoteType('note')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              noteType === 'note' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Note
          </button>
          <button
            type="button"
            onClick={() => setNoteType('todo')}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              noteType === 'todo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" /> To-do Task
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              placeholder={noteType === 'note' ? 'e.g. Weekly reset' : 'e.g. Daily routine or Project milestones'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {noteType === 'note' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Thoughts / Content</label>
              <textarea
                rows={5}
                placeholder="Write your thoughts freely..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ListChecks className="w-4 h-4 text-indigo-600" />
                  <span>Tasks Checklist with Checkboxes</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition"
                >
                  {isBulkMode ? 'Hide Paste Box' : '+ Paste multiple lines'}
                </button>
              </div>

              {/* Bulk paste box */}
              {isBulkMode && (
                <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                  <span className="text-[11px] text-slate-500 block font-medium">
                    Paste or type tasks (one per line):
                  </span>
                  <textarea
                    rows={4}
                    placeholder="breakfast&#10;project meeting&#10;call plumber"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBulkMode(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyBulkText}
                      className="px-3 py-1.5 text-xs bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm"
                    >
                      Add Tasks
                    </button>
                  </div>
                </div>
              )}

              {/* Checklist items list */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {checklist.length === 0 && !isBulkMode && (
                  <p className="text-xs text-slate-400 py-1 italic">No tasks added yet. Add tasks below.</p>
                )}
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleChecklistItem(item.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                        item.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                          : 'border-slate-300 hover:border-indigo-500 bg-white'
                      }`}
                    >
                      {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const newText = e.target.value;
                        setChecklist(
                          checklist.map((c) => (c.id === item.id ? { ...c, text: newText } : c))
                        );
                      }}
                      className={`flex-1 bg-transparent text-xs focus:outline-none ${
                        item.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                      title="Remove task"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add single task row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a task item... (Press Enter)"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          )}

          {noteType === 'todo' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="high">🔴 High Priority</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due / Time</label>
                <input
                  type="text"
                  placeholder="e.g. Today, 6:00 PM"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700">Category:</label>
              <input
                type="text"
                placeholder="Personal"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-24 px-2.5 py-1 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                isPinned ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-800' : ''}`} />
              <span>{isPinned ? 'Pinned' : 'Pin to top'}</span>
            </button>
          </div>

          <div className="flex gap-3 pt-2">
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
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Task' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}