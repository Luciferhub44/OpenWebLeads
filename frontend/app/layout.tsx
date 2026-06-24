import "./globals.css";

export const metadata = { title: "OpenEnrich OS", description: "Open-source lead enrichment" };

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/enrich", label: "Enrich" },
  { href: "/companies", label: "Companies" },
  { href: "/jobs", label: "Jobs" },
  { href: "/vault", label: "Vault" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <nav className="border-b border-gray-800 px-6 py-3 flex items-center gap-6">
          <span className="font-bold text-lg text-emerald-400">OpenEnrich OS</span>
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm text-gray-400 hover:text-white transition-colors">
              {n.label}
            </a>
          ))}
          <a href="/api/v1/export/companies.csv" className="ml-auto text-xs text-gray-500 hover:text-emerald-400">
            Export CSV
          </a>
        </nav>
        <main className="max-w-6xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
