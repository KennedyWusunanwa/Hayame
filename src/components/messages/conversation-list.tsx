"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ConversationListItem } from "@/components/messages/conversation-list-item";
import { useMessaging } from "@/components/messages/messaging-provider";

export function ConversationList() {
  const { conversations, activeConversationId, openConversation } =
    useMessaging();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "unread">("all");

  const filtered = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return conversations.filter((conv) => {
      if (tab === "unread" && conv.unreadCount === 0) return false;
      if (!lower) return true;
      return (
        conv.otherUser.name.toLowerCase().includes(lower) ||
        (conv.last_message_preview ?? "").toLowerCase().includes(lower)
      );
    });
  }, [conversations, query, tab]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-border bg-background px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold text-foreground">Inbox</p>
          <span className="text-xs text-gray-600">
            {conversations.length} chats
          </span>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages"
          className="bg-background"
        />
        <div className="flex gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`rounded-full border px-3 py-1 ${
              tab === "all"
                ? "border-brand bg-brand text-white"
                : "border-border text-gray-700"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setTab("unread")}
            className={`rounded-full border px-3 py-1 ${
              tab === "unread"
                ? "border-brand bg-brand text-white"
                : "border-border text-gray-700"
            }`}
          >
            Unread
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No conversations yet.</div>
        ) : (
          filtered.map((conv) => (
            <ConversationListItem
              key={conv.id}
              conversation={conv}
              active={conv.id === activeConversationId}
              onClick={() => openConversation(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
