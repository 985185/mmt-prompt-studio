"use client";

import { useState, useCallback, useEffect } from "react";
import { ProviderId } from "@/types";
import HighlightedEditor from "@/components/HighlightedEditor";
import EditorToolbar from "@/components/EditorToolbar";
import VariableInputs from "@/components/VariableInputs";
import Preview from "@/components/Preview";
import Output from "@/components/Output";
import SavePromptModal from "@/components/SavePromptModal";
import ProviderSelector from "@/components/ProviderSelector";
import HistoryPanel from "@/components/HistoryPanel";
import CompareMode from "@/components/CompareMode";
import {
  useVariableDetection,
  fillVariables,
} from "@/hooks/useVariableDetection";
import {
  savePrompt,
  saveAnswer,
  addHistoryEntry,
} from "@/lib/storage";
import { runPrompt } from "@/lib/provider-api";
import { getProvider } from "@/lib/providers";

type Tab = "studio" | "compare";

export default function StudioPage() {
  const [tab, setTab] = useState<Tab>("studio");
  const [promptText, setPromptText] = useState("");
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const variables = useVariableDetection(promptText);
  const filledPrompt = fillVariables(promptText, variableValues);

  // Load a prompt from the library (via sessionStorage handoff)
  useEffect(() => {
    const stored = sessionStorage.getItem("mmp_load_prompt");
    if (stored) {
      try {
        const prompt = JSON.parse(stored);
        setPromptText(prompt.content || "");
      } catch {
        // ignore
      }
      sessionStorage.removeItem("mmp_load_prompt");
    }
  }, []);

  // Auto-select first provider on mount
  useEffect(() => {
    if (!selectedProvider) {
      // Default to ollama (always available)
      setSelectedProvider("ollama");
      setSelectedModel("llama3.2");
    }
  }, [selectedProvider]);

  const handleVariableChange = useCallback(
    (varName: string, value: string) => {
      setVariableValues((prev) => ({ ...prev, [varName]: value }));
    },
    []
  );

  const handleClear = () => {
    setPromptText("");
    setVariableValues({});
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promptText);
  };

  const handleSavePrompt = (title: string, tags: string[]) => {
    // TODO: Replace localStorage with real API call
    savePrompt({
      title,
      content: promptText,
      tags,
      variables,
    });
  };

  const handleRun = async () => {
    if (!selectedProvider || !selectedModel) return;

    setIsRunning(true);
    setResponse("");
    setError("");

    // TODO: Replace with server-side API route call
    await runPrompt({
      provider: selectedProvider,
      model: selectedModel,
      prompt: filledPrompt,
      onChunk: (chunk) => setResponse((prev) => prev + chunk),
      onDone: () => {
        setIsRunning(false);
        // Add to history
        addHistoryEntry({
          promptSnippet: promptText.slice(0, 80),
          provider: selectedProvider,
          model: selectedModel,
          responseSnippet: "", // filled after response is complete
          timestamp: new Date().toISOString(),
        });
        setHistoryRefresh((n) => n + 1);
      },
      onError: (errMsg) => {
        setError(errMsg);
        setIsRunning(false);
      },
    });
  };

  const handleSaveAnswer = () => {
    // TODO: Replace localStorage with real API call
    saveAnswer({
      promptId: "",
      response,
      model: selectedModel,
      provider: selectedProvider || undefined,
    });
  };

  const handleClearOutput = () => {
    setResponse("");
    setError("");
  };

  const handleLoadFromHistory = (snippet: string) => {
    setPromptText(snippet);
  };

  const providerConfig = selectedProvider ? getProvider(selectedProvider) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-1px)] p-4">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={() => setTab("studio")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === "studio"
              ? "bg-mmp-accent text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Studio
        </button>
        <button
          onClick={() => setTab("compare")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === "compare"
              ? "bg-mmp-accent text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Compare
        </button>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* PANEL 1 — EDITOR (left 50%) — shared between both tabs */}
        <div className="w-1/2 flex flex-col min-h-0">
          <EditorToolbar
            onClear={handleClear}
            onCopy={handleCopy}
            onSave={() => setShowSaveModal(true)}
          />
          <div className="flex-1 min-h-0 flex flex-col bg-white border border-gray-200 rounded-md overflow-hidden">
            <HighlightedEditor
              value={promptText}
              onChange={setPromptText}
              placeholder="Write your prompt here... Use {{variable_name}} for dynamic values."
            />
            <div className="border-t border-gray-200 px-3 py-1.5 text-xs text-gray-400 flex justify-between">
              <span>{promptText.length} characters</span>
              <span>
                {variables.length} variable{variables.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <VariableInputs
            variables={variables}
            values={variableValues}
            onChange={handleVariableChange}
          />
        </div>

        {/* RIGHT HALF — changes based on active tab */}
        <div className="w-1/2 flex flex-col gap-4 min-h-0">
          {tab === "studio" ? (
            <>
              {/* Provider selector */}
              <ProviderSelector
                provider={selectedProvider}
                model={selectedModel}
                onProviderChange={setSelectedProvider}
                onModelChange={setSelectedModel}
              />

              {/* PANEL 2 — TEST/RUN (right top) */}
              <div className="flex-1 min-h-0 flex flex-col">
                <Preview
                  filledPrompt={filledPrompt}
                  hasPrompt={promptText.length > 0}
                  onRun={handleRun}
                  isRunning={isRunning}
                  providerBadge={
                    providerConfig ? (
                      <span
                        className="px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded ml-2"
                        style={{ backgroundColor: providerConfig.color }}
                      >
                        {providerConfig.name}
                      </span>
                    ) : null
                  }
                />
              </div>

              {/* PANEL 3 — OUTPUT (right bottom) */}
              <div className="flex-1 min-h-0 flex flex-col">
                <Output
                  response={response}
                  error={error}
                  isRunning={isRunning}
                  onClear={handleClearOutput}
                  onSaveAnswer={handleSaveAnswer}
                />
                <HistoryPanel
                  onLoadPrompt={handleLoadFromHistory}
                  refreshKey={historyRefresh}
                />
              </div>
            </>
          ) : (
            /* Compare tab */
            <CompareMode
              filledPrompt={filledPrompt}
              hasPrompt={promptText.length > 0}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <SavePromptModal
        isOpen={showSaveModal}
        defaultTitle={promptText.slice(0, 50)}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSavePrompt}
      />
    </div>
  );
}
