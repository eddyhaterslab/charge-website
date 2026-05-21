# Charge — Website

Next.js 14 + TypeScript + Tailwind CSS marketing site for Charge, the Belgian B2B Charging-as-a-Service partner.

## Stack
- Next.js 14.2 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3.4
- framer-motion (subtle scroll/load animations)
- lucide-react (line icons)
- Inter font via `next/font/google`

## Local development

```bash
npm install
npm run dev
```

The site runs at http://localhost:3000.

## Build & start

```bash
npm run build
npm run start
```

## Deployment (Vercel)

Push this repo to GitHub and import it in Vercel — no environment variables or special build settings required. The default `next build` works out of the box.

Alternatively from the CLI:

```bash
npm i -g vercel
vercel
```

## Structure

```
app/
  layout.tsx         # root layout, Inter font, metadata
  page.tsx           # assembles all sections
  globals.css        # Tailwind layers, design tokens, utilities
components/
  Navbar.tsx
  Hero.tsx
  Problem.tsx
  Solution.tsx
  Stakeholders.tsx
  Platform.tsx
  Wedge.tsx          # dark differentiator section
  UseCases.tsx
  Process.tsx
  Metrics.tsx
  Founder.tsx
  CTA.tsx
  Contact.tsx        # client-side form, no backend
  Footer.tsx
tailwind.config.ts   # ink / electric / mint colour scales, animations
```

## Notes

- The contact form is client-only. `onSubmit` is intercepted with `e.preventDefault()` and toggles a success state. Wire it to your preferred form backend (Resend, Formspree, custom API route) when you're ready.
- All visuals are pure SVG / CSS — no images or photos. Replace the founder initials block (`Founder.tsx`) with a real photo when available.
- Copy is in Dutch (NL).
