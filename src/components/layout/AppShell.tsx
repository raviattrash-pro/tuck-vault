"use client";

import type { ReactNode } from "react";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";

interface AppShellProps {
  children: ReactNode;
  activeTab: string;
}

/**
 * Main application shell.
 * - Mobile (<lg): content + BottomNav at bottom
 * - Desktop (>=lg): DesktopSidebar on left + content area
 */
export function AppShell({ children, activeTab }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Desktop sidebar */}
      <DesktopSidebar activeTab={activeTab} />

      {/* Main content area — offset by sidebar width on desktop */}
      <main className="pb-20 lg:pl-[260px] lg:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav activeTab={activeTab} />
    </div>
  );
}

export default AppShell;
