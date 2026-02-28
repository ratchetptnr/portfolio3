"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

export const WIN_W          = 480;
export const WIN_CONTENT_H  = 300;
const        TITLE_BAR_H    = 38;

// ─── Props ────────────────────────────────────────────────────────────────────

interface DesktopWindowProps {
  title:    string;
  content:  string;
  initialX: number;
  initialY: number;
  zIndex:   number;
  onClose:  () => void;
  onFocus:  () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DesktopWindow({
  title,
  content,
  initialX,
  initialY,
  zIndex,
  onClose,
  onFocus,
}: DesktopWindowProps) {
  const [pos, setPos] = useState({ x: initialX, y: initialY });

  // Title-bar drag state — all in a ref so pointermove never goes stale
  const drag = useRef<{
    startMouseX: number;
    startMouseY: number;
    startX:      number;
    startY:      number;
  } | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      setPos({
        x: drag.current.startX + (e.clientX - drag.current.startMouseX),
        y: drag.current.startY + (e.clientY - drag.current.startMouseY),
      });
    };
    const onUp = () => { drag.current = null; };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, []);

  return (
    <motion.div
      className="absolute flex flex-col rounded-xl overflow-hidden border border-border/40"
      style={{
        left:   pos.x,
        top:    pos.y,
        zIndex,
        width:  WIN_W,
        boxShadow: "0 24px 64px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.12)",
      }}
      initial={{ scale: 0.93, opacity: 0 }}
      animate={{ scale: 1,    opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      onPointerDown={onFocus}
    >
      {/* ── Title bar ───────────────────────────────────────────────────── */}
      <div
        className="relative flex items-center px-3.5 select-none cursor-default bg-muted/80 backdrop-blur-2xl border-b border-border/40"
        style={{ height: TITLE_BAR_H }}
        onPointerDown={(e) => {
          e.preventDefault();
          onFocus();
          drag.current = {
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startX:      pos.x,
            startY:      pos.y,
          };
        }}
      >
        {/* Traffic lights */}
        <div className="flex gap-[6px] z-10">
          <button
            className="w-3 h-3 rounded-full bg-[#ff5f57] ring-1 ring-black/10 hover:brightness-110 active:brightness-90 transition-all"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
          />
          <button
            className="w-3 h-3 rounded-full bg-[#ffbd2e] ring-1 ring-black/10 hover:brightness-110 active:brightness-90 transition-all"
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Minimize"
          />
          <button
            className="w-3 h-3 rounded-full bg-[#28c840] ring-1 ring-black/10 hover:brightness-110 active:brightness-90 transition-all"
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Maximize"
          />
        </div>

        {/* Centered filename */}
        <span className="absolute inset-0 flex items-center justify-center text-[13px] text-foreground/55 font-medium pointer-events-none">
          {title}
        </span>
      </div>

      {/* ── Text content ────────────────────────────────────────────────── */}
      <div
        className="bg-background overflow-y-auto"
        style={{ height: WIN_CONTENT_H }}
      >
        <pre className="p-6 font-mono text-[13px] text-foreground/80 leading-[1.75] whitespace-pre-wrap break-words">
          {content}
        </pre>
      </div>
    </motion.div>
  );
}
