// ============================================================================
// Tuck App — Core Type Definitions
// ============================================================================

/** Document types supported in the Vault */
export type DocumentType =
  | 'aadhaar'
  | 'pan'
  | 'voter_id'
  | 'driving_licence'
  | 'office_id'
  | 'passport'
  | 'other';

/** Priority levels for tasks and notes */
export type Priority = 'high' | 'medium' | 'low';

/** Filter tabs for Notes page */
export type NoteFilter = 'all' | 'notes' | 'todos' | 'pinned';

/** List categories */
export type ListCategory =
  | 'grocery'
  | 'shopping'
  | 'investment'
  | 'budget'
  | 'custom';

/** Sync status */
export type SyncStatus = 'synced' | 'pending' | 'offline' | 'error';

// ============================================================================
// Database Models
// ============================================================================

export interface BaseModel {
  id?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  isDeleted: boolean;
}

/** A document stored in the Vault */
export interface VaultDocument extends BaseModel {
  type: DocumentType;
  title: string;
  /** Document number (stored encrypted) */
  documentNumber: string;
  /** Organisation name for office ID or description for "other" */
  organisation?: string;
  /** Base64-encoded front image (encrypted) */
  frontImage?: string;
  /** Base64-encoded back image (encrypted) */
  backImage?: string;
  /** Original filename */
  fileName?: string;
  /** Tags for search */
  tags: string[];
}

/** A note or to-do item */
export interface Note extends BaseModel {
  title: string;
  content: string;
  /** 'note' = freeform text, 'todo' = checkbox item */
  noteType: 'note' | 'todo';
  priority?: Priority;
  isPinned: boolean;
  isCompleted: boolean;
  /** Category tag e.g. "Personal", "Work" */
  category?: string;
  /** Due date ISO string */
  dueDate?: string;
}

/** A saved URL / link */
export interface SavedLink extends BaseModel {
  url: string;
  title: string;
  description?: string;
  /** Favicon URL or base64 */
  favicon?: string;
  /** Category tag e.g. "Money", "Recipes", "Weekend reading" */
  category?: string;
  /** Auto-extracted domain */
  domain?: string;
}

/** A list (grocery, shopping, budget, investment, custom) */
export interface TuckList extends BaseModel {
  name: string;
  category: ListCategory;
  /** For budget lists: planned total amount */
  plannedAmount?: number;
  /** For budget lists: currency symbol */
  currency?: string;
  items: ListItem[];
}

/** Individual item within a list */
export interface ListItem {
  id: string;
  text: string;
  isChecked: boolean;
  /** Amount (for budget/investment lists) */
  amount?: number;
  /** Quantity (for grocery/shopping) */
  quantity?: number;
  sortOrder: number;
}

// ============================================================================
// User & Auth
// ============================================================================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  /** Encryption key derived from user credentials (never stored raw) */
  encryptionSalt?: string;
}

// ============================================================================
// Sync & Sharing
// ============================================================================

export interface SyncPayload {
  version: number;
  timestamp: string;
  documents: VaultDocument[];
  notes: Note[];
  links: SavedLink[];
  lists: TuckList[];
}

export interface SharePayload {
  type: 'document' | 'note' | 'link' | 'list';
  data: VaultDocument | Note | SavedLink | TuckList;
  sharedBy: string;
  sharedAt: string;
}

/** Peer connection state for P2P sharing */
export interface PeerState {
  peerId: string;
  isConnected: boolean;
  isTransferring: boolean;
  progress: number;
}

// ============================================================================
// UI State helpers
// ============================================================================

export interface AppStats {
  documentCount: number;
  noteCount: number;
  todoCount: number;
  todayTodoCount: number;
  linkCount: number;
  listCount: number;
}

/** Document type display metadata */
export const DOCUMENT_TYPE_META: Record<DocumentType, { label: string; icon: string; color: string }> = {
  aadhaar:         { label: 'Aadhaar card',     icon: 'Fingerprint', color: '#6366F1' },
  pan:             { label: 'PAN card',         icon: 'CreditCard',  color: '#8B5CF6' },
  voter_id:        { label: 'Voter ID',         icon: 'Vote',        color: '#3B82F6' },
  driving_licence: { label: 'Driving licence',  icon: 'Car',         color: '#10B981' },
  office_id:       { label: 'Office ID',        icon: 'Building2',   color: '#F59E0B' },
  passport:        { label: 'Passport',         icon: 'BookOpen',    color: '#EF4444' },
  other:           { label: 'Other documents',  icon: 'FileText',    color: '#6B7280' },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string; bg: string }> = {
  high:   { label: 'High',   color: '#EF4444', bg: '#FEF2F2' },
  medium: { label: 'Medium', color: '#F59E0B', bg: '#FFFBEB' },
  low:    { label: 'Low',    color: '#22C55E', bg: '#F0FDF4' },
};

export const LIST_CATEGORY_META: Record<ListCategory, { label: string; icon: string; color: string }> = {
  grocery:    { label: 'Grocery',    icon: 'ShoppingCart', color: '#22C55E' },
  shopping:   { label: 'Shopping',   icon: 'ShoppingBag', color: '#8B5CF6' },
  investment: { label: 'Investment', icon: 'TrendingUp',  color: '#3B82F6' },
  budget:     { label: 'Budget',     icon: 'Wallet',      color: '#F59E0B' },
  custom:     { label: 'Custom',     icon: 'List',        color: '#6B7280' },
};
