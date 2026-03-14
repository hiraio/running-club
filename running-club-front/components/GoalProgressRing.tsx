"use client";

import { motion } from "framer-motion";

interface Props {
  /** 현재 누적 거리 (km) */
  current: number;
  /** 목표 거리 (km). null이면 목표 미설정 상태 표시. */
  target: number | null;
  /** 팀 포인트 컬러 (hex). 기본 보라색. */
  color?: string;
  /** 링 크기 (px). 기본 200. */
  size?: number;
  /** 링 두께 (px). 기본 16. */
  strokeWidth?: number;
}

/**
 * NRC 스타일 원형 목표 진행 링.
 * SVG stroke-dashoffset + Framer Motion으로 마운트 시 채워지는 애니메이션.
 */
export default function GoalProgressRing({
  current,
  target,
  color = "#8B5CF6",
  size = 200,
  strokeWidth = 16,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = target && target > 0
    ? Math.min(current / target, 1)
    : 0;

  const offset = circumference * (1 - progress);
  const percent = Math.round(progress * 100);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* 배경 트랙 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          {/* 진행 아크 — Framer Motion 애니메이션 */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
            style={{
              filter: `drop-shadow(0 0 6px ${color}88)`,
            }}
          />
        </svg>

        {/* 중앙 텍스트 */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ transform: "rotate(0deg)" }}
        >
          <motion.span
            className="text-3xl font-black text-white tabular-nums"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            {current.toFixed(1)}
          </motion.span>
          <span className="text-xs font-medium text-white/50 mt-0.5">km</span>
        </div>
      </div>

      {/* 목표 표시 */}
      {target ? (
        <div className="text-center">
          <motion.div
            className="text-sm font-bold"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {percent}%
          </motion.div>
          <div className="text-xs text-white/40 mt-0.5">
            목표 {target}km 중 {current.toFixed(1)}km
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-xs text-white/40">목표 미설정</div>
          <a href="/setup-account" className="text-xs mt-0.5 block" style={{ color }}>
            목표 설정하기 →
          </a>
        </div>
      )}
    </div>
  );
}
