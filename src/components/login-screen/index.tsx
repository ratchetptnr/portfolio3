"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [now, setNow]           = useState<Date | null>(null);
  const [clicked, setClicked]   = useState(false);
  const [visible, setVisible]   = useState(true);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogin = () => {
    if (clicked) return;
    setClicked(true);
    // Brief pause so the avatar pop animation plays, then fade out
    setTimeout(() => setVisible(false), 320);
  };

  const timeStr = now?.toLocaleTimeString("en-US", {
    hour: "numeric",
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
      className="fixed inset-0 z-[150] flex flex-col items-center select-none overflow-hidden"
      style={{
        backdropFilter:  "blur(56px) saturate(1.6)",
        WebkitBackdropFilter: "blur(56px) saturate(1.6)",
        backgroundColor: "rgba(0, 0, 0, 0.45)",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => { if (!visible) onLogin(); }}
    >
      {/* ── Clock ───────────────────────────────────────────────────────── */}
      <div className="mt-20 flex flex-col items-center gap-1 text-white pointer-events-none">
        <motion.p
          className="text-[88px] font-thin tabular-nums leading-none tracking-tight"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {timeStr}
        </motion.p>
        <motion.p
          className="text-[19px] text-white/60 font-light"
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
            boxShadow:  "0 0 0 0px rgba(255,255,255,0)",
          }}
          whileHover={{
            scale:     1.06,
            boxShadow: "0 0 0 4px rgba(255,255,255,0.25)",
          }}
          animate={clicked ? { scale: 1.14 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          PR

          {/* Subtle inner glow ring on hover */}
          <motion.div
            className="absolute inset-0 rounded-full ring-2 ring-white/0 group-hover:ring-white/20 transition-all duration-300"
          />
        </motion.div>

        {/* Name */}
        <div className="flex flex-col items-center gap-[3px]">
          <p className="text-white text-[20px] font-medium leading-none">
            Praneeth Reddy
          </p>
          <p className="text-white/45 text-[13px] leading-none">
            CEO of Womp.txt
          </p>
        </div>

        {/* Hint */}
        <AnimatePresence>
          {!clicked && (
            <motion.p
              className="text-white/35 text-[12px]"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              click to log in
            </motion.p>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8 text-white/30 text-[12px]">
        <button className="hover:text-white/60 transition-colors cursor-default">
          ↺  Restart
        </button>
        <button className="hover:text-white/60 transition-colors cursor-default">
          ⏻  Shut Down
        </button>
      </div>
    </motion.div>
  );
}
