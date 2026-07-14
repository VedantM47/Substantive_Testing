"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({
  children,
  documentCount = 0,
}: {
  children: ReactNode;
  documentCount?: number;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white md:grid md:grid-cols-[288px_1fr]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 bg-surface">
        <Navbar documentCount={documentCount} onMenu={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
