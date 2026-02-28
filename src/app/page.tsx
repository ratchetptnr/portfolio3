"use client";

import { useState } from "react";
import { Desktop } from "@/components/desktop";
import { SleepScreen } from "@/components/sleep-screen";

export default function Home() {
  const [awake, setAwake] = useState(false);

  return (
    <>
      <Desktop />
      {!awake && <SleepScreen onWake={() => setAwake(true)} />}
    </>
  );
}
