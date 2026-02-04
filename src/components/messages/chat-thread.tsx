"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { MessageComposer } from "@/components/messages/message-composer";
import { MessageBubble } from "@/components/messages/message-bubble";
import { useMessaging } from "@/components/messages/messaging-provider";
import { getInitials } from "@/lib/utils";

export function ChatThread() {
  const {
    conversations,
    activeConversationId,
    messagesByConversation,
    userId,
    sendMessage,
    loadOlderMessages,
  } = useMessaging();
  const activeConversation = useMemo(
    () => conversations.find((conv) => conv.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );
  const messages = activeConversationId ? messagesByConversation[activeConversationId] ?? [] : [];
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  if (!activeConversation) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-border bg-background p-8 text-center">
        <div>
          <p className="text-sm font-semibold text-foreground">Select a conversation</p>
          <p className="mt-2 text-sm text-gray-600">Choose a thread to start chatting.</p>
        </div>
      </div>
    );
  }

  const initials = getInitials(activeConversation.otherUser.name);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-background shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-border bg-background">
            {activeConversation.otherUser.avatar ? (
              <Image
                src={activeConversation.otherUser.avatar}
                alt={activeConversation.otherUser.name}
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
          <div>
            <p className="text-sm font-semibold text-foreground">{activeConversation.otherUser.name}</p>
            <p className="text-xs text-gray-600">
              {activeConversation.carTitle ? `Listing: ${activeConversation.carTitle}` : "Direct conversation"}
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-500">Live</div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length >= 30 ? (
          <button
            type="button"
            onClick={() => loadOlderMessages(activeConversation.id)}
            className="mx-auto block rounded-full border border-border px-3 py-1 text-xs font-semibold text-gray-700"
          >
            Load older messages
          </button>
        ) : null}
        {messages.length === 0 ? (
          <div className="rounded-xl border border-border bg-background p-6 text-center text-sm text-gray-600">
            No messages yet. Say hello.
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} isOwn={message.sender_id === userId} />
          ))
        )}
        <div ref={endRef} />
      </div>

      <MessageComposer onSend={(body) => sendMessage(activeConversation.id, body)} />
    </div>
  );
}
