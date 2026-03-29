/**
 * Unified multi-provider API layer.
 * All calls go directly from the browser to provider APIs (BYOK).
 *
 * TODO: Replace direct browser→provider calls with server-side proxy routes
 * in production to avoid exposing API keys in network requests.
 */

import { ProviderId } from "@/types";
import { getProviderKey, getOllamaBaseUrl } from "./storage";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface RunOptions {
  provider: ProviderId;
  model: string;
  prompt: string;
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

/**
 * Run a prompt against any supported provider.
 * Streams where the API supports it.
 */
export async function runPrompt(opts: RunOptions): Promise<void> {
  const { provider } = opts;

  switch (provider) {
    // OpenAI-compatible streaming providers
    case "openai":
    case "groq":
    case "mistral":
    case "deepseek":
    case "xai":
    case "perplexity":
      return runOpenAICompatible(opts);
    case "anthropic":
      return runAnthropic(opts);
    case "google":
      return runGemini(opts);
    case "cohere":
      return runCohere(opts);
    case "ollama":
      return runOllama(opts);
    default:
      opts.onError(`Unsupported provider: ${provider}`);
  }
}

/**
 * Quick connection test — sends "Hello" and checks for a valid response.
 * Returns true on success, throws with an error message on failure.
 */
export async function testConnection(
  provider: ProviderId,
  apiKey: string
): Promise<boolean> {
  try {
    switch (provider) {
      case "openai":
      case "groq":
      case "mistral":
      case "deepseek":
      case "xai":
      case "perplexity": {
        const url = getOpenAICompatibleUrl(provider);
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: getTestModel(provider),
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 5,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      }
      case "anthropic": {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-allow-browser": "true",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5",
            max_tokens: 5,
            messages: [{ role: "user", content: "Hello" }],
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      }
      case "google": {
        const model = "gemini-1.5-pro";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Hello" }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      }
      case "cohere": {
        const res = await fetch("https://api.cohere.com/v2/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "command-r",
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 5,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      }
      case "ollama": {
        // For Ollama we just check if the server is reachable
        const base = getOllamaBaseUrl();
        const res = await fetch(`${base}/api/tags`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
      }
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Connection failed"
    );
  }
}

// ---------------------------------------------------------------------------
// OpenAI-compatible streaming (OpenAI, Groq, Mistral, DeepSeek, xAI, Perplexity)
// ---------------------------------------------------------------------------

function getOpenAICompatibleUrl(provider: ProviderId): string {
  const urls: Record<string, string> = {
    openai: "https://api.openai.com/v1/chat/completions",
    groq: "https://api.groq.com/openai/v1/chat/completions",
    mistral: "https://api.mistral.ai/v1/chat/completions",
    deepseek: "https://api.deepseek.com/chat/completions",
    xai: "https://api.x.ai/v1/chat/completions",
    perplexity: "https://api.perplexity.ai/chat/completions",
  };
  return urls[provider] || urls.openai;
}

function getTestModel(provider: ProviderId): string {
  const models: Record<string, string> = {
    openai: "gpt-3.5-turbo",
    groq: "gemma2-9b-it",
    mistral: "mistral-small-latest",
    deepseek: "deepseek-chat",
    xai: "grok-3-mini-beta",
    perplexity: "sonar",
  };
  return models[provider] || "gpt-3.5-turbo";
}

async function runOpenAICompatible(opts: RunOptions): Promise<void> {
  const { provider, model, prompt, onChunk, onDone, onError } = opts;
  // TODO: Replace localStorage key lookup with real backend API call
  const apiKey = getProviderKey(provider);
  if (!apiKey) {
    onError(`No API key configured for ${provider}. Go to Settings to add one.`);
    return;
  }

  try {
    const url = getOpenAICompatibleUrl(provider);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      let msg = `API error: ${res.status}`;
      try {
        msg = JSON.parse(body)?.error?.message || msg;
      } catch { /* use default */ }
      onError(msg);
      return;
    }

    await readSSEStream(res, onChunk, onDone, onError);
  } catch (err) {
    onError(err instanceof Error ? err.message : "Unknown error");
  }
}

// ---------------------------------------------------------------------------
// Anthropic (different header/body/SSE format)
// ---------------------------------------------------------------------------

async function runAnthropic(opts: RunOptions): Promise<void> {
  const { model, prompt, onChunk, onDone, onError } = opts;
  const apiKey = getProviderKey("anthropic");
  if (!apiKey) {
    onError("No API key configured for Anthropic. Go to Settings to add one.");
    return;
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-allow-browser": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        stream: true,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      let msg = `API error: ${res.status}`;
      try {
        msg = JSON.parse(body)?.error?.message || msg;
      } catch { /* use default */ }
      onError(msg);
      return;
    }

    // Anthropic SSE has different event types
    const reader = res.body?.getReader();
    if (!reader) { onError("Failed to read stream."); return; }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") { onDone(); return; }
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta") {
            const text = parsed.delta?.text;
            if (text) onChunk(text);
          } else if (parsed.type === "message_stop") {
            onDone();
            return;
          }
        } catch { /* skip */ }
      }
    }

    onDone();
  } catch (err) {
    onError(err instanceof Error ? err.message : "Unknown error");
  }
}

// ---------------------------------------------------------------------------
// Google Gemini (REST, SSE streaming)
// ---------------------------------------------------------------------------

async function runGemini(opts: RunOptions): Promise<void> {
  const { model, prompt, onChunk, onDone, onError } = opts;
  const apiKey = getProviderKey("google");
  if (!apiKey) {
    onError("No API key configured for Google Gemini. Go to Settings to add one.");
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      let msg = `API error: ${res.status}`;
      try {
        msg = JSON.parse(body)?.error?.message || msg;
      } catch { /* use default */ }
      onError(msg);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) { onError("Failed to read stream."); return; }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        try {
          const parsed = JSON.parse(data);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) onChunk(text);
        } catch { /* skip */ }
      }
    }

    onDone();
  } catch (err) {
    onError(err instanceof Error ? err.message : "Unknown error");
  }
}

// ---------------------------------------------------------------------------
// Cohere v2 (non-streaming for simplicity — Cohere v2 SSE is complex)
// ---------------------------------------------------------------------------

async function runCohere(opts: RunOptions): Promise<void> {
  const { model, prompt, onChunk, onDone, onError } = opts;
  const apiKey = getProviderKey("cohere");
  if (!apiKey) {
    onError("No API key configured for Cohere. Go to Settings to add one.");
    return;
  }

  try {
    const res = await fetch("https://api.cohere.com/v2/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      let msg = `API error: ${res.status}`;
      try {
        msg = JSON.parse(body)?.message || msg;
      } catch { /* use default */ }
      onError(msg);
      return;
    }

    // Cohere v2 streaming sends NDJSON-like SSE events
    const reader = res.body?.getReader();
    if (!reader) { onError("Failed to read stream."); return; }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        // Cohere v2 stream sends data: prefixed JSON or bare JSON
        const jsonStr = trimmed.startsWith("data: ") ? trimmed.slice(6) : trimmed;
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === "content-delta") {
            const text = parsed.delta?.message?.content?.text;
            if (text) onChunk(text);
          }
        } catch { /* skip */ }
      }
    }

    onDone();
  } catch (err) {
    onError(err instanceof Error ? err.message : "Unknown error");
  }
}

// ---------------------------------------------------------------------------
// Ollama (local, NDJSON streaming)
// ---------------------------------------------------------------------------

async function runOllama(opts: RunOptions): Promise<void> {
  const { model, prompt, onChunk, onDone, onError } = opts;
  const base = getOllamaBaseUrl();

  try {
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
    });

    if (!res.ok) {
      onError(`Ollama error: ${res.status}. Is Ollama running at ${base}?`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) { onError("Failed to read stream."); return; }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            onChunk(parsed.message.content);
          }
          if (parsed.done) {
            onDone();
            return;
          }
        } catch { /* skip */ }
      }
    }

    onDone();
  } catch (err) {
    onError(
      err instanceof Error
        ? `Ollama connection failed: ${err.message}. Is Ollama running at ${base}?`
        : "Unknown error"
    );
  }
}

// ---------------------------------------------------------------------------
// Shared SSE reader for OpenAI-compatible APIs
// ---------------------------------------------------------------------------

async function readSSEStream(
  res: Response,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (error: string) => void
): Promise<void> {
  const reader = res.body?.getReader();
  if (!reader) { onError("Failed to read response stream."); return; }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const data = trimmed.slice(6);
      if (data === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onChunk(content);
      } catch { /* skip malformed chunks */ }
    }
  }

  onDone();
}
