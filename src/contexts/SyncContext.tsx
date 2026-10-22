"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useAuth } from "@/contexts/AuthContext";
import { exportAllData, importAllData } from "@/lib/db";

export type SyncStatus = "synced" | "pending" | "offline" | "error";

interface SyncContextValue {
  syncStatus: SyncStatus;
  lastSynced: string | null;
  triggerSync: () => Promise<void>;
  isSyncing: boolean;
}

const STORAGE_KEY = "tuck_last_synced";
const SYNC_INTERVAL_MS = 15 * 1000; // 15 seconds

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useOnlineStatus();
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("pending");
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSyncingRef = useRef(false);

  /**
   * Real Cloud Sync:
   * Merges local IndexedDB state with server storage for this user account.
   * Ensures that when the user logs in from any other device, all their data is loaded immediately.
   */
  const triggerSync = useCallback(async () => {
    if (!isOnline) {
      setSyncStatus("offline");
      return;
    }

    if (!user?.email) {
      setSyncStatus("synced");
      return;
    }

    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncStatus("pending");

    try {
      const userKey = user.email.toLowerCase().trim();
      const localData = await exportAllData();

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userKey,
          data: {
            documents: localData.documents || [],
            notes: localData.notes || [],
            links: localData.links || [],
            lists: localData.lists || [],
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Sync HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        // Merge server data into local IndexedDB
        await importAllData({
          documents: json.data.documents || [],
          notes: json.data.notes || [],
          links: json.data.links || [],
          lists: json.data.lists || [],
        });

        const now = json.lastSynced || new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, now);
        setLastSynced(now);
        setSyncStatus("synced");
      } else {
        setSyncStatus("error");
      }
    } catch (err) {
      console.error("Account synchronization error:", err);
      setSyncStatus("error");
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline, user?.email]);

  // Hydrate last-synced from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setLastSynced(stored);
    } catch {}
  }, []);

  // Trigger sync on user change (e.g. login on new device)
  useEffect(() => {
    if (user?.email) {
      triggerSync();
    }
  }, [user?.email, triggerSync]);

  // Periodic background sync
  useEffect(() => {
    if (!user?.email) return;

    intervalRef.current = setInterval(() => {
      triggerSync();
    }, SYNC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user?.email, triggerSync]);

  // Sync on tab focus or visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        triggerSync();
      }
    };
    const handleFocus = () => {
      triggerSync();
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [triggerSync]);

  // React to online/offline changes
  useEffect(() => {
    if (!isOnline) {
      setSyncStatus("offline");
    } else if (user?.email) {
      triggerSync();
    }
  }, [isOnline, user?.email, triggerSync]);

  const value = useMemo<SyncContextValue>(
    () => ({ syncStatus, lastSynced, triggerSync, isSyncing }),
    [syncStatus, lastSynced, triggerSync, isSyncing],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (ctx === undefined) {
    throw new Error("useSync must be used within a <SyncProvider>");
  }
  return ctx;
}