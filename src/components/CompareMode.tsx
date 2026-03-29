"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ProviderId, ComparisonSlot } from "@/types";
import { getConfiguredProviders } from "@/lib/storage";
import { PROVIDERS, getProvider } from "@/lib/providers";
import { runPrompt } from "@/lib/provider-api";
import Link from "next/link";

interface CompareModeProps {
  filledPrompt: string;
  hasPrompt: boolean;
}

interface SlotSelection {
  provider: ProviderId;
  model: string;
}

export default function CompareMode({
  filledPrompt,
  hasPrompt,
}: CompareModeProps) {
  const [configured, setConfigured] = useState<ProviderId[]>([]);
  const [selections, setSelections] = useState<SlotSelection[]>([]);
  const [slots, setSlots] = useState<ComparisonSlot[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const slotsRef = useRef<ComparisonSlot[]>([]);

  useEffect(() => {
    setConfigured(getConfiguredProviders());
  }, []);

  const availableProviders = PROVIDERS.filter((p) =>
    configured.includes(p.id)
  );

  const addSelection = () => {
    if (selections.length >= 4) return;
    if (availableProviders.length === 0) return;
    const first = availableProviders[0];
    setSelections((prev) => [
      ...prev,
      { provider: first.id, model: first.models[0].id },
    ]);
  };

  const removeSelection = (idx: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSelection = (idx: number, patch: Partial<SlotSelection>) => {
    setSelections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  };

  const updateSlot = useCallback(
    (idx: number, patch: Partial<ComparisonSlot>) => {
      slotsRef.current = slotsRef.current.map((s, i) =>
        i === idx ? { ...s, ...patch } : s
      );
      setSlots([...slotsRef.current]);
    },
    []
  );

  const handleRun = async () => {
    if (selections.length === 0 || !hasPrompt) return;
    setIsRunning(true);

    const initial: ComparisonSlot[] = selections.map((s) => ({
      provider: s.provider,
      model: s.model,
      response: "",
      error: "",
      isRunning: true,
      durationMs: 0,
      tokenEstimate: 0,
      rating: 0,
    }));
    slotsRef.current = initial;
    setSlots(initial);

    // Run all in parallel with Promise.all
    await Promise.all(
      selections.map((sel, idx) => {
        const start = performance.now();
        return runPrompt({
          provider: sel.provider,
          model: sel.model,
          prompt: filledPrompt,
          onChunk: (text) => {
            const current = slotsRef.current[idx];
            const newResponse = current.response + text;
            updateSlot(idx, {
              response: newResponse,
              durationMs: Math.round(performance.now() - start),
              tokenEstimate: Math.round(
                newResponse.split(/\s+/).length * 1.3
              ),
            });
          },
          onDone: () => {
            updateSlot(idx, {
              isRunning: false,
              durationMs: Math.round(performance.now() - start),
            });
          },
          onError: (error) => {
            updateSlot(idx, { isRunning: false, error });
          },
        });
      })
    );

    setIsRunning(false);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const handleRate = (idx: number, rating: number) => {
    const current = slotsRef.current[idx];
    updateSlot(idx, {
      rating: current.rating === rating ? 0 : rating,
    });
  };

  if (configured.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No AI providers configured.</p>
          <Link
            href="/settings"
            className="text-mmp-accent underline font-medium"
          >
            Go to Settings
          </Link>{" "}
          to add your API keys.
        </div>
      </div>
    );
  }

  // Grid layout: 1 col for 1, 2 cols for 2-3, 2x2 for 4
  const gridCols =
    slots.length <= 1
      ? "grid-cols-1"
      : slots.length <= 3
      ? `grid-cols-${slots.length}`
      : "grid-cols-2";

  return (
    <div className="flex flex-col h-full">
      {/* Selection header */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {selections.map((sel, idx) => {
            const prov = getProvider(sel.provider);
            return (
              <div
                key={idx}
                className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 py-1"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: prov?.color || "#999" }}
                />
                <select
                  value={sel.provider}
                  onChange={(e) => {
                    const newP = e.target.value as ProviderId;
                    const newProv = getProvider(newP);
                    updateSelection(idx, {
                      provider: newP,
                      model: newProv?.models[0]?.id || "",
                    });
                  }}
                  className="text-xs border-none bg-transparent focus:outline-none"
                >
                  {availableProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={sel.model}
                  onChange={(e) =>
                    updateSelection(idx, { model: e.target.value })
                  }
                  className="text-xs border-none bg-transparent focus:outline-none"
                >
                  {getProvider(sel.provider)?.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeSelection(idx)}
                  className="text-gray-400 hover:text-red-500 text-xs ml-1"
                >
                  ✕
                </button>
              </div>
            );
          })}

          {selections.length < 4 && (
            <button
              onClick={addSelection}
              className="px-2 py-1 text-xs text-gray-500 border border-dashed border-gray-300 rounded-md hover:border-mmp-accent hover:text-mmp-accent"
            >
              + Add model
            </button>
          )}
        </div>

        <button
          onClick={handleRun}
          disabled={!hasPrompt || selections.length === 0 || isRunning}
          className="px-4 py-1.5 text-xs font-medium text-white bg-mmp-accent rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isRunning && (
            <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {isRunning ? "Running..." : "Run Comparison"}
        </button>
      </div>

      {/* Results grid */}
      {slots.length > 0 && (
        <div className={`grid ${gridCols} gap-3 flex-1 min-h-0`}>
          {slots.map((slot, idx) => {
            const prov = getProvider(slot.provider);
            return (
              <div
                key={idx}
                className="flex flex-col border border-gray-200 rounded-lg overflow-hidden min-h-0"
              >
                {/* Color-coded header */}
                <div
                  className="px-3 py-2 text-xs font-semibold text-white flex items-center justify-between"
                  style={{ backgroundColor: prov?.color || "#666" }}
                >
                  <span>
                    {prov?.name} / {slot.model}
                  </span>
                  {slot.isRunning && (
                    <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                </div>

                {/* Response body */}
                <div className="flex-1 min-h-0 overflow-auto p-3 bg-white">
                  {slot.error ? (
                    <p className="text-sm text-red-600">{slot.error}</p>
                  ) : slot.response ? (
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words text-gray-800 leading-relaxed">
                      {slot.response}
                    </pre>
                  ) : slot.isRunning ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : null}
                </div>

                {/* Footer stats */}
                <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[10px] text-gray-500">
                  <div className="flex items-center gap-3">
                    <span>{slot.durationMs}ms</span>
                    <span>~{slot.tokenEstimate} tokens</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {slot.response && (
                      <button
                        onClick={() => handleCopy(slot.response)}
                        className="px-1.5 py-0.5 text-[10px] text-gray-500 hover:text-gray-700 border border-gray-200 rounded"
                      >
                        Copy
                      </button>
                    )}
                    <button
                      onClick={() => handleRate(idx, 1)}
                      className={`px-1 py-0.5 rounded ${
                        slot.rating === 1
                          ? "bg-green-100 text-green-700"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      👍
                    </button>
                    <button
                      onClick={() => handleRate(idx, -1)}
                      className={`px-1 py-0.5 rounded ${
                        slot.rating === -1
                          ? "bg-red-100 text-red-700"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      👎
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {slots.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          Select models above and click &quot;Run Comparison&quot; to compare
          responses side by side.
        </div>
      )}
    </div>
  );
}
