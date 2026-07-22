"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useMessaging } from "@/components/messages/messaging-provider";
import { friendlyError } from "@/lib/client-errors";

type Props = {
  hostId?: string | null;
  hostName?: string | null;
  carId?: string | null;
};

const presets = [
  "Hi! Is this car available this week?",
  "Can I pick up the car in the morning?",
  "Do you offer delivery or pickup?",
  "What documents do you require?",
];

export function HostMessageCard({ hostId, hostName, carId }: Props) {
  const router = useRouter();
  const { refreshConversations, sendMessage, userId } = useMessaging();
  const [selected, setSelected] = useState<string>(presets[0]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = useMemo(() => hostName ?? "Host", [hostName]);

  const startConversation = async (withMessage: boolean) => {
    if (!hostId) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId, carId }),
      });
      const payload = (await res.json()) as { id?: string; message?: string };
      if (!res.ok || !payload.id) {
        throw new Error(payload.message || "Unable to start conversation");
      }
      if (withMessage) {
        await sendMessage(payload.id, selected);
      }
      await refreshConversations();
      router.push(`/messages?conversation=${payload.id}`);
    } catch (err: any) {
      setError(friendlyError(err, "Unable to message host"));
    } finally {
      setSending(false);
    }
  };

  if (!hostId) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-soft">
      <p className="text-sm font-semibold text-foreground">Message {label}</p>
      <p className="mt-1 text-xs text-gray-600">
        Use a quick prompt to start the chat.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setSelected(preset)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              selected === preset
                ? "border-brand bg-brand text-white"
                : "border-border text-gray-700"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {userId ? (
          <>
            <Button
              size="sm"
              onClick={() => startConversation(true)}
              disabled={sending}
            >
              {sending ? "Opening..." : "Send message"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => startConversation(false)}
              disabled={sending}
            >
              Chat without message
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/auth/login")}
          >
            Sign in to message
          </Button>
        )}
      </div>
    </div>
  );
}
