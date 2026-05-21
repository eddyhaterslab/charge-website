"use client";

import { motion } from "framer-motion";
import { Factory, Laptop2, Network, Warehouse } from "lucide-react";

const cases = [
  {
    icon: Factory,
    tag: "KMO",
    title: "Productiebedrijf · 25 voertuigen",
    challenge:
      "Eén HQ met 12 laadpunten, 25 werknemers met bedrijfswagens, waarvan 18 met thuislaad-behoefte. Drie verschillende laadpas-providers.",
    result: [
      { k: "Providers", v: "3 → 1" },
      { k: "HR-uren / maand", v: "−14 u" },
      { k: "Reimbursement-fout", v: "0%" },
    ],
  },
  {
    icon: Laptop2,
    tag: "Consultancy",
    title: "Consultancy · remote workforce",
    challenge:
      "85 consultants, 70% van de tijd onderweg of thuis. Slechts 6 vaste parkeerplaatsen op kantoor. Thuislaad-reimbursement was de pijnpunt nummer één voor HR.",
    result: [
      { k: "Thuislaad-reimbursement", v: "100% geautomatiseerd" },
      { k: "Payroll-koppeling", v: "SD Worx native" },
      { k: "Audit trail", v: "Per kWh" },
    ],
  },
  {
    icon: Network,
    tag: "Mid-market",
    title: "Multi-site · 200 voertuigen",
    challenge:
      "Vier sites verspreid over Vlaanderen en Wallonië. Verschillende leveranciers per site, geen geconsolideerde rapportage richting CFO en duurzaamheidsteam.",
    result: [
      { k: "Sites", v: "4 op 1 platform" },
      { k: "Uptime SLA", v: "98,9%" },
      { k: "CO₂-rapport", v: "CSRD-ready" },
    ],
  },
  {
    icon: Warehouse,
    tag: "Real estate",
    title: "Bedrijvenpark · multi-tenant",
    challenge:
      "Vastgoedeigenaar wil laadinfra aanbieden aan 14 tenants zonder zelf operator te worden. Vraagt om transparante doorrekening per tenant en per gebruiker.",
    result: [
      { k: "Tenants ondersteund", v: "14" },
      { k: "Doorrekening", v: "Per CDR" },
      { k: "Eigenaars-rapport", v: "Maandelijks" },
    ],
  },
];

export default function UseCases() {
  return (
    <section id="use-cases" className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="max-w-3xl">
          <span className="eyebrow">
            <span className="h-px w-6 bg-electric-500" /> Use cases
          </span>
          <h2 className="mt-4 text-3xl md:text-[44px] md:leading-[1.1] font-semibold tracking-tight text-ink-900">
            Vier scenario's. Eén speelboek.
          </h2>
          <p className="mt-5 text-lg text-ink-500">
            Charge schaalt van 10 naar 500 voertuigen, van één site naar multi-tenant bedrijvenparken — zonder
            dat je halverwege van platform moet wisselen.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="card card-hover"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-900 text-white">
                    <c.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </div>
                  <span className="pill bg-electric-50 text-electric-700 ring-1 ring-electric-100">{c.tag}</span>
                </div>
              </div>

              <h3 className="mt-5 text-xl font-semibold text-ink-900 tracking-tight">{c.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-500">{c.challenge}</p>

              <div className="mt-6 grid grid-cols-3 gap-3 pt-5 border-t border-ink-100">
                {c.result.map((r) => (
                  <div key={r.k}>
                    <div className="text-[10.5px] uppercase tracking-[0.14em] text-ink-400 font-semibold">
                      {r.k}
                    </div>
                    <div className="mt-1 text-[15px] font-semibold tabular-nums text-ink-900">{r.v}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
