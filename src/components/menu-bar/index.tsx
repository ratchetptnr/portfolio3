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

// ─── Live Clock ───────────────────────────────────────────────────────────────

function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const date = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <span className="tabular-nums">
      {date}&nbsp;&nbsp;{time}
    </span>
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

  /** Click to open / close */
  const handleOpenChange = (id: MenuId, open: boolean) => {
    if (open) {
      setActiveMenu(id);
    } else {
      // Only clear if this menu is still the active one
      // (prevents race when hover-switching clears the new menu)
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
      "px-[9px] h-full flex items-center text-[13px] text-white/90",
      "hover:bg-white/15 rounded-[4px] transition-colors duration-75",
      "focus-visible:outline-none cursor-default select-none",
      activeMenu === id && "bg-white/15"
    );

  const sysTriggerCls =
    "px-[9px] h-full flex items-center gap-1.5 text-[13px] text-white/90 hover:bg-white/15 rounded-[4px] transition-colors duration-75 cursor-default select-none";

  // Shared props for every DropdownMenu
  const menuProps = (id: MenuId) => ({
    open: activeMenu === id,
    onOpenChange: (o: boolean) => handleOpenChange(id, o),
  });

  // Shared props for every DropdownMenuTrigger
  const triggerProps = (id: MenuId) => ({
    className: triggerCls(id),
    onMouseEnter: () => handleMouseEnter(id),
  });

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-7 flex items-center justify-between px-1 select-none bg-black/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.06]">

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
            <DropdownMenuItem className={ITEM_CLS}>Sleep</DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Restart…</DropdownMenuItem>
            <DropdownMenuItem className={ITEM_CLS}>Shut Down…</DropdownMenuItem>
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
              <span className="text-white/90">✓</span>
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

        {/* Clock */}
        <button className={cn(sysTriggerCls, "px-3 text-[13px]")} aria-label="Date and Time">
          <Clock />
        </button>

      </div>
    </div>
  );
}
