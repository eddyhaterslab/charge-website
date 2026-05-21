import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Solution from "@/components/Solution";
import Stakeholders from "@/components/Stakeholders";
import Platform from "@/components/Platform";
import Wedge from "@/components/Wedge";
import UseCases from "@/components/UseCases";
import Process from "@/components/Process";
import Metrics from "@/components/Metrics";
import Founder from "@/components/Founder";
import CTA from "@/components/CTA";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <main className="relative overflow-x-hidden">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Stakeholders />
      <Platform />
      <Wedge />
      <UseCases />
      <Process />
      <Metrics />
      <Founder />
      <CTA />
      <Contact />
      <Footer />
    </main>
  );
}
