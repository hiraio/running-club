import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "ND Running Club";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  // public/endi.png를 base64로 읽기
  const endiPath = join(process.cwd(), "public", "endi.png");
  const endiBuffer = await readFile(endiPath);
  const endiBase64 = `data:image/png;base64,${endiBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0c0d10 0%, #1a1b2e 50%, #0c0d10 100%)",
          position: "relative",
        }}
      >
        {/* 배경 장식 원 */}
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
            top: 60,
            left: 100,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
            bottom: 40,
            right: 150,
          }}
        />

        {/* 엔디 캐릭터 */}
        <img
          src={endiBase64}
          width={200}
          height={200}
          style={{ marginBottom: 24 }}
        />

        {/* 타이틀 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-1px",
            }}
          >
            ND Running Club
          </div>
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.5)",
              fontWeight: 500,
            }}
          >
            함께 달리는 즐거움
          </div>
        </div>

        {/* 하단 뱃지 */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 32,
          }}
        >
          <div
            style={{
              background: "rgba(139,92,246,0.2)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: 20,
              padding: "8px 20px",
              fontSize: 16,
              color: "rgba(139,92,246,0.9)",
              fontWeight: 700,
            }}
          >
            팀 대항전
          </div>
          <div
            style={{
              background: "rgba(59,130,246,0.2)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: 20,
              padding: "8px 20px",
              fontSize: 16,
              color: "rgba(59,130,246,0.9)",
              fontWeight: 700,
            }}
          >
            개인 랭킹
          </div>
          <div
            style={{
              background: "rgba(16,185,129,0.2)",
              border: "1px solid rgba(16,185,129,0.3)",
              borderRadius: 20,
              padding: "8px 20px",
              fontSize: 16,
              color: "rgba(16,185,129,0.9)",
              fontWeight: 700,
            }}
          >
            기록 인증
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
