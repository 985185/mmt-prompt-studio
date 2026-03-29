"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SavedPrompt } from "@/types";
import { getPrompts, deletePrompt } from "@/lib/storage";
import { getProvider } from "@/lib/providers";

export default function LibraryPage() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const router = useRouter();

  useEffect(() => {
    // TODO: Replace localStorage with real API call (GET /api/prompts)
    setPrompts(getPrompts());
  }, []);

  const handleDelete = (id: string) => {
    // TODO: Replace localStorage with real API call (DELETE /api/prompts/:id)
    deletePrompt(id);
    setPrompts(getPrompts());
  };

  const handleLoad = (prompt: SavedPrompt) => {
    sessionStorage.setItem("mmp_load_prompt", JSON.stringify(prompt));
    router.push("/");
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (prompts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No prompts saved yet.</p>
          <p className="text-gray-400 text-sm">
            Start creating in the Studio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-auto h-[calc(100vh-1px)]">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Prompt Library
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer group"
            onClick={() => handleLoad(prompt)}
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
              {prompt.title || prompt.content.slice(0, 50)}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">
              {prompt.content.slice(0, 120)}
              {prompt.content.length > 120 ? "..." : ""}
            </p>

            {/* Provider badges */}
            {prompt.runsWith && prompt.runsWith.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {prompt.runsWith.map((run, i) => {
                  const prov = getProvider(run.provider);
                  return (
                    <span
                      key={`${run.provider}-${run.model}-${i}`}
                      className="px-1.5 py-0.5 text-[9px] font-bold uppercase text-white rounded"
                      style={{ backgroundColor: prov?.color || "#666" }}
                    >
                      {prov?.name || run.provider}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-3">
                <span>{prompt.variables.length} vars</span>
                <span>{prompt.content.length} chars</span>
                {prompt.bestRating === 1 && <span className="text-green-600">👍</span>}
                {prompt.bestRating === -1 && <span className="text-red-600">👎</span>}
              </div>
              <span>{formatDate(prompt.lastRunAt || prompt.createdAt)}</span>
            </div>

            {prompt.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {prompt.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(prompt.id);
              }}
              className="mt-3 px-3 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
