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
          first_name: string | null;
          last_name: string | null;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          region: string | null;
          city: string | null;
          is_host: boolean | null;
          host_approved_at: string | null;
          id_verified: boolean | null;
          phone_verified: boolean | null;
          email_verified: boolean | null;
          host_level: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          region?: string | null;
          city?: string | null;
          is_host?: boolean | null;
          host_approved_at?: string | null;
          id_verified?: boolean | null;
          phone_verified?: boolean | null;
          email_verified?: boolean | null;
          host_level?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          region?: string | null;
          city?: string | null;
          is_host?: boolean | null;
          host_approved_at?: string | null;
          id_verified?: boolean | null;
          phone_verified?: boolean | null;
          email_verified?: boolean | null;
          host_level?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      host_applications: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string | null;
          region: string | null;
          city: string | null;
          id_type: string | null;
          id_number: string | null;
          id_front_path: string | null;
          id_back_path: string | null;
          note: string | null;
          experience: string | null;
          fleet_size: number | null;
          status: Database["public"]["Enums"]["host_application_status"];
          submitted_at: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone?: string | null;
          region?: string | null;
          city?: string | null;
          id_type?: string | null;
          id_number?: string | null;
          id_front_path?: string | null;
          id_back_path?: string | null;
          note?: string | null;
          experience?: string | null;
          fleet_size?: number | null;
          status?: Database["public"]["Enums"]["host_application_status"];
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string | null;
          region?: string | null;
          city?: string | null;
          id_type?: string | null;
          id_number?: string | null;
          id_front_path?: string | null;
          id_back_path?: string | null;
          note?: string | null;
          experience?: string | null;
          fleet_size?: number | null;
          status?: Database["public"]["Enums"]["host_application_status"];
          submitted_at?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      admin_actions: {
        Row: {
          id: string;
          action: string;
          target_id: string | null;
          target_type: string | null;
          metadata: Json | null;
          performed_by: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          action: string;
          target_id?: string | null;
          target_type?: string | null;
          metadata?: Json | null;
          performed_by?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          action?: string;
          target_id?: string | null;
          target_type?: string | null;
          metadata?: Json | null;
          performed_by?: string | null;
          created_at?: string | null;
        };
      };
      gh_regions: {
        Row: {
          id: number;
          name: string;
        };
        Insert: {
          id?: number;
          name: string;
        };
        Update: {
          id?: number;
          name?: string;
        };
      };
      gh_districts: {
        Row: {
          id: number;
          region_id: number;
          name: string;
          capital: string | null;
          category: string | null;
          established_year: number | null;
        };
        Insert: {
          id?: number;
          region_id: number;
          name: string;
          capital?: string | null;
          category?: string | null;
          established_year?: number | null;
        };
        Update: {
          id?: number;
          region_id?: number;
          name?: string;
          capital?: string | null;
          category?: string | null;
          established_year?: number | null;
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
          outside_accra_fee: number | null;
          car_type: string | null;
          brand: string | null;
          model: string | null;
          seats: number | null;
          transmission: string | null;
          fuel: string | null;
          fuel_type: string | null;
          car_year: number | null;
          features: string[] | null;
          is_available: boolean | null;
          instant_book: boolean | null;
          delivery_available: boolean | null;
          air_conditioning: boolean | null;
          delivery_fee: number | null;
          insurance_fee: number | null;
          deposit_amount: number | null;
          cancellation_policy: string | null;
          approval_status: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
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
          outside_accra_fee?: number | null;
          car_type?: string | null;
          brand?: string | null;
          model?: string | null;
          seats?: number | null;
          transmission?: string | null;
          fuel?: string | null;
          fuel_type?: string | null;
          car_year?: number | null;
          features?: string[] | null;
          is_available?: boolean | null;
          instant_book?: boolean | null;
          delivery_available?: boolean | null;
          air_conditioning?: boolean | null;
          delivery_fee?: number | null;
          insurance_fee?: number | null;
          deposit_amount?: number | null;
          cancellation_policy?: string | null;
          approval_status?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
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
          outside_accra_fee?: number | null;
          car_type?: string | null;
          brand?: string | null;
          model?: string | null;
          seats?: number | null;
          transmission?: string | null;
          fuel?: string | null;
          fuel_type?: string | null;
          car_year?: number | null;
          features?: string[] | null;
          is_available?: boolean | null;
          instant_book?: boolean | null;
          delivery_available?: boolean | null;
          air_conditioning?: boolean | null;
          delivery_fee?: number | null;
          insurance_fee?: number | null;
          deposit_amount?: number | null;
          cancellation_policy?: string | null;
          approval_status?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
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
          trip_use_region: string | null;
          trip_use_city: string | null;
          trip_use_address: string | null;
          trip_outside_accra: boolean | null;
          trip_outside_listing_region: boolean | null;
          outside_accra_surcharge: number | null;
          nights: number | null;
          daily_rate: number | null;
          subtotal: number | null;
          platform_fee: number | null;
          insurance_fee: number | null;
          delivery_fee: number | null;
          deposit_amount: number | null;
          total_price: number | null;
          payment_status: string | null;
          payment_reference: string | null;
          payment_provider: string | null;
          paid_at: string | null;
          hold_expires_at: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          refund_reference: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          car_id: string;
          renter_id: string;
          start_date: string;
          end_date: string;
          status?: Database["public"]["Enums"]["booking_status"];
          trip_use_region?: string | null;
          trip_use_city?: string | null;
          trip_use_address?: string | null;
          trip_outside_accra?: boolean | null;
          trip_outside_listing_region?: boolean | null;
          outside_accra_surcharge?: number | null;
          nights?: number | null;
          daily_rate?: number | null;
          subtotal?: number | null;
          platform_fee?: number | null;
          insurance_fee?: number | null;
          delivery_fee?: number | null;
          deposit_amount?: number | null;
          total_price?: number | null;
          payment_status?: string | null;
          payment_reference?: string | null;
          payment_provider?: string | null;
          paid_at?: string | null;
          hold_expires_at?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          refund_reference?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          car_id?: string;
          renter_id?: string;
          start_date?: string;
          end_date?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          trip_use_region?: string | null;
          trip_use_city?: string | null;
          trip_use_address?: string | null;
          trip_outside_accra?: boolean | null;
          trip_outside_listing_region?: boolean | null;
          outside_accra_surcharge?: number | null;
          nights?: number | null;
          daily_rate?: number | null;
          subtotal?: number | null;
          platform_fee?: number | null;
          insurance_fee?: number | null;
          delivery_fee?: number | null;
          deposit_amount?: number | null;
          total_price?: number | null;
          payment_status?: string | null;
          payment_reference?: string | null;
          payment_provider?: string | null;
          paid_at?: string | null;
          hold_expires_at?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          refund_reference?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
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
          is_hidden: boolean | null;
          moderated_at: string | null;
          moderated_by: string | null;
          moderation_reason: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          booking_id: string;
          car_id: string;
          user_id: string;
          rating: number;
          comment?: string | null;
          is_hidden?: boolean | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_reason?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          booking_id?: string;
          car_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string | null;
          is_hidden?: boolean | null;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_reason?: string | null;
          created_at?: string | null;
        };
      };
      platform_settings: {
        Row: {
          id: number;
          platform_fee_percent: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          platform_fee_percent?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          platform_fee_percent?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      listing_views: {
        Row: {
          id: string;
          car_id: string;
          viewer_id: string | null;
          session_key: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          car_id: string;
          viewer_id?: string | null;
          session_key?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          car_id?: string;
          viewer_id?: string | null;
          session_key?: string | null;
          created_at?: string | null;
        };
      };
      disputes: {
        Row: {
          id: string;
          booking_id: string;
          car_id: string;
          opened_by: string;
          reason: string;
          status: string;
          resolution_note: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          booking_id: string;
          car_id: string;
          opened_by: string;
          reason: string;
          status?: string;
          resolution_note?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          booking_id?: string;
          car_id?: string;
          opened_by?: string;
          reason?: string;
          status?: string;
          resolution_note?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Enums: {
      host_application_status: "pending" | "approved" | "rejected";
      booking_status:
        | "pending"
        | "awaiting_host"
        | "confirmed"
        | "rejected"
        | "cancelled"
        | "completed"
        | "refunded";
    };
    Views: {
      car_search_view: {
        Row: {
          id: string | null;
          owner_id: string | null;
          title: string | null;
          description: string | null;
          daily_price: number | null;
          city: string | null;
          region: string | null;
          car_type: string | null;
          brand: string | null;
          model: string | null;
          seats: number | null;
          transmission: string | null;
          fuel_type: string | null;
          features: string[] | null;
          is_available: boolean | null;
          instant_book: boolean | null;
          delivery_available: boolean | null;
          air_conditioning: boolean | null;
          year: number | null;
          car_year: number | null;
          delivery_fee: number | null;
          insurance_fee: number | null;
          deposit_amount: number | null;
          outside_accra_fee: number | null;
          cancellation_policy: string | null;
          approval_status: string | null;
          created_at: string | null;
          updated_at: string | null;
          avg_rating: number | null;
          reviews_count: number | null;
          bookings_count: number | null;
          trips_count: number | null;
          host_name: string | null;
          host_avatar: string | null;
          id_verified: boolean | null;
          phone_verified: boolean | null;
          email_verified: boolean | null;
          host_level: string | null;
          host_type: string | null;
          image_url: string | null;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
