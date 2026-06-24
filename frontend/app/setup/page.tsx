"use client";

import { useEffect, useState } from "react";
import { getHealth, getProviders, createVaultKey, enrich, getJob, register, login } from "@/lib/api";

const STEPS = ["System Check", "Account", "LLM Provider", "API Key", "Test Run", "Complete"];

const PROVIDER_INFO: Record<string, { name: string; url: string; placeholder: string }> = {
  openai: { name: "OpenAI", url: "https://platform.openai.com/api-keys", placeholder: "sk-..." },
  anthropic: { name: "Anthropic", url: "https://console.anthropic.com/settings/keys", placeholder: "sk-ant-..." },
  gemini: { name: "Google Gemini", url: "https://aistudio.google.com/apikey", placeholder: "AI..." },
  grok: { name: "Grok (xAI)", url: "https://console.x.ai/", placeholder: "xai-..." },
  mistral: { name: "Mistral", url: "https://console.mistral.ai/api-keys", placeholder: "..." },
  groq: { name: "Groq", url: "https://console.groq.com/keys", placeholder: "gsk_..." },
  deepseek: { name: "DeepSeek", url: "https://platform.deepseek.com/api_keys", placeholder: "sk-..." },
};

export default function SetupWizard() {
  const [step, setStep] = useState(0);
  const [health, setHealth] = useState<any>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [testDomain, setTestDomain] = useState("stripe.com");
  const [testJob, setTestJob] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth({ status: "unreachable" }));
    getProviders().then((p: any) => {
      setProviders(p.providers);
      setProvider(p.default);
    }).catch(() => {});
  }, []);

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)); setError(""); }
  function prev() { setStep(s => Math.max(s - 1, 0)); setError(""); }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password);
      next();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey) { next(); return; }
    setError("");
    setLoading(true);
    try {
      await createVaultKey({ provider, api_key: apiKey, label: "setup-wizard" });
      next();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTest(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTestJob(null);
    try {
      const res = await enrich(testDomain, provider);
      setTestJob({ status: res.status, id: res.job_id });
      const poll = setInterval(async () => {
        try {
          const j = await getJob(res.job_id);
          setTestJob(j);
          if (j.status === "completed" || j.status === "failed") {
            clearInterval(poll);
            setLoading(false);
          }
        } catch { clearInterval(poll); setLoading(false); }
      }, 2500);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-lg animate-in">
        {/* Progress */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= step ? "bg-emerald-500 w-8" : "bg-[var(--color-surface-3)] w-4"}`} />
          ))}
        </div>

        <div className="text-center mb-2">
          <div className="text-[10px] uppercase tracking-widest text-emerald-500 mb-1">Step {step + 1} of {STEPS.length}</div>
          <h1 className="text-xl font-bold text-white">{STEPS[step]}</h1>
        </div>

        <div className="glass rounded-2xl p-8 mt-6">
          {/* Step 0: Health check */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 text-center mb-6">Verifying your OpenEnrich installation</p>
              <Check label="API Server" ok={health?.status === "ok"} />
              <Check label="LLM Provider Configured" ok={health?.llm_configured} />
              <Check label="Vault Encryption" ok={health?.vault_encrypted} warn={!health?.vault_encrypted} warnText="Optional — keys stored base64" />
              <div className="pt-4">
                <button onClick={next} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <p className="text-sm text-gray-400 text-center mb-4">Create your admin account</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required minLength={6}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none" />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={prev} className="flex-1 py-2.5 border border-[var(--color-border)] text-gray-400 text-sm rounded-xl">Back</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 text-white text-sm font-medium rounded-xl transition-all">
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
              <button type="button" onClick={next} className="w-full text-xs text-gray-500 hover:text-gray-300">Skip — already registered</button>
            </form>
          )}

          {/* Step 2: Provider */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400 text-center mb-4">Choose your primary LLM provider</p>
              <div className="grid grid-cols-2 gap-2">
                {providers.map(p => {
                  const info = PROVIDER_INFO[p] || { name: p, url: "", placeholder: "" };
                  return (
                    <button key={p} type="button" onClick={() => setProvider(p)}
                      className={`rounded-xl p-3 text-left transition-all border ${provider === p ? "border-emerald-500/50 bg-emerald-500/10" : "border-[var(--color-border)] hover:border-[var(--color-border-hover)]"}`}>
                      <div className="text-sm font-medium text-white">{info.name}</div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={prev} className="flex-1 py-2.5 border border-[var(--color-border)] text-gray-400 text-sm rounded-xl">Back</button>
                <button onClick={next} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all">Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: API Key */}
          {step === 3 && (
            <form onSubmit={handleSaveKey} className="space-y-4">
              <p className="text-sm text-gray-400 text-center mb-2">
                Enter your {PROVIDER_INFO[provider]?.name || provider} API key
              </p>
              {PROVIDER_INFO[provider]?.url && (
                <p className="text-xs text-center">
                  <a href={PROVIDER_INFO[provider].url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                    Get your key here →
                  </a>
                </p>
              )}
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                placeholder={PROVIDER_INFO[provider]?.placeholder || "API key"}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none font-mono" />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={prev} className="flex-1 py-2.5 border border-[var(--color-border)] text-gray-400 text-sm rounded-xl">Back</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 text-white text-sm font-medium rounded-xl transition-all">
                  {loading ? "Saving..." : apiKey ? "Save & Continue" : "Skip"}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Test */}
          {step === 4 && (
            <form onSubmit={handleTest} className="space-y-4">
              <p className="text-sm text-gray-400 text-center mb-4">Test the enrichment pipeline</p>
              <input type="text" value={testDomain} onChange={e => setTestDomain(e.target.value)} placeholder="stripe.com"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none" />

              {testJob && (
                <div className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    {testJob.status === "completed" && <span className="text-emerald-400">✓</span>}
                    {testJob.status === "failed" && <span className="text-red-400">✗</span>}
                    {(testJob.status === "pending" || testJob.status === "processing") && (
                      <svg className="w-4 h-4 animate-spin text-yellow-400" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                    )}
                    <span className="text-sm text-white capitalize">{testJob.status}</span>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={prev} className="flex-1 py-2.5 border border-[var(--color-border)] text-gray-400 text-sm rounded-xl">Back</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 text-white text-sm font-medium rounded-xl transition-all">
                  {loading ? "Running..." : "Run Test"}
                </button>
              </div>
              <button type="button" onClick={next} className="w-full text-xs text-gray-500 hover:text-gray-300">Skip test →</button>
            </form>
          )}

          {/* Step 5: Complete */}
          {step === 5 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">You&apos;re all set!</h2>
                <p className="text-sm text-gray-400 mt-1">OpenEnrich OS is configured and ready to use</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a href="/" className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all text-center">
                  Dashboard
                </a>
                <a href="/enrich" className="py-2.5 border border-[var(--color-border)] hover:border-emerald-500/30 text-gray-300 text-sm rounded-xl transition-all text-center">
                  Enrich Domains
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Check({ label, ok, warn, warnText }: { label: string; ok: boolean; warn?: boolean; warnText?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${ok ? "bg-emerald-500/20 text-emerald-400" : warn ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
        {ok ? "✓" : warn ? "!" : "✗"}
      </div>
      <div>
        <div className="text-sm text-white">{label}</div>
        {!ok && warnText && <div className="text-xs text-gray-500">{warnText}</div>}
      </div>
    </div>
  );
}
