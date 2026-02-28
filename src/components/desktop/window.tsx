"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

// ─── Constants ────────────────────────────────────────────────────────────────

export const WIN_W   = 480;          // default width (also used by Desktop for centering)
const WIN_H          = 338;          // default height (38 title + 300 content)
const WIN_MIN_W      = 300;
const WIN_MIN_H      = 160;          // title bar + at least a little content
const TITLE_BAR_H    = 38;

const EDGE_HIT       = 8;            // px — invisible resize strip thickness
const CORNER_HIT     = 16;           // px — corner hit square size

// ─── Types ────────────────────────────────────────────────────────────────────

type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

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
  const [pos,  setPos]  = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ w: WIN_W,     h: WIN_H   });

  // Title-bar drag
  const drag = useRef<{
    startMouseX: number; startMouseY: number;
    startX:      number; startY:      number;
  } | null>(null);

  // Edge / corner resize
  const resize = useRef<{
    edge:        Edge;
    startMouseX: number; startMouseY: number;
    startX:      number; startY:      number;
    startW:      number; startH:      number;
  } | null>(null);

  // ── Shared pointermove / pointerup listeners ──────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // Title-bar drag
      if (drag.current) {
        setPos({
          x: drag.current.startX + (e.clientX - drag.current.startMouseX),
          y: drag.current.startY + (e.clientY - drag.current.startMouseY),
        });
        return;
      }

      // Edge / corner resize
      if (resize.current) {
        const { edge, startMouseX, startMouseY, startX, startY, startW, startH } = resize.current;
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;

        let newX = startX, newY = startY, newW = startW, newH = startH;

        if (edge.includes("e")) newW = Math.max(WIN_MIN_W, startW + dx);
        if (edge.includes("s")) newH = Math.max(WIN_MIN_H, startH + dy);
        if (edge.includes("w")) {
          newW = Math.max(WIN_MIN_W, startW - dx);
          newX = startX + startW - newW;       // keep right edge fixed
        }
        if (edge.includes("n")) {
          newH = Math.max(WIN_MIN_H, startH - dy);
          newY = startY + startH - newH;       // keep bottom edge fixed
        }

        setPos ({ x: newX, y: newY });
        setSize({ w: newW, h: newH });
      }
    };

    const onUp = () => {
      drag.current   = null;
      resize.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, []);

  // ── Start a resize from a given edge ─────────────────────────────────────
  // Called from render-time onPointerDown handlers, so pos/size are always fresh
  const startResize = (edge: Edge, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFocus();
    resize.current = {
      edge,
      startMouseX: e.clientX, startMouseY: e.clientY,
      startX: pos.x,           startY: pos.y,
      startW: size.w,          startH: size.h,
    };
  };

  // ── Inline styles for each of the 8 resize handles ───────────────────────
  const H = EDGE_HIT;
  const C = CORNER_HIT;
  const handleBase: React.CSSProperties = { position: "absolute", zIndex: 10 };

  const handles: { edge: Edge; style: React.CSSProperties }[] = [
    // Edges
    { edge: "n",  style: { ...handleBase, top: -H/2, left: C, right: C, height: H, cursor: "ns-resize" } },
    { edge: "s",  style: { ...handleBase, bottom: -H/2, left: C, right: C, height: H, cursor: "ns-resize" } },
    { edge: "w",  style: { ...handleBase, left: -H/2, top: C, bottom: C, width: H, cursor: "ew-resize" } },
    { edge: "e",  style: { ...handleBase, right: -H/2, top: C, bottom: C, width: H, cursor: "ew-resize" } },
    // Corners
    { edge: "nw", style: { ...handleBase, top: -H/2, left: -H/2, width: C + H/2, height: C + H/2, cursor: "nwse-resize", zIndex: 11 } },
    { edge: "ne", style: { ...handleBase, top: -H/2, right: -H/2, width: C + H/2, height: C + H/2, cursor: "nesw-resize", zIndex: 11 } },
    { edge: "sw", style: { ...handleBase, bottom: -H/2, left: -H/2, width: C + H/2, height: C + H/2, cursor: "nesw-resize", zIndex: 11 } },
    { edge: "se", style: { ...handleBase, bottom: -H/2, right: -H/2, width: C + H/2, height: C + H/2, cursor: "nwse-resize", zIndex: 11 } },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    // Outer wrapper: NO overflow-hidden so handles can bleed outside chrome
    <motion.div
      className="absolute"
      style={{ left: pos.x, top: pos.y, zIndex, width: size.w, height: size.h }}
      initial={{ scale: 0.93, opacity: 0 }}
      animate={{ scale: 1,    opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      onPointerDown={onFocus}
    >
      {/* ── Window chrome (rounded + clipped) ───────────────────────────── */}
      <div
        className="absolute inset-0 flex flex-col rounded-xl overflow-hidden border border-border/40"
        style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.12)" }}
      >
        {/* Title bar */}
        <div
          className="relative flex items-center px-3.5 select-none cursor-default bg-muted/80 backdrop-blur-2xl border-b border-border/40 flex-shrink-0"
          style={{ height: TITLE_BAR_H }}
          onPointerDown={(e) => {
            e.preventDefault();
            onFocus();
            drag.current = {
              startMouseX: e.clientX, startMouseY: e.clientY,
              startX: pos.x,          startY: pos.y,
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

          {/* Centred filename */}
          <span className="absolute inset-0 flex items-center justify-center text-[13px] text-foreground/55 font-medium pointer-events-none">
            {title}
          </span>
        </div>

        {/* Scrollable text content */}
        <div className="flex-1 bg-background overflow-y-auto min-h-0">
          <pre className="p-6 font-mono text-[13px] text-foreground/80 leading-[1.75] whitespace-pre-wrap break-words">
            {content}
          </pre>
        </div>
      </div>

      {/* ── Resize handles (outside the overflow-hidden chrome) ─────────── */}
      {handles.map(({ edge, style }) => (
        <div key={edge} style={style} onPointerDown={(e) => startResize(edge, e)} />
      ))}
    </motion.div>
  );
}
