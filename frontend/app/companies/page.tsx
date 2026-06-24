"use client";

import { useEffect, useState } from "react";
import { getCompanies } from "@/lib/api";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompanies(100).then(setCompanies).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = companies.filter(c =>
    !search || c.domain.includes(search.toLowerCase()) || (c.legal_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-sm text-gray-500 mt-1">{companies.length} enriched companies</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none w-48 transition-colors"
          />
          <a href="/enrich" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-all">
            + Enrich
          </a>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-24 skeleton" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => (
            <a
              key={c.id}
              href={`/companies/${c.id}`}
              className="block glass rounded-xl p-5 hover:border-emerald-500/30 transition-all group"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                    {(c.legal_name || c.domain)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{c.legal_name || c.domain}</div>
                    <div className="text-xs text-gray-500">{c.domain}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {c.industry && <span className="text-xs bg-[var(--color-surface-3)] text-gray-300 px-2.5 py-1 rounded-full">{c.industry}</span>}
                </div>
              </div>

              {c.summary && <p className="text-sm text-gray-500 mt-3 line-clamp-2">{c.summary}</p>}

              <div className="flex items-center gap-4 mt-3">
                {c.employee_count && <span className="text-xs text-gray-500">{c.employee_count.toLocaleString()} employees</span>}
                {c.funding_stage && <span className="text-xs text-gray-500">{c.funding_stage}</span>}
                {c.estimated_tech_stack?.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {c.estimated_tech_stack.slice(0, 4).map((t: string) => (
                      <span key={t} className="text-[10px] bg-[var(--color-surface)] text-gray-400 px-2 py-0.5 rounded">{t}</span>
                    ))}
                    {c.estimated_tech_stack.length > 4 && <span className="text-[10px] text-gray-600">+{c.estimated_tech_stack.length - 4}</span>}
                  </div>
                )}
              </div>
            </a>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="text-center py-16 glass rounded-xl">
              <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <p className="text-gray-500 text-sm">{search ? "No matching companies" : "No companies yet"}</p>
              <a href="/enrich" className="text-emerald-400 text-sm hover:underline mt-2 inline-block">Enrich your first domain →</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
