const benefits = [
  "Airport pickup",
  "Verified hosts",
  "Flexible booking",
];

const highlights = [
  {
    label: "Search flow",
    value: "Accra to Kotoka Airport",
  },
  {
    label: "Trip style",
    value: "SUV, automatic, 5 seats",
  },
  {
    label: "Trust layer",
    value: "Host approval and secure payments",
  },
];

export const socialImageAlt = "Hayame logo social preview";
export const socialImageSize = {
  width: 1200,
  height: 630,
};

export function SocialPreviewImage({ logoSrc }: { logoSrc: string }) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        padding: 30,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #ffffff 0%, #f8fbff 56%, #eef6ff 100%)",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -90,
          right: -10,
          width: 360,
          height: 360,
          borderRadius: 999,
          background: "rgba(14, 134, 212, 0.08)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -120,
          left: -70,
          width: 360,
          height: 360,
          borderRadius: 999,
          background: "rgba(14, 134, 212, 0.10)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 112,
          left: 52,
          width: 148,
          height: 148,
          borderRadius: 34,
          border: "1px solid rgba(14, 134, 212, 0.14)",
          background: "rgba(237, 246, 253, 0.95)",
          transform: "rotate(-10deg)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 66,
          bottom: 102,
          width: 176,
          height: 176,
          borderRadius: 40,
          border: "1px solid rgba(14, 134, 212, 0.14)",
          background: "rgba(255, 255, 255, 0.88)",
          transform: "rotate(10deg)",
        }}
      />

      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: 38,
          border: "1px solid rgba(168, 194, 220, 0.42)",
          background: "rgba(255, 255, 255, 0.94)",
          boxShadow: "0 30px 90px rgba(35, 76, 118, 0.14)",
          padding: "36px 42px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                width: "58%",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  borderRadius: 999,
                  background: "#edf6fd",
                  border: "1px solid #d4e7f8",
                  padding: "10px 16px",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0e86d4",
                }}
              >
                Website link preview
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 56,
                  lineHeight: 1.04,
                  fontWeight: 900,
                  letterSpacing: "-0.05em",
                  color: "#10243a",
                }}
              >
                Hayame, styled around the real brand logo.
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 23,
                  lineHeight: 1.42,
                  color: "#4d647b",
                  maxWidth: 560,
                }}
              >
                Clean white background, strong blue brand accents, and booking
                details that match the website experience.
              </div>
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
                gap: 18,
                width: "36%",
              }}
            >
              {highlights.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    borderRadius: 24,
                    border: "1px solid #dce8f4",
                    background: "#ffffff",
                    padding: "18px 20px",
                    boxShadow: "0 14px 34px rgba(37, 85, 126, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: 14,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#7b90a3",
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 22,
                      lineHeight: 1.25,
                      fontWeight: 800,
                      color: "#13273d",
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "28%",
                gap: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 270,
                  height: 270,
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
                  width="210"
                  height="210"
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
                justifyContent: "space-between",
                width: "36%",
                gap: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  borderRadius: 28,
                  background:
                    "linear-gradient(180deg, #0b1f33 0%, #12395f 100%)",
                  padding: "20px 22px",
                  color: "#ffffff",
                  boxShadow: "0 18px 40px rgba(18, 57, 95, 0.20)",
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
                        color: "rgba(255,255,255,0.70)",
                      }}
                    >
                      Featured booking
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 30,
                        fontWeight: 900,
                      }}
                    >
                      Toyota RAV4
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      borderRadius: 999,
                      background: "#f8b400",
                      padding: "8px 12px",
                      fontSize: 14,
                      fontWeight: 900,
                      color: "#112131",
                    }}
                  >
                    GHS 1,250
                  </div>
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
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.12)",
                        padding: "10px 13px",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {benefit}
                    </div>
                  ))}
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
