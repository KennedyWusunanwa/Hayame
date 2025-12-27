export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          city: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          city?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          city?: string | null;
          created_at?: string | null;
        };
      };
      locations: {
        Row: {
          id: number;
          city: string;
          region: string | null;
          lat: number | null;
          lng: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          city: string;
          region?: string | null;
          lat?: number | null;
          lng?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          city?: string;
          region?: string | null;
          lat?: number | null;
          lng?: number | null;
          created_at?: string | null;
        };
      };
      cars: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          daily_price: number;
          city: string | null;
          region: string | null;
          location_id: number | null;
          car_type: string | null;
          seats: number | null;
          transmission: string | null;
          fuel: string | null;
          features: string[] | null;
          is_available: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          daily_price: number;
          city?: string | null;
          region?: string | null;
          location_id?: number | null;
          car_type?: string | null;
          seats?: number | null;
          transmission?: string | null;
          fuel?: string | null;
          features?: string[] | null;
          is_available?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          daily_price?: number;
          city?: string | null;
          region?: string | null;
          location_id?: number | null;
          car_type?: string | null;
          seats?: number | null;
          transmission?: string | null;
          fuel?: string | null;
          features?: string[] | null;
          is_available?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      car_photos: {
        Row: {
          id: string;
          car_id: string;
          url: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          car_id: string;
          url: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          car_id?: string;
          url?: string;
          created_at?: string | null;
        };
      };
      favorites: {
        Row: {
          user_id: string;
          car_id: string;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          car_id: string;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          car_id?: string;
          created_at?: string | null;
        };
      };
      bookings: {
        Row: {
          id: string;
          car_id: string;
          renter_id: string;
          start_date: string;
          end_date: string;
          status: Database["public"]["Enums"]["booking_status"];
          total_price: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          car_id: string;
          renter_id: string;
          start_date: string;
          end_date: string;
          status?: Database["public"]["Enums"]["booking_status"];
          total_price?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          car_id?: string;
          renter_id?: string;
          start_date?: string;
          end_date?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          total_price?: number | null;
          created_at?: string | null;
        };
      };
      car_availability: {
        Row: {
          id: string;
          car_id: string;
          start_date: string;
          end_date: string;
          available: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          car_id: string;
          start_date: string;
          end_date: string;
          available?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          car_id?: string;
          start_date?: string;
          end_date?: string;
          available?: boolean | null;
          created_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          car_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          booking_id: string;
          car_id: string;
          user_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          booking_id?: string;
          car_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string | null;
        };
      };
    };
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "completed";
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
