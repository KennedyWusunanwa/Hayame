"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onSend: (body: string) => Promise<void>;
};

export function MessageComposer({ onSend }: Props) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setBody("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={1}
            placeholder="Write a message..."
            className="min-h-[44px] w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Attachments coming soon.
          </p>
        </div>
        <Button onClick={submit} disabled={sending}>
          {sending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
