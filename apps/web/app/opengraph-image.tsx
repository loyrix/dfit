import { ImageResponse } from "next/og";
import { APP_CONFIG } from "@/config/app";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0c120f",
        color: "#f7f4ed",
        fontFamily: "Inter, Arial, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 560,
          height: 560,
          borderRadius: 560,
          border: "1px solid rgba(239, 189, 68, 0.18)",
          right: -120,
          top: -80,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: 420,
          border: "1px solid rgba(112, 202, 163, 0.18)",
          right: -50,
          top: -10,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 980,
          gap: 34,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 24,
              background: "#19211b",
              border: "1px solid rgba(239, 189, 68, 0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 24px 80px rgba(0,0,0,0.36)",
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 54,
                borderTop: "10px solid #efbd44",
                borderRight: "10px solid #70caa3",
                borderBottom: "10px solid #ff7e78",
                borderLeft: "10px solid transparent",
                transform: "rotate(28deg)",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 32, letterSpacing: 7, color: "#b8b5ad" }}>
              {APP_CONFIG.brandName}
            </div>
            <div style={{ fontSize: 22, color: "#efbd44" }}>AI Calorie Tracker</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 78,
            lineHeight: 1.02,
            letterSpacing: -2,
            fontWeight: 800,
            maxWidth: 820,
          }}
        >
          Track meals from a photo.
        </div>
        <div style={{ fontSize: 30, lineHeight: 1.35, color: "#b8b5ad", maxWidth: 760 }}>
          AI-estimated calories and macros for Indian and global meals. Review every item before
          saving.
        </div>
      </div>
    </div>,
    size,
  );
}
