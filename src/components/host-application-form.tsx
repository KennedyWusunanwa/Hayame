"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type HostApplicationFormProps = {
  disabled?: boolean;
  initialStatus?: "pending" | "approved" | "rejected" | null;
  initialReason?: string | null;
};

export function HostApplicationForm({
  disabled = false,
  initialStatus = null,
  initialReason = null,
}: HostApplicationFormProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [fleetSize, setFleetSize] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    setError(null);
    setSuccess(false);

    try {
      setLoading(true);
      const res = await fetch("/api/host-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone || undefined,
          city: city || undefined,
          experience,
          fleet_size: fleetSize ? Number(fleetSize) : undefined,
          message: message || undefined,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message ?? "Unable to submit application.");
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message ?? "Unable to submit application.");
    } finally {
      setLoading(false);
    }
  };

  const isLocked = disabled || loading;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {initialStatus === "rejected" && initialReason ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Previous application rejected: {initialReason}
        </p>
      ) : null}
      {initialStatus === "pending" ? (
        <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Your application is under review. We will notify you once it is approved.
        </p>
      ) : null}

      <div>
        <label className="text-sm font-semibold text-foreground">Full name</label>
        <input
          className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={isLocked}
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-foreground">Phone</label>
          <input
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={isLocked}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">City</label>
          <input
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            disabled={isLocked}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">Hosting experience</label>
        <Textarea
          className="mt-2"
          rows={4}
          value={experience}
          onChange={(event) => setExperience(event.target.value)}
          placeholder="Tell us about your driving/hosting experience and the kind of cars you want to list."
          disabled={isLocked}
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-foreground">Fleet size</label>
          <input
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            value={fleetSize}
            onChange={(event) => setFleetSize(event.target.value)}
            disabled={isLocked}
            type="number"
            min={0}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Notes</label>
          <input
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={isLocked}
            placeholder="Anything else to share?"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">Application submitted successfully.</p> : null}

      <Button type="submit" disabled={isLocked}>
        {loading ? "Submitting..." : "Submit application"}
      </Button>
    </form>
  );
}
