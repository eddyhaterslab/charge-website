"use client";

import { motion } from "framer-motion";
import { ClipboardCheck, PencilRuler, HardHat, Activity, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Audit",
    duration: "2 weken",
    description:
      "We analyseren je vloot, sites, vermogensreserve en gebruikspatronen. Onze ingenieurs leveren een concreet rapport — geen verkooppraatje.",
    badge: "Betaald",
  },
  {
    icon: PencilRuler,
    title: "Design",
    duration: "1–2 weken",
    description:
      "Netwerk-blueprint op maat: aantal palen, locaties, load-balancing, software-config en payroll-koppeling. Volledig kostenmodel inbegrepen.",
  },
  {
    icon: HardHat,
    title: "Rollout",
    duration: "4–8 weken",
    description:
      "Installatie door eigen gecertificeerde teams. Geen onderaannemers. Inclusief commissioning, integratie en onboarding van je bestuurders.",
  },
  {
    icon: Activity,
    title: "Management",
    duration: "Doorlopend",
    description:
      "24/7 monitoring, proactief storingsbeheer, on-site interventie binnen SLA. Eén Belgisch aanspreekpunt — NL, FR of EN.",
  },
  {
    icon: BarChart3,
    title: "Reporting",
    duration: "Maandelijks",
    description:
      "Rapportage voor CFO, HR, Fleet en ESG. Eén factuur, één export naar payroll, één CO₂-rapport voor CSRD.",
  },
];

export default function Process() {
  return (
    <section id="process" className="relative py-24 md:py-32 bg-ink-50/40">
      <div className="container-x">
        <div className="max-w-3xl">
          <span className="eyebrow">
            <span className="h-px w-6 bg-electric-500" /> Het proces
          </span>
          <h2 className="mt-4 text-3xl md:text-[44px] md:leading-[1.1] font-semibold tracking-tight text-ink-900">
            Van eerste gesprek tot levende vloot in 6 tot 12 weken.
          </h2>
          <p className="mt-5 text-lg text-ink-500">
            We werken in vijf duidelijke fasen. Geen black box, geen open einde — elke stap heeft een eigenaar,
            een deliverable en een deadline.
          </p>
        </div>

        <div className="mt-16 relative">
          {/* Vertical connector (mobile) */}
          <div
            aria-hidden
            className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-electric-200 via-ink-200 to-transparent md:hidden"
          />

          {/* Horizontal connector (desktop) */}
          <div
            aria-hidden
            className="hidden md:block absolute top-7 left-[8%] right-[8%] h-px bg-gradient-to-r from-electric-300 via-ink-200 to-transparent"
          />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="relative pl-16 md:pl-0"
              >
                <div className="md:flex md:flex-col md:items-start">
                  <div className="absolute left-0 md:relative md:left-auto">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white ring-1 ring-ink-200 shadow-soft">
                      <s.icon className="h-5 w-5 text-electric-600" strokeWidth={1.75} />
                      <span className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-ink-900 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white">
                        {i + 1}
                      </span>
                    </div>
                  </div>

                  <div className="md:mt-5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-semibold tracking-tight text-ink-900">{s.title}</h3>
                      {s.badge && (
                        <span className="pill bg-electric-50 text-electric-700 ring-1 ring-electric-100">
                          {s.badge}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11.5px] uppercase tracking-[0.14em] text-ink-400 font-semibold">
                      {s.duration}
                    </div>
                    <p className="mt-3 text-[13.5px] leading-relaxed text-ink-500 max-w-xs">{s.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
