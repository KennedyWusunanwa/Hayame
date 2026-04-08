const benefits = [
  "Airport pickup in Accra",
  "Verified hosts",
  "Flexible booking",
  "Pay with Mobile Money",
];

const quickFacts = [
  {
    label: "Popular trips",
    value: "Accra, Kumasi, and airport runs",
  },
  {
    label: "Vehicle types",
    value: "SUVs, sedans, and everyday cars",
  },
];

export const socialImageAlt = "Hayame Ghana car rental social preview";
export const socialImageSize = {
  width: 1200,
  height: 630,
};

export function SocialPreviewImage({
  logoSrc,
  carSrc,
}: {
  logoSrc: string;
  carSrc: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        padding: 28,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #ffffff 0%, #f7fbff 55%, #edf6fd 100%)",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -100,
          right: -40,
          width: 320,
          height: 320,
          borderRadius: 999,
          background: "rgba(14, 134, 212, 0.08)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -140,
          left: -80,
          width: 380,
          height: 380,
          borderRadius: 999,
          background: "rgba(14, 134, 212, 0.10)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 88,
          left: 420,
          width: 140,
          height: 140,
          borderRadius: 34,
          border: "1px solid rgba(14, 134, 212, 0.14)",
          background: "rgba(237, 246, 253, 0.95)",
          transform: "rotate(-14deg)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 98,
          bottom: 72,
          width: 156,
          height: 156,
          borderRadius: 40,
          border: "1px solid rgba(14, 134, 212, 0.12)",
          background: "rgba(255,255,255,0.88)",
          transform: "rotate(12deg)",
        }}
      />

      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 38,
          border: "1px solid rgba(168, 194, 220, 0.44)",
          background: "rgba(255,255,255,0.95)",
          boxShadow: "0 30px 90px rgba(35, 76, 118, 0.14)",
          padding: "34px 38px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                borderRadius: 999,
                background: "#edf6fd",
                border: "1px solid #d4e7f8",
                padding: "10px 16px",
                fontSize: 15,
                fontWeight: 800,
                color: "#0e86d4",
              }}
            >
              Rent cars across Ghana.
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  borderRadius: 999,
                  background: "#ffffff",
                  border: "1px solid #d9e7f4",
                  padding: "10px 16px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#5c748d",
                }}
              >
                www.hayamegh.com
              </div>
              <div
                style={{
                  display: "flex",
                  borderRadius: 999,
                  background: "#0e86d4",
                  padding: "10px 16px",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                Book now
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 28,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "38%",
                gap: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 58,
                  lineHeight: 1.04,
                  fontWeight: 900,
                  letterSpacing: "-0.05em",
                  color: "#10243a",
                }}
              >
                Rent a Car, Anytime, Anywhere in Ghana.
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  lineHeight: 1.42,
                  color: "#4d647b",
                }}
              >
                Discover trusted cars for city rides, airport pickups, weekend
                trips, and everyday bookings with verified hosts across Ghana.
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {benefits.map((benefit) => (
                  <div
                    key={benefit}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      borderRadius: 999,
                      background: "#ffffff",
                      border: "1px solid #dbe8f4",
                      padding: "10px 14px",
                      fontSize: 14,
                      fontWeight: 800,
                      color: benefit === "Pay with Mobile Money" ? "#0e86d4" : "#24415d",
                      boxShadow: "0 10px 24px rgba(37, 85, 126, 0.06)",
                    }}
                  >
                    {benefit}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                }}
              >
                {quickFacts.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      flex: 1,
                      flexDirection: "column",
                      gap: 6,
                      borderRadius: 24,
                      border: "1px solid #dce8f4",
                      background: "#ffffff",
                      padding: "18px 18px",
                      boxShadow: "0 14px 34px rgba(37, 85, 126, 0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        fontSize: 13,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#8094a7",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 20,
                        lineHeight: 1.3,
                        fontWeight: 800,
                        color: "#13273d",
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "26%",
                gap: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 260,
                  height: 260,
                  borderRadius: 999,
                  background:
                    "radial-gradient(circle at center, #ffffff 0%, #f5faff 60%, #e6f3ff 100%)",
                  border: "1px solid rgba(14, 134, 212, 0.18)",
                  boxShadow: "0 18px 45px rgba(14, 134, 212, 0.14)",
                }}
              >
                <img
                  src={logoSrc}
                  alt="Hayame logo"
                  width="208"
                  height="208"
                  style={{
                    objectFit: "contain",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  borderRadius: 999,
                  background: "#eef7ff",
                  border: "1px solid #d5e8f8",
                  padding: "10px 16px",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0e86d4",
                }}
              >
                Ghana car sharing marketplace
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "36%",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  borderRadius: 28,
                  background: "#ffffff",
                  border: "1px solid #dce8f4",
                  padding: "18px",
                  boxShadow: "0 18px 40px rgba(18, 57, 95, 0.14)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
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
                        fontWeight: 700,
                        color: "#6d8295",
                      }}
                    >
                      Featured car
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 30,
                        fontWeight: 900,
                        color: "#10243a",
                      }}
                    >
                      Mercedes-Benz GLE 2026
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      borderRadius: 999,
                      background: "#0e86d4",
                      padding: "8px 12px",
                      fontSize: 14,
                      fontWeight: 900,
                      color: "#ffffff",
                    }}
                  >
                    GHS 1,250
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    overflow: "hidden",
                    borderRadius: 24,
                    height: 200,
                    border: "1px solid #dbe7f4",
                    background: "#e9f4fd",
                  }}
                >
                  <img
                    src={carSrc}
                    alt="Mercedes-Benz GLE 2026"
                    width="420"
                    height="240"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      borderRadius: 999,
                      background: "#edf7ff",
                      padding: "10px 13px",
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#0e86d4",
                    }}
                  >
                    Pay with Mobile Money
                  </div>
                  <div
                    style={{
                      display: "flex",
                      borderRadius: 999,
                      background: "#f7fafc",
                      padding: "10px 13px",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#50677d",
                    }}
                  >
                    Airport pickup available
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                }}
              >
                {[
                  { label: "Preview", value: "Brand-led" },
                  { label: "Format", value: "1200 x 630" },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: "flex",
                      flex: 1,
                      flexDirection: "column",
                      gap: 6,
                      borderRadius: 22,
                      border: "1px solid #dbe7f3",
                      background: "#ffffff",
                      padding: "18px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        fontSize: 13,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#8498aa",
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 24,
                        fontWeight: 900,
                        color: "#152941",
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
