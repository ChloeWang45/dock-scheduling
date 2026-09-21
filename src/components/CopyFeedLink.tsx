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
      <span className="w-40 shrink-0 truncate text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 rounded border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
      />
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
