const PAYSTACK_BASE = "https://api.paystack.co";

function getSecretKey() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is not set");
  }
  return secret;
}

export async function verifyPaystackTransaction(reference: string) {
  const secret = getSecretKey();
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
  });
  const payload = (await res.json()) as any;
  if (!res.ok || payload?.data?.status !== "success") {
    throw new Error(
      payload?.message ?? "Failed to verify Paystack transaction",
    );
  }
  return payload.data;
}

export async function initializePaystackTransaction(params: {
  email: string;
  amount: number;
  reference: string;
  callback_url?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}) {
  const secret = getSecretKey();
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      currency: params.currency ?? "GHS",
      callback_url: params.callback_url,
      metadata: params.metadata,
    }),
  });
  const payload = (await res.json()) as any;
  if (!res.ok || payload?.status === false) {
    throw new Error(
      payload?.message ?? "Failed to initialize Paystack transaction",
    );
  }
  if (!payload?.data?.authorization_url || !payload?.data?.reference) {
    throw new Error("Paystack initialize response missing checkout URL");
  }
  return payload.data;
}

export async function refundPaystack(reference: string) {
  const secret = getSecretKey();
  const res = await fetch(`${PAYSTACK_BASE}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    // Paystack expects `transaction` (can be transaction ID or reference string)
    body: JSON.stringify({ transaction: reference }),
  });
  const payload = (await res.json()) as any;
  const message = String(payload?.message ?? "");
  const loweredMessage = message.toLowerCase();
  const alreadyRefunded =
    loweredMessage.includes("already") && loweredMessage.includes("refund");

  if (!res.ok || payload?.status === false) {
    if (!alreadyRefunded) {
      throw new Error(message || "Failed to refund Paystack transaction");
    }
  }
  return payload.data ?? payload;
}
