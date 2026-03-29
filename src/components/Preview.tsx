"use client";

interface PreviewProps {
  filledPrompt: string;
  hasPrompt: boolean;
  onRun: () => void;
  isRunning: boolean;
  providerBadge?: React.ReactNode;
}

export default function Preview({
  filledPrompt,
  hasPrompt,
  onRun,
  isRunning,
  providerBadge,
}: PreviewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700">
          Fill &amp; Preview
        </h2>
        <div className="flex items-center">
          <button
            onClick={onRun}
            disabled={!hasPrompt || isRunning}
            className="px-4 py-1.5 text-xs font-medium text-white bg-mmp-accent rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRunning && (
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isRunning ? "Running..." : "Run with AI"}
          </button>
          {providerBadge}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto bg-white border border-gray-200 rounded-md p-3">
        {hasPrompt ? (
          <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800 leading-relaxed">
            {filledPrompt}
          </pre>
        ) : (
          <p className="text-sm text-gray-400 italic">
            Start typing a prompt to see a preview here...
          </p>
        )}
      </div>
    </div>
  );
}
