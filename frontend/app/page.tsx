"use client";

import { useEffect, useState } from "react";
import { getStats, getJobs } from "@/lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStats().then(setStats),
      getJobs().then((j: any[]) => setJobs(j.slice(0, 8))),
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  const successRate = stats && stats.jobs_total > 0
    ? Math.round((stats.jobs_completed / stats.jobs_total) * 100) : 0;

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your lead enrichment pipeline</p>
        </div>
        <a href="/enrich" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-900/30">
          + New Enrichment
        </a>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in-delay">
        <StatCard label="Companies" value={stats?.companies ?? 0} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" color="emerald" />
        <StatCard label="Leads" value={stats?.leads ?? 0} icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" color="blue" />
        <StatCard label="Success Rate" value={`${successRate}%`} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="green" />
        <StatCard label="Total Tokens" value={formatNumber((stats?.total_tokens_in ?? 0) + (stats?.total_tokens_out ?? 0))} icon="M13 10V3L4 14h7v7l9-11h-7z" color="yellow" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 animate-in-delay">
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Recent Activity</h2>
              <a href="/jobs" className="text-xs text-gray-500 hover:text-emerald-400 transition-colors">View all →</a>
            </div>
            <div className="space-y-1">
              {jobs.map((j, i) => (
                <div key={j.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[var(--color-surface-3)] transition-colors group" style={{ animationDelay: `${i * 50}ms` }}>
                  <StatusDot status={j.status} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white font-medium">{j.target_domain}</span>
                    <span className="text-xs text-gray-500 ml-2">{j.llm_provider}</span>
                  </div>
                  <div className="text-xs text-gray-500 tabular-nums">
                    {j.tokens_in + j.tokens_out > 0 && <span className="mr-3">{formatNumber(j.tokens_in + j.tokens_out)} tok</span>}
                    {timeAgo(j.created_at)}
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">No enrichment jobs yet</p>
                  <a href="/enrich" className="text-emerald-400 text-sm hover:underline mt-1 inline-block">Run your first enrichment →</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats sidebar */}
        <div className="space-y-4 animate-in-delay">
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Pipeline Breakdown</h3>
            <div className="space-y-3">
              <MiniStat label="Completed" value={stats?.jobs_completed ?? 0} total={stats?.jobs_total ?? 1} color="bg-emerald-500" />
              <MiniStat label="Failed" value={stats?.jobs_failed ?? 0} total={stats?.jobs_total ?? 1} color="bg-red-500" />
              <MiniStat label="Pending" value={Math.max(0, (stats?.jobs_total ?? 0) - (stats?.jobs_completed ?? 0) - (stats?.jobs_failed ?? 0))} total={stats?.jobs_total ?? 1} color="bg-yellow-500" />
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4">Token Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Input</span>
                <span className="text-white tabular-nums">{formatNumber(stats?.total_tokens_in ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Output</span>
                <span className="text-white tabular-nums">{formatNumber(stats?.total_tokens_out ?? 0)}</span>
              </div>
              <div className="border-t border-[var(--color-border)] pt-2 mt-2 flex justify-between text-sm">
                <span className="text-gray-400 font-medium">Total</span>
                <span className="text-emerald-400 font-medium tabular-nums">{formatNumber((stats?.total_tokens_in ?? 0) + (stats?.total_tokens_out ?? 0))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: any; icon: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-400",
    blue: "from-blue-500/10 to-blue-500/5 text-blue-400",
    green: "from-green-500/10 to-green-500/5 text-green-400",
    yellow: "from-yellow-500/10 to-yellow-500/5 text-yellow-400",
  };
  return (
    <div className="glass rounded-xl p-5 group hover:border-[var(--color-border-hover)] transition-all">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-3`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const c: Record<string, string> = { completed: "bg-emerald-400", failed: "bg-red-400", processing: "bg-yellow-400 animate-pulse", pending: "bg-gray-500" };
  return <div className={`w-2 h-2 rounded-full ${c[status] || "bg-gray-500"}`} />;
}

function MiniStat({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="text-white tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 bg-[var(--color-surface)] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="h-8 w-48 skeleton mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 skeleton" />
        <div className="h-96 skeleton" />
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
