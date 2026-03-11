import { POST as finalizeBookingPaystack } from "@/app/api/bookings/paystack/route";

export async function POST(req: Request) {
  return finalizeBookingPaystack(req);
}
