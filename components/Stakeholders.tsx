"use client";

import { motion } from "framer-motion";
import { LineChart, Users, Truck, Briefcase, Building } from "lucide-react";

const personas = [
  {
    icon: LineChart,
    role: "CFO",
    pain: "Drie providers, drie facturen, geen audit-klaar overzicht van fleet-energiekosten.",
    win: "Eén geconsolideerde factuur per maand. Kostenallocatie per cost center. Volledig audit trail.",
    tone: "ink",
  },
  {
    icon: Users,
    role: "HR Director",
    pain: "Thuislaad-reimbursement is een handmatige nachtmerrie met juridische risico's.",
    win: "Automatische maandberekening per medewerker. Direct in payroll via SD Worx, Securex of Acerta.",
    tone: "electric",
  },
  {
    icon: Truck,
    role: "Fleet Manager",
    pain: "Bestuurders bellen je rechtstreeks als een paal het niet doet. Geen escalatiepad.",
    win: "Eén dashboard, één ticketing-flow, 24/7 monitoring met proactieve interventie. Geen telefoons meer.",
    tone: "ink",
  },
  {
    icon: Briefcase,
    role: "CEO",
    pain: "ESG-rapportage en CSRD-deadlines komen eraan. De data zit nergens samen.",
    win: "CO₂-rapportage exporteerbaar in één klik. CSRD-ready. Strategisch energie-inzicht op directieniveau.",
    tone: "mint",
  },
  {
    icon: Building,
    role: "Real Estate",
    pain: "Aanvragen voor laadinfra op bedrijvenparken stapelen zich op zonder duidelijke standaard.",
    win: "Schaalbare blueprint voor multi-tenant sites. Eigenaar krijgt rapportage, gebruikers krijgen toegang.",
    tone: "ink",
  },
];

const toneClasses: Record<string, string> = {
  ink: "bg-white ring-ink-100",
  electric: "bg-electric-50/50 ring-electric-100",
  mint: "bg-mint-50/40 ring-mint-100",
};

export default function Stakeholders() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 max-w-5xl">
          <div>
            <span className="eyebrow">
              <span className="h-px w-6 bg-electric-500" /> Voor elke stakeholder
            </span>
            <h2 className="mt-4 text-3xl md:text-[44px] md:leading-[1.1] font-semibold tracking-tight text-ink-900">
              Vijf rollen. Eén dashboard.
            </h2>
          </div>
          <p className="text-ink-500 text-[15px] max-w-md">
            De beslissing om over te stappen op een Charging-as-a-Service partner raakt vijf afdelingen tegelijk.
            Charge is gebouwd om elk van hen iets concreet te geven.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {personas.map((p, i) => (
            <motion.div
              key={p.role}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className={`rounded-2xl ring-1 p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 ${toneClasses[p.tone]}`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-900 text-white">
                  <p.icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <span className="text-sm font-semibold text-ink-900">{p.role}</span>
              </div>

              <div className="mt-5">
                <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-ink-400">Pain</div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-600">{p.pain}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-ink-100">
                <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-electric-600">
                  Met Charge
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-700">{p.win}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
