"use client";

import { motion } from "framer-motion";
import { ArrowRight, ClipboardCheck } from "lucide-react";

export default function CTA() {
  return (
    <section className="relative py-20 md:py-28">
      <div className="container-x">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 ring-1 ring-ink-700 shadow-card noise"
        >
          <div className="absolute inset-0 bg-grid-dark opacity-40 mask-radial" />
          <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-electric-600/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-mint-500/20 blur-3xl" />

          <div className="relative px-6 md:px-14 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8">
              <span className="eyebrow-light">
                <span className="h-px w-6 bg-electric-400" /> Eerste stap
              </span>
              <h2 className="mt-4 text-3xl md:text-[44px] md:leading-[1.1] font-semibold tracking-tight text-white">
                Start met een{" "}
                <span className="text-gradient-static">betaalde fleet audit</span>.
              </h2>
              <p className="mt-5 text-lg text-ink-200 max-w-2xl">
                Charge analyseert eerst en installeert daarna. We brengen je vloot, sites en gebruikspatronen in
                kaart vóór we ook maar één paal aanraden. Dat zorgt voor het juiste netwerk in plaats van de
                grootste verkoop.
              </p>

              <div className="mt-3 inline-flex items-start gap-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 mt-6 max-w-xl">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric-500/15 text-electric-300">
                  <ClipboardCheck className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <p className="text-[13.5px] leading-relaxed text-ink-200">
                  <span className="font-semibold text-white">Wij geloven niet in gratis audits.</span>{" "}
                  Een goede audit kost tijd, expertise en eerlijke advies. Daarom is fase één betaald —
                  en wordt ze verrekend zodra je met Charge in zee gaat.
                </p>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 lg:items-end">
              <a href="#contact" className="btn-electric w-full lg:w-auto">
                Plan fleet audit
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#process" className="btn-ghost-dark w-full lg:w-auto">
                Bekijk het proces
              </a>
              <p className="text-[12px] text-ink-400 lg:text-right">
                Antwoord binnen 1 werkdag · NL · FR · EN
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
