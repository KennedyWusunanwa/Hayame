import { ImageResponse } from "next/og";
import { getSocialPreviewLogoSrc } from "@/lib/social-preview-logo";
import { createSupabasePublicClient } from "@/lib/supabase/public";

export const runtime = "nodejs";
export const alt = "Hayame vehicle listing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: { id: string } | Promise<{ id: string }>;
};

export default async function ListingOpenGraphImage({ params }: Props) {
  const { id } = await params;
  const listing = await loadListingPreview(id);
  const logoSrc = await getSocialPreviewLogoSrc();

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        alignItems: "flex-end",
        background: "#07325c",
        color: "white",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {listing?.image ? (
        <img
          src={listing.image}
          alt=""
          width="1200"
          height="630"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : null}

      <div
        style={{
          display: "flex",
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(3, 22, 42, 0.02) 30%, rgba(3, 22, 42, 0.9) 100%)",
        }}
      />

      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "0 48px 44px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxWidth: 820,
          }}
        >
          <div style={{ display: "flex", fontSize: 54, fontWeight: 800 }}>
            {listing?.title ?? "Vehicle listing on Hayame"}
          </div>
          {listing?.location ? (
            <div style={{ display: "flex", fontSize: 26, opacity: 0.9 }}>
              {listing.location}
            </div>
          ) : null}
        </div>

        <img
          src={logoSrc}
          alt="Hayame"
          width="230"
          height="120"
          style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
        />
      </div>
    </div>,
    size,
  );
}

async function loadListingPreview(id: string) {
  try {
    const supabase = createSupabasePublicClient() as any;
    const { data } = await supabase
      .from("cars")
      .select("title,city,region,approval_status,car_photos(url)")
      .eq("id", id)
      .eq("approval_status", "approved")
      .maybeSingle();

    if (!data) return null;
    return {
      title: String(data.title || "Vehicle listing on Hayame"),
      location: [data.city, data.region].filter(Boolean).join(", "),
      image: data.car_photos?.[0]?.url
        ? String(data.car_photos[0].url)
        : null,
    };
  } catch {
    return null;
  }
}
