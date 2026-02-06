export type Conversation = {
  id: string;
  host_id: string;
  user_id: string;
  car_id: string | null;
  booking_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export type ConversationSummary = Conversation & {
  otherUser: {
    id: string;
    name: string;
    avatar: string | null;
  };
  hostProfile?: {
    id: string;
    name: string;
    avatar: string | null;
    phone: string | null;
    city: string | null;
  };
  userProfile?: {
    id: string;
    name: string;
    avatar: string | null;
    phone: string | null;
    city: string | null;
  };
  carTitle?: string | null;
  carLocation?: string | null;
  unreadCount: number;
};
