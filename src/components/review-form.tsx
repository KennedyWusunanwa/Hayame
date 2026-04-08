"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type ReviewableBooking = {
  id: string;
  label: string;
};

type ReviewFormProps = {
  carId: string;
  bookings: ReviewableBooking[];
  disabled?: boolean;
  disabledMessage?: string;
};

export function ReviewForm({
  carId,
  bookings,
  disabled = false,
  disabledMessage,
}: ReviewFormProps) {
  const router = useRouter();
  const defaultBookingId = useMemo(() => bookings[0]?.id ?? "", [bookings]);
  const [bookingId, setBookingId] = useState(defaultBookingId);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const isLocked = disabled || loading;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    setError(null);
    setSuccess(false);

    if (!bookingId) {
      setError("Select the trip you want to review.");
      return;
    }
    if (!rating) {
      setError("Choose a rating before submitting.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rating,
          comment: comment.trim() ? comment.trim() : undefined,
          carId,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message ?? "Unable to submit review.");
      }
      setComment("");
      setRating(0);
      setSuccess(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Unable to submit review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-semibold text-foreground">Trip</label>
        <select
          className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          value={bookingId}
          onChange={(event) => setBookingId(event.target.value)}
          disabled={isLocked || bookings.length === 0}
        >
          {bookings.length === 0 ? (
            <option value="">No completed trips yet</option>
          ) : (
            bookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                {booking.label}
              </option>
            ))
          )}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">Rating</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={
                value <= rating
                  ? "rounded-full border border-brand bg-brand px-4 py-1 text-sm font-semibold text-white"
                  : "rounded-full border border-border bg-white px-4 py-1 text-sm font-semibold text-gray-700 hover:border-brand hover:text-brand"
              }
              onClick={() => setRating(value)}
              disabled={isLocked}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">Comment</label>
        <Textarea
          className="mt-2"
          rows={4}
          placeholder="Share how the pickup, cleanliness, and communication went."
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          disabled={isLocked}
        />
      </div>

      {disabledMessage && disabled ? (
        <p className="text-sm text-gray-600">{disabledMessage}</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? (
        <p className="text-sm text-emerald-600">Thanks! Your review is live.</p>
      ) : null}

      <Button type="submit" disabled={isLocked}>
        {loading ? "Submitting..." : "Submit review"}
      </Button>
    </form>
  );
}
