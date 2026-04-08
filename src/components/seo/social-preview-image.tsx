export const socialImageAlt = "Hayame logo on white background";
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
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: -140,
          right: -100,
          width: 380,
          height: 380,
          borderRadius: 999,
          background: "rgba(14, 134, 212, 0.08)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: -180,
          left: -120,
          width: 420,
          height: 420,
          borderRadius: 999,
          background: "rgba(14, 134, 212, 0.10)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          width: 180,
          height: 180,
          top: 88,
          left: 132,
          borderRadius: 44,
          background: "rgba(237, 246, 253, 0.95)",
          border: "1px solid rgba(14, 134, 212, 0.14)",
          transform: "rotate(-12deg)",
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          width: 200,
          height: 200,
          right: 126,
          bottom: 74,
          borderRadius: 50,
          background: "rgba(244, 249, 255, 0.98)",
          border: "1px solid rgba(14, 134, 212, 0.12)",
          transform: "rotate(12deg)",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 620,
          height: 620,
          borderRadius: 999,
          background:
            "radial-gradient(circle at center, #ffffff 0%, #f7fbff 62%, #edf6fd 100%)",
          border: "1px solid rgba(14, 134, 212, 0.16)",
          boxShadow: "0 26px 70px rgba(14, 134, 212, 0.12)",
        }}
      >
        <img
          src={logoSrc}
          alt="Hayame logo"
          width="520"
          height="520"
          style={{
            objectFit: "contain",
          }}
        />
      </div>
    </div>
  );
}
