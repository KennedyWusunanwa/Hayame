"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ConversationList } from "@/components/messages/conversation-list";
import { ChatThread } from "@/components/messages/chat-thread";
import { useMessaging } from "@/components/messages/messaging-provider";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  const { activeConversationId, closeConversation, loading, openConversation } =
    useMessaging();
  const searchParams = useSearchParams();

  useEffect(() => {
    const target = searchParams.get("conversation");
    if (target && target !== activeConversationId) {
      openConversation(target);
    }
  }, [activeConversationId, openConversation, searchParams]);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-10">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <div
          className={`h-[70vh] rounded-2xl border border-border bg-background shadow-soft ${activeConversationId ? "hidden lg:block" : ""}`}
        >
          <ConversationList />
        </div>
        <div
          className={`h-[70vh] ${activeConversationId ? "block" : "hidden lg:block"}`}
        >
          {activeConversationId ? (
            <div className="flex h-full flex-col gap-3">
              <div className="flex items-center gap-3 lg:hidden">
                <Button variant="outline" onClick={closeConversation}>
                  Back
                </Button>
                <p className="text-sm font-semibold text-foreground">
                  Conversation
                </p>
              </div>
              <ChatThread />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-border bg-background p-8 text-center">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Start a conversation
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Pick a chat from the inbox to see messages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
