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

// Approximate bounding box of one icon (icon + label)
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
      {/* Icon body */}
      <div
        className={cn(
          "p-[6px] rounded-xl transition-colors duration-100",
          selected && "bg-blue-500/20 ring-1 ring-blue-400/30"
        )}
      >
        <FileText
          size={52}
          weight="thin"
          className={cn(
            "transition-colors duration-100",
            "drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]",
            selected ? "text-blue-200" : "text-white"
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
            : "text-white drop-shadow-[0_1px_4px_rgba(0,0,0,1)]"
        )}
      >
        {icon.name}
      </span>
    </div>
  );
}

// ─── Desktop Surface ──────────────────────────────────────────────────────────

export function Desktop() {
  // Start off-screen; centred after mount when we know window dimensions
  const [icons, setIcons] = useState<IconData[]>([
    { id: "praneeth", name: "Praneeth", x: -999, y: -999 },
    { id: "womp",     name: "Womp",     x: -999, y: -999 },
  ]);
  const [ready,      setReady]      = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Per-icon z-index — bump the dragged icon to the top
  const zCounter   = useRef(10);
  const [zMap, setZMap] = useState<Record<string, number>>({
    praneeth: 1,
    womp:     1,
  });

  // ── Centre icons once we know the viewport ───────────────────────────────
  useEffect(() => {
    const gap    = 36;
    const totalW = ICON_W * 2 + gap;
    const vw     = window.innerWidth;
    const vh     = window.innerHeight - 28; // 28 px = menu bar

    const x0 = Math.round((vw - totalW) / 2);
    const y0 = Math.round((vh - ICON_H)  / 2);

    setIcons([
      { id: "praneeth", name: "Praneeth", x: x0,              y: y0 },
      { id: "womp",     name: "Womp",     x: x0 + ICON_W + gap, y: y0 },
    ]);
    setReady(true);
  }, []);

  // ── Drag state (refs keep closures fresh without re-mounting listeners) ──
  const dragging = useRef<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startIconX:  number;
    startIconY:  number;
    moved:       boolean;
  } | null>(null);

  // Mirror icons into a ref so the event handlers always see fresh values
  const iconsRef = useRef(icons);
  useEffect(() => { iconsRef.current = icons; }, [icons]);

  // ── Global pointer listeners — mounted once ──────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault(); // prevent text selection / scroll during drag

      const dx = e.clientX - dragging.current.startMouseX;
      const dy = e.clientY - dragging.current.startMouseY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragging.current.moved = true;
      }

      const newX = dragging.current.startIconX + dx;
      const newY = dragging.current.startIconY + dy;

      setIcons((prev) =>
        prev.map((ic) =>
          ic.id === dragging.current!.id ? { ...ic, x: newX, y: newY } : ic
        )
      );
    };

    const onUp = () => {
      if (!dragging.current) return;
      // A pointer-down with no meaningful movement = a click → select
      if (!dragging.current.moved) {
        setSelectedId(dragging.current.id);
      }
      dragging.current = null;
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, []);

  // ── Icon pointer-down handler ────────────────────────────────────────────
  const handleIconPointerDown = useCallback(
    (id: string, e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation(); // don't bubble to desktop → don't deselect

      const icon = iconsRef.current.find((i) => i.id === id)!;
      dragging.current = {
        id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startIconX:  icon.x,
        startIconY:  icon.y,
        moved:       false,
      };

      // Raise this icon above all others
      const z = ++zCounter.current;
      setZMap((prev) => ({ ...prev, [id]: z }));
    },
    []
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="relative w-full select-none overflow-hidden"
      style={{
        height: "calc(100vh - 28px)",
        background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 45%, #0f3460 100%)",
      }}
      // Clicking bare desktop deselects everything
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
