// Read-only Paystack reporting for the admin Payments page: balance, totals,
// transactions, refunds and payouts. Nothing here moves money.

const PAYSTACK_BASE = "https://api.paystack.co";

export type PaystackMeta = {
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
};

export type PaystackTransaction = {
  id: number;
  status: string;
  reference: string;
  /** Minor units (pesewas). */
  amount: number;
  /** Minor units (pesewas). */
  fees: number | null;
  currency: string;
  channel: string | null;
  gateway_response: string | null;
  paid_at: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | string | null;
  customer: { id?: number; email?: string | null } | null;
  authorization: {
    brand?: string | null;
    last4?: string | null;
    bank?: string | null;
    channel?: string | null;
    card_type?: string | null;
    mobile_money_number?: string | null;
  } | null;
};

export type PaystackRefund = {
  id: number;
  status: string | null;
  amount: number;
  currency: string | null;
  transaction_reference: string | null;
  customer_note: string | null;
  merchant_note: string | null;
  created_at: string | null;
  refunded_at: string | null;
};

export type PaystackSettlement = {
  id: number;
  status: string | null;
  currency: string | null;
  total_amount: number;
  effective_amount: number | null;
  total_fees: number | null;
  total_processed: number | null;
  settlement_date: string | null;
  created_at: string | null;
};

export type PaystackTotals = {
  totalTransactions: number;
  /** Minor units, GHS. */
  totalVolume: number;
  /** Minor units, GHS: collected but not yet paid out to the bank. */
  pendingPayout: number;
};

export function isPaystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

export function isPaystackLiveMode() {
  return (process.env.PAYSTACK_SECRET_KEY ?? "").startsWith("sk_live");
}

async function paystackGet<T>(
  path: string,
  params: Record<string, string | number | undefined | null> = {},
): Promise<{ data: T; meta: PaystackMeta | null }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not set");
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const url = `${PAYSTACK_BASE}${path}${query.toString() ? `?${query}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const payload = (await res.json().catch(() => null)) as any;
  if (!res.ok || !payload || payload.status === false) {
    throw new Error(payload?.message ?? `Paystack request failed (${res.status})`);
  }
  const meta = payload.meta
    ? {
        total: Number(payload.meta.total ?? 0),
        page: Number(payload.meta.page ?? 1),
        perPage: Number(payload.meta.perPage ?? 0),
        pageCount: Number(payload.meta.pageCount ?? 0),
      }
    : null;
  return { data: payload.data as T, meta };
}

function ghsAmount(list: unknown, fallback: unknown) {
  if (Array.isArray(list)) {
    const ghs = list.find(
      (item: any) => String(item?.currency ?? "").toUpperCase() === "GHS",
    );
    if (ghs) return Number((ghs as any).amount ?? (ghs as any).balance ?? 0);
    if (list.length > 0) return 0;
  }
  return Number(fallback ?? 0);
}

/** Money available in the Paystack balance right now, in pesewas (GHS). */
export async function getPaystackBalance() {
  const { data } = await paystackGet<any[]>("/balance");
  return {
    balance: ghsAmount(
      (data ?? []).map((item) => ({ currency: item.currency, amount: item.balance })),
      0,
    ),
    currencies: (data ?? []).map((item) => ({
      currency: String(item.currency ?? ""),
      balance: Number(item.balance ?? 0),
    })),
  };
}

/** Successful volume and what is still waiting to be paid out, optionally for a period. */
export async function getPaystackTotals(range?: {
  from?: string;
  to?: string;
}): Promise<PaystackTotals> {
  const { data } = await paystackGet<any>("/transaction/totals", {
    from: range?.from,
    to: range?.to,
  });
  return {
    totalTransactions: Number(data?.total_transactions ?? 0),
    totalVolume: ghsAmount(data?.total_volume_by_currency, data?.total_volume),
    pendingPayout: ghsAmount(
      data?.pending_transfers_by_currency,
      data?.pending_transfers,
    ),
  };
}

function normalizeTransaction(raw: any): PaystackTransaction {
  return {
    id: Number(raw?.id ?? 0),
    status: String(raw?.status ?? "unknown"),
    reference: String(raw?.reference ?? ""),
    amount: Number(raw?.amount ?? 0),
    fees: raw?.fees === null || raw?.fees === undefined ? null : Number(raw.fees),
    currency: String(raw?.currency ?? "GHS"),
    channel: raw?.channel ?? null,
    gateway_response: raw?.gateway_response ?? null,
    paid_at: raw?.paid_at ?? raw?.paidAt ?? null,
    created_at: raw?.created_at ?? raw?.createdAt ?? null,
    metadata: raw?.metadata ?? null,
    customer: raw?.customer ?? null,
    authorization: raw?.authorization ?? null,
  };
}

export async function listPaystackTransactions(params: {
  page?: number;
  perPage?: number;
  status?: string;
  from?: string;
  to?: string;
}) {
  const { data, meta } = await paystackGet<any[]>("/transaction", {
    page: params.page ?? 1,
    perPage: params.perPage ?? 50,
    status: params.status,
    from: params.from,
    to: params.to,
  });
  return {
    transactions: (data ?? []).map(normalizeTransaction),
    meta,
  };
}

/**
 * Every transaction in a period, up to `maxPages` pages, for period summaries
 * and search. `truncated` is true when the period holds more than was read.
 */
export async function listAllPaystackTransactions(params: {
  status?: string;
  from?: string;
  to?: string;
  maxPages?: number;
}) {
  const perPage = 100;
  const maxPages = params.maxPages ?? 10;
  const transactions: PaystackTransaction[] = [];
  let total = 0;
  let truncated = false;
  for (let page = 1; page <= maxPages; page += 1) {
    const result = await listPaystackTransactions({ ...params, page, perPage });
    transactions.push(...result.transactions);
    total = result.meta?.total ?? transactions.length;
    const pageCount = result.meta?.pageCount ?? 1;
    if (page >= pageCount || result.transactions.length === 0) break;
    if (page === maxPages) truncated = true;
  }
  return { transactions, total, truncated };
}

export async function listPaystackRefunds(params: { page?: number; perPage?: number } = {}) {
  const { data, meta } = await paystackGet<any[]>("/refund", {
    page: params.page ?? 1,
    perPage: params.perPage ?? 50,
  });
  const refunds: PaystackRefund[] = (data ?? []).map((raw) => ({
    id: Number(raw?.id ?? 0),
    status: raw?.status ?? null,
    amount: Number(raw?.amount ?? 0),
    currency: raw?.currency ?? null,
    transaction_reference:
      raw?.transaction_reference ??
      (typeof raw?.transaction === "object" ? (raw.transaction?.reference ?? null) : null),
    customer_note: raw?.customer_note ?? null,
    merchant_note: raw?.merchant_note ?? null,
    created_at: raw?.created_at ?? raw?.createdAt ?? null,
    refunded_at: raw?.refunded_at ?? null,
  }));
  return { refunds, meta };
}

export async function listPaystackSettlements(params: { page?: number; perPage?: number } = {}) {
  const { data, meta } = await paystackGet<any[]>("/settlement", {
    page: params.page ?? 1,
    perPage: params.perPage ?? 50,
  });
  const settlements: PaystackSettlement[] = (data ?? []).map((raw) => ({
    id: Number(raw?.id ?? 0),
    status: raw?.status ?? null,
    currency: raw?.currency ?? null,
    total_amount: Number(raw?.total_amount ?? 0),
    effective_amount:
      raw?.effective_amount === undefined || raw?.effective_amount === null
        ? null
        : Number(raw.effective_amount),
    total_fees:
      raw?.total_fees === undefined || raw?.total_fees === null ? null : Number(raw.total_fees),
    total_processed:
      raw?.total_processed === undefined || raw?.total_processed === null
        ? null
        : Number(raw.total_processed),
    settlement_date: raw?.settlement_date ?? null,
    created_at: raw?.created_at ?? raw?.createdAt ?? null,
  }));
  return { settlements, meta };
}

/** Read a string out of Paystack metadata, which may arrive as an object or a JSON string. */
export function transactionMetadataValue(
  metadata: PaystackTransaction["metadata"],
  key: string,
): string | null {
  let source: any = metadata;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return null;
    }
  }
  if (!source || typeof source !== "object") return null;
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** "Mastercard •••• 5847 (Apple Pay)", "MTN mobile money", "Bank transfer". */
export function describePaymentMethod(tx: PaystackTransaction) {
  const channel = String(tx.channel ?? tx.authorization?.channel ?? "").toLowerCase();
  const auth = tx.authorization ?? {};
  const brand = String(auth.brand ?? "").trim();
  const last4 = String(auth.last4 ?? "").trim();
  const bank = String(auth.bank ?? "").trim();
  const title = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
  if (channel === "mobile_money") {
    return `${bank || "Mobile money"}${bank && !/money|momo/i.test(bank) ? " mobile money" : ""}`;
  }
  if (channel === "bank_transfer" || channel === "bank") {
    return bank ? `Bank transfer (${bank})` : "Bank transfer";
  }
  const card = brand ? `${title(brand)}${last4 ? ` •••• ${last4}` : ""}` : "";
  if (channel === "apple_pay") return card ? `${card} (Apple Pay)` : "Apple Pay";
  if (channel === "card") return card || "Card";
  if (!channel) return card || "Unknown";
  return card ? `${card} (${title(channel.replace(/_/g, " "))})` : title(channel.replace(/_/g, " "));
}
