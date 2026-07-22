import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "ok" | "expired" | "invalid";

function parseStatus(value: string | undefined): Status {
  if (value === "ok" || value === "expired") return value;
  return "invalid";
}

const COPY: Record<
  Status,
  { title: string; body: string; tone: "success" | "error" }
> = {
  ok: {
    title: "Email verified",
    body: "Your Hayame account is active. You can log in on the app or here on the web.",
    tone: "success",
  },
  expired: {
    title: "This link has expired",
    body: "Verification links are valid for 24 hours and can only be used once. Request a fresh one from the log in screen and we'll email it straight away.",
    tone: "error",
  },
  invalid: {
    title: "We couldn't verify this link",
    body: "The link looks incomplete or has already been used. Request a new verification email from the log in screen.",
    tone: "error",
  },
};

export default async function VerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const state = parseStatus(status);
  const copy = COPY[state];

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md border border-border shadow-soft">
        <CardHeader>
          <div
            className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full text-xl ${
              copy.tone === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
            aria-hidden
          >
            {copy.tone === "success" ? "✓" : "!"}
          </div>
          <CardTitle className="text-2xl font-semibold text-foreground">
            {copy.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-gray-600">{copy.body}</p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/login">Go to log in</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Browse cars</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
