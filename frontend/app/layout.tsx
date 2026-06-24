import "./globals.css";

export const metadata = {
  title: "OpenEnrich OS",
  description: "Open-source B2B lead enrichment engine",
};

const NAV = [
  { href: "/", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" },
  { href: "/enrich", label: "Enrich", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { href: "/companies", label: "Companies", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { href: "/jobs", label: "Jobs", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { href: "/vault", label: "Vault", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
  { href: "/setup", label: "Setup", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col fixed h-screen z-50">
          <div className="p-5 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm">O</div>
              <div>
                <div className="font-semibold text-sm text-white tracking-tight">OpenEnrich OS</div>
                <div className="text-[10px] text-gray-500 tracking-wider uppercase">Lead Intelligence</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-0.5">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[var(--color-surface-2)] transition-all group"
              >
                <NavIcon d={n.icon} />
                <span>{n.label}</span>
              </a>
            ))}
          </nav>

          <div className="p-4 border-t border-[var(--color-border)]">
            <div className="glass rounded-lg p-3">
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Quick Export</div>
              <div className="flex gap-2">
                <a href={`${process.env.NEXT_PUBLIC_API_URL || "https://openwebleads-production.up.railway.app"}/api/v1/export/companies.csv`}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Companies</a>
                <span className="text-gray-600">·</span>
                <a href={`${process.env.NEXT_PUBLIC_API_URL || "https://openwebleads-production.up.railway.app"}/api/v1/export/leads.csv`}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Leads</a>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 ml-64 min-h-screen">
          <div className="max-w-7xl mx-auto p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
