"use client";

import { useState, useEffect, useCallback } from "react";
import { ProviderId } from "@/types";
import {
  getProviderKey,
  setProviderKey,
  hasProviderKey,
  getOllamaBaseUrl,
  setOllamaBaseUrl,
} from "@/lib/storage";
import { getProvidersByGroup, PROVIDERS } from "@/lib/providers";
import { testConnection } from "@/lib/provider-api";

interface ProviderKeyState {
  value: string;
  show: boolean;
  testing: boolean;
  testResult: "idle" | "success" | "fail";
  testMsg: string;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<Record<string, ProviderKeyState>>({});
  const [ollamaUrl, setOllamaUrlState] = useState("http://localhost:11434");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // TODO: Replace localStorage with real API call (GET /api/settings)
    const initial: Record<string, ProviderKeyState> = {};
    for (const p of PROVIDERS) {
      initial[p.id] = {
        value: getProviderKey(p.id),
        show: false,
        testing: false,
        testResult: "idle",
        testMsg: "",
      };
    }
    setKeys(initial);
    setOllamaUrlState(getOllamaBaseUrl());
  }, []);

  const updateKey = useCallback(
    (id: string, patch: Partial<ProviderKeyState>) => {
      setKeys((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    },
    []
  );

  const handleSaveKey = (providerId: ProviderId) => {
    // TODO: Replace localStorage with real API call
    const val = keys[providerId]?.value || "";
    setProviderKey(providerId, val);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveOllama = () => {
    setOllamaBaseUrl(ollamaUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async (providerId: ProviderId) => {
    updateKey(providerId, { testing: true, testResult: "idle", testMsg: "" });
    try {
      const key = keys[providerId]?.value || "";
      await testConnection(providerId, key);
      updateKey(providerId, { testing: false, testResult: "success", testMsg: "Connected" });
    } catch (err) {
      updateKey(providerId, {
        testing: false,
        testResult: "fail",
        testMsg: err instanceof Error ? err.message : "Failed",
      });
    }
  };

  const groups = getProvidersByGroup();

  const renderProviderCard = (providerId: ProviderId) => {
    const provider = PROVIDERS.find((p) => p.id === providerId)!;
    const state = keys[providerId];
    if (!state) return null;
    const isOllama = providerId === "ollama";
    const hasSavedKey = hasProviderKey(providerId);

    return (
      <div
        key={providerId}
        className="bg-white border border-gray-200 rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          {/* Provider color dot */}
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: provider.color }}
          />
          <h3 className="text-sm font-semibold text-gray-900">
            {provider.name}
          </h3>
          {/* Green dot if configured */}
          {hasSavedKey && (
            <span className="w-2 h-2 rounded-full bg-green-500 ml-auto" title="Configured" />
          )}
          {isOllama && (
            <span className="ml-auto px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-100 text-purple-700 rounded">
              Free / Local
            </span>
          )}
        </div>

        {/* Models list */}
        <p className="text-xs text-gray-400 mb-3">
          Models: {provider.models.map((m) => m.label).join(", ")}
        </p>

        {isOllama ? (
          /* Ollama: base URL field instead of API key */
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrlState(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-mmp-accent"
              />
              <button
                onClick={handleSaveOllama}
                className="px-3 py-1.5 text-xs font-medium text-white bg-mmp-accent rounded-md hover:opacity-90"
              >
                Save
              </button>
              <button
                onClick={() => handleTest("ollama")}
                disabled={state.testing}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {state.testing ? "Testing..." : "Test"}
              </button>
            </div>
          </div>
        ) : (
          /* Regular provider: API key field */
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={state.show ? "text" : "password"}
                  value={state.value}
                  onChange={(e) => updateKey(providerId, { value: e.target.value })}
                  placeholder={provider.id === "openai" ? "sk-..." : "Enter API key..."}
                  className="w-full px-3 py-1.5 pr-14 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-mmp-accent"
                />
                <button
                  type="button"
                  onClick={() => updateKey(providerId, { show: !state.show })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-[10px] text-gray-500 hover:text-gray-700"
                >
                  {state.show ? "Hide" : "Show"}
                </button>
              </div>
              <button
                onClick={() => handleSaveKey(providerId)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-mmp-accent rounded-md hover:opacity-90"
              >
                Save
              </button>
              <button
                onClick={() => handleTest(providerId)}
                disabled={state.testing || !state.value}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {state.testing ? "Testing..." : "Test"}
              </button>
            </div>
          </div>
        )}

        {/* Test result feedback */}
        {state.testResult === "success" && (
          <p className="mt-2 text-xs text-green-600 font-medium">✓ {state.testMsg}</p>
        )}
        {state.testResult === "fail" && (
          <p className="mt-2 text-xs text-red-600 font-medium">✗ {state.testMsg}</p>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl overflow-auto h-[calc(100vh-1px)]">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-6">
        Your API keys are stored in your browser only. They are never sent to
        our servers.
      </p>

      {saved && (
        <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
          Settings saved!
        </div>
      )}

      {/* Cloud Providers */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Cloud Providers
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {groups.cloud.map((p) => renderProviderCard(p.id))}
        </div>
      </section>

      {/* Open Source Hosted */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Open Source Hosted
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {groups.opensource.map((p) => renderProviderCard(p.id))}
        </div>
      </section>

      {/* Local / Free */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Local / Free
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {groups.local.map((p) => renderProviderCard(p.id))}
        </div>
      </section>

      {/* Footer credit */}
      <p className="text-xs text-gray-400 mt-4">
        Provider list inspired by{" "}
        <a
          href="https://www.promptfoo.dev/docs/providers/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-600"
        >
          promptfoo
        </a>
        .
      </p>
    </div>
  );
}
