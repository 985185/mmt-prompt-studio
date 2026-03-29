"use client";

import { useState } from "react";

interface EditorToolbarProps {
  onClear: () => void;
  onCopy: () => void;
  onSave: () => void;
}

export default function EditorToolbar({
  onClear,
  onCopy,
  onSave,
}: EditorToolbarProps) {
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  };

  return (
    <div className="flex items-center gap-2 mb-2">
      <button
        onClick={onClear}
        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
      >
        Clear
      </button>
      <button
        onClick={handleCopy}
        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
      >
        {copyFeedback ? "Copied!" : "Copy Prompt"}
      </button>
      <button
        onClick={onSave}
        className="px-3 py-1.5 text-xs font-medium text-white bg-mmp-accent rounded-md hover:opacity-90 transition-opacity"
      >
        Save to Library
      </button>
    </div>
  );
}
