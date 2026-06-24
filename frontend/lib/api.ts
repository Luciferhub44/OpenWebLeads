const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res;
}

export async function getStats() {
  return (await apiFetch("/api/v1/stats")).json();
}

export async function getJobs(status?: string) {
  const q = status ? `?status=${status}` : "";
  return (await apiFetch(`/api/v1/jobs${q}`)).json();
}

export async function getJob(id: string) {
  return (await apiFetch(`/api/v1/jobs/${id}`)).json();
}

export async function enrich(domain: string, provider?: string) {
  return (await apiFetch("/api/v1/enrich", {
    method: "POST",
    body: JSON.stringify({ domain, provider: provider || "" }),
  })).json();
}

export async function getCompanies() {
  return (await apiFetch("/api/v1/companies")).json();
}

export async function getCompany(id: string) {
  return (await apiFetch(`/api/v1/companies/${id}`)).json();
}

export async function getLeads(companyId: string) {
  return (await apiFetch(`/api/v1/companies/${companyId}/leads`)).json();
}

export async function getProviders() {
  return (await apiFetch("/api/v1/providers")).json();
}

export async function getVaultKeys() {
  return (await apiFetch("/api/v1/vault/keys")).json();
}

export async function createVaultKey(data: { provider: string; api_key: string; label?: string }) {
  return (await apiFetch("/api/v1/vault/keys", {
    method: "POST",
    body: JSON.stringify(data),
  })).json();
}

export async function deleteVaultKey(id: string) {
  return (await apiFetch(`/api/v1/vault/keys/${id}`, { method: "DELETE" })).json();
}

export async function runScoring() {
  return (await apiFetch("/api/v1/scoring/run", { method: "POST" })).json();
}
