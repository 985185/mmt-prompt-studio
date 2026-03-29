"use client";

import { useState, useEffect } from "react";
import { HistoryEntry } from "@/types";
import { getHistory, clearHistory } from "@/lib/storage";
import { getProvider } from "@/lib/providers";

interface HistoryPanelProps {
  onLoadPrompt: (promptSnippet: string) => void;
  /** Increment to trigger a refresh from localStorage */
  refreshKey?: number;
}

export default function HistoryPanel({
  onLoadPrompt,
  refreshKey,
}: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // TODO: Replace localStorage with real API call (GET /api/history)
    setEntries(getHistory());
  }, [refreshKey]);

  const handleClear = () => {
    clearHistory();
    setEntries([]);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (entries.length === 0 && !open) return null;

  return (
    <div className="mt-3 border-t border-gray-200 pt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>
          ▶
        </span>
        Recent Runs ({entries.length})
      </button>

      {open && (
        <div className="mt-2">
          {entries.length === 0 ? (
            <p className="text-xs text-gray-400">No runs yet.</p>
          ) : (
            <>
              <div className="flex justify-end mb-1">
                <button
                  onClick={handleClear}
                  className="text-[10px] text-red-500 hover:text-red-700"
                >
                  Clear history
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {entries.map((entry) => {
                  const prov = getProvider(entry.provider);
                  return (
                    <button
                      key={entry.id}
                      onClick={() => onLoadPrompt(entry.promptSnippet)}
                      className="w-full text-left p-2 rounded hover:bg-white/80 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        {prov && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: prov.color }}
                          />
                        )}
                        <span className="text-[10px] font-medium text-gray-500">
                          {prov?.name || entry.provider} / {entry.model}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-auto">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {entry.promptSnippet}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
