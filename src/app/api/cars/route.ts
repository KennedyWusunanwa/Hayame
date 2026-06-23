import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestUser } from "@/lib/supabase/request-auth";
import { carFormSchema } from "@/lib/validators";
import { getHostStatus } from "@/lib/host-status";
import { buildListingTitle } from "@/lib/listing-title";

function parseNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value: string | null) {
  if (!value) return undefined;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return undefined;
}

function searchTokens(value: string) {
  return value
    .split(/\s+/)
    .map((token) => token.replace(/[^a-zA-Z0-9-]/g, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeSearchText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function rowMatchesSearch(row: any, tokens: string[]) {
  if (tokens.length === 0) return true;
  const haystack = normalizeSearchText(
    [
      row?.title,
      row?.description,
      row?.city,
      row?.region,
      row?.brand,
      row?.model,
      row?.car_type,
      row?.fuel_type,
      row?.transmission,
      row?.host_name,
      row?.host_level,
      row?.host_type,
      row?.year,
      row?.car_year,
      row?.instant_book ? "instant book" : "",
      row?.delivery_available ? "delivery available" : "",
      row?.air_conditioning ? "air conditioning ac" : "",
      Array.isArray(row?.features) ? row.features.join(" ") : "",
    ].join(" "),
  );
  return tokens.every((token) => haystack.includes(token));
}

const MOBILE_CAR_LIST_SELECT = [
  "id",
  "owner_id",
  "title",
  "description",
  "brand",
  "model",
  "daily_price",
  "city",
  "region",
  "latitude",
  "longitude",
  "lat",
  "lng",
  "car_type",
  "seats",
  "transmission",
  "fuel_type",
  "features",
  "year",
  "car_year",
  "delivery_fee",
  "insurance_fee",
  "deposit_amount",
  "outside_accra_fee",
  "cancellation_policy",
  "is_available",
  "instant_book",
  "delivery_available",
  "air_conditioning",
  "approval_status",
  "created_at",
  "avg_rating",
  "reviews_count",
  "favorites_count",
  "host_name",
  "host_avatar",
  "host_level",
  "host_type",
  "id_verified",
  "phone_verified",
  "email_verified",
  "image_url",
  "car_photos",
].join(",");

async function getPlatformFeePercent(supa: any) {
  const envValue = Number(
    process.env.NEXT_PUBLIC_PLATFORM_FEE_PERCENT ??
      process.env.PLATFORM_FEE_PERCENT ??
      "10",
  );
  const fallback = Number.isFinite(envValue) ? envValue : 10;
  const { data } = await supa
    .from("platform_settings")
    .select("platform_fee_percent")
    .eq("id", 1)
    .maybeSingle();
  const value = Number(data?.platform_fee_percent ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const { searchParams } = new URL(req.url);
    const mineOnly = parseBoolean(searchParams.get("mine")) === true;
    const limit = Math.min(Number(searchParams.get("limit") ?? 48), 100);
    const q = (searchParams.get("q") ?? "").trim();
    const qTokens = searchTokens(q);
    const sort = (searchParams.get("sort") ?? "").trim();
    const mobileList = parseBoolean(searchParams.get("mobile")) === true;

    let ownerId: string | null = null;
    if (mineOnly) {
      const user = await getRequestUser(supabase as any, req);
      if (!user)
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      ownerId = user.id;
    }

    let query = supa
      .from("car_search_view")
      .select(mobileList ? MOBILE_CAR_LIST_SELECT : "*")
      .limit(qTokens.length > 0 ? 1000 : Number.isFinite(limit) ? limit : 48);
    if (mineOnly) {
      query = query.eq("owner_id", ownerId);
    } else {
      query = query.eq("approval_status", "approved");
    }

    const region = searchParams.get("region");
    const city = searchParams.get("city");
    const carType = searchParams.get("carType");
    const brand = searchParams.get("brand");
    const model = searchParams.get("model");
    const fuelType = searchParams.get("fuelType");
    const transmission = searchParams.get("transmission");
    const seats = searchParams.get("seats");
    const hostType = searchParams.get("hostType");
    const minPrice = parseNumber(searchParams.get("minPrice"));
    const maxPrice = parseNumber(searchParams.get("maxPrice"));
    const minYear = parseNumber(searchParams.get("minYear"));
    const maxYear = parseNumber(searchParams.get("maxYear"));
    const minRating = parseNumber(searchParams.get("minRating"));
    const instantBook = parseBoolean(searchParams.get("instantBook"));
    const deliveryAvailable = parseBoolean(
      searchParams.get("deliveryAvailable"),
    );
    const airConditioning = parseBoolean(searchParams.get("airConditioning"));

    if (region) query = query.eq("region", region);
    if (city) query = query.eq("city", city);
    if (carType) query = query.eq("car_type", carType);
    if (brand) query = query.eq("brand", brand);
    if (model) query = query.eq("model", model);
    if (fuelType) query = query.eq("fuel_type", fuelType.toLowerCase());
    if (transmission)
      query = query.eq("transmission", transmission.toLowerCase());
    if (hostType) {
      if (hostType === "verified") {
        query = query.or("host_type.eq.verified,host_level.eq.verified_host");
      } else {
        query = query.eq("host_type", hostType);
      }
    }
    if (typeof minPrice === "number")
      query = query.gte("daily_price", minPrice);
    if (typeof maxPrice === "number")
      query = query.lte("daily_price", maxPrice);
    if (typeof minYear === "number") query = query.gte("year", minYear);
    if (typeof maxYear === "number") query = query.lte("year", maxYear);
    if (typeof minRating === "number")
      query = query.gte("avg_rating", minRating);
    if (instantBook === true) query = query.eq("instant_book", true);
    if (deliveryAvailable === true)
      query = query.eq("delivery_available", true);
    if (airConditioning === true) query = query.eq("air_conditioning", true);

    if (seats) {
      if (seats === "8+") {
        query = query.gte("seats", 8);
      } else {
        const seatsValue = Number(seats);
        if (Number.isFinite(seatsValue)) {
          query = query.eq("seats", seatsValue);
        }
      }
    }

    const featureFilters = searchParams.getAll("feature");
    for (const feature of featureFilters) {
      if (feature.trim()) {
        query = query.contains("features", [feature.trim()]);
      }
    }

    switch (sort) {
      case "price_low":
        query = query.order("daily_price", { ascending: true });
        break;
      case "price_high":
        query = query.order("daily_price", { ascending: false });
        break;
      case "most_booked":
        query = query.order("bookings_count", { ascending: false });
        break;
      case "top_rated":
        query = query.order("avg_rating", { ascending: false });
        break;
      case "new_listings":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    let { data, error } = await query;
    if (error) {
      // Backward-compatible fallback if migration view is not yet applied.
      const fallbackQuery = supa
        .from("cars")
        .select("*, car_photos(url)")
        .limit(24);
      const fallback =
        mineOnly && ownerId
          ? await fallbackQuery.eq("owner_id", ownerId)
          : await fallbackQuery.eq("approval_status", "approved");
      if (fallback.error) throw fallback.error;
      data = fallback.data;
      error = null;
    }

    const rows = (Array.isArray(data) ? data : []).filter((row: any) =>
      rowMatchesSearch(row, qTokens),
    );
    const favoriteCounts: Record<string, number> = {};
    if (mineOnly && rows.length > 0) {
      const admin = (() => {
        try {
          return createSupabaseAdminClient() as any;
        } catch {
          return null;
        }
      })();
      if (admin) {
        const carIds = rows.map((row: any) => row.id).filter(Boolean);
        if (carIds.length > 0) {
          const { data: favoriteRows } = await admin
            .from("favorites")
            .select("car_id")
            .in("car_id", carIds);
          for (const row of favoriteRows ?? []) {
            const carId = String((row as any)?.car_id ?? "");
            if (!carId) continue;
            favoriteCounts[carId] = (favoriteCounts[carId] ?? 0) + 1;
          }
        }
      }
    }

    const normalizedRows = rows
      .slice(0, Number.isFinite(limit) ? limit : 48)
      .map((row: any) => ({
        ...row,
        favorites_count: mineOnly
          ? (favoriteCounts[row?.id] ?? 0)
          : (row?.favorites_count ?? 0),
      }));

    const platformFeePercent = await getPlatformFeePercent(supa).catch(
      () => 10,
    );
    const hasInstantBookListings = normalizedRows.some(
      (row: any) => row?.instant_book === true,
    );

    return NextResponse.json(
      {
        data: normalizedRows,
        meta: {
          platform_fee_percent: platformFeePercent,
          capabilities: {
            instantBook: hasInstantBookListings,
            deliveryAvailable: true,
            transmission: true,
            fuelType: true,
            seats: true,
            year: true,
            airConditioning: true,
            rating: true,
            hostType: true,
            sorts: {
              price_low: true,
              price_high: true,
              most_booked: true,
              top_rated: true,
              new_listings: true,
            },
          },
        },
      },
      {
        headers: {
          "Cache-Control": mineOnly
            ? "private, max-age=30, stale-while-revalidate=120"
            : "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = carFormSchema.parse(body);
    const listingTitle = buildListingTitle(
      parsed.brand,
      parsed.model,
      parsed.car_year,
    );
    if (!listingTitle) {
      return NextResponse.json(
        {
          message:
            "Brand, model and year are required to generate the listing title.",
        },
        { status: 400 },
      );
    }
    const supabase = await createSupabaseServerClient();
    const supa = supabase as any;
    const user = await getRequestUser(supabase as any, req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { isHost } = await getHostStatus(supa, user.id);
    if (!isHost) {
      return NextResponse.json(
        { message: "Host approval required" },
        { status: 403 },
      );
    }

    // Ensure a profile row exists to satisfy FKs. `is_host` is intentionally
    // NOT set here — it is owned by the host-application approval flow and is
    // protected by a DB trigger (db/launch_security_hardening.sql).
    await supa.from("profiles").upsert(
      {
        id: user.id,
        full_name: (user.user_metadata as any)?.full_name ?? user.email,
      },
      { onConflict: "id" },
    );

    const hasAirConditioning =
      Boolean(parsed.air_conditioning) ||
      Boolean(
        parsed.features?.some(
          (feature) => feature.toLowerCase() === "air conditioning",
        ),
      );

    const payload = {
      ...parsed,
      title: listingTitle,
      owner_id: user.id,
      approval_status: "pending",
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
      air_conditioning: hasAirConditioning,
      delivery_fee: parsed.delivery_available
        ? (parsed.delivery_fee ?? 0)
        : null,
    };

    const { data, error } = await supa
      .from("cars")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message ?? "Failed to create car" },
      { status: 400 },
    );
  }
}
