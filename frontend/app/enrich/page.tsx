"use client";

import { useState, useEffect, useRef } from "react";
import { enrich, getProviders, getJob } from "@/lib/api";

const PROVIDER_META: Record<string, { color: string; label: string }> = {
  openai: { color: "from-green-500/20 to-green-600/10", label: "OpenAI" },
  anthropic: { color: "from-orange-500/20 to-orange-600/10", label: "Anthropic" },
  gemini: { color: "from-blue-500/20 to-blue-600/10", label: "Google Gemini" },
  grok: { color: "from-purple-500/20 to-purple-600/10", label: "Grok (xAI)" },
  mistral: { color: "from-cyan-500/20 to-cyan-600/10", label: "Mistral" },
  groq: { color: "from-pink-500/20 to-pink-600/10", label: "Groq" },
  deepseek: { color: "from-indigo-500/20 to-indigo-600/10", label: "DeepSeek" },
};

export default function EnrichPage() {
  const [domain, setDomain] = useState("");
  const [provider, setProvider] = useState("");
  const [providers, setProviders] = useState<string[]>([]);
  const [jobId, setJobId] = useState("");
  const [job, setJob] = useState<any>(null);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);
  const [domains, setDomains] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getProviders().then((p: any) => {
      setProviders(p.providers);
      setProvider(p.default);
    }).catch(console.error);
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setJob(null);

    const targetDomains = bulkMode
      ? domains.split(/[\n,]+/).map(d => d.trim()).filter(Boolean)
      : [domain.trim()];

    if (targetDomains.length === 0) return;

    try {
      const res = await enrich(targetDomains[0], provider);
      setJobId(res.job_id);
      setJob({ status: res.status });
      setPolling(true);
      pollJob(res.job_id);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function pollJob(id: string) {
    const interval = setInterval(async () => {
      try {
        const j = await getJob(id);
        setJob(j);
        if (j.status === "completed" || j.status === "failed") {
          clearInterval(interval);
          setPolling(false);
          if (j.status === "failed") setError(j.error_message || "Enrichment failed");
        }
      } catch {
        clearInterval(interval);
        setPolling(false);
      }
    }, 2000);
  }

  return (
    <div className="animate-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Enrich</h1>
        <p className="text-sm text-gray-500 mt-1">Extract company data, contacts, and email patterns from any domain</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Domain input */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">Target Domain</label>
            <button type="button" onClick={() => setBulkMode(!bulkMode)} className="text-xs text-gray-500 hover:text-emerald-400 transition-colors">
              {bulkMode ? "Single mode" : "Bulk mode"}
            </button>
          </div>
          {bulkMode ? (
            <textarea
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
              placeholder={"stripe.com\nlinear.app\nvercel.com"}
              rows={4}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none resize-none font-mono text-sm transition-colors"
            />
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. stripe.com"
              required={!bulkMode}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none text-sm transition-colors"
            />
          )}
        </div>

        {/* Provider selection */}
        <div className="glass rounded-xl p-5">
          <label className="text-sm font-medium text-gray-300 mb-3 block">LLM Provider</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {providers.map((p) => {
              const meta = PROVIDER_META[p] || { color: "from-gray-500/20 to-gray-600/10", label: p };
              const selected = provider === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`relative rounded-lg p-3 text-left transition-all border ${
                    selected
                      ? "border-emerald-500/50 bg-gradient-to-br " + meta.color
                      : "border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-[var(--color-surface)]"
                  }`}
                >
                  <div className="text-sm font-medium text-white">{meta.label}</div>
                  {selected && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={polling || (!domain && !domains)}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-emerald-900/30 text-sm"
        >
          {polling ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
              Processing...
            </span>
          ) : "Start Enrichment"}
        </button>
      </form>

      {/* Job result */}
      {job && (
        <div className="mt-6 glass rounded-xl p-5 animate-in">
          <div className="flex items-center gap-3 mb-3">
            <StatusIcon status={job.status} />
            <div>
              <div className="text-sm font-medium text-white capitalize">{job.status}</div>
              <div className="text-xs text-gray-500 font-mono">{jobId.slice(0, 8)}...</div>
            </div>
          </div>
          {job.status === "completed" && (
            <div className="flex gap-3 mt-3">
              {job.company_id && (
                <a href={`/companies/${job.company_id}`} className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                  View company →
                </a>
              )}
              <a href="/companies" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">All companies</a>
            </div>
          )}
          {job.tokens_in > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              Tokens: {job.tokens_in.toLocaleString()} in / {job.tokens_out.toLocaleString()} out
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 glass rounded-xl p-4 border-red-500/20 animate-in">
          <div className="text-sm text-red-400">{error}</div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>;
  if (status === "failed") return <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></div>;
  return <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center"><svg className="w-4 h-4 animate-spin text-yellow-400" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></div>;
}
