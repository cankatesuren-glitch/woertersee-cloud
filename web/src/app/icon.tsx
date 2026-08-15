import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b2454",
          color: "#f4c430",
          fontFamily: "Georgia",
          fontSize: 260,
          fontWeight: 700,
          letterSpacing: -24,
        }}
      >
        W
        <span
          style={{
            color: "#fffdf7",
            fontSize: 120,
            marginTop: 170,
            marginLeft: -28,
          }}
        >
          S
        </span>
      </div>
    ),
    size,
  );
}
