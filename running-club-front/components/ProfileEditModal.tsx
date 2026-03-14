"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Target } from "lucide-react";
import { updateMemberProfile } from "@/lib/api";
import type { MemberProfile } from "@/lib/types";

interface Props {
  open: boolean;
  initialData: {
    school: string | null;
    major: string | null;
    bio: string | null;
    targetDistance: number | null;
  };
  teamColor: string;
  onClose: () => void;
  onSaved: (updated: MemberProfile) => void;
}

export default function ProfileEditModal({ open, initialData, teamColor, onClose, onSaved }: Props) {
  const [school, setSchool] = useState(initialData.school ?? "");
  const [major, setMajor] = useState(initialData.major ?? "");
  const [bio, setBio] = useState(initialData.bio ?? "");
  const [targetDistance, setTargetDistance] = useState(
    initialData.targetDistance ? String(initialData.targetDistance) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string | number> = {};
      if (school.trim()) payload.school = school.trim();
      if (major.trim()) payload.major = major.trim();
      if (bio.trim()) payload.bio = bio.trim();
      const km = parseFloat(targetDistance);
      if (!isNaN(km) && km > 0) payload.targetDistance = km;

      const updated = await updateMemberProfile(payload);
      onSaved(updated);
      onClose();
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-white/25 transition-colors";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 백드롭 */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 모달 */}
          <motion.div
            className="fixed inset-x-4 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl border border-white/10 bg-card pb-safe shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:rounded-2xl sm:-translate-x-1/2 sm:-translate-y-1/2"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
              <h2 className="text-sm font-bold text-foreground">프로필 설정</h2>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* 프로필 섹션 */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" style={{ color: teamColor }} />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    프로필
                  </span>
                </div>
                <input
                  className={inputClass}
                  placeholder="학교 (예: 한국대학교)"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="전공 (예: 컴퓨터공학과)"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                />
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="한 줄 소개 (예: 매일 5km 달리는 중!)"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              {/* 목표 섹션 */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" style={{ color: teamColor }} />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    목표 거리
                  </span>
                </div>
                <div className="relative">
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    max="9999"
                    placeholder="목표 km (예: 100)"
                    value={targetDistance}
                    onChange={(e) => setTargetDistance(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    km
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}

              {/* 저장 버튼 */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${teamColor}, ${teamColor}cc)`,
                  boxShadow: `0 4px 16px ${teamColor}44`,
                }}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
