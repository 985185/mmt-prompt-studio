// --- Provider system ---

export type ProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "groq"
  | "mistral"
  | "deepseek"
  | "xai"
  | "perplexity"
  | "cohere"
  | "ollama";

export interface ModelConfig {
  id: string;
  label: string;
}

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  color: string;
  models: ModelConfig[];
  /** Provider group for settings UI */
  group: "cloud" | "opensource" | "local";
  /** Whether an API key is required (false for Ollama) */
  requiresKey: boolean;
}

// --- Prompts ---

export interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  tags: string[];
  variables: string[];
  createdAt: string;
  updatedAt: string;
  /** Providers/models this prompt has been run with */
  runsWith?: { provider: ProviderId; model: string }[];
  /** Best rating from compare mode (1 = thumbs up, -1 = thumbs down) */
  bestRating?: number;
  /** Last time this prompt was run */
  lastRunAt?: string;
}

export interface SavedAnswer {
  id: string;
  promptId: string;
  response: string;
  model: string;
  provider?: ProviderId;
  createdAt: string;
}

// --- History ---

export interface HistoryEntry {
  id: string;
  promptSnippet: string;
  provider: ProviderId;
  model: string;
  responseSnippet: string;
  timestamp: string;
}

// --- Compare mode ---

export interface ComparisonSlot {
  provider: ProviderId;
  model: string;
  response: string;
  error: string;
  isRunning: boolean;
  durationMs: number;
  tokenEstimate: number;
  rating: number; // 1 = thumbs up, -1 = thumbs down, 0 = unrated
}

// --- Settings (legacy compat) ---

export interface AppSettings {
  apiKey: string;
  defaultModel: string;
}
