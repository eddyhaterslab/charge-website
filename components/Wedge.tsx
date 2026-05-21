"use client";

import { motion } from "framer-motion";
import { Home, Calculator, FileCheck, ShieldCheck, Wallet } from "lucide-react";

const steps = [
  {
    icon: Home,
    title: "Thuisladen op privé-meter",
    body: "De medewerker laadt thuis op zijn eigen elektriciteitsmeter. Geen aparte meter, geen graafwerken.",
  },
  {
    icon: Calculator,
    title: "Automatische maandberekening",
    body: "Wij scheiden bedrijfsverbruik van privé via slimme submetering en CDR-data. Tarief volgens CREG.",
  },
  {
    icon: Wallet,
    title: "Reimbursement via payroll",
    body: "Het bedrag landt direct op de loonbrief van die maand — via SD Worx, Securex of Acerta.",
  },
  {
    icon: FileCheck,
    title: "Volledig audit trail",
    body: "Elke kWh herleidbaar tot CDR, meterstand en tariefkaart. Klaar voor controle door BCO of revisor.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance gegarandeerd",
    body: "Conform RSZ-richtlijnen, fiscale rulings en sectorale CAO's. Wij houden de regelgeving bij, jij niet.",
  },
];

const partners = ["SD Worx", "Securex", "Acerta", "Liantis"];

export default function Wedge() {
  return (
    <section id="wedge" className="relative py-28 md:py-36 bg-ink-900 text-white overflow-hidden noise">
      {/* background */}
      <div className="absolute inset-0 bg-grid-dark opacity-50 mask-radial" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[1000px] rounded-full bg-electric-700/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[700px] rounded-full bg-mint-700/15 blur-3xl" />

      <div className="container-x relative">
        <div className="max-w-3xl">
          <span className="eyebrow-light">
            <span className="h-px w-6 bg-electric-400" /> De wedge
          </span>
          <h2 className="mt-4 text-3xl md:text-[48px] md:leading-[1.05] font-semibold tracking-tight">
            Built for{" "}
            <span className="text-gradient-static">Belgian fiscal reality</span>.
          </h2>
          <p className="mt-5 text-lg text-ink-200 max-w-2xl">
            Thuisladen correct verrekenen via payroll is geen feature — het is een hele product-line. We hebben
            jaren werk gestoken in de juiste integraties zodat jouw HR-team het niet hoeft te doen.
          </p>
        </div>

        {/* 5-step flow */}
        <div className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-3 relative">
            {/* connecting line (desktop) */}
            <div
              aria-hidden
              className="hidden md:block absolute top-7 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-electric-400/40 to-transparent"
            />
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative"
              >
                <div className="relative z-10 flex flex-col items-start">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-electric-500 to-electric-700 ring-1 ring-white/10 shadow-glow">
                      <s.icon className="h-6 w-6 text-white" strokeWidth={1.75} />
                      <span className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-white text-ink-900 text-[11px] font-bold flex items-center justify-center ring-2 ring-ink-900">
                        {i + 1}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-5 text-[15px] font-semibold tracking-tight text-white">{s.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ink-300">{s.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Partners */}
        <div className="mt-20 pt-10 border-t border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <p className="text-[13px] uppercase tracking-[0.18em] text-ink-300 font-semibold">
              Werkende koppelingen met
            </p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              {partners.map((p) => (
                <span
                  key={p}
                  className="text-xl md:text-2xl font-semibold tracking-tight text-white/85 hover:text-white transition-colors"
                  style={{ fontFeatureSettings: '"ss01"' }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
