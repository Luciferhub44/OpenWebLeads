"use client";

import { useEffect, useState } from "react";
import { getVaultKeys, createVaultKey, deleteVaultKey, getProviders } from "@/lib/api";

export default function VaultPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  function refresh() {
    getVaultKeys().then(setKeys).catch(console.error);
  }

  useEffect(() => {
    refresh();
    getProviders().then((p: any) => {
      setProviders(p.providers);
      setProvider(p.providers[0] || "openai");
    }).catch(console.error);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await createVaultKey({ provider, api_key: apiKey, label });
      setApiKey("");
      setLabel("");
      refresh();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string) {
    await deleteVaultKey(id);
    refresh();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">BYOK Vault</h1>

      <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6 space-y-3">
        <div className="text-sm font-medium text-gray-300 mb-2">Add API Key</div>

        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          {providers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-... or API key"
          required
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
        />

        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500"
        />

        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 rounded-lg transition-colors">
          Store Key (AES-256-GCM Encrypted)
        </button>
      </form>

      {error && <div className="mb-4 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3">{error}</div>}

      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-3">
            <div>
              <span className="text-sm font-medium text-emerald-400">{k.provider}</span>
              {k.label && <span className="text-sm text-gray-400 ml-2">({k.label})</span>}
              <div className="text-xs text-gray-500 mt-0.5">Added {new Date(k.created_at).toLocaleDateString()}</div>
            </div>
            <button onClick={() => handleDelete(k.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
          </div>
        ))}
        {keys.length === 0 && <p className="text-gray-500 text-sm">No keys stored. API keys are encrypted with AES-256-GCM before storage.</p>}
      </div>
    </div>
  );
}
