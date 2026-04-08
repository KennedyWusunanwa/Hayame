import { ImageResponse } from "next/og";

export const alt = "Hayame homepage preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(180deg, #f8fbff 0%, #ffffff 48%, #f4f7fb 100%)",
          color: "#0b1220",
          padding: "46px 54px",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                height: 54,
                width: 54,
                borderRadius: 18,
                background: "#0e86d4",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              H
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  fontWeight: 800,
                }}
              >
                Hayame
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#47607f",
                }}
              >
                Ghana car sharing
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              color: "#4d657f",
              fontSize: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                borderRadius: 999,
                border: "1px solid #d6e3f0",
                padding: "10px 18px",
                background: "rgba(255,255,255,0.75)",
              }}
            >
              Explore cars
            </div>
            <div
              style={{
                display: "flex",
                borderRadius: 999,
                border: "1px solid #d6e3f0",
                padding: "10px 18px",
                background: "rgba(255,255,255,0.75)",
              }}
            >
              Become a host
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "58%",
              gap: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                borderRadius: 999,
                background: "rgba(14, 134, 212, 0.1)",
                color: "#0e86d4",
                padding: "10px 16px",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              Site snapshot for link previews
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 60,
                lineHeight: 1.05,
                fontWeight: 900,
                letterSpacing: "-0.04em",
              }}
            >
              Rent trusted cars in Ghana, straight from a real marketplace.
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 24,
                lineHeight: 1.45,
                color: "#42526e",
                maxWidth: 620,
              }}
            >
              Airport pickup, verified hosts, flexible booking windows, and a
              clean admin-backed platform built for Accra and beyond.
            </div>

            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 6,
              }}
            >
              {[
                "Airport delivery",
                "Verified hosts",
                "Instant booking flow",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 999,
                    border: "1px solid #d7e2ed",
                    background: "white",
                    padding: "12px 18px",
                    fontSize: 18,
                    color: "#2d435b",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "42%",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: 28,
                background:
                  "linear-gradient(180deg, rgba(11,18,32,0.98) 0%, rgba(13,34,61,0.94) 100%)",
                padding: 24,
                boxShadow: "0 24px 70px rgba(13, 37, 63, 0.22)",
                color: "white",
                gap: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: 15,
                      color: "rgba(255,255,255,0.72)",
                    }}
                  >
                    Homepage search
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 28,
                      fontWeight: 800,
                    }}
                  >
                    Accra SUV rentals
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    borderRadius: 999,
                    background: "#f8b400",
                    color: "#0b1220",
                    padding: "8px 14px",
                    fontSize: 16,
                    fontWeight: 800,
                  }}
                >
                  Live
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  borderRadius: 22,
                  background: "rgba(255,255,255,0.09)",
                  padding: "16px 18px",
                  color: "rgba(255,255,255,0.95)",
                  fontSize: 18,
                }}
              >
                Kotoka Airport • Apr 12–16 • Automatic • 5 seats
              </div>

              {[
                {
                  title: "Toyota RAV4",
                  price: "GHS 1,250 / trip",
                  meta: "4.9 rating • Airport pickup",
                },
                {
                  title: "Hyundai Tucson",
                  price: "GHS 980 / trip",
                  meta: "Verified host • Flexible return",
                },
              ].map((car) => (
                <div
                  key={car.title}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderRadius: 22,
                    background: "white",
                    padding: "18px 20px",
                    color: "#0b1220",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        fontSize: 24,
                        fontWeight: 800,
                      }}
                    >
                      {car.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 16,
                        color: "#55657b",
                      }}
                    >
                      {car.meta}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      borderRadius: 18,
                      background: "#edf6fd",
                      padding: "12px 14px",
                      fontSize: 17,
                      fontWeight: 800,
                      color: "#0e86d4",
                    }}
                  >
                    {car.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#55708d",
            fontSize: 18,
            borderTop: "1px solid #deebf5",
            paddingTop: 22,
          }}
        >
          <div style={{ display: "flex" }}>
            www.hayamegh.com
          </div>
          <div style={{ display: "flex" }}>
            Share preview image
          </div>
        </div>
      </div>
    ),
    size,
  );
}
