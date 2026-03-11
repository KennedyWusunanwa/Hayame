import { POST as createBookingHold } from "@/app/api/bookings/hold/route";

export async function POST(req: Request) {
  return createBookingHold(req);
}
