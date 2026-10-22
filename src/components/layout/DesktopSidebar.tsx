"use client";

import Link from "next/link";
import {
  House,
  FileText,
  StickyNote,
  Link as LinkIcon,
  ListChecks,
  Monitor,
  QrCode,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSync } from "@/contexts/SyncContext";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

import { useState } from "react";
import { UserProfileModal } from "./UserProfileModal";
import { ShareModal } from "@/components/sharing/ShareModal";

/* ─── Nav item types ─── */
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

interface DesktopSidebarProps {
  activeTab: string;
}

export default function DesktopSidebar({ activeTab }: DesktopSidebarProps) {
  const { user } = useAuth();
  const { syncStatus, isSyncing } = useSync();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const counts = useLiveQuery(async () => {
    try {
      const [docs, notes, links, lists] = await Promise.all([
        db.documents.filter((d) => !d.isDeleted).count(),
        db.notes.filter((n) => !n.isDeleted).count(),
        db.links.filter((l) => !l.isDeleted).count(),
        db.lists.filter((l) => !l.isDeleted).count(),
      ]);
      return { docs, notes, links, lists };
    } catch {
      return { docs: 0, notes: 0, links: 0, lists: 0 };
    }
  }, []);

  const primaryNav: NavItem[] = [
    { label: "Home", href: "/home", icon: House },
    { label: "Documents", href: "/vault", icon: FileText, badge: counts?.docs ?? 6 },
    { label: "Notes & tasks", href: "/notes", icon: StickyNote, badge: counts?.notes ?? 8 },
    { label: "Saved links", href: "/links", icon: LinkIcon, badge: counts?.links ?? 12 },
    { label: "Lists", href: "/lists", icon: ListChecks, badge: counts?.lists ?? 4 },
  ];

  const secondaryNav: NavItem[] = [
    { label: "Nearby devices", href: "/home", icon: Monitor },
    { label: "Scan QR", href: "/home", icon: QrCode },
  ];

  /** Map activeTab (lowercase) → label match */
  function isActive(label: string) {
    const mapping: Record<string, string> = {
      home: "Home",
      vault: "Documents",
      notes: "Notes & tasks",
      links: "Saved links",
      lists: "Lists",
    };
    return mapping[activeTab] === label;
  }

  /** Get user initials for avatar fallback */
  function getInitials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-slate-100 bg-white lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-800">
          Tuck
        </span>
      </div>

      {/* Section label */}
      <p className="mt-6 mb-2 px-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        Your personal space
      </p>

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {primaryNav.map(({ label, href, icon: Icon, badge }) => {
          const active = isActive(label);
          return (
            <Link
              key={label}
              href={href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-light text-brand"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] ${active ? "stroke-[2.25]" : "stroke-[1.75]"}`}
              />
              <span className="flex-1">{label}</span>
              {typeof badge === "number" && badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-500">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="!my-3 h-px bg-slate-100" />

        {secondaryNav.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => setIsSyncModalOpen(true)}
            className="w-full group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800 text-left"
          >
            <Icon className="h-[18px] w-[18px] stroke-[1.75]" />
            <span className="flex-1">{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-slate-100 px-4 py-4">
        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="w-full flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-50 transition text-left group"
        >
          {/* Avatar */}
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-9 w-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600 shrink-0">
              {user?.name ? getInitials(user.name) : "?"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition">
              {user?.name || "Sign In"}
            </p>
            <p className="text-[11px] text-slate-400">Settings &amp; space</p>
          </div>

          {/* Sync dot */}
          <span
            className={`h-2.5 w-2.5 rounded-full shrink-0 transition ${
              syncStatus === 'synced'
                ? 'bg-emerald-500 shadow-sm shadow-emerald-200'
                : isSyncing
                ? 'bg-amber-400 animate-pulse'
                : 'bg-slate-300'
            }`}
            title={syncStatus === 'synced' ? 'All changes synced' : isSyncing ? 'Syncing...' : 'Pending sync'}
          />
        </button>
      </div>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <ShareModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        title="Tuck Quick Sync"
        type="sync"
      />
    </aside>
  );
}
