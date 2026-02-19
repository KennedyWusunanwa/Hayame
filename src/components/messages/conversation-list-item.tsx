"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/messages/types";
import { ADMIN_OFFICE_PROFILE_ID } from "@/lib/admin-office";

type Props = {
  conversation: ConversationSummary;
  active: boolean;
  onClick: () => void;
};

export function ConversationListItem({ conversation, active, onClick }: Props) {
  const initials = getInitials(conversation.otherUser.name);
  const date = conversation.last_message_at ?? conversation.created_at;
  const timeLabel = date ? new Date(date).toLocaleDateString() : "";
  const isOffice = conversation.otherUser.id === ADMIN_OFFICE_PROFILE_ID;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left transition hover:bg-muted",
        active && "bg-muted",
      )}
    >
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-border bg-background">
        {conversation.otherUser.avatar ? (
          <Image
            src={conversation.otherUser.avatar}
            alt={conversation.otherUser.name}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground">
            {initials || "U"}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold text-foreground">
            {conversation.otherUser.name}
            {isOffice ? (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            ) : null}
          </p>
          <span className="text-xs text-gray-500">{timeLabel}</span>
        </div>
        <p className="truncate text-xs text-gray-600">
          {conversation.last_message_preview ?? "No messages yet."}
        </p>
        {conversation.carTitle ? (
          <p className="mt-1 text-[11px] text-gray-500">Listing: {conversation.carTitle}</p>
        ) : null}
      </div>
      {conversation.unreadCount > 0 ? (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
          {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
        </span>
      ) : null}
    </button>
  );
}
