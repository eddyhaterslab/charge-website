"use client";

import { motion } from "framer-motion";
import { Linkedin } from "lucide-react";

export default function Founder() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-4"
          >
            <div className="relative w-48 h-48 md:w-56 md:h-56">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-electric-500 via-electric-600 to-mint-500 shadow-glow" />
              <div className="absolute inset-[3px] rounded-[22px] bg-ink-900 flex items-center justify-center">
                <span className="text-[88px] font-semibold tracking-tight text-white" style={{ letterSpacing: "-0.04em" }}>
                  CP
                </span>
              </div>
              <div className="absolute -bottom-3 -right-3 rounded-full bg-white shadow-card ring-1 ring-ink-100 p-2.5">
                <Linkedin className="h-4 w-4 text-electric-600" />
              </div>
            </div>

            <div className="mt-6 max-w-sm">
              <div className="text-[15px] font-semibold text-ink-900">Charly Provenzano</div>
              <div className="mt-1 text-[13.5px] text-ink-500">
                Founder, Charge · Ex-fleet operator · Belgian EV-infrastructure
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="pill bg-ink-50 text-ink-600 ring-1 ring-ink-100">15+ jaar fleet</span>
                <span className="pill bg-ink-50 text-ink-600 ring-1 ring-ink-100">Payroll-integraties</span>
                <span className="pill bg-ink-50 text-ink-600 ring-1 ring-ink-100">CSRD / ESG</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-8"
          >
            <span className="eyebrow">
              <span className="h-px w-6 bg-electric-500" /> De founder
            </span>
            <h2 className="mt-4 text-3xl md:text-[40px] md:leading-[1.1] font-semibold tracking-tight text-ink-900">
              Waarom Charge bestaat.
            </h2>

            <blockquote className="mt-8 border-l-2 border-electric-500 pl-6 md:pl-7">
              <p className="text-xl md:text-[26px] leading-[1.4] tracking-tight text-ink-900 font-medium">
                "We bouwen Charge omdat geen enkele bestaande speler de Belgische B2B-realiteit echt begrijpt."
              </p>
            </blockquote>

            <div className="mt-8 space-y-4 text-[16px] leading-relaxed text-ink-500 max-w-2xl">
              <p>
                Ik heb jaren binnen Belgische bedrijfsvloten gewerkt en gezien hoe pijnlijk de overgang naar
                elektrisch verloopt. Niet door de auto's — die werken. Maar door alles eromheen: de palen, de
                facturen, de payroll, de rapportage.
              </p>
              <p>
                Bestaande providers behandelen België als een uitbreiding van hun thuismarkt. Wij beginnen vanuit
                de Belgische realiteit — RSZ, sociaal secretariaat, mobiliteitsbudget, CAO's — en bouwen het
                technische platform daaromheen.
              </p>
              <p>
                Charge wil de partner zijn waar elke CFO, HR-directeur en fleet manager dezelfde week voor kiest,
                omdat het eindelijk gewoon klopt.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
