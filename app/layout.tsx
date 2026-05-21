import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Charge — De Belgische standaard voor B2B EV-laadinfrastructuur",
  description:
    "Charge is de Belgische Charging-as-a-Service partner voor bedrijfsvloten. Audit, installatie, software, payroll-reimbursement en SLA — alles in één contract.",
  openGraph: {
    title: "Charge — De Belgische standaard voor B2B EV-laadinfrastructuur",
    description:
      "Eén partner. Eén platform. Eén factuur. Charging-as-a-Service voor Belgische bedrijven met 10 tot 500 voertuigen.",
    locale: "nl_BE",
    type: "website",
  },
  metadataBase: new URL("https://charge.be"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-ink-900 selection:bg-electric-100 selection:text-electric-700">
        {children}
      </body>
    </html>
  );
}
