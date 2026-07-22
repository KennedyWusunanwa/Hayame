"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { friendlyError } from "@/lib/client-errors";

type FormState = {
  company: string;
  email: string;
  message: string;
  name: string;
  phone: string;
};

const initialState: FormState = {
  company: "",
  email: "",
  message: "",
  name: "",
  phone: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateField =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitted(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(
          payload.message ?? "We could not send your message right now.",
        );
      }
      setSubmitted(true);
      setForm(initialState);
    } catch (submissionError) {
      setError(friendlyError(submissionError, "Unable to send message."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <Input
        placeholder="Your name"
        value={form.name}
        onChange={updateField("name")}
        required
      />
      <Input
        placeholder="Email"
        type="email"
        value={form.email}
        onChange={updateField("email")}
        required
      />
      <Input
        placeholder="Phone number (optional)"
        value={form.phone}
        onChange={updateField("phone")}
      />
      <Textarea
        placeholder="How can we help?"
        rows={5}
        value={form.message}
        onChange={updateField("message")}
        required
      />
      <input
        aria-hidden="true"
        autoComplete="off"
        className="hidden"
        name="company"
        tabIndex={-1}
        value={form.company}
        onChange={updateField("company")}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {submitted ? (
        <p className="text-sm text-emerald-700">
          Message sent. We will reply within one business day.
        </p>
      ) : null}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Sending..." : "Submit"}
      </Button>
    </form>
  );
}
