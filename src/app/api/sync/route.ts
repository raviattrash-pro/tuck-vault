import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase';

const DATA_DIR = path.join(process.cwd(), 'data', 'sync_users');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_KEY_LENGTH = 254;
const MAX_COLLECTION_ITEMS = 5000;

function isValidUserKey(key: unknown): key is string {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_KEY_LENGTH) return false;
  return EMAIL_REGEX.test(trimmed) || /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(trimmed);
}

// Ensure fallback directory exists
async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
}

function sanitizeUserKey(key: string): string {
  return Buffer.from(key.toLowerCase().trim()).toString('hex');
}

function getUserFilePath(userKey: string): string {
  const safeName = sanitizeUserKey(userKey);
  return path.join(DATA_DIR, `${safeName}.json`);
}

interface SyncRecord {
  id?: string;
  updatedAt: string;
  isDeleted?: boolean;
  [key: string]: any;
}

interface UserSyncData {
  userKey: string;
  updatedAt: string;
  documents: SyncRecord[];
  notes: SyncRecord[];
  links: SyncRecord[];
  lists: SyncRecord[];
}

function mergeCollections(serverList: SyncRecord[] = [], clientList: SyncRecord[] = []): SyncRecord[] {
  const map = new Map<string, SyncRecord>();

  for (const item of serverList) {
    if (item.id) map.set(item.id, item);
  }

  for (const item of clientList) {
    if (!item.id) continue;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      const existingTime = new Date(existing.updatedAt || 0).getTime();
      const itemTime = new Date(item.updatedAt || 0).getTime();
      if (itemTime >= existingTime) {
        map.set(item.id, item);
      }
    }
  }

  return Array.from(map.values()).slice(0, MAX_COLLECTION_ITEMS);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userKey = searchParams.get('userKey');

    if (!userKey || !isValidUserKey(userKey)) {
      return NextResponse.json({ error: 'Invalid or missing userKey' }, { status: 400 });
    }

    const normalizedEmail = userKey.toLowerCase().trim();

    // 1. Try Supabase if configured
    const supabaseClient = getSupabaseServerClient();
    if (supabaseClient) {
      const { data: row, error } = await supabaseClient
        .from('tuck_user_data')
        .select('*')
        .eq('user_email', normalizedEmail)
        .maybeSingle();

      if (error) {
        console.error('Supabase GET sync error:', error);
      } else if (row?.data) {
        return NextResponse.json({
          success: true,
          source: 'supabase',
          data: {
            userKey: normalizedEmail,
            updatedAt: row.updated_at || new Date().toISOString(),
            documents: row.data.documents || [],
            notes: row.data.notes || [],
            links: row.data.links || [],
            lists: row.data.lists || [],
          },
        });
      }
    }

    // 2. Fallback to local disk storage
    await ensureDir();
    const filePath = getUserFilePath(normalizedEmail);
    try {
      const fileData = await fs.readFile(filePath, 'utf-8');
      const parsed: UserSyncData = JSON.parse(fileData);
      return NextResponse.json({
        success: true,
        source: 'local_fallback',
        data: parsed,
      });
    } catch {
      return NextResponse.json({
        success: true,
        source: 'empty',
        data: {
          userKey: normalizedEmail,
          updatedAt: new Date().toISOString(),
          documents: [],
          notes: [],
          links: [],
          lists: [],
        },
      });
    }
  } catch (err: any) {
    console.error('Sync GET error:', err);
    return NextResponse.json({ error: err?.message || 'Internal sync error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userKey, data } = body;

    if (!userKey || !isValidUserKey(userKey)) {
      return NextResponse.json({ error: 'Invalid or missing userKey' }, { status: 400 });
    }

    if (data && typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid data payload format' }, { status: 400 });
    }

    const normalizedEmail = userKey.toLowerCase().trim();
    let serverData: UserSyncData = {
      userKey: normalizedEmail,
      updatedAt: new Date().toISOString(),
      documents: [],
      notes: [],
      links: [],
      lists: [],
    };

    const supabaseClient = getSupabaseServerClient();

    // 1. If Supabase is connected, fetch remote copy from Supabase
    if (supabaseClient) {
      try {
        const { data: row } = await supabaseClient
          .from('tuck_user_data')
          .select('*')
          .eq('user_email', normalizedEmail)
          .maybeSingle();

        if (row?.data) {
          serverData = {
            userKey: normalizedEmail,
            updatedAt: row.updated_at || new Date().toISOString(),
            documents: row.data.documents || [],
            notes: row.data.notes || [],
            links: row.data.links || [],
            lists: row.data.lists || [],
          };
        }
      } catch (e) {
        console.warn('Failed reading remote Supabase record, continuing merge:', e);
      }
    } else {
      // Fallback: read local file
      await ensureDir();
      const filePath = getUserFilePath(normalizedEmail);
      try {
        const existingRaw = await fs.readFile(filePath, 'utf-8');
        serverData = JSON.parse(existingRaw);
      } catch {}
    }

    const clientDocs: SyncRecord[] = data?.documents || [];
    const clientNotes: SyncRecord[] = data?.notes || [];
    const clientLinks: SyncRecord[] = data?.links || [];
    const clientLists: SyncRecord[] = data?.lists || [];

    // Merge each collection
    const mergedDocs = mergeCollections(serverData.documents, clientDocs);
    const mergedNotes = mergeCollections(serverData.notes, clientNotes);
    const mergedLinks = mergeCollections(serverData.links, clientLinks);
    const mergedLists = mergeCollections(serverData.lists, clientLists);

    const now = new Date().toISOString();
    const mergedData: UserSyncData = {
      userKey: normalizedEmail,
      updatedAt: now,
      documents: mergedDocs,
      notes: mergedNotes,
      links: mergedLinks,
      lists: mergedLists,
    };

    // 2. Save back to Supabase if configured
    if (supabaseClient) {
      try {
        const { error: upsertError } = await supabaseClient
          .from('tuck_user_data')
          .upsert(
            {
              user_email: normalizedEmail,
              data: {
                documents: mergedDocs,
                notes: mergedNotes,
                links: mergedLinks,
                lists: mergedLists,
              },
              updated_at: now,
            },
            { onConflict: 'user_email' }
          );

        if (upsertError) {
          console.error('Supabase upsert sync error:', upsertError);
        }
      } catch (err) {
        console.error('Failed writing to Supabase:', err);
      }
    }

    // Also persist local fallback copy
    try {
      await ensureDir();
      const filePath = getUserFilePath(normalizedEmail);
      await fs.writeFile(filePath, JSON.stringify(mergedData, null, 2), 'utf-8');
    } catch {}

    return NextResponse.json({
      success: true,
      lastSynced: now,
      source: supabaseClient ? 'supabase' : 'local_fallback',
      data: mergedData,
    });
  } catch (err: any) {
    console.error('Sync POST error:', err);
    return NextResponse.json({ error: err?.message || 'Sync failed' }, { status: 500 });
  }
}