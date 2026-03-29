"use client";

import { useEffect, useState } from "react";
import { ProviderId } from "@/types";
import { getConfiguredProviders } from "@/lib/storage";
import { PROVIDERS, getProvider } from "@/lib/providers";
import Link from "next/link";

interface ProviderSelectorProps {
  provider: ProviderId | null;
  model: string;
  onProviderChange: (provider: ProviderId) => void;
  onModelChange: (model: string) => void;
}

export default function ProviderSelector({
  provider,
  model,
  onProviderChange,
  onModelChange,
}: ProviderSelectorProps) {
  const [configured, setConfigured] = useState<ProviderId[]>([]);

  useEffect(() => {
    setConfigured(getConfiguredProviders());
  }, []);

  if (configured.length === 0) {
    return (
      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
        No AI providers configured.{" "}
        <Link href="/settings" className="underline font-medium hover:text-amber-900">
          Go to Settings
        </Link>{" "}
        to add your API keys.
      </div>
    );
  }

  const currentProvider = provider ? getProvider(provider) : null;
  const availableProviders = PROVIDERS.filter((p) => configured.includes(p.id));
  const models = currentProvider?.models || [];

  return (
    <div className="flex items-center gap-2 mb-3">
      {/* Provider dropdown */}
      <select
        value={provider || ""}
        onChange={(e) => {
          const newProv = e.target.value as ProviderId;
          onProviderChange(newProv);
          // Auto-select first model of new provider
          const prov = getProvider(newProv);
          if (prov && prov.models.length > 0) {
            onModelChange(prov.models[0].id);
          }
        }}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-mmp-accent"
      >
        <option value="" disabled>
          Select provider...
        </option>
        {availableProviders.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Model dropdown */}
      {provider && (
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-mmp-accent"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      )}

      {/* Provider badge */}
      {currentProvider && (
        <span
          className="px-2 py-0.5 text-[10px] font-bold uppercase text-white rounded"
          style={{ backgroundColor: currentProvider.color }}
        >
          {currentProvider.name}
        </span>
      )}
    </div>
  );
}
