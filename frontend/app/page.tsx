"use client";

import { useEffect, useState } from "react";
import { getStats, getJobs } from "@/lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    getStats().then(setStats).catch(console.error);
    getJobs().then((j: any[]) => setRecentJobs(j.slice(0, 10))).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Companies" value={stats.companies} />
          <StatCard label="Leads" value={stats.leads} />
          <StatCard label="Jobs Completed" value={stats.jobs_completed} />
          <StatCard label="Jobs Failed" value={stats.jobs_failed} />
          <StatCard label="Total Tokens In" value={stats.total_tokens_in?.toLocaleString()} />
          <StatCard label="Total Tokens Out" value={stats.total_tokens_out?.toLocaleString()} />
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Recent Jobs</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="pb-2">Domain</th>
              <th className="pb-2">Provider</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Tokens</th>
              <th className="pb-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {recentJobs.map((j) => (
              <tr key={j.id} className="border-b border-gray-800/50">
                <td className="py-2">{j.target_domain}</td>
                <td className="py-2 text-gray-400">{j.llm_provider}</td>
                <td className="py-2">
                  <StatusBadge status={j.status} />
                </td>
                <td className="py-2 text-gray-400">{j.tokens_in + j.tokens_out}</td>
                <td className="py-2 text-gray-500">{new Date(j.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="text-2xl font-bold text-emerald-400">{value ?? "—"}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "text-emerald-400",
    failed: "text-red-400",
    processing: "text-yellow-400",
    pending: "text-gray-400",
  };
  return <span className={`font-medium ${colors[status] || "text-gray-400"}`}>{status}</span>;
}
