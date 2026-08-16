import { useEffect, useState } from "react";
import { Radar } from "lucide-react";
import { useVoice } from "@/state/voice-store";

const WORD = "WAREMIND".split("");

export function Intro() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const { speak } = useVoice();

  useEffect(() => {
    const speakTimer = window.setTimeout(() => {
      speak(
        "Welcome to WareMind. Your autonomous warehouse copilot is online. Warehouse telemetry synced.",
      );
    }, 900);
    const fadeTimer = window.setTimeout(() => setFading(true), 2600);
    const hideTimer = window.setTimeout(() => setVisible(false), 3300);
    return () => {
      window.clearTimeout(speakTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-background transition-opacity duration-700"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 bg-gradient-glow animate-pulse-glow" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-primary animate-scanline" />

      <div className="relative text-center">
        <span className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-gradient-primary shadow-[0_20px_60px_-20px_oklch(0.5_0.24_268)] animate-float">
          <Radar className="size-8 text-primary-foreground" />
        </span>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
          {WORD.map((letter, i) => (
            <span
              key={`${letter}-${i}`}
              className="inline-block"
              style={{
                animation: `wm-letter 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 90}ms both`,
              }}
            >
              {i < 4 ? (
                letter
              ) : (
                <span className="text-gradient">{letter}</span>
              )}
            </span>
          ))}
        </h1>
        <p
          className="mt-4 text-xs uppercase tracking-[0.4em] text-muted-foreground sm:text-sm"
          style={{ animation: "wm-rise 0.7s cubic-bezier(0.22,1,0.36,1) 900ms both" }}
        >
          Autonomous Warehouse Copilot
        </p>
        <div
          className="relative mx-auto mt-8 h-0.5 w-56 overflow-hidden rounded-full bg-muted"
          style={{ animation: "wm-rise 0.7s ease 1.1s both" }}
        >
          <div className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-primary animate-sweep" />
        </div>
        <p
          className="mt-3 font-mono text-[11px] text-muted-foreground"
          style={{ animation: "wm-rise 0.7s ease 1.3s both" }}
        >
          Initialising decision engine · syncing inventory · calibrating zones
        </p>
      </div>
    </div>
  );
}
