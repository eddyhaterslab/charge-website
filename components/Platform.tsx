"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Activity,
  Plug,
  FileSpreadsheet,
  Settings,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

export default function Platform() {
  return (
    <section className="relative py-24 md:py-32 bg-ink-50/40">
      <div className="container-x">
        <div className="max-w-3xl">
          <span className="eyebrow">
            <span className="h-px w-6 bg-electric-500" /> Het platform
          </span>
          <h2 className="mt-4 text-3xl md:text-[44px] md:leading-[1.1] font-semibold tracking-tight text-ink-900">
            Live data over je hele laadnetwerk — vanaf de eerste dag.
          </h2>
          <p className="mt-5 text-lg text-ink-500">
            Geen losse hardware-portalen, geen Excel-exports. Eén dashboard dat kantoor, thuis en publieke laadbeurten
            samenbrengt — met audit trail tot op de kWh.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mt-14"
        >
          <Dashboard />
        </motion.div>
      </div>
    </section>
  );
}

function Dashboard() {
  return (
    <div className="rounded-3xl bg-white ring-1 ring-ink-100 shadow-card overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-ink-100 bg-gradient-to-b from-ink-50/80 to-white">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <span className="h-3 w-3 rounded-full bg-ink-200" />
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-md bg-ink-50 px-3 py-1 ring-1 ring-ink-100 text-[12px] text-ink-400">
          <Search className="h-3.5 w-3.5" />
          app.charge.be / fleet / overview
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-ink-400" />
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-electric-500 to-mint-500" />
        </div>
      </div>

      <div className="grid grid-cols-12">
        {/* Sidebar */}
        <aside className="hidden md:block col-span-2 border-r border-ink-100 py-5 px-3">
          <div className="px-2 flex items-center gap-2 mb-6">
            <span className="h-2 w-2 rounded-full bg-electric-600" />
            <span className="text-[13px] font-semibold text-ink-900">Charge</span>
          </div>
          <NavItem icon={LayoutDashboard} label="Overzicht" active />
          <NavItem icon={Plug} label="Laadpunten" />
          <NavItem icon={Activity} label="Sessies" />
          <NavItem icon={FileSpreadsheet} label="Reimbursement" />
          <NavItem icon={Settings} label="Instellingen" />
        </aside>

        {/* Main */}
        <div className="col-span-12 md:col-span-10 p-5 md:p-7">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-5 text-[13px] border-b border-ink-100">
            <Tab label="Overzicht" active />
            <Tab label="Sites" />
            <Tab label="Bestuurders" />
            <Tab label="Facturen" />
            <Tab label="Rapporten" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="Laadpunten actief" value="127" delta="+4 deze maand" deltaTone="mint" />
            <Stat label="Reimbursement (mei)" value="€8.420" delta="+12,4%" deltaTone="mint" />
            <Stat label="kWh dit jaar" value="12.847" delta="3.2 MWh deze maand" deltaTone="ink" />
            <Stat label="Uptime" value="98,7%" delta="SLA: 98%" deltaTone="mint" />
            <Stat label="CO₂ vermeden" value="−3,2 t" delta="t.o.v. diesel" deltaTone="mint" />
          </div>

          {/* Chart + Payroll */}
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl ring-1 ring-ink-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">
                    Verbruik (kWh)
                  </div>
                  <div className="mt-0.5 text-base font-semibold text-ink-900">
                    Laatste 12 maanden
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-ink-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-electric-500" /> Kantoor
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-mint-500" /> Thuis
                  </span>
                </div>
              </div>
              <LineChartSVG />
              <div className="mt-1 flex items-center justify-between text-[11px] text-ink-400 px-1">
                {["jun", "jul", "aug", "sep", "okt", "nov", "dec", "jan", "feb", "mrt", "apr", "mei"].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>

            {/* Payroll panel */}
            <div className="rounded-2xl ring-1 ring-mint-200 bg-gradient-to-br from-mint-50 to-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-mint-700 font-semibold">
                  Payroll export
                </span>
                <span className="pill bg-mint-100 text-mint-700">
                  <CheckCircle2 className="h-3 w-3" /> Ready
                </span>
              </div>
              <div className="mt-3 text-base font-semibold text-ink-900">SD Worx — mei 2026</div>
              <div className="mt-1 text-[13px] text-ink-500">
                47 medewerkers · €8.420 totaal
              </div>
              <div className="mt-5 space-y-2.5 text-[12.5px]">
                <Row label="Geverifieerd" value="47 / 47" />
                <Row label="Aan tarief" value="€0,28 / kWh" />
                <Row label="Periode" value="01–31 mei" />
                <Row label="Export-formaat" value=".SDX" />
              </div>
              <button className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-ink-900 text-white text-[13px] font-medium py-2.5 hover:bg-ink-800 transition-colors">
                Export naar SD Worx
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Recent reimbursements */}
          <div className="mt-5 rounded-2xl ring-1 ring-ink-100 bg-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">
                  Recente reimbursements
                </div>
                <div className="mt-0.5 text-base font-semibold text-ink-900">Laatste 4 entries</div>
              </div>
              <a href="#" className="text-[12px] text-electric-600 hover:text-electric-700 font-medium flex items-center gap-1">
                Bekijk alle <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
            <div className="divide-y divide-ink-100">
              <ReimbursementRow name="L. Vermeulen" site="Thuis · Gent" kwh="124,5 kWh" amount="€34,86" status="paid" />
              <ReimbursementRow name="A. Janssens" site="Thuis · Antwerpen" kwh="98,1 kWh" amount="€27,47" status="processing" />
              <ReimbursementRow name="K. De Smet" site="HQ · Mechelen" kwh="212,3 kWh" amount="€59,44" status="paid" />
              <ReimbursementRow name="T. Lemaire" site="Thuis · Namur" kwh="76,8 kWh" amount="€21,50" status="pending" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active }: any) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] mb-1 ${
        active ? "bg-electric-50 text-electric-700 font-medium" : "text-ink-500"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </div>
  );
}

function Tab({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={`px-3 py-2.5 -mb-px border-b-2 ${
        active
          ? "border-ink-900 text-ink-900 font-medium"
          : "border-transparent text-ink-400 hover:text-ink-700"
      }`}
    >
      {label}
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  deltaTone,
}: {
  label: string;
  value: string;
  delta: string;
  deltaTone: "mint" | "ink";
}) {
  return (
    <div className="rounded-2xl ring-1 ring-ink-100 bg-white p-4">
      <div className="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">{label}</div>
      <div className="mt-1 text-[22px] font-semibold tabular-nums text-ink-900">{value}</div>
      <div
        className={`mt-1 inline-flex items-center gap-1 text-[11.5px] ${
          deltaTone === "mint" ? "text-mint-600" : "text-ink-500"
        }`}
      >
        {deltaTone === "mint" && <TrendingUp className="h-3 w-3" />}
        {delta}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900 tabular-nums">{value}</span>
    </div>
  );
}

function ReimbursementRow({
  name,
  site,
  kwh,
  amount,
  status,
}: {
  name: string;
  site: string;
  kwh: string;
  amount: string;
  status: "paid" | "processing" | "pending";
}) {
  const badge =
    status === "paid"
      ? { label: "Betaald", cls: "bg-mint-50 text-mint-700 ring-mint-100" }
      : status === "processing"
      ? { label: "Verwerkt", cls: "bg-electric-50 text-electric-700 ring-electric-100" }
      : { label: "Wacht", cls: "bg-ink-50 text-ink-600 ring-ink-100" };

  const icon = status === "paid" ? CheckCircle2 : Clock;
  const Icon = icon;

  return (
    <div className="grid grid-cols-12 items-center px-5 py-3.5 text-[13px]">
      <div className="col-span-5 flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-electric-100 to-mint-100 flex items-center justify-center text-[10px] font-semibold text-ink-700">
          {name.split(" ").map((s) => s[0]).join("")}
        </div>
        <div>
          <div className="font-medium text-ink-900">{name}</div>
          <div className="text-[11.5px] text-ink-400">{site}</div>
        </div>
      </div>
      <div className="col-span-3 text-ink-500 tabular-nums">{kwh}</div>
      <div className="col-span-2 font-medium text-ink-900 tabular-nums">{amount}</div>
      <div className="col-span-2 flex justify-end">
        <span className={`pill ring-1 ${badge.cls}`}>
          <Icon className="h-3 w-3" />
          {badge.label}
        </span>
      </div>
    </div>
  );
}

function LineChartSVG() {
  // Two series over 12 points
  const office = [42, 55, 60, 58, 70, 78, 65, 80, 88, 95, 102, 118];
  const home = [22, 28, 30, 36, 41, 48, 55, 60, 68, 74, 82, 94];
  const w = 700;
  const h = 180;
  const padX = 20;
  const padY = 16;
  const max = 130;
  const xStep = (w - padX * 2) / (office.length - 1);
  const toPath = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = padX + i * xStep;
        const y = h - padY - (v / max) * (h - padY * 2);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  const toArea = (arr: number[]) => {
    const line = toPath(arr);
    const lastX = padX + (arr.length - 1) * xStep;
    return `${line} L${lastX} ${h - padY} L${padX} ${h - padY} Z`;
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full h-[180px]">
      <defs>
        <linearGradient id="electricFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mintFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((p) => (
        <line
          key={p}
          x1={padX}
          x2={w - padX}
          y1={h - padY - (h - padY * 2) * p}
          y2={h - padY - (h - padY * 2) * p}
          stroke="#E6EAF2"
          strokeDasharray="2 4"
        />
      ))}

      <path d={toArea(office)} fill="url(#electricFill)" />
      <path d={toPath(office)} stroke="#2563EB" strokeWidth="2" fill="none" strokeLinecap="round" />

      <path d={toArea(home)} fill="url(#mintFill)" />
      <path d={toPath(home)} stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* end dots */}
      <circle cx={padX + (office.length - 1) * xStep} cy={h - padY - (118 / max) * (h - padY * 2)} r="3.5" fill="#2563EB" />
      <circle cx={padX + (home.length - 1) * xStep} cy={h - padY - (94 / max) * (h - padY * 2)} r="3.5" fill="#10B981" />
    </svg>
  );
}
