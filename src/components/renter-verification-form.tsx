"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, CheckCircle2, Clock, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/client-errors";

type VerificationState = {
  status: "unverified" | "pending" | "approved" | "rejected";
  required: boolean;
  canBook: boolean;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

type SlotKey = "face" | "licence-front" | "licence-back";

const SLOTS: Array<{
  key: SlotKey;
  field: "face_path" | "licence_front_path" | "licence_back_path";
  title: string;
  hint: string;
}> = [
  {
    key: "face",
    field: "face_path",
    title: "Your face",
    hint: "Look straight at the camera in good light. No sunglasses, hat or mask.",
  },
  {
    key: "licence-front",
    field: "licence_front_path",
    title: "Driving licence, front",
    hint: "Lay it flat. All four corners visible, nothing covered, text readable.",
  },
  {
    key: "licence-back",
    field: "licence_back_path",
    title: "Driving licence, back",
    hint: "Turn it over and take the same clear, flat photo of the back.",
  },
];

const MAX_SIDE = 2000;
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

/**
 * Phone cameras produce 5-12 MB photos. Scale down to something a reviewer can
 * still read comfortably so the upload works on a slow connection.
 */
async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    return blob ?? file;
  } catch {
    // Formats the browser cannot decode (some HEIC files) go up untouched.
    return file;
  }
}

function formatWhen(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function RenterVerificationForm({
  initial,
  next,
}: {
  initial: VerificationState;
  next?: string | null;
}) {
  const [state, setState] = useState<VerificationState>(initial);
  const [files, setFiles] = useState<Partial<Record<SlotKey, File>>>({});
  const [previews, setPreviews] = useState<Partial<Record<SlotKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  useEffect(
    () => () => {
      Object.values(previewsRef.current).forEach(
        (url) => url && URL.revokeObjectURL(url),
      );
    },
    [],
  );

  const refresh = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/renter-verification", { cache: "no-store" });
      const payload = (await res.json().catch(() => ({}))) as {
        data?: VerificationState;
      };
      if (res.ok && payload.data) setState(payload.data);
    } catch {
      // Keep what is on screen; the button can be pressed again.
    } finally {
      setRefreshing(false);
    }
  };

  // While a review is open, pick up the decision without a manual reload.
  useEffect(() => {
    if (state.status !== "pending") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [state.status]);

  const choose = (key: SlotKey, file: File | null) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo (JPG or PNG).");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError("That photo is too large. Please choose one under 25 MB.");
      return;
    }
    setFiles((current) => ({ ...current, [key]: file }));
    setPreviews((current) => {
      if (current[key]) URL.revokeObjectURL(current[key]!);
      return { ...current, [key]: URL.createObjectURL(file) };
    });
  };

  const allChosen = SLOTS.every((slot) => files[slot.key]);

  const submit = async () => {
    if (!allChosen || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again to continue.");

      const bucket =
        process.env.NEXT_PUBLIC_SUPABASE_HOST_ID_BUCKET || "host-ids";
      const stamp = Date.now();
      const body: Record<string, string> = {};
      for (let index = 0; index < SLOTS.length; index += 1) {
        const slot = SLOTS[index];
        setProgress(`Uploading photo ${index + 1} of ${SLOTS.length}...`);
        const blob = await compressImage(files[slot.key]!);
        const isJpeg = blob.type === "image/jpeg";
        const extension = isJpeg
          ? "jpg"
          : (files[slot.key]!.name.split(".").pop() ?? "jpg").toLowerCase();
        const path = `${user.id}/renter-${slot.key}-${stamp}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, blob, {
            cacheControl: "0",
            upsert: false,
            contentType: blob.type || "image/jpeg",
          });
        if (uploadError) {
          throw new Error(
            `We couldn't upload the "${slot.title}" photo. Check your connection and try again.`,
          );
        }
        body[slot.field] = path;
      }

      setProgress("Sending for review...");
      const res = await fetch("/api/renter-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        data?: VerificationState;
        message?: string;
      };
      if (payload.data) setState(payload.data);
      if (!res.ok && !payload.data) {
        throw new Error(payload.message ?? "Unable to submit your verification.");
      }
      setFiles({});
    } catch (err) {
      setError(friendlyError(err, "Unable to submit your verification."));
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  if (state.status === "approved" || (!state.required && state.canBook)) {
    const verified = state.status === "approved";
    return (
      <div className="space-y-4 text-sm text-gray-700">
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              {verified ? "You're verified" : "You're all set"}
            </p>
            <p>
              {verified
                ? "Your identity and driving licence are approved. You can book any car."
                : "You can book a car right now."}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={next ?? "/explore"}>
            {next ? "Back to your booking" : "Find a car"}
          </Link>
        </Button>
      </div>
    );
  }

  if (state.status === "pending") {
    const when = formatWhen(state.submittedAt);
    return (
      <div className="space-y-4 text-sm text-gray-700">
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Under review</p>
            <p>
              We have your photos{when ? ` (sent ${when})` : ""} and our team is
              checking them. This usually takes a few hours. We will email you
              the moment you can book.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refresh} disabled={refreshing}>
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {refreshing ? "Checking..." : "Check again"}
          </Button>
          <Button asChild variant="ghost">
            <Link href={next ?? "/explore"}>
              {next ? "Back to the car" : "Keep browsing"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {state.status === "rejected" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">We couldn&apos;t approve your last photos</p>
          <p>
            {state.rejectionReason?.trim() ||
              "The photos were not clear enough to verify."}{" "}
            Please send new ones below.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p>
            Three photos, about a minute. You can keep browsing while we review
            them, and you only ever do this once.
          </p>
        </div>
      )}

      <ol className="grid gap-4 sm:grid-cols-3">
        {SLOTS.map((slot, index) => {
          const preview = previews[slot.key];
          const inputId = `verify-${slot.key}`;
          return (
            <li
              key={slot.key}
              className="flex flex-col rounded-xl border border-border bg-white p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Step {index + 1}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {slot.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {slot.hint}
              </p>
              <div className="mt-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-gray-50">
                {preview ? (
                  <img
                    src={preview}
                    alt={`${slot.title} preview`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Camera className="h-7 w-7 text-gray-400" aria-hidden="true" />
                )}
              </div>
              <input
                id={inputId}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={submitting}
                onChange={(event) => {
                  choose(slot.key, event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
              <label
                htmlFor={inputId}
                className={`mt-3 inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-brand px-3 text-sm font-medium text-brand transition-colors hover:bg-brand hover:text-white focus-within:ring-2 focus-within:ring-brand ${submitting ? "pointer-events-none opacity-60" : ""}`}
              >
                {preview ? "Retake photo" : "Add photo"}
              </label>
            </li>
          );
        })}
      </ol>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={!allChosen || submitting} size="lg">
          {submitting ? (progress ?? "Sending...") : "Submit for review"}
        </Button>
        {!allChosen ? (
          <p className="text-xs text-gray-500">Add all three photos to continue.</p>
        ) : null}
      </div>
    </div>
  );
}
