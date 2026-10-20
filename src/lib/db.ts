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

    this.version(1).stores({
      documents: 'id, type, title, updatedAt, syncStatus, isDeleted',
      notes:     'id, noteType, priority, isPinned, isCompleted, updatedAt, syncStatus, isDeleted, dueDate',
      links:     'id, domain, category, updatedAt, syncStatus, isDeleted',
      lists:     'id, category, updatedAt, syncStatus, isDeleted',
    });
  }
}

export const db = new TuckDB();

// ============================================================================
// Helper: generate a new record with defaults
// ============================================================================

function baseDefaults() {
  const now = new Date().toISOString();
  return { id: uuid(), createdAt: now, updatedAt: now, syncStatus: 'pending' as const, isDeleted: false };
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
  return db.documents.where('isDeleted').equals(0).reverse().sortBy('updatedAt');
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
  return db.notes.where('isDeleted').equals(0).reverse().sortBy('updatedAt');
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
  return db.links.where('isDeleted').equals(0).reverse().sortBy('updatedAt');
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
  return db.lists.where('isDeleted').equals(0).reverse().sortBy('updatedAt');
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
    db.documents.where('isDeleted').equals(0).count(),
    db.notes.where('isDeleted').equals(0).toArray(),
    db.links.where('isDeleted').equals(0).count(),
    db.lists.where('isDeleted').equals(0).count(),
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
