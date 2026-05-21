"use client";

import { motion } from "framer-motion";
import { Wrench, LayoutDashboard, Activity, Handshake } from "lucide-react";

const cards = [
  {
    icon: Wrench,
    eyebrow: "Service",
    title: "Audit, design & installatie",
    body: "Onze ingenieurs analyseren je sites, vermogensreserve en gebruikspatronen. We ontwerpen een netwerk dat past bij je vloot vandaag én over drie jaar. Installatie door eigen gecertificeerde teams, geen onderaannemers.",
  },
  {
    icon: LayoutDashboard,
    eyebrow: "SaaS",
    title: "Eén platform voor alles",
    body: "Live monitoring, kostenallocatie per voertuig of medewerker, kWh-rapportage en CO₂-output. Inclusief native koppeling met SD Worx, Securex en Acerta voor thuislaad-reimbursement.",
  },
  {
    icon: Activity,
    eyebrow: "Operations",
    title: "24/7 monitoring & SLA",
    body: "Geen ticketsysteem dat na drie dagen antwoordt. Wij detecteren storingen proactief, dispatchen technici binnen contractueel afgesproken tijden en garanderen 98%+ uptime — in writing.",
  },
  {
    icon: Handshake,
    eyebrow: "Partnerships",
    title: "Native payroll-integratie",
    body: "We hebben werkende koppelingen gebouwd met de drie grote Belgische sociale secretariaten. Geen Excel-imports, geen handmatige correcties — gewoon de juiste vergoeding op de juiste loonbrief.",
  },
];

export default function Solution() {
  return (
    <section id="platform" className="relative py-24 md:py-32 bg-ink-50/40">
      <div className="container-x">
        <div className="max-w-3xl">
          <span className="eyebrow">
            <span className="h-px w-6 bg-electric-500" /> De oplossing
          </span>
          <h2 className="mt-4 text-3xl md:text-[44px] md:leading-[1.1] font-semibold tracking-tight text-ink-900">
            Eén partner. Eén platform. Eén factuur.
          </h2>
          <p className="mt-5 text-lg text-ink-500">
            Charge is geen hardwareverkoper en geen pure softwarespeler. We zijn een Charging-as-a-Service partner —
            gebouwd rond de manier waarop Belgische bedrijven écht werken.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="card card-hover relative overflow-hidden"
            >
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-electric-100/60 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-white">
                    <c.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </div>
                  <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-electric-600">
                    {c.eyebrow}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-ink-900 tracking-tight">{c.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-500">{c.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
