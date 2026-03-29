import { ProviderConfig, ProviderId } from "@/types";

/**
 * Central registry of all supported AI providers.
 * Inspired by the promptfoo provider list — see https://www.promptfoo.dev/docs/providers/
 */
export const PROVIDERS: ProviderConfig[] = [
  // --- Cloud Providers ---
  {
    id: "openai",
    name: "OpenAI",
    color: "#10A37F",
    group: "cloud",
    requiresKey: true,
    models: [
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    color: "#D97757",
    group: "cloud",
    requiresKey: true,
    models: [
      { id: "claude-opus-4-6", label: "Claude Opus 4" },
      { id: "claude-sonnet-4-5", label: "Claude Sonnet 4" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4" },
    ],
  },
  {
    id: "google",
    name: "Google Gemini",
    color: "#4285F4",
    group: "cloud",
    requiresKey: true,
    models: [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    ],
  },
  {
    id: "xai",
    name: "xAI / Grok",
    color: "#000000",
    group: "cloud",
    requiresKey: true,
    models: [
      { id: "grok-3-beta", label: "Grok 3 Beta" },
      { id: "grok-3-mini-beta", label: "Grok 3 Mini Beta" },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    color: "#20808D",
    group: "cloud",
    requiresKey: true,
    models: [
      { id: "sonar-pro", label: "Sonar Pro" },
      { id: "sonar", label: "Sonar" },
    ],
  },
  // --- Open Source Hosted ---
  {
    id: "groq",
    name: "Groq",
    color: "#F55036",
    group: "opensource",
    requiresKey: true,
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
      { id: "gemma2-9b-it", label: "Gemma2 9B" },
    ],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    color: "#FF7000",
    group: "opensource",
    requiresKey: true,
    models: [
      { id: "mistral-large-latest", label: "Mistral Large" },
      { id: "mistral-small-latest", label: "Mistral Small" },
      { id: "open-mixtral-8x7b", label: "Open Mixtral 8x7B" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    color: "#4D6BFE",
    group: "opensource",
    requiresKey: true,
    models: [
      { id: "deepseek-chat", label: "DeepSeek Chat" },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner" },
    ],
  },
  {
    id: "cohere",
    name: "Cohere",
    color: "#39594D",
    group: "opensource",
    requiresKey: true,
    models: [
      { id: "command-r-plus", label: "Command R+" },
      { id: "command-r", label: "Command R" },
    ],
  },
  // --- Local / Free ---
  {
    id: "ollama",
    name: "Ollama",
    color: "#8B5CF6",
    group: "local",
    requiresKey: false,
    models: [
      { id: "llama3.2", label: "Llama 3.2" },
      { id: "mistral", label: "Mistral" },
      { id: "codellama", label: "Code Llama" },
      { id: "phi3", label: "Phi-3" },
    ],
  },
];

/** Lookup a provider config by id */
export function getProvider(id: ProviderId): ProviderConfig | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

/** Get providers grouped for the settings UI */
export function getProvidersByGroup() {
  return {
    cloud: PROVIDERS.filter((p) => p.group === "cloud"),
    opensource: PROVIDERS.filter((p) => p.group === "opensource"),
    local: PROVIDERS.filter((p) => p.group === "local"),
  };
}
