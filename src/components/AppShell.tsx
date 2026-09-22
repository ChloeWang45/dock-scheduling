"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import NavRail from "@/components/NavRail";
import { CloseIcon } from "@/components/icons";

const DEFAULT_PANEL_WIDTH = 620;
const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 880;
const STORAGE_KEY = "dockScheduling.panelWidth";

export default function AppShell({
  main,
  panel,
  role,
  userName,
  userEmail,
  logout,
}: {
  main: React.ReactNode;
  panel: React.ReactNode;
  role: "admin" | "staff" | "viewer";
  userName: string;
  userEmail: string;
  logout: () => void;
}) {
  const pathname = usePathname();
  const panelOpen = pathname !== "/calendar";
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const dragging = useRef(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const n = Number(saved);
        if (Number.isFinite(n)) {
          setPanelWidth(Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, n)));
        }
      }
    } catch {
      // localStorage unavailable — keep the default width.
    }
  }, []);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const railWidth = 56; // collapsed rail width (w-14)
      const next = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, ev.clientX - railWidth));
      setPanelWidth(next);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setPanelWidth((w) => {
        try {
          window.localStorage.setItem(STORAGE_KEY, String(w));
        } catch {
          // ignore
        }
        return w;
      });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <NavRail role={role} userName={userName} userEmail={userEmail} logout={logout} />
      <div className="flex min-w-0 flex-1 overflow-hidden">
        <div
          className="flex shrink-0 overflow-hidden transition-[width] duration-200 ease-out"
          style={{ width: panelOpen ? panelWidth : 0 }}
        >
          <div className="h-full min-w-0 flex-1 overflow-y-auto bg-paper" style={{ width: panelWidth }}>
            {panelOpen && (
              <div className="p-6">
                <div className="mb-4 flex justify-end">
                  <Link
                    href="/calendar"
                    className="flex items-center gap-1 text-sm text-ink/50 transition-colors hover:text-ink"
                    title="Close panel"
                  >
                    <CloseIcon className="h-4 w-4" />
                    Close
                  </Link>
                </div>
                {panel}
              </div>
            )}
          </div>
          <div
            onMouseDown={onDragStart}
            className="relative w-1 shrink-0 cursor-col-resize"
          >
            <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize" />
            <div className="h-full w-full bg-ink/10 transition-colors duration-150 hover:bg-wave/60" />
          </div>
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto p-6">{main}</div>
      </div>
    </div>
  );
}
