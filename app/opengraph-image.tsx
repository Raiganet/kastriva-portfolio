import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Kastriva - Jasa Pembuatan Website & Aplikasi Profesional";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          color: "white",
          background: "linear-gradient(135deg, #0A0A0F 0%, #171329 52%, #3D2E7D 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "#6C5CE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, fontWeight: 800 }}>K</div>
          <div style={{ fontSize: 40, fontWeight: 800 }}>Kastriva</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 930 }}>
          <div style={{ fontSize: 68, lineHeight: 1.08, fontWeight: 800, letterSpacing: -2 }}>Website & Aplikasi yang siap membantu bisnis berkembang.</div>
          <div style={{ marginTop: 28, fontSize: 28, color: "#D8D5E8" }}>Portfolio • Konsultasi • Pengembangan • Serah Terima</div>
        </div>
      </div>
    ),
    size
  );
}
