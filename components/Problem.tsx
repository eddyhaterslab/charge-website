"use client";

import { motion } from "framer-motion";
import { Zap, Receipt, Building2, Wallet } from "lucide-react";

const problems = [
  {
    icon: Zap,
    title: "Versnipperd laadlandschap",
    body: "Bedrijven jongleren met drie of vier providers tegelijk — één voor kantoor, één voor onderweg, één voor thuis. Geen overzicht, geen consolidatie, geen onderhandelingspositie.",
  },
  {
    icon: Receipt,
    title: "Thuisladen blijft een fiscaal mijnenveld",
    body: "Privé-meter, bedrijfsverbruik, juiste tarief, correcte payroll-verwerking. Geen enkele bestaande tool spreekt vloeiend SD Worx, Securex of Acerta.",
  },
  {
    icon: Building2,
    title: "Hardware-leveranciers verkopen palen, geen oplossing",
    body: "Na installatie sta je er alleen voor — met een onderhoudscontract dat geen SLA bevat en software die niet praat met je fleet management.",
  },
  {
    icon: Wallet,
    title: "Geen totaaloverzicht voor de CFO",
    body: "Drie facturen, twee dashboards, één Excel die de fleet manager bijhoudt. Audit-klaar rapporteren over kWh, CO₂ en kosten? Veel succes.",
  },
];

export default function Problem() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="max-w-3xl">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.4 }}
            className="eyebrow"
          >
            <span className="h-px w-6 bg-electric-500" /> Het probleem
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-4 text-3xl md:text-[44px] md:leading-[1.1] font-semibold tracking-tight text-ink-900"
          >
            EV-fleet management was nooit gebouwd voor de Belgische realiteit.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 text-lg text-ink-500"
          >
            De meeste providers komen uit Nederland, Duitsland of de UK. Ze begrijpen mobiliteitsbudget niet,
            payroll niet, en de Belgische fiscale eigenheid van bedrijfswagens al helemaal niet.
          </motion.p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="card card-hover group"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-electric-50 ring-1 ring-electric-100 text-electric-600 group-hover:bg-electric-600 group-hover:text-white transition-colors">
                  <p.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink-900 tracking-tight">{p.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-500">{p.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
