export type Car = {
  id: string;
  title: string;
  city: string;
  region: string;
  daily_price: number;
  rating?: number;
  reviews?: number;
  car_type?: string;
  seats?: number;
  transmission?: string;
  fuel?: string;
  features?: string[];
  description?: string;
  image_url?: string;
  host_name?: string;
  host_avatar?: string;
};

export type Booking = {
  id: string;
  car_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  total_price: number;
  created_at?: string;
};
