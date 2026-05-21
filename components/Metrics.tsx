"use client";

import { motion } from "framer-motion";

const metrics = [
  { value: "98%+", label: "Uptime SLA", sub: "Contractueel gegarandeerd" },
  { value: "36–48", label: "Maanden contract", sub: "Geen rolling fees" },
  { value: "10–500", label: "Voertuigen", sub: "KMO tot mid-market" },
  { value: "NL / FR / EN", label: "Support", sub: "Belgisch team" },
  { value: "BE-first", label: "Built for Belgium", sub: "Niet gelokaliseerd" },
];

export default function Metrics() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="container-x">
        <div className="rounded-3xl bg-white ring-1 ring-ink-100 shadow-soft overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-ink-100">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="px-6 py-8 md:py-10"
              >
                <div className="text-[34px] md:text-[40px] leading-none font-semibold tracking-tight text-ink-900 tabular-nums">
                  {m.value}
                </div>
                <div className="mt-3 text-[13px] font-semibold text-electric-600">{m.label}</div>
                <div className="mt-1 text-[12.5px] text-ink-400">{m.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
