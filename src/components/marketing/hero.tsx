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
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/65 z-10" />
      </div>
      <div className="relative z-20 mx-auto flex max-w-6xl flex-col gap-6 px-6 py-20 text-white lg:py-28">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold text-brand">Online peer-to-peer car rental marketplace</p>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
            Rent a Car, Anytime, Anywhere in Ghana.
          </h1>
          <p className="max-w-2xl text-lg text-white/80">
            From Accra to Kumasi, book verified cars from trusted hosts. Flexible pickup, transparent pricing, and
            Paystack coming soon.
          </p>
        </div>
        <div>
          <Button
            size="lg"
            asChild
            className="border border-brand bg-brand text-white hover:bg-white hover:text-brand"
          >
            <Link href="/explore">Real started</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
