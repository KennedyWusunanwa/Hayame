"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, SendHorizontal } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import {
  ADMIN_OFFICE_AVATAR,
  ADMIN_OFFICE_NAME,
  ADMIN_OFFICE_PROFILE_ID,
} from "@/lib/admin-office";

type AdminUser = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  city: string | null;
};

type AdminConversation = {
  id: string;
  created_at: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  participant: AdminUser;
};

type AdminMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type Props = {
  initialUserId?: string | null;
};

export function AdminMessagesConsole({ initialUserId }: Props) {
  const [officeProfileId, setOfficeProfileId] = useState(
    ADMIN_OFFICE_PROFILE_ID,
  );
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersQuery, setUsersQuery] = useState("");

  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializedUserRef = useRef(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId,
      ) ?? null,
    [activeConversationId, conversations],
  );

  const filteredUsers = useMemo(() => {
    const q = usersQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (user.id === officeProfileId) return false;
      if (!q) return true;
      return [user.full_name ?? "", user.phone ?? "", user.city ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [users, usersQuery, officeProfileId]);

  const loadUsers = async (query = "") => {
    setUsersLoading(true);
    const url = query
      ? `/api/admin/messages?scope=users&q=${encodeURIComponent(query)}`
      : "/api/admin/messages?scope=users";
    const res = await fetch(url, { cache: "no-store" });
    const payload = (await res.json()) as {
      data?: AdminUser[];
      office_profile_id?: string;
      message?: string;
    };
    if (!res.ok) {
      throw new Error(payload.message ?? "Failed to load users");
    }
    if (payload.office_profile_id) {
      setOfficeProfileId(payload.office_profile_id);
    }
    setUsers(payload.data ?? []);
    setUsersLoading(false);
  };

  const loadConversations = async () => {
    setConversationsLoading(true);
    const res = await fetch("/api/admin/messages", { cache: "no-store" });
    const payload = (await res.json()) as {
      data?: AdminConversation[];
      office_profile_id?: string;
      message?: string;
    };
    if (!res.ok) {
      throw new Error(payload.message ?? "Failed to load conversations");
    }
    if (payload.office_profile_id) {
      setOfficeProfileId(payload.office_profile_id);
    }
    setConversations(payload.data ?? []);
    setConversationsLoading(false);
  };

  const openConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMessagesLoading(true);
    const res = await fetch(
      `/api/admin/messages?conversationId=${conversationId}`,
      { cache: "no-store" },
    );
    const payload = (await res.json()) as {
      data?: { messages?: AdminMessage[] };
      office_profile_id?: string;
      message?: string;
    };
    if (!res.ok) {
      throw new Error(payload.message ?? "Failed to load messages");
    }
    if (payload.office_profile_id) {
      setOfficeProfileId(payload.office_profile_id);
    }
    setMessages(payload.data?.messages ?? []);
    setMessagesLoading(false);
    await loadConversations();
  };

  const startConversation = async (userId: string) => {
    setError(null);
    const res = await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", userId }),
    });
    const payload = (await res.json()) as {
      data?: { id?: string };
      message?: string;
    };
    if (!res.ok || !payload.data?.id) {
      throw new Error(payload.message ?? "Unable to start conversation");
    }
    await loadConversations();
    await openConversation(payload.data.id);
  };

  const sendMessage = async () => {
    if (!activeConversationId) return;
    const body = composer.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          conversationId: activeConversationId,
          body,
        }),
      });
      const payload = (await res.json()) as {
        data?: AdminMessage;
        message?: string;
      };
      if (!res.ok || !payload.data) {
        throw new Error(payload.message ?? "Unable to send message");
      }
      setComposer("");
      setMessages((prev) => [...prev, payload.data!]);
      await loadConversations();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to send message");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        await Promise.all([loadUsers(), loadConversations()]);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Unable to load admin messages",
        );
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (
      !initialUserId ||
      initializedUserRef.current ||
      usersLoading ||
      conversationsLoading
    )
      return;
    initializedUserRef.current = true;
    void startConversation(initialUserId).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Unable to open this user");
    });
  }, [initialUserId, usersLoading, conversationsLoading]); // eslint-disable-line react-hooks/exhaustive-deps -- bootstrap an initial conversation once loading settles

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activeConversationId]);

  useEffect(() => {
    const timer = setInterval(() => {
      void loadConversations().catch(() => undefined);
      if (activeConversationId) {
        void openConversation(activeConversationId).catch(() => undefined);
      }
    }, 12000);
    return () => clearInterval(timer);
  }, [activeConversationId]); // eslint-disable-line react-hooks/exhaustive-deps -- poll by active conversation id only

  return (
    <div className="grid gap-4 lg:grid-cols-[340px,1fr] lg:gap-6">
      <aside className="max-h-[44vh] overflow-hidden rounded-2xl border border-border bg-white lg:h-[72vh] lg:max-h-none">
        <div className="border-b border-border p-3 sm:p-4">
          <p className="text-lg font-semibold text-foreground">Admin inbox</p>
          <p className="text-xs text-gray-600">Official Hayame messages</p>
          <div className="mt-3">
            <Input
              value={usersQuery}
              onChange={(event) => setUsersQuery(event.target.value)}
              placeholder="Find user by name, phone, city"
            />
          </div>
        </div>

        <div className="max-h-[calc(44vh-86px)] overflow-y-auto p-3 lg:h-[calc(72vh-90px)] lg:max-h-none">
          <div>
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
              Start chat
            </p>
            <div className="mt-2 space-y-2">
              {usersLoading ? (
                <p className="px-2 py-2 text-xs text-gray-500">
                  Loading users...
                </p>
              ) : null}
              {!usersLoading && filteredUsers.length === 0 ? (
                <p className="px-2 py-2 text-xs text-gray-500">
                  No users found.
                </p>
              ) : null}
              {!usersLoading
                ? filteredUsers.slice(0, 20).map((user) => {
                    const initials = getInitials(user.full_name ?? "User");
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          void startConversation(user.id).catch(
                            (err: unknown) => {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Unable to start conversation",
                              );
                            },
                          );
                        }}
                        className="flex w-full items-center justify-between rounded-lg border border-border px-2 py-2 text-left hover:bg-gray-50"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-white">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name ?? "User"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-gray-700">
                                {initials || "U"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {user.full_name ?? "User"}
                            </p>
                            <p className="truncate text-[11px] text-gray-500">
                              {user.phone ?? user.city ?? "No details"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold text-brand">
                          Message
                        </span>
                      </button>
                    );
                  })
                : null}
            </div>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">
              Conversations
            </p>
            <div className="mt-2 space-y-2">
              {conversationsLoading ? (
                <p className="px-2 py-2 text-xs text-gray-500">
                  Loading conversations...
                </p>
              ) : null}
              {!conversationsLoading && conversations.length === 0 ? (
                <p className="px-2 py-2 text-xs text-gray-500">
                  No conversations yet.
                </p>
              ) : null}
              {!conversationsLoading
                ? conversations.map((conversation) => {
                    const initials = getInitials(
                      conversation.participant.full_name ?? "User",
                    );
                    const date =
                      conversation.last_message_at ?? conversation.created_at;
                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => {
                          void openConversation(conversation.id).catch(
                            (err: unknown) => {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : "Unable to open conversation",
                              );
                            },
                          );
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border border-border px-2 py-2 text-left hover:bg-gray-50",
                          activeConversationId === conversation.id
                            ? "bg-gray-50"
                            : "bg-white",
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-white">
                            {conversation.participant.avatar_url ? (
                              <img
                                src={conversation.participant.avatar_url}
                                alt={
                                  conversation.participant.full_name ?? "User"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-gray-700">
                                {initials || "U"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {conversation.participant.full_name ?? "User"}
                            </p>
                            <p className="truncate text-[11px] text-gray-500">
                              {conversation.last_message_preview ??
                                "No messages yet."}
                            </p>
                          </div>
                        </div>
                        <div className="ml-2 shrink-0 text-right">
                          <p className="text-[10px] text-gray-500">
                            {date ? new Date(date).toLocaleDateString() : ""}
                          </p>
                          {conversation.unread_count > 0 ? (
                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
                              {conversation.unread_count > 99
                                ? "99+"
                                : conversation.unread_count}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })
                : null}
            </div>
          </div>
        </div>
      </aside>

      <section className="flex h-[68vh] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-white lg:h-[72vh]">
        {activeConversation ? (
          <>
            <div className="border-b border-border px-3 py-3 sm:px-4 sm:py-4">
              <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {activeConversation.participant.full_name ?? "User"}
                  </p>
                  <p className="text-xs text-gray-600">
                    {activeConversation.participant.phone ??
                      activeConversation.participant.city ??
                      "User conversation"}
                  </p>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-xs font-semibold text-brandHover">
                  <div className="relative h-4 w-4 overflow-hidden rounded-full border border-brand/25 bg-white">
                    <img
                      src={ADMIN_OFFICE_AVATAR}
                      alt={ADMIN_OFFICE_NAME}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span>{ADMIN_OFFICE_NAME}</span>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verified</span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
              {messagesLoading ? (
                <p className="text-sm text-gray-500">Loading messages...</p>
              ) : null}
              {!messagesLoading && messages.length === 0 ? (
                <p className="rounded-xl border border-border bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  No messages yet. Send the first message as Hayame office.
                </p>
              ) : null}
              {!messagesLoading
                ? messages.map((message) => {
                    const isOffice = message.sender_id === officeProfileId;
                    const initials = getInitials(
                      activeConversation.participant.full_name ?? "User",
                    );
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex w-full",
                          isOffice ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[88%] rounded-2xl border px-3 py-3 text-sm shadow-sm sm:max-w-[78%] sm:px-4",
                            isOffice
                              ? "border-brand/30 bg-brand/10 text-foreground"
                              : "border-border bg-gray-50 text-foreground",
                          )}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            {isOffice ? (
                              <>
                                <div className="relative h-4 w-4 overflow-hidden rounded-full border border-brand/30 bg-white">
                                  <img
                                    src={ADMIN_OFFICE_AVATAR}
                                    alt={ADMIN_OFFICE_NAME}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <span className="text-[11px] font-semibold text-brand">
                                  {ADMIN_OFFICE_NAME}
                                </span>
                                <CheckCircle2 className="h-3 w-3 text-brand" />
                              </>
                            ) : (
                              <>
                                <div className="relative h-4 w-4 overflow-hidden rounded-full border border-border bg-white">
                                  {activeConversation.participant.avatar_url ? (
                                    <img
                                      src={
                                        activeConversation.participant
                                          .avatar_url
                                      }
                                      alt={
                                        activeConversation.participant
                                          .full_name ?? "User"
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-gray-700">
                                      {initials || "U"}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[11px] font-semibold text-gray-700">
                                  {activeConversation.participant.full_name ??
                                    "User"}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap break-words">
                            {message.body}
                          </p>
                          <p className="mt-2 text-[11px] text-gray-500">
                            {new Date(message.created_at).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                : null}
              <div ref={endRef} />
            </div>

            <form
              className="grid gap-2 border-t border-border px-3 py-3 sm:flex sm:items-center sm:px-4"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
            >
              <Input
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                placeholder="Send message as Hayame office..."
              />
              <Button type="submit" disabled={sending || !composer.trim()}>
                <SendHorizontal className="mr-2 h-4 w-4" />
                {sending ? "Sending..." : "Send"}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <p className="text-base font-semibold text-foreground">
                Start an admin conversation
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Pick a user from the left, then message them as verified{" "}
                {ADMIN_OFFICE_NAME} office.
              </p>
            </div>
          </div>
        )}
      </section>

      {error ? (
        <p className="lg:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
