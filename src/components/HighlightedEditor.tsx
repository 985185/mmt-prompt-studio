"use client";

import { useRef, useCallback } from "react";

interface HighlightedEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * A prompt editor that highlights {{variables}} in MMP accent colour.
 * Uses a backdrop highlight div behind a transparent textarea.
 */
export default function HighlightedEditor({
  value,
  onChange,
  placeholder,
}: HighlightedEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Build highlighted HTML: escape HTML entities, then wrap {{vars}} in spans
  const getHighlightedHtml = () => {
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const highlighted = escaped.replace(
      /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g,
      '<span class="variable-highlight">{{$1}}</span>'
    );
    // Append a trailing newline so the backdrop sizing matches the textarea
    return highlighted + "\n";
  };

  return (
    <div className="relative flex-1 min-h-0">
      {/* Backdrop layer with highlights */}
      <div
        ref={backdropRef}
        className="absolute inset-0 overflow-auto pointer-events-none whitespace-pre-wrap break-words p-3 text-sm font-mono text-transparent leading-relaxed"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: getHighlightedHtml() }}
      />
      {/* Actual textarea — transparent text so highlights show through */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="relative w-full h-full resize-none bg-transparent p-3 text-sm font-mono leading-relaxed text-gray-900 outline-none caret-gray-900 placeholder:text-gray-400"
        style={{ caretColor: "#1a1a1a" }}
      />
    </div>
  );
}
