"use client";

import { useState, useEffect } from "react";
import { Desktop }     from "@/components/desktop";
import { LoginScreen } from "@/components/login-screen";
import { SleepScreen } from "@/components/sleep-screen";

type Stage = "sleep" | "login" | "desktop";

export default function Home() {
  const [stage, setStage] = useState<Stage>("sleep");

  // Apple menu → Sleep fires a custom event from the menu bar (which lives in layout)
  useEffect(() => {
    const onSleep = () => setStage("sleep");
    window.addEventListener("portfolio:sleep", onSleep);
    return () => window.removeEventListener("portfolio:sleep", onSleep);
  }, []);

  return (
    <>
      {/* Desktop is always mounted underneath — wakes instantly */}
      <Desktop />

      {/* Login screen sits between BIOS and desktop.
          Visible during "sleep" too (BIOS overlay covers it). */}
      {stage !== "desktop" && (
        <LoginScreen
          onLogin={() => setStage("desktop")}
          onSleep={() => setStage("sleep")}
        />
      )}

      {/* BIOS / sleep screen — topmost layer */}
      {stage === "sleep" && (
        <SleepScreen onWake={() => setStage("login")} />
      )}
    </>
  );
}
