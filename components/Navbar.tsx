"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const links = [
  { href: "#platform", label: "Platform" },
  { href: "#process", label: "Proces" },
  { href: "#wedge", label: "Wedge" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/80 backdrop-blur-md border-b border-ink-100 shadow-soft"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2 group">
          <span className="relative inline-flex h-2.5 w-2.5">
            <span className="absolute inset-0 rounded-full bg-electric-500 animate-pulse-dot" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-electric-600" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight text-ink-900">Charge</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ink-500 hover:text-ink-900 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a href="#contact" className="btn-primary text-sm">
          Vraag fleet audit aan
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}
