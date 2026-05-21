"use client";

import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background grid + radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid mask-radial opacity-70" />
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[560px] w-[1100px] rounded-full bg-electric-100/60 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-20 h-[420px] w-[420px] rounded-full bg-mint-100/60 blur-3xl" />

      <div className="container-x relative">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-ink-100 px-3 py-1.5 text-xs text-ink-600 shadow-soft"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
              Nu beschikbaar voor Belgische bedrijven · 10–500 voertuigen
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-6 text-[40px] leading-[1.05] sm:text-5xl lg:text-[64px] lg:leading-[1.05] font-semibold tracking-tight text-ink-900"
            >
              De Belgische standaard voor{" "}
              <span className="text-gradient">B2B EV-laadinfrastructuur</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-6 max-w-2xl text-lg text-ink-500 leading-relaxed"
            >
              Charging-as-a-Service voor bedrijfsvloten. Wij ontwerpen, installeren en beheren je laadnetwerk —
              inclusief thuisladen, payroll-reimbursement en CO₂-rapportage. Eén partner. Eén platform. Eén factuur.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <a href="#contact" className="btn-electric">
                Vraag een fleet audit aan
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#process" className="btn-secondary">
                <PlayCircle className="h-4 w-4" />
                Bekijk hoe het werkt
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-400"
            >
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-ink-300" />
                Built for Belgian companies
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-ink-300" />
                Payroll-ready
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-ink-300" />
                Fleet-first
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-ink-300" />
                SLA-driven
              </span>
            </motion.div>
          </div>

          {/* Right visual: abstract energy network */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <EnergyNetwork />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function EnergyNetwork() {
  // 7 nodes in a soft grid; connect with subtle lines
  const nodes = [
    { x: 80, y: 60, size: 9, label: "HQ" },
    { x: 220, y: 40, size: 7 },
    { x: 350, y: 100, size: 10, label: "Site A" },
    { x: 120, y: 180, size: 8 },
    { x: 260, y: 210, size: 11, label: "Site B" },
    { x: 380, y: 260, size: 7 },
    { x: 90, y: 300, size: 9, label: "Home" },
    { x: 220, y: 330, size: 8 },
  ];

  const edges: Array<[number, number]> = [
    [0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [4, 5], [3, 6], [6, 7], [4, 7],
  ];

  return (
    <div className="relative aspect-[5/6] rounded-3xl bg-gradient-to-br from-white to-ink-50 ring-1 ring-ink-100 shadow-card overflow-hidden">
      {/* grid */}
      <div className="absolute inset-0 bg-grid opacity-60" />
      {/* glow */}
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-electric-200/50 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-mint-200/50 blur-3xl" />

      <svg viewBox="0 0 460 400" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="edge" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="node">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="1" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </radialGradient>
        </defs>

        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="url(#edge)"
            strokeWidth="1.2"
            strokeDasharray="2 4"
            className="animate-grid-pulse"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}

        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={n.size + 8} fill="url(#node)" opacity="0.4" />
            <circle cx={n.x} cy={n.y} r={n.size} fill="white" stroke="#2563EB" strokeWidth="1.5" />
            <circle cx={n.x} cy={n.y} r={n.size - 4} fill="#2563EB" />
            {n.label && (
              <text
                x={n.x + n.size + 10}
                y={n.y + 4}
                fontSize="10"
                fontFamily="Inter, sans-serif"
                fontWeight="500"
                fill="#0B1220"
              >
                {n.label}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Floating stat chips */}
      <div className="absolute top-5 left-5 rounded-xl bg-white shadow-card ring-1 ring-ink-100 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wider text-ink-400 font-medium">Uptime</div>
        <div className="text-lg font-semibold text-ink-900 tabular-nums">98.7%</div>
      </div>
      <div className="absolute bottom-5 right-5 rounded-xl bg-white shadow-card ring-1 ring-ink-100 px-3 py-2">
        <div className="text-[10px] uppercase tracking-wider text-ink-400 font-medium">kWh deze maand</div>
        <div className="text-lg font-semibold text-ink-900 tabular-nums">12.847</div>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-5 rounded-xl bg-ink-900 text-white shadow-card px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-mint-400 animate-pulse-dot" />
          <span className="text-[11px] font-medium">Payroll sync OK</span>
        </div>
      </div>
    </div>
  );
}
