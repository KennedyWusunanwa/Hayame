"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageComposer } from "@/components/messages/message-composer";
import { MessageBubble } from "@/components/messages/message-bubble";
import { useMessaging } from "@/components/messages/messaging-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
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
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const activeConversation = useMemo(
    () => conversations.find((conv) => conv.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );
  const messages = activeConversationId ? messagesByConversation[activeConversationId] ?? [] : [];
  const endRef = useRef<HTMLDivElement | null>(null);
  const [bookingStatus, setBookingStatus] = useState<string | null>(null);
  const [checkingBooking, setCheckingBooking] = useState(false);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages.length]);

  useEffect(() => {
    let cancelled = false;
    const loadBookingStatus = async () => {
      if (!activeConversation || !userId) {
        setBookingStatus(null);
        return;
      }
      if (userId !== activeConversation.user_id) {
        setBookingStatus(null);
        return;
      }
      if (!activeConversation.car_id) {
        setBookingStatus(null);
        return;
      }
      setCheckingBooking(true);
      try {
        const { data } = await supabase
          .from("bookings")
          .select("id,status,created_at")
          .eq("car_id", activeConversation.car_id)
          .eq("renter_id", activeConversation.user_id)
          .in("status", ["awaiting_host", "confirmed", "completed", "refunded"])
          .order("created_at", { ascending: false })
          .limit(1);
        if (!cancelled) {
          setBookingStatus((data ?? [])[0]?.status ?? null);
        }
      } finally {
        if (!cancelled) setCheckingBooking(false);
      }
    };
    loadBookingStatus();
    return () => {
      cancelled = true;
    };
  }, [activeConversation, supabase, userId]);

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
  const canRevealHost =
    userId === activeConversation.user_id && Boolean(bookingStatus) && Boolean(activeConversation.hostProfile);
  const hostProfile = activeConversation.hostProfile;
  const hostLocation = hostProfile?.city ?? activeConversation.carLocation ?? "Location not provided";
  const hostPhone = hostProfile?.phone ?? "Phone not provided";

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
      {canRevealHost ? (
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Host info</p>
          <div className="mt-2 grid gap-2 text-sm text-foreground sm:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase text-gray-500">Full name</p>
              <p className="font-semibold">{hostProfile?.name ?? "Host"}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-gray-500">Location</p>
              <p className="font-semibold">{hostLocation}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-gray-500">Phone</p>
              <p className="font-semibold">{hostPhone}</p>
            </div>
          </div>
        </div>
      ) : checkingBooking ? (
        <div className="border-b border-border px-4 py-3 text-xs text-gray-500">Checking booking status...</div>
      ) : null}

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
