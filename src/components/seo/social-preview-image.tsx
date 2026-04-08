const featuredCars = [
  {
    name: "Toyota RAV4",
    details: "Airport pickup - Verified host",
    price: "GHS 1,250",
    rating: "4.9",
  },
  {
    name: "Hyundai Tucson",
    details: "Flexible return - Instant booking",
    price: "GHS 980",
    rating: "4.8",
  },
];

const metrics = [
  { label: "Cars listed", value: "120+" },
  { label: "Bookings", value: "2.4k" },
  { label: "Approved hosts", value: "80+" },
];

const filters = ["Greater Accra", "SUV", "Apr 12 - 16", "Automatic"];

export const socialImageAlt = "Hayame website preview";
export const socialImageSize = {
  width: 1200,
  height: 630,
};

export function SocialPreviewImage() {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        padding: 28,
        background:
          "linear-gradient(135deg, #dbeafe 0%, #eef6ff 38%, #f8fbff 100%)",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 32,
          right: 72,
          width: 220,
          height: 220,
          borderRadius: 999,
          background: "rgba(14, 134, 212, 0.12)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -60,
          left: -20,
          width: 300,
          height: 300,
          borderRadius: 999,
          background: "rgba(11, 31, 51, 0.08)",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: 34,
          border: "1px solid rgba(117, 143, 173, 0.22)",
          background: "#ffffff",
          boxShadow: "0 26px 80px rgba(15, 45, 84, 0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            borderBottom: "1px solid #e5eef7",
            background: "rgba(250, 252, 255, 0.96)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {["#ff5f57", "#febc2e", "#28c840"].map((dot) => (
              <div
                key={dot}
                style={{
                  display: "flex",
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: dot,
                }}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 360,
              borderRadius: 999,
              border: "1px solid #dbe7f3",
              background: "#ffffff",
              padding: "10px 24px",
              fontSize: 17,
              fontWeight: 600,
              color: "#36516c",
            }}
          >
            www.hayamegh.com
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                background: "#eef6ff",
                padding: "10px 16px",
                fontSize: 15,
                fontWeight: 700,
                color: "#0e86d4",
              }}
            >
              Share preview
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                background: "#0e86d4",
                padding: "10px 16px",
                fontSize: 15,
                fontWeight: 700,
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
            flex: 1,
            padding: 22,
            gap: 20,
            background:
              "linear-gradient(180deg, rgba(250, 252, 255, 0.92) 0%, rgba(245, 248, 252, 0.96) 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "60%",
              borderRadius: 28,
              padding: 26,
              justifyContent: "space-between",
              background:
                "linear-gradient(155deg, rgba(8, 16, 27, 0.96) 0%, rgba(10, 34, 58, 0.93) 52%, rgba(13, 72, 116, 0.90) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              color: "#ffffff",
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
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 44,
                    height: 44,
                    borderRadius: 16,
                    background: "#0e86d4",
                    fontSize: 24,
                    fontWeight: 900,
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
                      fontSize: 24,
                      fontWeight: 800,
                    }}
                  >
                    Hayame
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "rgba(255,255,255,0.62)",
                    }}
                  >
                    Ghana car sharing
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.12)",
                    padding: "9px 14px",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Explore cars
                </div>
                <div
                  style={{
                    display: "flex",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.12)",
                    padding: "9px 14px",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  Become a host
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                maxWidth: 520,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.14)",
                  padding: "9px 14px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#bfe5ff",
                }}
              >
                Real website snapshot
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 48,
                  lineHeight: 1.05,
                  fontWeight: 900,
                  letterSpacing: "-0.05em",
                }}
              >
                Rent a Car, Anytime, Anywhere in Ghana.
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  lineHeight: 1.4,
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                Airport pickup, verified hosts, trusted listings, and a clean
                booking flow built for Accra and beyond.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  padding: 14,
                  borderRadius: 22,
                  background: "rgba(7, 24, 39, 0.42)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {filters.map((filter) => (
                  <div
                    key={filter}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.12)",
                      padding: "11px 14px",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {filter}
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: "auto",
                    borderRadius: 999,
                    background: "#0e86d4",
                    padding: "11px 18px",
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  Search
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                }}
              >
                {[
                  "Secure MoMo & Card",
                  "Transparent pricing",
                  "Host approval workflow",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      padding: "14px 12px",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#f4fbff",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "40%",
              gap: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                borderRadius: 26,
                padding: 18,
                background: "#ffffff",
                border: "1px solid #e3edf7",
                boxShadow: "0 18px 50px rgba(24, 54, 93, 0.10)",
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
                    gap: 3,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: 15,
                      color: "#6b8297",
                      fontWeight: 600,
                    }}
                  >
                    Featured cars
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 26,
                      fontWeight: 800,
                      color: "#0d1f31",
                    }}
                  >
                    Accra bookings
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 999,
                    background: "#edf7ff",
                    padding: "8px 12px",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0e86d4",
                  }}
                >
                  Live
                </div>
              </div>

              {featuredCars.map((car) => (
                <div
                  key={car.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                    borderRadius: 22,
                    border: "1px solid #e4edf6",
                    background: "#f8fbff",
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          fontSize: 22,
                          fontWeight: 800,
                          color: "#10243b",
                        }}
                      >
                        {car.name}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          borderRadius: 999,
                          background: "#ffffff",
                          padding: "6px 10px",
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#405972",
                        }}
                      >
                        Rating {car.rating}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 15,
                        color: "#647b91",
                        fontWeight: 600,
                      }}
                    >
                      {car.details}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        fontSize: 20,
                        fontWeight: 900,
                        color: "#0e86d4",
                      }}
                    >
                      {car.price}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#7289a0",
                      }}
                    >
                      per trip
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
              }}
            >
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  style={{
                    display: "flex",
                    flex: 1,
                    flexDirection: "column",
                    gap: 6,
                    borderRadius: 22,
                    border: "1px solid #e3edf7",
                    background: "#ffffff",
                    padding: "16px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#6d8497",
                    }}
                  >
                    {metric.label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 28,
                      fontWeight: 900,
                      color: "#0d1f31",
                    }}
                  >
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 22,
                background: "#0f2237",
                padding: "18px 20px",
                color: "#ffffff",
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
                    fontSize: 14,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.62)",
                  }}
                >
                  Booking experience
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 24,
                    fontWeight: 800,
                  }}
                >
                  Clean website preview for every share
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  background: "#f8b400",
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 900,
                  color: "#111827",
                }}
              >
                1200 x 630
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
