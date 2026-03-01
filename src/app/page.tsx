"use client";

import { useState } from "react";
import { Desktop }     from "@/components/desktop";
import { LoginScreen } from "@/components/login-screen";
import { SleepScreen } from "@/components/sleep-screen";

type Stage = "sleep" | "login" | "desktop";

export default function Home() {
  const [stage, setStage] = useState<Stage>("sleep");

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
