"use client";

import { useState, useEffect } from "react";
import { enrich, getProviders, getJob } from "@/lib/api";

export default function EnrichPage() {
  const [domain, setDomain] = useState("");
  const [provider, setProvider] = useState("");
  const [providers, setProviders] = useState<string[]>([]);
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    getProviders().then((p: any) => {
      setProviders(p.providers);
      setProvider(p.default);
    }).catch(console.error);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    try {
      const res = await enrich(domain, provider);
      setJobId(res.job_id);
      setStatus(res.status);
      setPolling(true);
      pollJob(res.job_id);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function pollJob(id: string) {
    const interval = setInterval(async () => {
      try {
        const job = await getJob(id);
        setStatus(job.status);
        if (job.status === "completed" || job.status === "failed") {
          clearInterval(interval);
          setPolling(false);
          if (job.status === "failed") setError(job.error_message || "Job failed");
        }
      } catch {
        clearInterval(interval);
        setPolling(false);
      }
    }, 2000);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Enrich a Domain</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="e.g. stripe.com"
          required
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
        />

        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
        >
          {providers.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={polling || !domain}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white font-medium py-2 rounded-lg transition-colors"
        >
          {polling ? "Processing..." : "Enrich"}
        </button>
      </form>

      {status && (
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Job: <span className="text-gray-200 font-mono text-xs">{jobId}</span></div>
          <div className="text-sm mt-1">
            Status: <span className={status === "completed" ? "text-emerald-400" : status === "failed" ? "text-red-400" : "text-yellow-400"}>{status}</span>
          </div>
          {status === "completed" && (
            <a href={`/companies`} className="text-sm text-emerald-400 hover:underline mt-2 inline-block">
              View companies &rarr;
            </a>
          )}
        </div>
      )}

      {error && <div className="mt-4 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3">{error}</div>}
    </div>
  );
}
