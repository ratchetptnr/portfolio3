"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginScreen({ onLogin, onSleep }: { onLogin: () => void; onSleep: () => void }) {
  const [now, setNow]         = useState<Date | null>(null);
  const [clicked, setClicked] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogin = () => {
    if (clicked) return;
    setClicked(true);
    setTimeout(() => setVisible(false), 320);
  };

  const timeStr = now?.toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
    hour12: false,
  }) ?? "";

  const dateStr = now?.toLocaleDateString("en-US", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
  }) ?? "";

  return (
    <motion.div
      className="fixed inset-0 z-[150] flex flex-col items-center bg-background select-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => { if (!visible) onLogin(); }}
    >
      {/* ── Clock ───────────────────────────────────────────────────────── */}
      <div className="mt-20 flex flex-col items-center gap-1 pointer-events-none">
        <motion.p
          className="text-[88px] font-thin tabular-nums leading-none tracking-tight text-foreground"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {timeStr}
        </motion.p>
        <motion.p
          className="text-[19px] font-light text-foreground/55"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5 }}
        >
          {dateStr}
        </motion.p>
      </div>

      {/* ── Profile card ────────────────────────────────────────────────── */}
      <motion.button
        className="mt-20 flex flex-col items-center gap-4 group outline-none"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.5 }}
        onClick={handleLogin}
        aria-label="Log in"
      >
        {/* Avatar */}
        <motion.div
          className="relative w-24 h-24 rounded-full flex items-center justify-center text-white text-[28px] font-semibold"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
          }}
          whileHover={{ scale: 1.06 }}
          animate={clicked ? { scale: 1.14 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          PP
        </motion.div>

        {/* Name + title */}
        <div className="flex flex-col items-center gap-[4px]">
          <p className="text-foreground text-[20px] font-medium leading-none">
            Praneeth Potnuru
          </p>
          <p className="text-foreground/45 text-[13px] leading-none">
            product designer
          </p>
        </div>

        {/* Hint */}
        <AnimatePresence>
          {!clicked && (
            <motion.p
              className="text-foreground/30 text-[12px]"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              click to log in
            </motion.p>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center text-foreground/30 text-[12px]">
        <button
          className="hover:text-foreground/60 transition-colors cursor-default"
          onClick={onSleep}
        >
          ⏾  Sleep
        </button>
      </div>
    </motion.div>
  );
}
