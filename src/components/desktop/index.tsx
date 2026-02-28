"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FileText } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IconData {
  id: string;
  name: string;
  x: number;
  y: number;
}

// Approximate bounding box of one icon (icon glyph + label)
const ICON_W = 80;
const ICON_H = 90;

// ─── Desktop Icon ─────────────────────────────────────────────────────────────

function DesktopIcon({
  icon,
  selected,
  zIndex,
  onPointerDown,
}: {
  icon: IconData;
  selected: boolean;
  zIndex: number;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="absolute flex flex-col items-center gap-[4px] w-20 select-none touch-none cursor-default"
      style={{ left: icon.x, top: icon.y, zIndex }}
      onPointerDown={onPointerDown}
    >
      {/* Icon body — blue ring on selection, transparent otherwise */}
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
            selected
              ? "text-blue-600 dark:text-blue-400"
              : "text-foreground"
          )}
        />
      </div>

      {/* Filename label */}
      <span
        className={cn(
          "text-[11.5px] leading-tight text-center px-[5px] py-[2px] rounded",
          "max-w-[78px] break-words pointer-events-none",
          selected
            ? "bg-blue-600 text-white"
            : "text-foreground"
        )}
      >
        {icon.name}
      </span>
    </div>
  );
}

// ─── Desktop Surface ──────────────────────────────────────────────────────────

export function Desktop() {
  // Icons start off-screen; centred once we know viewport dimensions
  const [icons, setIcons] = useState<IconData[]>([
    { id: "praneeth", name: "Praneeth", x: -999, y: -999 },
    { id: "womp",     name: "Womp",     x: -999, y: -999 },
  ]);
  const [ready,      setReady]      = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Per-icon z-index — bump dragged icon to the top
  const zCounter = useRef(10);
  const [zMap, setZMap] = useState<Record<string, number>>({
    praneeth: 1,
    womp:     1,
  });

  // ── Centre icons after mount (needs window dimensions) ──────────────────
  useEffect(() => {
    const gap    = 36;
    const totalW = ICON_W * 2 + gap;
    const vw     = window.innerWidth;
    const vh     = window.innerHeight - 28; // 28 px = menu bar

    const x0 = Math.round((vw - totalW) / 2);
    const y0 = Math.round((vh - ICON_H)  / 2);

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

  // Mirror icons into a ref so event-listener closures always see fresh positions
  const iconsRef = useRef(icons);
  useEffect(() => { iconsRef.current = icons; }, [icons]);

  // ── Global pointer listeners (mounted once) ──────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();

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
    };

    const onUp = () => {
      if (!dragging.current) return;
      if (!dragging.current.moved) setSelectedId(dragging.current.id);
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

      // Raise to front
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
        // Dotted graph-paper pattern using shadcn CSS variables.
        // color-mix keeps the dots theme-aware: dark on light bg, light on dark bg.
        backgroundImage:
          "radial-gradient(circle, color-mix(in oklch, var(--foreground) 18%, transparent) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
      // Clicking bare desktop deselects all icons
      onPointerDown={() => setSelectedId(null)}
    >
      {ready &&
        icons.map((icon) => (
          <DesktopIcon
            key={icon.id}
            icon={icon}
            selected={selectedId === icon.id}
            zIndex={zMap[icon.id]}
            onPointerDown={(e) => handleIconPointerDown(icon.id, e)}
          />
        ))}
    </div>
  );
}
