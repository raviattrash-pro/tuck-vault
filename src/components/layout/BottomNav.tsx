"use client";

import Link from "next/link";
import {
  House,
  Shield,
  FileText,
  Link as LinkIcon,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

/* ─── Tab config ─── */
interface Tab {
  label: string;
  href: string;
  icon: LucideIcon;
}

const tabs: Tab[] = [
  { label: "Home", href: "/home", icon: House },
  { label: "Vault", href: "/vault", icon: Shield },
  { label: "Notes", href: "/notes", icon: FileText },
  { label: "Links", href: "/links", icon: LinkIcon },
  { label: "Lists", href: "/lists", icon: ListChecks },
];

interface BottomNavProps {
  activeTab: string;
}

export function BottomNav({ activeTab }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-100 bg-white/95 backdrop-blur-sm bottom-safe lg:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around">
        {tabs.map(({ label, href, icon: Icon }) => {
          const isActive = activeTab === label.toLowerCase();
          return (
            <Link
              key={label}
              href={href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-indigo-600" />
              )}
              <Icon
                className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
