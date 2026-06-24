"use client";

import { useEffect, useState } from "react";
import { getJobs } from "@/lib/api";

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    getJobs(filter || undefined).then(setJobs).catch(console.error);
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-800">
            <th className="pb-2">Domain</th>
            <th className="pb-2">Provider</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Tokens In</th>
            <th className="pb-2">Tokens Out</th>
            <th className="pb-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} className="border-b border-gray-800/50">
              <td className="py-2">{j.target_domain}</td>
              <td className="py-2 text-gray-400">{j.llm_provider || "—"}</td>
              <td className="py-2">
                <span className={
                  j.status === "completed" ? "text-emerald-400" :
                  j.status === "failed" ? "text-red-400" :
                  j.status === "processing" ? "text-yellow-400" : "text-gray-400"
                }>
                  {j.status}
                </span>
              </td>
              <td className="py-2 text-gray-400">{j.tokens_in.toLocaleString()}</td>
              <td className="py-2 text-gray-400">{j.tokens_out.toLocaleString()}</td>
              <td className="py-2 text-gray-500">{new Date(j.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {jobs.length === 0 && <p className="text-gray-500 mt-3">No jobs found.</p>}
    </div>
  );
}
