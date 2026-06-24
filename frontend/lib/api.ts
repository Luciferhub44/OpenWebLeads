const BASE = process.env.NEXT_PUBLIC_API_URL || "https://openwebleads-production.up.railway.app";

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`${res.status}: ${text}`);
  }
  return res;
}

export async function getHealth() {
  return (await apiFetch("/api/v1/health")).json();
}

export async function getStats() {
  return (await apiFetch("/api/v1/stats")).json();
}

export async function getJobs(status?: string, limit = 50) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("limit", String(limit));
  return (await apiFetch(`/api/v1/jobs?${params}`)).json();
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

export async function getCompanies(limit = 50) {
  return (await apiFetch(`/api/v1/companies?limit=${limit}`)).json();
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

export async function runScoring(companyId?: string) {
  const body = companyId ? { company_id: companyId } : {};
  return (await apiFetch("/api/v1/scoring/run", { method: "POST", body: JSON.stringify(body) })).json();
}

export async function register(email: string, password: string) {
  return (await apiFetch("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })).json();
}

export async function login(email: string, password: string) {
  return (await apiFetch("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })).json();
}

export const API_BASE = BASE;
