"use client";

import { useState } from "react";
import { setApiKey } from "@/lib/storage";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ApiKeyModal({
  isOpen,
  onClose,
  onSaved,
}: ApiKeyModalProps) {
  const [key, setKey] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!key.trim()) return;
    // TODO: Replace localStorage with real API call to securely store key server-side
    setApiKey(key.trim());
    setKey("");
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Add API Key
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Paste your OpenAI API key below. It will be stored locally in your
          browser only.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mmp-accent focus:border-mmp-accent"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-mmp-accent rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
}
