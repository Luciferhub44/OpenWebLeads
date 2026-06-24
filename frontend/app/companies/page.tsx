"use client";

import { useEffect, useState } from "react";
import { getCompanies } from "@/lib/api";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    getCompanies().then(setCompanies).catch(console.error);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Companies</h1>
        <a href="/api/v1/export/companies.csv" className="text-sm text-emerald-400 hover:underline">Download CSV</a>
      </div>

      <div className="space-y-3">
        {companies.map((c) => (
          <a
            key={c.id}
            href={`/companies/${c.id}`}
            className="block bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-emerald-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{c.legal_name || c.domain}</div>
                <div className="text-sm text-gray-400">{c.domain}</div>
              </div>
              <div className="text-right">
                {c.industry && <div className="text-sm text-emerald-400">{c.industry}</div>}
                {c.employee_count && <div className="text-xs text-gray-500">{c.employee_count} employees</div>}
              </div>
            </div>
            {c.summary && <p className="text-sm text-gray-400 mt-2 line-clamp-2">{c.summary}</p>}
            {c.estimated_tech_stack?.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {c.estimated_tech_stack.map((t: string) => (
                  <span key={t} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            )}
          </a>
        ))}
        {companies.length === 0 && <p className="text-gray-500">No companies yet. Go enrich some domains!</p>}
      </div>
    </div>
  );
}
