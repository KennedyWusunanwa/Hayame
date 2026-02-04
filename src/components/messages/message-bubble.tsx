"use client";

import { cn } from "@/lib/utils";
import type { Message } from "@/lib/messages/types";

type Props = {
  message: Message;
  isOwn: boolean;
};

export function MessageBubble({ message, isOwn }: Props) {
  return (
    <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isOwn ? "bg-background text-foreground border border-border" : "bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p className={cn("mt-2 text-[11px]", isOwn ? "text-gray-500" : "text-gray-600")}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
