"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCompany, getLeads, API_BASE } from "@/lib/api";

export default function CompanyDetail() {
  const params = useParams();
  const id = params.id as string;
  const [company, setCompany] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCompany(id).then(setCompany),
      getLeads(id).then(setLeads),
    ]).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-20 skeleton" />)}</div>;
  if (!company) return <div className="text-gray-500">Company not found.</div>;

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 flex items-center justify-center text-emerald-400 font-bold text-xl">
            {(company.legal_name || company.domain)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{company.legal_name || company.domain}</h1>
            <p className="text-sm text-gray-500">{company.domain}</p>
          </div>
        </div>
        <a
          href={`${API_BASE}/api/v1/export/leads.csv?company_id=${id}`}
          className="px-4 py-2 border border-[var(--color-border)] hover:border-emerald-500/30 text-sm text-gray-300 rounded-lg transition-all"
        >
          Export Leads CSV
        </a>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <InfoCard label="Industry" value={company.industry} />
        <InfoCard label="Employees" value={company.employee_count?.toLocaleString()} />
        <InfoCard label="Funding" value={company.funding_stage} />
        <InfoCard label="Leads Found" value={leads.length} accent />
      </div>

      {/* Summary */}
      {company.summary && (
        <div className="glass rounded-xl p-5 mb-6 animate-in-delay">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">About</div>
          <p className="text-sm text-gray-300 leading-relaxed">{company.summary}</p>
        </div>
      )}

      {/* Tech stack + Email patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {company.estimated_tech_stack?.length > 0 && (
          <div className="glass rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">Tech Stack</div>
            <div className="flex gap-2 flex-wrap">
              {company.estimated_tech_stack.map((t: string) => (
                <span key={t} className="text-sm bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg border border-emerald-500/20">{t}</span>
              ))}
            </div>
          </div>
        )}
        {company.email_patterns?.length > 0 && (
          <div className="glass rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">Email Patterns</div>
            <div className="flex gap-2 flex-wrap">
              {company.email_patterns.map((p: string) => (
                <span key={p} className="text-sm font-mono bg-[var(--color-surface)] text-gray-300 px-3 py-1 rounded-lg border border-[var(--color-border)]">{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Leads table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold text-white">Leads ({leads.length})</h2>
        </div>
        {leads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-[var(--color-border)]">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">LinkedIn</th>
                  <th className="px-5 py-3 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-2)] transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-white font-medium">{l.first_name} {l.last_name}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{l.job_title}</td>
                    <td className="px-5 py-3">
                      {l.corporate_email ? (
                        <span className="font-mono text-xs text-emerald-400">{l.corporate_email}</span>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      {l.linkedin_url ? (
                        <a href={l.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">Profile →</a>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ScoreBadge score={l.confidence_score} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 text-sm">No leads extracted for this company.</div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className={`text-lg font-semibold mt-1 ${accent ? "text-emerald-400" : "text-white"}`}>{value ?? "—"}</div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "text-emerald-400 bg-emerald-500/10" : pct >= 40 ? "text-yellow-400 bg-yellow-500/10" : "text-red-400 bg-red-500/10";
  return <span className={`text-xs font-medium px-2 py-1 rounded-md ${color}`}>{pct}%</span>;
}
