"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  messages: string[];
  teamColor?: string;
}

export default function EndiSpeechBanner({ messages, teamColor = "#a78bfa" }: Props) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(t);
  }, [messages.length]);

  if (!visible) return null;

  return (
    <motion.div
      className="flex items-end gap-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      {/* 엔디 */}
      <motion.div
        className="shrink-0"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src="/endi.png"
          alt="엔디"
          className="h-16 w-16 object-contain drop-shadow-md"
          onError={() => setVisible(false)}
        />
      </motion.div>

      {/* 말풍선 */}
      <div className="relative flex-1 min-w-0">
        {/* 꼬리 */}
        <div
          className="absolute -left-2 bottom-4 h-0 w-0"
          style={{
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderRight: "7px solid rgba(255,255,255,0.08)",
          }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.04] px-4 py-2.5"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <p className="text-sm font-semibold text-foreground">{messages[idx]}</p>
            {messages.length > 1 && (
              <div className="flex gap-1 mt-1.5">
                {messages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: i === idx ? "12px" : "4px",
                      background: i === idx ? teamColor : "rgba(255,255,255,0.2)",
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
