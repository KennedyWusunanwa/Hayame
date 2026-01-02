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
    throw new Error(payload?.message ?? "Failed to verify Paystack transaction");
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
  if (!res.ok) {
    throw new Error(payload?.message ?? "Failed to refund Paystack transaction");
  }
  return payload.data ?? payload;
}
