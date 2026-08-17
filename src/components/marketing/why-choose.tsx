import { Reveal } from "@/components/ui/reveal";

export function WhyChoose() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-14 text-center">
      <Reveal>
        <h3 className="text-2xl font-semibold text-foreground">
          Why Choose Hayame
        </h3>
        <p className="mt-3 text-sm text-gray-700">
          Hayame is Ghana&apos;s peer-to-peer car rental marketplace built for
          flexibility and trust. Book from city runabouts to SUVs for
          upcountry trips with secure MoMo and card payments, transparent
          pricing, and host verification workflows that keep trips safer for
          guests and hosts.
        </p>
      </Reveal>
    </section>
  );
}
