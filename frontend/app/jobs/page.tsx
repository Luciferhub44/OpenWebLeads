"use client";

import { useEffect, useState } from "react";
import { getJobs } from "@/lib/api";

const FILTERS = [
  { value: "", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getJobs(filter || undefined, 100).then(setJobs).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Enrichment pipeline activity</p>
        </div>
        <a href="/enrich" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all">
          + New Job
        </a>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-[var(--color-surface-2)] rounded-lg w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              filter === f.value
                ? "bg-[var(--color-surface-3)] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-14 skeleton" />)}</div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-[var(--color-border)]">
                <th className="px-5 py-3 font-medium">Domain</th>
                <th className="px-5 py-3 font-medium">Provider</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Tokens</th>
                <th className="px-5 py-3 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={j.status} />
                      <span className="text-white font-medium">{j.target_domain}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{j.llm_provider || "—"}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={j.status} />
                  </td>
                  <td className="px-5 py-3 text-right text-gray-400 tabular-nums">
                    {j.tokens_in + j.tokens_out > 0 ? (j.tokens_in + j.tokens_out).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-500 text-xs">{new Date(j.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">
              {filter ? `No ${filter} jobs` : "No jobs yet"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const c: Record<string, string> = { completed: "bg-emerald-400", failed: "bg-red-400", processing: "bg-yellow-400 animate-pulse", pending: "bg-gray-500" };
  return <div className={`w-2 h-2 rounded-full shrink-0 ${c[status] || "bg-gray-500"}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "text-emerald-400 bg-emerald-500/10",
    failed: "text-red-400 bg-red-500/10",
    processing: "text-yellow-400 bg-yellow-500/10",
    pending: "text-gray-400 bg-gray-500/10",
  };
  return <span className={`text-xs font-medium px-2 py-1 rounded-md ${styles[status] || styles.pending}`}>{status}</span>;
}
