"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ConversationSummary, Message } from "@/lib/messages/types";
import {
  ADMIN_OFFICE_AVATAR,
  ADMIN_OFFICE_NAME,
  ADMIN_OFFICE_PROFILE_ID,
} from "@/lib/admin-office";

type MessagingContextValue = {
  loading: boolean;
  userId: string | null;
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  unreadCount: number;
  openConversation: (id: string) => Promise<void>;
  closeConversation: () => void;
  messagesByConversation: Record<string, Message[]>;
  sendMessage: (conversationId: string, body: string) => Promise<void>;
  loadOlderMessages: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
};

const MessagingContext = createContext<MessagingContextValue | null>(null);

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx)
    throw new Error("useMessaging must be used within MessagingProvider");
  return ctx;
}

type ProviderProps = {
  children: React.ReactNode;
};

export function MessagingProvider({ children }: ProviderProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, Message[]>
  >({});
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);

  const hydrateConversations = useCallback(
    async (currentUserId: string) => {
      const { data } = await supabase
        .from("conversations")
        .select(
          "id,host_id,user_id,car_id,booking_id,last_message_at,last_message_preview,created_at,host:profiles!conversations_host_id_fkey(id,full_name,avatar_url,phone,city),user:profiles!conversations_user_id_fkey(id,full_name,avatar_url,phone,city),car:cars(title,city,region)",
        )
        .or(`host_id.eq.${currentUserId},user_id.eq.${currentUserId}`);

      const summaries: ConversationSummary[] = (data ?? []).map((row: any) => {
        const isHost = row.host_id === currentUserId;
        const other = isHost ? row.user : row.host;
        const host = row.host;
        const renter = row.user;
        const fallbackOtherName =
          (isHost ? row.user_id : row.host_id) === ADMIN_OFFICE_PROFILE_ID
            ? ADMIN_OFFICE_NAME
            : "User";
        const fallbackOtherAvatar =
          (isHost ? row.user_id : row.host_id) === ADMIN_OFFICE_PROFILE_ID
            ? ADMIN_OFFICE_AVATAR
            : null;
        const fallbackHostName =
          row.host_id === ADMIN_OFFICE_PROFILE_ID ? ADMIN_OFFICE_NAME : "Host";
        const fallbackHostAvatar =
          row.host_id === ADMIN_OFFICE_PROFILE_ID ? ADMIN_OFFICE_AVATAR : null;
        const fallbackUserName =
          row.user_id === ADMIN_OFFICE_PROFILE_ID ? ADMIN_OFFICE_NAME : "User";
        const fallbackUserAvatar =
          row.user_id === ADMIN_OFFICE_PROFILE_ID ? ADMIN_OFFICE_AVATAR : null;
        const carLocation =
          [row.car?.city, row.car?.region].filter(Boolean).join(", ") || null;
        return {
          id: row.id,
          host_id: row.host_id,
          user_id: row.user_id,
          car_id: row.car_id ?? null,
          booking_id: row.booking_id ?? null,
          last_message_at: row.last_message_at ?? null,
          last_message_preview: row.last_message_preview ?? null,
          created_at: row.created_at,
          otherUser: {
            id: other?.id ?? (isHost ? row.user_id : row.host_id),
            name: other?.full_name ?? fallbackOtherName,
            avatar: other?.avatar_url ?? fallbackOtherAvatar,
          },
          hostProfile:
            host || row.host_id === ADMIN_OFFICE_PROFILE_ID
              ? {
                  id: host?.id ?? row.host_id,
                  name: host?.full_name ?? fallbackHostName,
                  avatar: host?.avatar_url ?? fallbackHostAvatar,
                  phone: host?.phone ?? null,
                  city: host?.city ?? null,
                }
              : undefined,
          userProfile:
            renter || row.user_id === ADMIN_OFFICE_PROFILE_ID
              ? {
                  id: renter?.id ?? row.user_id,
                  name: renter?.full_name ?? fallbackUserName,
                  avatar: renter?.avatar_url ?? fallbackUserAvatar,
                  phone: renter?.phone ?? null,
                  city: renter?.city ?? null,
                }
              : undefined,
          carTitle: row.car?.title ?? null,
          carLocation,
          unreadCount: 0,
        };
      });

      summaries.sort((a, b) => {
        const aTime = a.last_message_at ?? a.created_at;
        const bTime = b.last_message_at ?? b.created_at;
        return bTime.localeCompare(aTime);
      });

      const conversationIds = summaries.map((c) => c.id);
      let unreadByConversation: Record<string, number> = {};
      if (conversationIds.length > 0) {
        const { data: unreadRows } = await supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", conversationIds)
          .is("read_at", null)
          .neq("sender_id", currentUserId);

        unreadByConversation = (unreadRows ?? []).reduce<
          Record<string, number>
        >((acc, row: any) => {
          acc[row.conversation_id] = (acc[row.conversation_id] ?? 0) + 1;
          return acc;
        }, {});
      }

      const nextSummaries = summaries.map((c) => ({
        ...c,
        unreadCount: unreadByConversation[c.id] ?? 0,
      }));
      const totalUnread = nextSummaries.reduce(
        (sum, c) => sum + c.unreadCount,
        0,
      );
      setConversations(nextSummaries);
      setUnreadCount(totalUnread);
      return conversationIds;
    },
    [supabase],
  );

  const ensureSubscription = useCallback(
    (conversationIds: string[], currentUserId: string) => {
      channelRef.current?.unsubscribe();
      if (conversationIds.length === 0) return;

      const channel = supabase.channel("messages-realtime");
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=in.(${conversationIds.join(",")})`,
        },
        async (payload) => {
          const message = payload.new as Message;
          setConversations((prev) => {
            const next = prev.map((conv) => {
              if (conv.id !== message.conversation_id) return conv;
              return {
                ...conv,
                last_message_at: message.created_at,
                last_message_preview: message.body,
              };
            });
            next.sort((a, b) => {
              const aTime = a.last_message_at ?? a.created_at;
              const bTime = b.last_message_at ?? b.created_at;
              return bTime.localeCompare(aTime);
            });
            return next;
          });

          setMessagesByConversation((prev) => {
            if (activeConversationIdRef.current !== message.conversation_id)
              return prev;
            const current = prev[message.conversation_id] ?? [];
            if (current.some((item) => item.id === message.id)) return prev;
            return {
              ...prev,
              [message.conversation_id]: [...current, message],
            };
          });

          if (message.sender_id !== currentUserId) {
            if (activeConversationIdRef.current === message.conversation_id) {
              await supabase
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", message.id);
              return;
            }
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === message.conversation_id
                  ? { ...conv, unreadCount: (conv.unreadCount ?? 0) + 1 }
                  : conv,
              ),
            );
            setUnreadCount((prev) => prev + 1);
          }
        },
      );

      const rebindForConversationChanges = async () => {
        const nextConversationIds = await hydrateConversations(currentUserId);
        ensureSubscription(nextConversationIds, currentUserId);
      };

      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `host_id=eq.${currentUserId}`,
        },
        rebindForConversationChanges,
      );

      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${currentUserId}`,
        },
        rebindForConversationChanges,
      );

      channel.subscribe();
      channelRef.current = channel;
    },
    [hydrateConversations, supabase],
  );

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!mounted) return;
      if (!user) {
        setUserId(null);
        setConversations([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const conversationIds = await hydrateConversations(user.id);
      ensureSubscription(conversationIds, user.id);
      setLoading(false);
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      init();
    });
    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
      channelRef.current?.unsubscribe();
    };
  }, [ensureSubscription, hydrateConversations, supabase]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const markConversationRead = useCallback(
    async (conversationId: string, currentUserId: string) => {
      const { data: unreadRows } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .is("read_at", null)
        .neq("sender_id", currentUserId);

      const unreadIds = (unreadRows ?? []).map((row: any) => row.id);
      if (unreadIds.length === 0) return 0;

      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);
      return unreadIds.length;
    },
    [supabase],
  );

  const openConversation = useCallback(
    async (conversationId: string) => {
      if (!userId) return;
      if (!conversations.find((conv) => conv.id === conversationId)) {
        const conversationIds = await hydrateConversations(userId);
        ensureSubscription(conversationIds, userId);
      }
      setActiveConversationId(conversationId);

      const { data } = await supabase
        .from("messages")
        .select("id,conversation_id,sender_id,body,created_at,read_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(30);

      const messages = (data ?? []).reverse();
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: messages,
      }));

      const cleared = await markConversationRead(conversationId, userId);
      if (cleared > 0) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
          ),
        );
        setUnreadCount((prev) => Math.max(prev - cleared, 0));
      }
    },
    [
      markConversationRead,
      supabase,
      userId,
      conversations,
      ensureSubscription,
      hydrateConversations,
    ],
  );

  const closeConversation = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  const sendMessage = useCallback(
    async (conversationId: string, body: string) => {
      if (!userId) return;
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, body }),
      });
      const payload = (await res.json()) as {
        data?: Message;
        message?: string;
      };
      if (!res.ok || !payload.data) {
        throw new Error(payload.message || "Failed to send message");
      }
      const message = payload.data;
      setMessagesByConversation((prev) => {
        const current = prev[conversationId] ?? [];
        if (current.some((item) => item.id === message.id)) return prev;
        return {
          ...prev,
          [conversationId]: [...current, message],
        };
      });
    },
    [userId],
  );

  const loadOlderMessages = useCallback(
    async (conversationId: string) => {
      const current = messagesByConversation[conversationId] ?? [];
      if (current.length === 0) return;
      const oldest = current[0]?.created_at;
      if (!oldest) return;
      const { data } = await supabase
        .from("messages")
        .select("id,conversation_id,sender_id,body,created_at,read_at")
        .eq("conversation_id", conversationId)
        .lt("created_at", oldest)
        .order("created_at", { ascending: false })
        .limit(30);
      const older = (data ?? []).reverse();
      if (older.length === 0) return;
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: [...older, ...(prev[conversationId] ?? [])],
      }));
    },
    [messagesByConversation, supabase],
  );

  const refreshConversations = useCallback(async () => {
    if (!userId) return;
    const conversationIds = await hydrateConversations(userId);
    ensureSubscription(conversationIds, userId);
  }, [ensureSubscription, hydrateConversations, userId]);

  useEffect(() => {
    if (!userId) return;

    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") {
        refreshConversations();
      }
    };

    const refreshOnFocus = () => {
      refreshConversations();
    };

    document.addEventListener("visibilitychange", refreshOnVisible);
    window.addEventListener("focus", refreshOnFocus);
    window.addEventListener("pageshow", refreshOnFocus);

    return () => {
      document.removeEventListener("visibilitychange", refreshOnVisible);
      window.removeEventListener("focus", refreshOnFocus);
      window.removeEventListener("pageshow", refreshOnFocus);
    };
  }, [refreshConversations, userId]);

  const value = useMemo(
    () => ({
      loading,
      userId,
      conversations,
      activeConversationId,
      unreadCount,
      openConversation,
      closeConversation,
      messagesByConversation,
      sendMessage,
      loadOlderMessages,
      refreshConversations,
    }),
    [
      activeConversationId,
      closeConversation,
      conversations,
      loading,
      messagesByConversation,
      openConversation,
      sendMessage,
      unreadCount,
      userId,
      loadOlderMessages,
      refreshConversations,
    ],
  );

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}
