import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Image
          src="/hero.jpg"
          alt="Driving in Ghana"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/55 via-black/45 to-black/65" />
        <div className="hero-bottom-fade" />
      </div>
      <div className="relative z-30 mx-auto flex max-w-6xl flex-col items-start gap-4 px-6 py-8 text-left text-white sm:py-10 lg:py-12">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Rent cars across Ghana.
          </p>
          <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
            Rent a Car, Anytime, Anywhere in Ghana.
          </h1>
        </div>
        <div>
          <Button
            size="lg"
            asChild
            className="rounded-full border border-brand bg-brand px-5 text-white hover:bg-white hover:text-brand"
          >
            <Link href="/explore">Book Now</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
