import { HeroSection } from "@/components/hero-section";
import { StorySections } from "@/components/story-sections";

export default function Home() {
  return (
    <main className="bg-[#08100C]">
      <HeroSection />
      <StorySections />
    </main>
  );
}
