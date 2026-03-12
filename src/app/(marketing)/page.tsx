import { FeaturedCars } from "@/components/marketing/featured-cars";
import { Hero } from "@/components/marketing/hero";
import { HeroSearchBar } from "@/components/marketing/search-bar";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { HomeMetrics } from "@/components/marketing/home-metrics";
import { MobileAppRedirect } from "@/components/marketing/mobile-app-redirect";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { WhyChoose } from "@/components/marketing/why-choose";

export default function MarketingHome() {
  return (
    <div className="bg-[#f6f7fb]">
      <MobileAppRedirect />
      <div className="relative">
        <Hero />
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <HeroSearchBar />
        </div>
      </div>
      <HomeMetrics />
      <TrustStrip />
      <FeaturedCars />
      <HowItWorks />
      <WhyChoose />
    </div>
  );
}
