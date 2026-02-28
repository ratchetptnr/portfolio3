"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// ─── Component ────────────────────────────────────────────────────────────────

export function SleepScreen({ onWake }: { onWake: () => void }) {
  const [visible, setVisible] = useState(true);

  const wake = () => {
    if (!visible) return;
    setVisible(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        wake();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <motion.div
      key="sleep"
      className="fixed inset-0 z-[200] bg-black select-none cursor-none"
      style={{ fontFamily: "var(--font-geist-pixel-square)" }}
      initial={{ opacity: 1 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => { if (!visible) onWake(); }}
      onClick={wake}
    >
      {/* Top-left BIOS text block */}
      <div className="absolute top-10 left-12 flex flex-col gap-[6px] text-left">

        {/* Header */}
        <p className="text-[22px] font-bold text-white/90 tracking-wide leading-none">
          PORTFOLIO BIOS  Release 1.0.2026
        </p>
        <p className="text-[16px] font-bold text-white/50 tracking-wide leading-none">
          Copyright (C) 2026 Praneeth Reddy. All rights reserved.
        </p>

        {/* Spacer */}
        <div className="h-4" />

        {/* System lines */}
        <p className="text-[16px] font-bold text-white/50 leading-snug">
          CPU  :  Human Brain  @ variable MHz
        </p>
        <p className="text-[16px] font-bold text-white/50 leading-snug">
          RAM  :  Questionable
        </p>
        <p className="text-[16px] font-bold text-white/50 leading-snug">
          GPU  :  Two eyes  (integrated)
        </p>

        {/* Spacer */}
        <div className="h-4" />

        {/* Wake prompt */}
        <p className="flex items-baseline gap-[0.1em] text-[22px] font-bold text-white/90 tracking-wide leading-none">
          Press SPACE to wake
          <motion.span
            animate={{ opacity: [1, 1, 0, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, times: [0, 0.45, 0.5, 0.95] }}
            aria-hidden
          >
            _
          </motion.span>
        </p>

      </div>
    </motion.div>
  );
}
