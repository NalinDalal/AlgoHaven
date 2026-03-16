import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import VerdictTicker from "@/components/VerdictTicker";
import Features from "@/components/Features";
import Leaderboard from "@/components/Leaderboard";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <VerdictTicker />
      <Features />
      <Leaderboard />
      <CtaSection />
      <Footer />
    </main>
  );
}