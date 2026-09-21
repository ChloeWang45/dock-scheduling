"use client";

import { useState } from "react";

export function CopyFeedLink({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable; the visible input still lets the user select-and-copy.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-40 shrink-0 truncate text-sm text-ink/80">{label}</span>
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 rounded border border-ink/20 bg-paper px-2 py-1 text-xs text-ink/70"
      />
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded border border-ink/20 px-2 py-1 text-xs text-ink/80 hover:bg-foam/60"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
