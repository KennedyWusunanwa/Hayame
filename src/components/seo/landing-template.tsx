import Link from "next/link";

type Faq = {
  question: string;
  answer: string;
};

type Props = {
  title: string;
  intro: string;
  faqs: Faq[];
};

export function SeoLandingTemplate({ title, intro, faqs }: Props) {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-gray-700">{intro}</p>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground">Quick links</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <Link href="/explore" className="rounded-full border border-border px-3 py-1 hover:text-brand">
            Browse cars
          </Link>
          <Link href="/become-host" className="rounded-full border border-border px-3 py-1 hover:text-brand">
            Become a Host
          </Link>
          <Link href="/host" className="rounded-full border border-border px-3 py-1 hover:text-brand">
            Host dashboard
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">FAQs</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-xl border border-border bg-white p-4">
              <h3 className="text-sm font-semibold text-foreground">{faq.question}</h3>
              <p className="mt-1 text-sm text-gray-700">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
