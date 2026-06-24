"use client";

import { useEffect, useState } from "react";
import { getVaultKeys, createVaultKey, deleteVaultKey, getProviders, getHealth } from "@/lib/api";

const PROVIDER_ICONS: Record<string, string> = {
  openai: "O", anthropic: "A", gemini: "G", grok: "X", mistral: "M", groq: "G", deepseek: "D",
};

export default function VaultPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [encrypted, setEncrypted] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function refresh() {
    getVaultKeys().then(setKeys).catch(console.error);
  }

  useEffect(() => {
    refresh();
    getProviders().then((p: any) => {
      setProviders(p.providers);
      setProvider(p.providers[0] || "openai");
    }).catch(console.error);
    getHealth().then((h: any) => setEncrypted(h.vault_encrypted)).catch(() => {});
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createVaultKey({ provider, api_key: apiKey, label });
      setApiKey("");
      setLabel("");
      setSuccess(`${provider} key stored successfully`);
      setShowForm(false);
      refresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(id: string, providerName: string) {
    if (!confirm(`Delete ${providerName} key?`)) return;
    await deleteVaultKey(id);
    refresh();
  }

  return (
    <div className="animate-in max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">BYOK Vault</h1>
          <p className="text-sm text-gray-500 mt-1">Securely store API keys for LLM providers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all">
          {showForm ? "Cancel" : "+ Add Key"}
        </button>
      </div>

      {/* Encryption status */}
      <div className={`glass rounded-xl p-4 mb-6 flex items-center gap-3 ${encrypted ? "border-emerald-500/20" : "border-yellow-500/20"}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${encrypted ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={encrypted ? "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" : "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"} />
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium text-white">{encrypted ? "AES-256-GCM Encryption Active" : "Vault Unencrypted"}</div>
          <div className="text-xs text-gray-500">{encrypted ? "All keys are encrypted at rest" : "Set ENCRYPTION_MASTER_KEY for encrypted storage"}</div>
        </div>
      </div>

      {success && <div className="glass rounded-xl p-3 mb-4 border-emerald-500/20 text-sm text-emerald-400">{success}</div>}
      {error && <div className="glass rounded-xl p-3 mb-4 border-red-500/20 text-sm text-red-400">{error}</div>}

      {/* Add key form */}
      {showForm && (
        <form onSubmit={handleAdd} className="glass rounded-xl p-6 mb-6 animate-in space-y-4">
          <div className="text-sm font-medium text-white mb-2">Store API Key</div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {providers.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={`rounded-lg p-2.5 text-sm text-left transition-all border ${
                  provider === p
                    ? "border-emerald-500/50 bg-emerald-500/10 text-white"
                    : "border-[var(--color-border)] text-gray-400 hover:border-[var(--color-border-hover)]"
                }`}
              >
                <span className="font-medium">{p}</span>
              </button>
            ))}
          </div>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-... or API key"
            required
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
          />

          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (e.g. production, personal)"
            className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none"
          />

          <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all">
            Store Key
          </button>
        </form>
      )}

      {/* Keys list */}
      <div className="space-y-2">
        {keys.map((k) => (
          <div key={k.id} className="glass rounded-xl p-4 flex items-center justify-between group hover:border-[var(--color-border-hover)] transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-3)] flex items-center justify-center text-gray-400 font-bold text-sm">
                {PROVIDER_ICONS[k.provider] || k.provider[0].toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{k.provider}</div>
                <div className="text-xs text-gray-500">
                  {k.label && <span>{k.label} · </span>}
                  Added {new Date(k.created_at).toLocaleDateString()}
                  {k.is_active && <span className="text-emerald-500 ml-2">● Active</span>}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(k.id, k.provider)}
              className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
            >
              Delete
            </button>
          </div>
        ))}
        {keys.length === 0 && !showForm && (
          <div className="text-center py-16 glass rounded-xl">
            <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <p className="text-gray-500 text-sm">No API keys stored yet</p>
            <button onClick={() => setShowForm(true)} className="text-emerald-400 text-sm hover:underline mt-2">Add your first key →</button>
          </div>
        )}
      </div>
    </div>
  );
}
