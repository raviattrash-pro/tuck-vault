// ============================================================================
// Tuck App — IndexedDB Database (Dexie.js)
// Offline-first local storage with reactive queries
// ============================================================================

import Dexie, { type Table } from 'dexie';
import type { VaultDocument, Note, SavedLink, TuckList } from '@/types';
import { v4 as uuid } from 'uuid';

export class TuckDB extends Dexie {
  documents!: Table<VaultDocument, string>;
  notes!: Table<Note, string>;
  links!: Table<SavedLink, string>;
  lists!: Table<TuckList, string>;

  constructor() {
    super('TuckDB');

    this.version(20).stores({
      documents: 'id, type, title, updatedAt, syncStatus, isDeleted',
      notes:     'id, noteType, priority, isPinned, isCompleted, updatedAt, syncStatus, isDeleted, dueDate',
      links:     'id, domain, category, updatedAt, syncStatus, isDeleted',
      lists:     'id, category, updatedAt, syncStatus, isDeleted',
    });
  }
}

export const db = new TuckDB();

// Automatically handle legacy version locks or corrupted schemas
if (typeof window !== 'undefined') {
  db.open().catch(async (err) => {
    console.warn('Dexie open error, auto-recovering:', err);
    if (err?.name === 'VersionError' || err?.name === 'UpgradeError' || err?.name === 'DatabaseClosedError') {
      try {
        await Dexie.delete('TuckDB');
        await db.open();
        console.log('TuckDB recovered successfully');
      } catch (e) {
        console.error('Failed auto-recovering TuckDB', e);
      }
    }
  });
}

// ============================================================================
// Helper: generate a new record with defaults
// ============================================================================

function safeId(): string {
  try {
    if (typeof crypto !== 'undefined') {
      if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
      if (typeof crypto.getRandomValues === 'function') {
        const b = new Uint8Array(16);
        crypto.getRandomValues(b);
        return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
      }
    }
  } catch {}
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

function baseDefaults() {
  const now = new Date().toISOString();
  return { id: safeId(), createdAt: now, updatedAt: now, syncStatus: 'pending' as const, isDeleted: false };
}

// ============================================================================
// DOCUMENTS (Vault)
// ============================================================================

export async function addDocument(doc: Omit<VaultDocument, keyof ReturnType<typeof baseDefaults>>) {
  const record: VaultDocument = { ...baseDefaults(), ...doc };
  await db.documents.add(record);
  return record;
}

export async function updateDocument(id: string, changes: Partial<VaultDocument>) {
  await db.documents.update(id, { ...changes, updatedAt: new Date().toISOString(), syncStatus: 'pending' });
}

export async function deleteDocument(id: string) {
  await db.documents.update(id, { isDeleted: true, updatedAt: new Date().toISOString(), syncStatus: 'pending' });
}

export async function getDocuments() {
  const list = await db.documents.filter((d) => !d.isDeleted).toArray();
  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getDocument(id: string) {
  return db.documents.get(id);
}

// ============================================================================
// NOTES
// ============================================================================

export async function addNote(note: Omit<Note, keyof ReturnType<typeof baseDefaults>>) {
  const record: Note = { ...baseDefaults(), ...note };
  await db.notes.add(record);
  return record;
}

export async function updateNote(id: string, changes: Partial<Note>) {
  await db.notes.update(id, { ...changes, updatedAt: new Date().toISOString(), syncStatus: 'pending' });
}

export async function deleteNote(id: string) {
  await db.notes.update(id, { isDeleted: true, updatedAt: new Date().toISOString(), syncStatus: 'pending' });
}

export async function getNotes() {
  const list = await db.notes.filter((n) => !n.isDeleted).toArray();
  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getNote(id: string) {
  return db.notes.get(id);
}

// ============================================================================
// LINKS
// ============================================================================

export async function addLink(link: Omit<SavedLink, keyof ReturnType<typeof baseDefaults>>) {
  const record: SavedLink = { ...baseDefaults(), ...link };
  await db.links.add(record);
  return record;
}

export async function updateLink(id: string, changes: Partial<SavedLink>) {
  await db.links.update(id, { ...changes, updatedAt: new Date().toISOString(), syncStatus: 'pending' });
}

export async function deleteLink(id: string) {
  await db.links.update(id, { isDeleted: true, updatedAt: new Date().toISOString(), syncStatus: 'pending' });
}

export async function getLinks() {
  const list = await db.links.filter((l) => !l.isDeleted).toArray();
  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

// ============================================================================
// LISTS
// ============================================================================

export async function addList(list: Omit<TuckList, keyof ReturnType<typeof baseDefaults>>) {
  const record: TuckList = { ...baseDefaults(), ...list };
  await db.lists.add(record);
  return record;
}

export async function updateList(id: string, changes: Partial<TuckList>) {
  await db.lists.update(id, { ...changes, updatedAt: new Date().toISOString(), syncStatus: 'pending' });
}

export async function deleteList(id: string) {
  await db.lists.update(id, { isDeleted: true, updatedAt: new Date().toISOString(), syncStatus: 'pending' });
}

export async function getLists() {
  const list = await db.lists.filter((l) => !l.isDeleted).toArray();
  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getList(id: string) {
  return db.lists.get(id);
}

// ============================================================================
// STATS (for Home page)
// ============================================================================

export async function getAppStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const [documents, notes, links, lists] = await Promise.all([
    db.documents.filter((d) => !d.isDeleted).count(),
    db.notes.filter((n) => !n.isDeleted).toArray(),
    db.links.filter((l) => !l.isDeleted).count(),
    db.lists.filter((l) => !l.isDeleted).count(),
  ]);

  const noteItems = notes.filter(n => !n.isDeleted);
  const noteCount = noteItems.filter(n => n.noteType === 'note').length;
  const todoCount = noteItems.filter(n => n.noteType === 'todo').length;
  const todayTodoCount = noteItems.filter(
    n => n.noteType === 'todo' && !n.isCompleted && n.dueDate && n.dueDate >= todayStr
  ).length;

  return { documentCount: documents, noteCount, todoCount, todayTodoCount, linkCount: links, listCount: lists };
}

// ============================================================================
// FULL EXPORT / IMPORT (for sync)
// ============================================================================

export async function exportAllData() {
  const [documents, notes, links, lists] = await Promise.all([
    db.documents.toArray(),
    db.notes.toArray(),
    db.links.toArray(),
    db.lists.toArray(),
  ]);
  return { version: 1, timestamp: new Date().toISOString(), documents, notes, links, lists };
}

export async function importAllData(data: { documents: VaultDocument[]; notes: Note[]; links: SavedLink[]; lists: TuckList[] }) {
  await db.transaction('rw', db.documents, db.notes, db.links, db.lists, async () => {
    // Merge strategy: incoming data wins if updatedAt is newer
    for (const doc of data.documents) {
      const existing = await db.documents.get(doc.id!);
      if (!existing || doc.updatedAt > existing.updatedAt) {
        await db.documents.put({ ...doc, syncStatus: 'synced' });
      }
    }
    for (const note of data.notes) {
      const existing = await db.notes.get(note.id!);
      if (!existing || note.updatedAt > existing.updatedAt) {
        await db.notes.put({ ...note, syncStatus: 'synced' });
      }
    }
    for (const link of data.links) {
      const existing = await db.links.get(link.id!);
      if (!existing || link.updatedAt > existing.updatedAt) {
        await db.links.put({ ...link, syncStatus: 'synced' });
      }
    }
    for (const list of data.lists) {
      const existing = await db.lists.get(list.id!);
      if (!existing || list.updatedAt > existing.updatedAt) {
        await db.lists.put({ ...list, syncStatus: 'synced' });
      }
    }
  });
}

export async function markAllSynced() {
  await db.transaction('rw', db.documents, db.notes, db.links, db.lists, async () => {
    await db.documents.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
    await db.notes.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
    await db.links.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
    await db.lists.where('syncStatus').equals('pending').modify({ syncStatus: 'synced' });
  });
}

/**
 * Cleanup any legacy mock/demo data so the user has a completely clean, private space
 */
export async function seedInitialDataIfEmpty() {
  // We do NOT seed any default mock data. The space belongs to the user.
  // Clean up any previously seeded mock data if present:
  try {
    const mockDocIds = ['doc-aadhaar', 'doc-pan', 'doc-voter', 'doc-dl', 'doc-office', 'doc-insurance'];
    const mockNoteIds = ['note-weekly-reset', 'note-weekend-ideas', 'todo-motor-insurance', 'todo-dentist', 'todo-groceries'];
    const mockLinkIds = ['link-1', 'link-2', 'link-3'];
    const mockListIds = ['list-groceries', 'list-october-budget'];

    await db.transaction('rw', db.documents, db.notes, db.links, db.lists, async () => {
      for (const id of mockDocIds) await db.documents.delete(id);
      for (const id of mockNoteIds) await db.notes.delete(id);
      for (const id of mockLinkIds) await db.links.delete(id);
      for (const id of mockListIds) await db.lists.delete(id);
    });
  } catch (e) {
    console.error('Failed cleaning mock data', e);
  }
}

/**
 * Wipe all data (for user reset / logout)
 */
export async function clearAllData() {
  await db.transaction('rw', db.documents, db.notes, db.links, db.lists, async () => {
    await db.documents.clear();
    await db.notes.clear();
    await db.links.clear();
    await db.lists.clear();
  });
}
