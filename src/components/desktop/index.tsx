"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useSpring, motionValue, type MotionValue } from "framer-motion";
import { FileText } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IconData {
  id: string;
  name: string;
  x: number;
  y: number;
}

const ICON_W = 80;
const ICON_H = 90;

// ─── Spring config for rotation return-to-zero ────────────────────────────────
// stiffness / damping tuned so the icon snaps back crisply without oscillating.
const SPRING_CFG = { stiffness: 160, damping: 20, mass: 0.4 };

// Max tilt angle (degrees) and velocity scale factor
const MAX_ROT   = 15;              // ° cap
const VEL_SCALE = 0.022;          // maps px/s → degrees

// ─── Desktop Icon ─────────────────────────────────────────────────────────────

function DesktopIcon({
  icon,
  selected,
  zIndex,
  rotationMV,
  onPointerDown,
}: {
  icon: IconData;
  selected: boolean;
  zIndex: number;
  rotationMV: MotionValue<number>;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  // Spring smooths both the live rotation and the return-to-zero snap
  const rotate = useSpring(rotationMV, SPRING_CFG);

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-[4px] w-20 select-none touch-none cursor-default"
      style={{ left: icon.x, top: icon.y, zIndex, rotate }}
      onPointerDown={onPointerDown}
    >
      {/* Icon glyph */}
      <div
        className={cn(
          "p-[6px] rounded-xl transition-colors duration-100",
          selected && "bg-blue-500/15 ring-1 ring-blue-500/30"
        )}
      >
        <FileText
          size={52}
          weight="thin"
          className={cn(
            "transition-colors duration-100",
            selected ? "text-blue-600 dark:text-blue-400" : "text-foreground"
          )}
        />
      </div>

      {/* Filename label */}
      <span
        className={cn(
          "text-[11.5px] leading-tight text-center px-[5px] py-[2px] rounded",
          "max-w-[78px] break-words pointer-events-none",
          selected ? "bg-blue-600 text-white" : "text-foreground"
        )}
      >
        {icon.name}
      </span>
    </motion.div>
  );
}

// ─── Desktop Surface ──────────────────────────────────────────────────────────

export function Desktop() {
  const [icons, setIcons] = useState<IconData[]>([
    { id: "praneeth", name: "Praneeth", x: -999, y: -999 },
    { id: "womp",     name: "Womp",     x: -999, y: -999 },
  ]);
  const [ready,      setReady]      = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const zCounter = useRef(10);
  const [zMap, setZMap] = useState<Record<string, number>>({ praneeth: 1, womp: 1 });

  // One MotionValue per icon, created once, never recreated
  const rotationMVs = useRef<Record<string, MotionValue<number>>>({
    praneeth: motionValue(0),
    womp:     motionValue(0),
  });

  // ── Centre icons after mount ─────────────────────────────────────────────
  useEffect(() => {
    const gap    = 36;
    const totalW = ICON_W * 2 + gap;
    const vw     = window.innerWidth;
    const vh     = window.innerHeight - 28;
    const x0     = Math.round((vw - totalW) / 2);
    const y0     = Math.round((vh - ICON_H)  / 2);

    setIcons([
      { id: "praneeth", name: "Praneeth", x: x0,                y: y0 },
      { id: "womp",     name: "Womp",     x: x0 + ICON_W + gap, y: y0 },
    ]);
    setReady(true);
  }, []);

  // ── Drag state ───────────────────────────────────────────────────────────
  const dragging = useRef<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startIconX:  number;
    startIconY:  number;
    moved:       boolean;
  } | null>(null);

  const iconsRef = useRef(icons);
  useEffect(() => { iconsRef.current = icons; }, [icons]);

  // Velocity tracking — all refs so updates never trigger re-renders
  const prevDragX    = useRef<number | null>(null);
  const prevDragTime = useRef<number | null>(null);
  const smoothedVelX = useRef(0);           // EMA-smoothed horizontal velocity

  // ── Global pointer listeners (mounted once) ──────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();

      // ── Position ─────────────────────────────────────────────────────────
      const dx = e.clientX - dragging.current.startMouseX;
      const dy = e.clientY - dragging.current.startMouseY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragging.current.moved = true;

      setIcons((prev) =>
        prev.map((ic) =>
          ic.id === dragging.current!.id
            ? { ...ic, x: dragging.current!.startIconX + dx, y: dragging.current!.startIconY + dy }
            : ic
        )
      );

      // ── Velocity → rotation ───────────────────────────────────────────────
      const now = performance.now();
      if (prevDragX.current !== null && prevDragTime.current !== null) {
        const dt     = Math.max(now - prevDragTime.current, 1); // ms, avoid ÷0
        const rawVel = (e.clientX - prevDragX.current) / dt * 1000; // px/s

        // Exponential moving average: smooths frame-to-frame jitter (α = 0.35)
        smoothedVelX.current = smoothedVelX.current * 0.65 + rawVel * 0.35;

        const target = Math.max(-MAX_ROT, Math.min(MAX_ROT, smoothedVelX.current * VEL_SCALE));
        rotationMVs.current[dragging.current.id]?.set(target);
      }
      prevDragX.current    = e.clientX;
      prevDragTime.current = now;
    };

    const onUp = () => {
      if (!dragging.current) return;
      if (!dragging.current.moved) setSelectedId(dragging.current.id);

      // Spring the icon back to upright
      rotationMVs.current[dragging.current.id]?.set(0);

      // Reset velocity state
      prevDragX.current    = null;
      prevDragTime.current = null;
      smoothedVelX.current = 0;

      dragging.current = null;
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, []);

  // ── Icon pointer-down ────────────────────────────────────────────────────
  const handleIconPointerDown = useCallback(
    (id: string, e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const icon = iconsRef.current.find((i) => i.id === id)!;
      dragging.current = {
        id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startIconX:  icon.x,
        startIconY:  icon.y,
        moved:       false,
      };

      // Seed velocity tracking from this exact point
      prevDragX.current    = e.clientX;
      prevDragTime.current = performance.now();
      smoothedVelX.current = 0;

      setZMap((prev) => ({ ...prev, [id]: ++zCounter.current }));
    },
    []
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full select-none overflow-hidden bg-background"
      style={{
        height: "calc(100vh - 28px)",
        backgroundImage:
          "radial-gradient(circle, color-mix(in oklch, var(--foreground) 18%, transparent) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
      onPointerDown={() => setSelectedId(null)}
    >
      {ready &&
        icons.map((icon) => (
          <DesktopIcon
            key={icon.id}
            icon={icon}
            selected={selectedId === icon.id}
            zIndex={zMap[icon.id]}
            rotationMV={rotationMVs.current[icon.id]}
            onPointerDown={(e) => handleIconPointerDown(icon.id, e)}
          />
        ))}
    </div>
  );
}
