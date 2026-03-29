import { SavedPrompt, SavedAnswer, ProviderId, HistoryEntry } from "@/types";

const PROMPTS_KEY = "mmp_prompts";
const ANSWERS_KEY = "mmp_answers";
const HISTORY_KEY = "mmp_history";
const OLLAMA_URL_KEY = "mmp_ollama_url";
const MAX_HISTORY = 20;

// Legacy keys kept for backward compatibility
const API_KEY_KEY = "mmp_api_key";
const MODEL_KEY = "mmp_default_model";

// --- Provider keys ---

// TODO: Replace localStorage with real backend API call (encrypted server-side storage)
export function getProviderKey(provider: ProviderId): string {
  if (typeof window === "undefined") return "";
  // Legacy fallback: if openai key requested, also check old key
  if (provider === "openai") {
    return localStorage.getItem(`mmp_key_${provider}`) || localStorage.getItem(API_KEY_KEY) || "";
  }
  return localStorage.getItem(`mmp_key_${provider}`) || "";
}

// TODO: Replace localStorage with real backend API call
export function setProviderKey(provider: ProviderId, key: string): void {
  localStorage.setItem(`mmp_key_${provider}`, key);
}

// TODO: Replace localStorage with real backend API call
export function hasProviderKey(provider: ProviderId): boolean {
  if (provider === "ollama") return true; // Ollama is always "configured" (local)
  return !!getProviderKey(provider);
}

/** Get list of provider IDs that have a saved API key */
export function getConfiguredProviders(): ProviderId[] {
  const all: ProviderId[] = [
    "openai", "anthropic", "google", "groq", "mistral",
    "deepseek", "xai", "perplexity", "cohere", "ollama",
  ];
  return all.filter(hasProviderKey);
}

// --- Ollama base URL ---

// TODO: Replace localStorage with real backend API call
export function getOllamaBaseUrl(): string {
  if (typeof window === "undefined") return "http://localhost:11434";
  return localStorage.getItem(OLLAMA_URL_KEY) || "http://localhost:11434";
}

// TODO: Replace localStorage with real backend API call
export function setOllamaBaseUrl(url: string): void {
  localStorage.setItem(OLLAMA_URL_KEY, url);
}

// --- Prompts ---

// TODO: Replace localStorage with real API call (POST /api/prompts)
export function savePrompt(prompt: Omit<SavedPrompt, "id" | "createdAt" | "updatedAt">): SavedPrompt {
  const prompts = getPrompts();
  const newPrompt: SavedPrompt = {
    ...prompt,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  prompts.push(newPrompt);
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
  return newPrompt;
}

// TODO: Replace localStorage with real API call (GET /api/prompts)
export function getPrompts(): SavedPrompt[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(PROMPTS_KEY);
  return data ? JSON.parse(data) : [];
}

// TODO: Replace localStorage with real API call (GET /api/prompts/:id)
export function getPromptById(id: string): SavedPrompt | undefined {
  return getPrompts().find((p) => p.id === id);
}

// TODO: Replace localStorage with real API call (DELETE /api/prompts/:id)
export function deletePrompt(id: string): void {
  const prompts = getPrompts().filter((p) => p.id !== id);
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
}

// TODO: Replace localStorage with real API call (PUT /api/prompts/:id)
export function updatePrompt(id: string, updates: Partial<SavedPrompt>): void {
  const prompts = getPrompts().map((p) =>
    p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
  );
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
}

// --- Answers ---

// TODO: Replace localStorage with real API call (POST /api/answers)
export function saveAnswer(answer: Omit<SavedAnswer, "id" | "createdAt">): SavedAnswer {
  const answers = getAnswers();
  const newAnswer: SavedAnswer = {
    ...answer,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  answers.push(newAnswer);
  localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
  return newAnswer;
}

// TODO: Replace localStorage with real API call (GET /api/answers)
export function getAnswers(): SavedAnswer[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(ANSWERS_KEY);
  return data ? JSON.parse(data) : [];
}

// --- History ---

// TODO: Replace localStorage with real API call (POST /api/history)
export function addHistoryEntry(entry: Omit<HistoryEntry, "id">): void {
  const history = getHistory();
  history.unshift({ ...entry, id: crypto.randomUUID() });
  // Keep only the last MAX_HISTORY entries
  const trimmed = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

// TODO: Replace localStorage with real API call (GET /api/history)
export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

// TODO: Replace localStorage with real API call (DELETE /api/history)
export function clearHistory(): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify([]));
}

// --- Legacy settings (kept for backward compat) ---

// TODO: Replace localStorage with real API call (encrypted server-side storage)
export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return getProviderKey("openai");
}

// TODO: Replace localStorage with real API call
export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_KEY, key);
  setProviderKey("openai", key);
}

// TODO: Replace localStorage with real API call (GET /api/settings)
export function getDefaultModel(): string {
  if (typeof window === "undefined") return "gpt-4o-mini";
  return localStorage.getItem(MODEL_KEY) || "gpt-4o-mini";
}

// TODO: Replace localStorage with real API call (PUT /api/settings)
export function setDefaultModel(model: string): void {
  localStorage.setItem(MODEL_KEY, model);
}
