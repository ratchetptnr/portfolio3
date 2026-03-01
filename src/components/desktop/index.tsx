"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useSpring, motionValue, type MotionValue } from "framer-motion";
import { FileText } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { DesktopWindow, WIN_W } from "./window";

// ─── Types ────────────────────────────────────────────────────────────────────

interface IconData {
  id: string;
  name: string;
  col: number;
  row: number;
  /** Pixel position of the icon's top-left corner (kept in sync with col/row) */
  x: number;
  y: number;
}

interface OpenWindow {
  id: string;
  initialX: number;
  initialY: number;
}

// ─── File content ─────────────────────────────────────────────────────────────

const ICON_FILES: Record<string, { title: string; content: string }> = {
  praneeth: {
    title: "Praneeth.txt",
    content: `Praneeth Potnuru
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hey — I'm Praneeth. I design and build
things for the web.

I care a lot about how things feel. The
weight of a button, the timing of an
animation, the right amount of space
between words.

Been building interfaces for a few years.
Currently exploring spatial computing and
whatever comes after that.

→  praneeth@example.com
→  github.com/praneeth
→  read.cv/praneeth

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Open to interesting work. Say hi.`,
  },

  womp: {
    title: "Womp.txt",
    content: `womp.txt — classified document
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Contents of this file:

  1. The word "womp" (see below)
  2. Existential uncertainty
  3. Nothing else

The word "womp":

      w  o  m  p

There. You've seen it.

Close the window.
Move on with your life.
You're doing great.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
File size: unknowable. File age: ancient.`,
  },
};

// ─── Icon dimensions ──────────────────────────────────────────────────────────

const ICON_W = 80;
const ICON_H = 90;

// ─── Grid constants ───────────────────────────────────────────────────────────

const CELL_W    = 100;   // horizontal slot pitch (px)
const CELL_H    = 108;   // vertical slot pitch (px)
const GRID_PAD  = 24;    // padding from viewport edges (px)

// ─── Spring configs ───────────────────────────────────────────────────────────

// Rotation: quick & loose (high stiffness, low damping → snappy but bouncy)
const ROT_SPRING  = { stiffness: 300, damping: 12, mass: 0.3 };

// Snap-to-slot: firm spring, no overshoot
const SNAP_SPRING = { type: "spring" as const, stiffness: 450, damping: 35 };

// While dragging: instant position tracking (no animation lag)
const DRAG_TRANS  = { duration: 0 } as const;

// Max tilt angle (degrees) and velocity → degrees scale factor
const MAX_ROT   = 15;
const VEL_SCALE = 0.028;

// ─── Grid helpers ─────────────────────────────────────────────────────────────

function gridDims(vw: number, vh: number) {
  const cols = Math.max(1, Math.floor((vw - GRID_PAD * 2) / CELL_W));
  const rows = Math.max(1, Math.floor((vh - GRID_PAD * 2) / CELL_H));
  return { cols, rows };
}

/** Top-left pixel coordinate of a grid slot */
function slotPos(col: number, row: number) {
  return {
    x: GRID_PAD + col * CELL_W + Math.round((CELL_W - ICON_W) / 2),
    y: GRID_PAD + row * CELL_H + Math.round((CELL_H - ICON_H) / 2),
  };
}

/** Which grid slot is closest to the icon's current pixel centre */
function nearestSlot(
  iconX: number,
  iconY: number,
  cols: number,
  rows: number,
): { col: number; row: number } {
  const cx = iconX + ICON_W / 2;
  const cy = iconY + ICON_H / 2;
  const col = Math.max(0, Math.min(cols - 1, Math.round((cx - GRID_PAD - CELL_W / 2) / CELL_W)));
  const row = Math.max(0, Math.min(rows - 1, Math.round((cy - GRID_PAD - CELL_H / 2) / CELL_H)));
  return { col, row };
}

/** BFS outward from (targetCol, targetRow) to find the nearest free slot */
function findFreeSlot(
  targetCol: number,
  targetRow: number,
  occupied: Set<string>,
  cols: number,
  rows: number,
): { col: number; row: number } {
  const key = (c: number, r: number) => `${c},${r}`;
  const queue: Array<{ col: number; row: number }> = [{ col: targetCol, row: targetRow }];
  const visited = new Set<string>([key(targetCol, targetRow)]);

  while (queue.length > 0) {
    const slot = queue.shift()!;
    if (!occupied.has(key(slot.col, slot.row))) return slot;

    const neighbors = [
      { col: slot.col - 1, row: slot.row },
      { col: slot.col + 1, row: slot.row },
      { col: slot.col,     row: slot.row - 1 },
      { col: slot.col,     row: slot.row + 1 },
      { col: slot.col - 1, row: slot.row - 1 },
      { col: slot.col + 1, row: slot.row - 1 },
      { col: slot.col - 1, row: slot.row + 1 },
      { col: slot.col + 1, row: slot.row + 1 },
    ];

    for (const n of neighbors) {
      if (n.col < 0 || n.col >= cols || n.row < 0 || n.row >= rows) continue;
      const k = key(n.col, n.row);
      if (!visited.has(k)) {
        visited.add(k);
        queue.push(n);
      }
    }
  }

  return { col: targetCol, row: targetRow };
}

// ─── Desktop Icon ─────────────────────────────────────────────────────────────

function DesktopIcon({
  icon,
  selected,
  zIndex,
  isDragging,
  rotationMV,
  onPointerDown,
}: {
  icon: IconData;
  selected: boolean;
  zIndex: number;
  isDragging: boolean;
  rotationMV: MotionValue<number>;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  const rotate = useSpring(rotationMV, ROT_SPRING);

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-[4px] w-20 select-none touch-none cursor-default"
      animate={{ x: icon.x, y: icon.y }}
      transition={isDragging ? DRAG_TRANS : SNAP_SPRING}
      style={{ zIndex, rotate }}
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
  const [icons, setIcons]           = useState<IconData[]>([]);
  const [ready, setReady]           = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);

  const zCounter = useRef(10);
  const [zMap, setZMap] = useState<Record<string, number>>({
    praneeth: 1, womp: 1,
  });

  // One MotionValue per icon, created once
  const rotationMVs = useRef<Record<string, MotionValue<number>>>({
    praneeth: motionValue(0),
    womp:     motionValue(0),
  });

  // ── Place icons in grid slots after mount ────────────────────────────────
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight - 28;
    const { cols, rows } = gridDims(vw, vh);

    const midRow = Math.floor(rows / 2);
    const midCol = Math.max(0, Math.floor((cols - 2) / 2));

    const pos0 = slotPos(midCol, midRow);
    const pos1 = slotPos(Math.min(midCol + 1, cols - 1), midRow);

    setIcons([
      { id: "praneeth", name: "Praneeth", col: midCol,                         row: midRow, ...pos0 },
      { id: "womp",     name: "Womp",     col: Math.min(midCol + 1, cols - 1), row: midRow, ...pos1 },
    ]);
    setReady(true);
  }, []);

  // ── Refs for use inside stable event-listener closures ───────────────────
  const iconsRef       = useRef(icons);
  const openWindowsRef = useRef(openWindows);
  useEffect(() => { iconsRef.current       = icons;       }, [icons]);
  useEffect(() => { openWindowsRef.current = openWindows; }, [openWindows]);

  // ── Drag state ───────────────────────────────────────────────────────────
  const dragging = useRef<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startIconX:  number;
    startIconY:  number;
    moved:       boolean;
  } | null>(null);

  // Velocity tracking
  const prevDragX    = useRef<number | null>(null);
  const prevDragTime = useRef<number | null>(null);
  const smoothedVelX = useRef(0);

  // Double-click tracking
  const lastTapRef = useRef<{ id: string; time: number } | null>(null);

  // ── Open / focus a window ────────────────────────────────────────────────
  const openOrFocusWindow = useCallback((id: string) => {
    const alreadyOpen = openWindowsRef.current.some((w) => w.id === id);

    if (alreadyOpen) {
      // Just bring to front
      setZMap((prev) => ({ ...prev, [`win_${id}`]: ++zCounter.current }));
    } else {
      // Calculate a centered-ish starting position, offset per window count
      const offset  = openWindowsRef.current.length * 28;
      const wx = Math.round((window.innerWidth - WIN_W) / 2) + offset;
      const wy = Math.round((window.innerHeight - 28 - 340) / 2) + 28 + offset;

      setOpenWindows((prev) => [...prev, { id, initialX: wx, initialY: wy }]);
      setZMap((prev) => ({ ...prev, [`win_${id}`]: ++zCounter.current }));
    }
  }, []);

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

      // Velocity → rotation
      const now = performance.now();
      if (prevDragX.current !== null && prevDragTime.current !== null) {
        const dt     = Math.max(now - prevDragTime.current, 1);
        const rawVel = (e.clientX - prevDragX.current) / dt * 1000;
        smoothedVelX.current = smoothedVelX.current * 0.65 + rawVel * 0.35;
        const target = Math.max(-MAX_ROT, Math.min(MAX_ROT, smoothedVelX.current * VEL_SCALE));
        rotationMVs.current[dragging.current.id]?.set(target);
      }
      prevDragX.current    = e.clientX;
      prevDragTime.current = now;
    };

    const onUp = () => {
      if (!dragging.current) return;
      const { id, moved } = dragging.current;

      if (!moved) {
        // ── Single vs double click detection ─────────────────────────────
        const now2 = Date.now();
        if (lastTapRef.current?.id === id && now2 - lastTapRef.current.time < 400) {
          // Double click → open the file
          lastTapRef.current = null;
          openOrFocusWindow(id);
        } else {
          lastTapRef.current = { id, time: now2 };
          setSelectedId(id);
        }
      } else {
        // ── Snap to nearest free grid slot ───────────────────────────────
        const vw = window.innerWidth;
        const vh = window.innerHeight - 28;
        const { cols, rows } = gridDims(vw, vh);

        const current = iconsRef.current.find((i) => i.id === id)!;
        const { col: targetCol, row: targetRow } = nearestSlot(current.x, current.y, cols, rows);

        const occupied = new Set(
          iconsRef.current
            .filter((i) => i.id !== id)
            .map((i) => `${i.col},${i.row}`)
        );

        const { col, row } = findFreeSlot(targetCol, targetRow, occupied, cols, rows);
        const pos = slotPos(col, row);

        setIcons((prev) =>
          prev.map((ic) =>
            ic.id === id ? { ...ic, col, row, x: pos.x, y: pos.y } : ic
          )
        );
      }

      rotationMVs.current[id]?.set(0);
      prevDragX.current    = null;
      prevDragTime.current = null;
      smoothedVelX.current = 0;
      dragging.current     = null;
      setDraggingId(null);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, [openOrFocusWindow]);

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

      prevDragX.current    = e.clientX;
      prevDragTime.current = performance.now();
      smoothedVelX.current = 0;

      setDraggingId(id);
      setZMap((prev) => ({ ...prev, [id]: ++zCounter.current }));
    },
    []
  );

  // ── Window handlers ──────────────────────────────────────────────────────
  const closeWindow = useCallback((id: string) => {
    setOpenWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setZMap((prev) => ({ ...prev, [`win_${id}`]: ++zCounter.current }));
  }, []);

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
      {/* Desktop icons */}
      {ready &&
        icons.map((icon) => (
          <DesktopIcon
            key={icon.id}
            icon={icon}
            selected={selectedId === icon.id}
            zIndex={zMap[icon.id]}
            isDragging={draggingId === icon.id}
            rotationMV={rotationMVs.current[icon.id]}
            onPointerDown={(e) => handleIconPointerDown(icon.id, e)}
          />
        ))}

      {/* Open windows */}
      {openWindows.map((win) => {
        const file = ICON_FILES[win.id];
        return (
          <DesktopWindow
            key={win.id}
            title={file.title}
            content={file.content}
            initialX={win.initialX}
            initialY={win.initialY}
            zIndex={zMap[`win_${win.id}`] ?? 20}
            onClose={() => closeWindow(win.id)}
            onFocus={() => focusWindow(win.id)}
          />
        );
      })}
    </div>
  );
}
