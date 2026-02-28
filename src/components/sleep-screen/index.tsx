"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// ─── Component ────────────────────────────────────────────────────────────────

export function SleepScreen({ onWake }: { onWake: () => void }) {
  const [visible, setVisible] = useState(true);

  // Kick off the exit animation, then notify parent after it finishes
  const wake = () => {
    if (!visible) return;
    setVisible(false);
  };

  // Spacebar or any click/tap wakes the screen
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
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black select-none cursor-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => { if (!visible) onWake(); }}
      onClick={wake}
    >
      {/* Main prompt */}
      <p
        className="flex items-baseline gap-[0.15em] text-[15px] text-white/35 tracking-[0.18em] lowercase"
        style={{ fontFamily: "var(--font-geist-pixel-square)" }}
      >
        press space to wake
        {/* Blinking cursor */}
        <motion.span
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, times: [0, 0.45, 0.5, 0.95] }}
          aria-hidden
        >
          _
        </motion.span>
      </p>
    </motion.div>
  );
}
