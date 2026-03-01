"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Wifi, BatteryMedium, Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type MenuId = "apple" | "app" | "file" | "edit" | "view" | "go" | "window" | "help";

// ─── Apple Logo SVG ───────────────────────────────────────────────────────────

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-label="Apple">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

// ─── Analog Clock SVG ─────────────────────────────────────────────────────────

function AnalogClock({ date }: { date: Date }) {
  const h = date.getHours() % 12;
  const m = date.getMinutes();
  const s = date.getSeconds();

  const secDeg  = s * 6;
  const minDeg  = m * 6 + s * 0.1;
  const hourDeg = h * 30 + m * 0.5;

  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const cx = 80, cy = 80;

  const hand = (deg: number, len: number) => ({
    x2: cx + len * Math.cos(toRad(deg)),
    y2: cy + len * Math.sin(toRad(deg)),
  });

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="mx-auto">
      {/* Face */}
      <circle cx={cx} cy={cy} r="72" className="fill-background stroke-border" strokeWidth="1.5" />

      {/* Hour markers */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = toRad(i * 30 + 90); // +90 because toRad subtracts 90
        const isMajor = i % 3 === 0;
        const outerR = 68, innerR = isMajor ? 56 : 61;
        return (
          <line
            key={i}
            x1={cx + outerR * Math.cos(a)} y1={cy + outerR * Math.sin(a)}
            x2={cx + innerR * Math.cos(a)} y2={cy + innerR * Math.sin(a)}
            className="stroke-foreground/50"
            strokeWidth={isMajor ? 2 : 1}
            strokeLinecap="round"
          />
        );
      })}

      {/* Hour hand */}
      <line
        x1={cx} y1={cy}
        {...hand(hourDeg, 42)}
        className="stroke-foreground"
        strokeWidth="3.5" strokeLinecap="round"
      />

      {/* Minute hand */}
      <line
        x1={cx} y1={cy}
        {...hand(minDeg, 58)}
        className="stroke-foreground"
        strokeWidth="2.5" strokeLinecap="round"
      />

      {/* Second hand — red, thinner */}
      <line
        x1={cx + 14 * Math.cos(toRad(secDeg + 180))}
        y1={cy + 14 * Math.sin(toRad(secDeg + 180))}
        {...hand(secDeg, 64)}
        stroke="#ef4444"
        strokeWidth="1.25" strokeLinecap="round"
      />

      {/* Center pivot */}
      <circle cx={cx} cy={cy} r="3.5" className="fill-foreground" />
      <circle cx={cx} cy={cy} r="1.5" fill="#ef4444" />
    </svg>
  );
}

// ─── Shared class strings ─────────────────────────────────────────────────────

const CONTENT_CLS =
  "menubar-dropdown min-w-[220px] mt-0 py-1 shadow-2xl rounded-[6px]";

const ITEM_CLS =
  "menubar-item text-[13px] h-[22px] px-3 rounded-[4px] cursor-default";

const SEP_CLS = "menubar-sep my-[3px]";

const SC = ({ children }: { children: string }) => (
  <DropdownMenuShortcut className="menubar-shortcut">{children}</DropdownMenuShortcut>
);

// ─── MenuBar ─────────────────────────────────────────────────────────────────

export function MenuBar() {
  const [activeMenu, setActiveMenu] = useState<MenuId | null>(null);
  const [clockOpen, setClockOpen]   = useState(false);
  const [now, setNow]               = useState<Date | null>(null);

  // Single shared timer for both the text clock and the analog clock
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /** Click to open / close */
  const handleOpenChange = (id: MenuId, open: boolean) => {
    if (open) {
      setActiveMenu(id);
    } else {
      setActiveMenu((prev) => (prev === id ? null : prev));
    }
  };

  /** Hover-to-switch: if ANY menu is open, jump to the hovered one */
  const handleMouseEnter = (id: MenuId) => {
    if (activeMenu !== null && activeMenu !== id) {
      setActiveMenu(id);
    }
  };

  const triggerCls = (id: MenuId) =>
    cn(
      "px-[9px] h-full flex items-center text-[13px] text-foreground/90",
      "hover:bg-foreground/10 rounded-[4px] transition-colors duration-75",
      "focus-visible:outline-none cursor-default select-none",
      activeMenu === id && "bg-foreground/10"
    );

  const sysTriggerCls =
    "px-[9px] h-full flex items-center gap-1.5 text-[13px] text-foreground/90 hover:bg-foreground/10 rounded-[4px] transition-colors duration-75 cursor-default select-none";

  const menuProps = (id: MenuId) => ({
    open: activeMenu === id,
    onOpenChange: (o: boolean) => handleOpenChange(id, o),
  });

  const triggerProps = (id: MenuId) => ({
    className: triggerCls(id),
    onMouseEnter: () => handleMouseEnter(id),
  });

  // Formatted strings for the menu-bar text clock
  const dateStr = now?.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  }) ?? "";
  const timeStr = now?.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  }) ?? "";

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-7 flex items-center justify-between px-1 select-none bg-background/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-border">

      {/* ── LEFT — App menus ───────────────────────────────────────────── */}
      <div className="flex items-center h-full">

        {/* Apple menu */}
        <DropdownMenu {...menuProps("apple")}>
          <DropdownMenuTrigger {...triggerProps("apple")} className={cn(triggerCls("apple"), "px-3")}>
            <AppleLogo />
          </DropdownMenuTrigger>
          <DropdownMenuContent className={CONTENT_CLS} sideOffset={0} align="start">
            <DropdownMenuItem className={cn(ITEM_CLS, "font-semibold")}>About This Portfolio</DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>System Preferences…</DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>App Store…</DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem
              className={ITEM_CLS}
              onClick={() => window.dispatchEvent(new CustomEvent("portfolio:sleep"))}
            >
              Sleep
            </DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Lock Screen <SC>⌃⌘Q</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Log Out… <SC>⇧⌘Q</SC></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* App name menu */}
        <DropdownMenu {...menuProps("app")}>
          <DropdownMenuTrigger {...triggerProps("app")}>
            <span className="font-semibold">Portfolio</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className={CONTENT_CLS} sideOffset={0} align="start">
            <DropdownMenuItem className={ITEM_CLS}>About Portfolio</DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Preferences… <SC>⌘,</SC></DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Services</DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Hide Portfolio <SC>⌘H</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Hide Others <SC>⌥⌘H</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Show All</DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Quit Portfolio <SC>⌘Q</SC></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* File */}
        <DropdownMenu {...menuProps("file")}>
          <DropdownMenuTrigger {...triggerProps("file")}>File</DropdownMenuTrigger>
          <DropdownMenuContent className={CONTENT_CLS} sideOffset={0} align="start">
            <DropdownMenuItem className={ITEM_CLS}>New Window <SC>⌘N</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>New Tab <SC>⌘T</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Open… <SC>⌘O</SC></DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Close Window <SC>⌘W</SC></DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Print… <SC>⌘P</SC></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit */}
        <DropdownMenu {...menuProps("edit")}>
          <DropdownMenuTrigger {...triggerProps("edit")}>Edit</DropdownMenuTrigger>
          <DropdownMenuContent className={CONTENT_CLS} sideOffset={0} align="start">
            <DropdownMenuItem className={ITEM_CLS}>Undo <SC>⌘Z</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Redo <SC>⇧⌘Z</SC></DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Cut <SC>⌘X</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Copy <SC>⌘C</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Paste <SC>⌘V</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Select All <SC>⌘A</SC></DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Find… <SC>⌘F</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Find and Replace… <SC>⌥⌘F</SC></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View */}
        <DropdownMenu {...menuProps("view")}>
          <DropdownMenuTrigger {...triggerProps("view")}>View</DropdownMenuTrigger>
          <DropdownMenuContent className={CONTENT_CLS} sideOffset={0} align="start">
            <DropdownMenuItem className={ITEM_CLS}>Show Toolbar</DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Show Sidebar</DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Enter Full Screen <SC>⌃⌘F</SC></DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Reload Page <SC>⌘R</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Developer Tools <SC>⌥⌘I</SC></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Go */}
        <DropdownMenu {...menuProps("go")}>
          <DropdownMenuTrigger {...triggerProps("go")}>Go</DropdownMenuTrigger>
          <DropdownMenuContent className={CONTENT_CLS} sideOffset={0} align="start">
            <DropdownMenuItem className={ITEM_CLS}>Home <SC>⌘1</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Projects <SC>⌘2</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>About <SC>⌘3</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Contact <SC>⌘4</SC></DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Back <SC>⌘[</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Forward <SC>⌘]</SC></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Window */}
        <DropdownMenu {...menuProps("window")}>
          <DropdownMenuTrigger {...triggerProps("window")}>Window</DropdownMenuTrigger>
          <DropdownMenuContent className={CONTENT_CLS} sideOffset={0} align="start">
            <DropdownMenuItem className={ITEM_CLS}>Minimize <SC>⌘M</SC></DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Zoom</DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Bring All to Front</DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={cn(ITEM_CLS, "gap-2")}>
              <span className="text-foreground/90">✓</span>
              Portfolio
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <DropdownMenu {...menuProps("help")}>
          <DropdownMenuTrigger {...triggerProps("help")}>Help</DropdownMenuTrigger>
          <DropdownMenuContent className={CONTENT_CLS} sideOffset={0} align="start">
            <DropdownMenuItem className={ITEM_CLS}>Search… <SC>⌘?</SC></DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Portfolio Help</DropdownMenuItem>
            <DropdownMenuSeparator className={SEP_CLS} />
            <DropdownMenuItem className={ITEM_CLS}>Report a Bug</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>

      {/* ── RIGHT — System tray ────────────────────────────────────────── */}
      <div className="flex items-center h-full">

        {/* Spotlight */}
        <button className={sysTriggerCls} aria-label="Spotlight Search">
          <Search size={13} strokeWidth={2} />
        </button>

        {/* Control Center */}
        <button className={sysTriggerCls} aria-label="Control Center">
          <SlidersHorizontal size={13} strokeWidth={2} />
        </button>

        {/* Wi-Fi */}
        <button className={sysTriggerCls} aria-label="Wi-Fi">
          <Wifi size={14} strokeWidth={2} />
        </button>

        {/* Battery */}
        <button className={sysTriggerCls} aria-label="Battery">
          <BatteryMedium size={16} strokeWidth={1.75} />
          <span className="text-[12px]">87%</span>
        </button>

        {/* Clock — opens analog clock + calendar popover */}
        <Popover open={clockOpen} onOpenChange={setClockOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                sysTriggerCls,
                "px-3 text-[13px] tabular-nums",
                clockOpen && "bg-foreground/10"
              )}
              aria-label="Date and Time"
            >
              {dateStr}&nbsp;&nbsp;{timeStr}
            </button>
          </PopoverTrigger>

          <PopoverContent
            className="menubar-dropdown w-[280px] p-0 shadow-2xl rounded-xl border-border overflow-hidden"
            sideOffset={4}
            align="end"
          >
            {/* Analog clock */}
            <div className="px-4 pt-5 pb-3 flex flex-col items-center gap-1 border-b border-border/60">
              {now && <AnalogClock date={now} />}
              <p className="text-[22px] font-light tabular-nums text-foreground/90 tracking-tight">
                {timeStr}
              </p>
              <p className="text-[12px] text-foreground/50 pb-1">
                {now?.toLocaleDateString("en-US", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>

            {/* Calendar */}
            <div className="p-2">
              <Calendar
                mode="single"
                selected={now ?? undefined}
                onSelect={() => {}}
                className="w-full"
              />
            </div>
          </PopoverContent>
        </Popover>

      </div>
    </div>
  );
}
