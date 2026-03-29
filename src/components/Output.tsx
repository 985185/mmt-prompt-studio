"use client";

import { useState } from "react";

interface OutputProps {
  response: string;
  error: string;
  isRunning: boolean;
  onClear: () => void;
  onSaveAnswer: () => void;
}

export default function Output({
  response,
  error,
  isRunning,
  onClear,
  onSaveAnswer,
}: OutputProps) {
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(response);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700">Output</h2>
        <div className="flex items-center gap-2">
          {response && (
            <>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                {copyFeedback ? "Copied!" : "Copy Response"}
              </button>
              <button
                onClick={onSaveAnswer}
                className="px-3 py-1.5 text-xs font-medium text-white bg-mmp-accent rounded-md hover:opacity-90 transition-opacity"
              >
                Save as Answer
              </button>
            </>
          )}
          <button
            onClick={onClear}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto bg-white border border-gray-200 rounded-md p-3">
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}
        {isRunning && !response && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-mmp-accent rounded-full animate-spin" />
            Generating response...
          </div>
        )}
        {response ? (
          <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800 leading-relaxed">
            {response}
          </pre>
        ) : (
          !isRunning &&
          !error && (
            <p className="text-sm text-gray-400 italic">
              AI responses will appear here...
            </p>
          )
        )}
      </div>
    </div>
  );
}
