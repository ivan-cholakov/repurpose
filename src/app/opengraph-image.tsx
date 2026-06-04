import { ImageResponse } from "next/og";

export const alt = "Repurpose — turn one post into ten";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        background: "#0a0a0a",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 30, opacity: 0.7, marginBottom: 16 }}>Repurpose</div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 84,
          fontWeight: 700,
          lineHeight: 1.05,
          letterSpacing: -2,
        }}
      >
        <div>Turn one post</div>
        <div>into ten.</div>
      </div>
      <div style={{ fontSize: 34, opacity: 0.8, marginTop: 28, maxWidth: 900 }}>
        Paste once for a polished X thread, LinkedIn post, newsletter, and TL;DR. Powered by Claude.
      </div>
    </div>,
    { ...size },
  );
}
