import { ShieldCheck, Clock, CarFront } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const steps = [
  {
    title: "Step 1: Sign Up & Verify",
    icon: ShieldCheck,
    description:
      "Create your free account and submit your driver’s license for rapid verification. Once approved, browse hundreds of unique vehicles listed by local hosts across Ghana.",
  },
  {
    title: "Step 2: Book Your Ride",
    icon: Clock,
    description:
      "Select your dates, choose the perfect car for your trip, and pay securely online using your preferred method, including Mobile Money (MoMo). The host will confirm the booking details.",
  },
  {
    title: "Step 3: Drive & Return",
    icon: CarFront,
    description:
      "Meet the host for pickup or choose delivery if available. Enjoy your journey and simply return the vehicle in the same condition at the end of your trip.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-gray-50">
      <Reveal className="mx-auto max-w-6xl px-6 py-14">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-foreground">
            How Hayame Works
          </h3>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="flex h-full flex-col items-center gap-4 rounded-2xl border border-border bg-white p-6 text-left shadow-soft text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center text-brand">
                  <Icon className="h-10 w-10" />
                </div>
                <h4 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h4>
                <p className="text-sm text-gray-700">{step.description}</p>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
