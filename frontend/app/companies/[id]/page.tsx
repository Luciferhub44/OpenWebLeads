"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCompany, getLeads } from "@/lib/api";

export default function CompanyDetail() {
  const params = useParams();
  const id = params.id as string;
  const [company, setCompany] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    getCompany(id).then(setCompany).catch(console.error);
    getLeads(id).then(setLeads).catch(console.error);
  }, [id]);

  if (!company) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{company.legal_name || company.domain}</h1>
      <p className="text-gray-400 mb-6">{company.domain}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Field label="Industry" value={company.industry} />
        <Field label="Employees" value={company.employee_count} />
        <Field label="Funding" value={company.funding_stage} />
      </div>

      {company.summary && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <div className="text-xs text-gray-500 mb-1">Summary</div>
          <p className="text-sm text-gray-300">{company.summary}</p>
        </div>
      )}

      {company.estimated_tech_stack?.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-gray-500 mb-2">Tech Stack</div>
          <div className="flex gap-2 flex-wrap">
            {company.estimated_tech_stack.map((t: string) => (
              <span key={t} className="text-sm bg-emerald-900/30 text-emerald-400 px-2.5 py-1 rounded">{t}</span>
            ))}
          </div>
        </div>
      )}

      {company.email_patterns?.length > 0 && (
        <div className="mb-8">
          <div className="text-xs text-gray-500 mb-2">Email Patterns</div>
          <div className="flex gap-2 flex-wrap">
            {company.email_patterns.map((p: string) => (
              <span key={p} className="text-sm font-mono bg-gray-800 text-gray-300 px-2.5 py-1 rounded">{p}</span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Leads ({leads.length})</h2>
        <a href={`/api/v1/export/leads.csv?company_id=${id}`} className="text-sm text-emerald-400 hover:underline">Download CSV</a>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-800">
            <th className="pb-2">Name</th>
            <th className="pb-2">Title</th>
            <th className="pb-2">Email</th>
            <th className="pb-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-b border-gray-800/50">
              <td className="py-2">{l.first_name} {l.last_name}</td>
              <td className="py-2 text-gray-400">{l.job_title}</td>
              <td className="py-2 font-mono text-xs text-gray-300">{l.corporate_email || "—"}</td>
              <td className="py-2">
                <span className={l.confidence_score >= 0.7 ? "text-emerald-400" : l.confidence_score >= 0.4 ? "text-yellow-400" : "text-red-400"}>
                  {(l.confidence_score * 100).toFixed(0)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {leads.length === 0 && <p className="text-gray-500 mt-3">No leads extracted yet.</p>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value ?? "—"}</div>
    </div>
  );
}
