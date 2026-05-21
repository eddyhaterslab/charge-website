"use client";

import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    fleet: "",
    message: "",
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <section id="contact" className="relative py-24 md:py-32 bg-ink-50/40">
      <div className="container-x">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-5"
          >
            <span className="eyebrow">
              <span className="h-px w-6 bg-electric-500" /> Contact
            </span>
            <h2 className="mt-4 text-3xl md:text-[44px] md:leading-[1.05] font-semibold tracking-tight text-ink-900">
              Laat ons je vloot bekijken.
            </h2>
            <p className="mt-5 text-[16.5px] text-ink-500 max-w-md leading-relaxed">
              Vul het formulier in en we plannen een intake-gesprek binnen één werkdag.
              Daarna stellen we een audit-voorstel op, afgestemd op de schaal en complexiteit van je vloot.
            </p>

            <div className="mt-10 space-y-4 text-[14px]">
              <div className="flex items-center gap-3 text-ink-700">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white ring-1 ring-ink-100">
                  <Mail className="h-4 w-4 text-electric-600" />
                </div>
                hello@charge.be
              </div>
              <div className="flex items-center gap-3 text-ink-700">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white ring-1 ring-ink-100">
                  <Phone className="h-4 w-4 text-electric-600" />
                </div>
                +32 (0)2 808 00 00
              </div>
              <div className="flex items-center gap-3 text-ink-700">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white ring-1 ring-ink-100">
                  <MapPin className="h-4 w-4 text-electric-600" />
                </div>
                Antwerpen · België
              </div>
            </div>

            <p className="mt-10 text-[12.5px] text-ink-400">
              We antwoorden binnen 1 werkdag · NL · FR · EN
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="rounded-3xl bg-white ring-1 ring-ink-100 shadow-card p-6 md:p-10">
              {sent ? (
                <div className="flex flex-col items-start py-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-50 ring-1 ring-mint-100 text-mint-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-tight text-ink-900">
                    Bedankt — je aanvraag is binnen.
                  </h3>
                  <p className="mt-3 text-[15px] text-ink-500 max-w-md">
                    Een lid van het Charge team neemt binnen één werkdag contact op om een intake te plannen.
                    Ondertussen kijken we al naar je vloot-context op basis van wat je hebt meegegeven.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field
                      label="Naam"
                      name="name"
                      placeholder="Jane De Smet"
                      value={form.name}
                      onChange={(v) => setForm({ ...form, name: v })}
                      required
                    />
                    <Field
                      label="Bedrijf"
                      name="company"
                      placeholder="Acme Logistics BV"
                      value={form.company}
                      onChange={(v) => setForm({ ...form, company: v })}
                      required
                    />
                  </div>

                  <Field
                    label="E-mail"
                    name="email"
                    type="email"
                    placeholder="jane@acme.be"
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                    required
                  />

                  <div>
                    <label className="block text-[12.5px] font-medium text-ink-700 mb-1.5">Vlootgrootte</label>
                    <select
                      required
                      value={form.fleet}
                      onChange={(e) => setForm({ ...form, fleet: e.target.value })}
                      className="w-full rounded-xl bg-white ring-1 ring-ink-200 px-4 py-3 text-[14px] text-ink-900 focus:outline-none focus:ring-2 focus:ring-electric-500/40 focus:border-electric-500 transition-all"
                    >
                      <option value="">Selecteer een grootte…</option>
                      <option value="lt10">Minder dan 10 voertuigen</option>
                      <option value="10-25">10 – 25 voertuigen</option>
                      <option value="25-100">25 – 100 voertuigen</option>
                      <option value="100-500">100 – 500 voertuigen</option>
                      <option value="500+">500+ voertuigen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-medium text-ink-700 mb-1.5">
                      Context (optioneel)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Aantal sites, huidige providers, planning…"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full rounded-xl bg-white ring-1 ring-ink-200 px-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-electric-500/40 focus:border-electric-500 transition-all resize-none"
                    />
                  </div>

                  <button type="submit" className="btn-electric w-full sm:w-auto">
                    Stuur aanvraag
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <p className="text-[11.5px] text-ink-400">
                    Door dit formulier in te dienen ga je akkoord met onze verwerking van je gegevens om contact
                    op te nemen.
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-[12.5px] font-medium text-ink-700 mb-1.5">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-white ring-1 ring-ink-200 px-4 py-3 text-[14px] text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-electric-500/40 focus:border-electric-500 transition-all"
      />
    </div>
  );
}
