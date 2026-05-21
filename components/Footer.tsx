import { Linkedin, Mail } from "lucide-react";

const columns = [
  {
    title: "Platform",
    links: ["Overzicht", "Dashboard", "Integraties", "API"],
  },
  {
    title: "Fleet audit",
    links: ["Hoe het werkt", "Wat zit erin", "Pricing", "Plannen"],
  },
  {
    title: "Reimbursement",
    links: ["SD Worx", "Securex", "Acerta", "Liantis"],
  },
  {
    title: "Bedrijf",
    links: ["Partners", "Contact", "Privacy", "Algemene voorwaarden"],
  },
];

export default function Footer() {
  return (
    <footer className="relative bg-ink-900 text-white overflow-hidden noise">
      <div className="absolute inset-0 bg-grid-dark opacity-30" />
      <div className="absolute -top-32 right-1/4 h-72 w-72 rounded-full bg-electric-700/15 blur-3xl" />

      <div className="container-x relative pt-20 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inset-0 rounded-full bg-electric-400 animate-pulse-dot" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-electric-500" />
              </span>
              <span className="text-[18px] font-semibold tracking-tight">Charge</span>
            </div>
            <p className="mt-4 text-[14px] text-ink-300 max-w-xs leading-relaxed">
              De Belgische standaard voor B2B EV-laadinfrastructuur. Audit, installatie, software, payroll en SLA —
              in één contract.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 text-ink-200 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@charge.be"
                aria-label="E-mail"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 text-ink-200 hover:bg-white/10 hover:text-white transition-colors"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {columns.map((c) => (
            <div key={c.title}>
              <div className="text-[12px] uppercase tracking-[0.16em] text-ink-400 font-semibold">{c.title}</div>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[13.5px] text-ink-200 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-6 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-[12.5px] text-ink-400">© 2026 Charge. Alle rechten voorbehouden.</p>
          <div className="flex items-center gap-4 text-[12.5px] text-ink-400">
            <span>🇧🇪 Made in Belgium</span>
            <span className="h-1 w-1 rounded-full bg-ink-700" />
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
