"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "./Logo";

const SPLASH_SEEN_KEY = "isf.intro.completed";

type SplashPhase = "checking" | "revealing" | "ready" | "leaving" | "done";

function playChime() {
  try {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.12, now);
    master.connect(ctx.destination);

    const notes: Array<{ freq: number; at: number; dur: number }> = [
      { freq: 659.25, at: 0, dur: 1.1 }, // E5
      { freq: 987.77, at: 0.22, dur: 1.4 }, // B5
    ];
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(note.freq, now + note.at);
      gain.gain.setValueAtTime(0, now + note.at);
      gain.gain.linearRampToValueAtTime(1, now + note.at + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(now + note.at);
      osc.stop(now + note.at + note.dur + 0.1);
    }
    window.setTimeout(() => {
      void ctx.close();
    }, 2600);
  } catch {
    // Sound is a garnish; never let it break the entrance.
  }
}

export default function FirstRunSplash() {
  const [phase, setPhase] = useState<SplashPhase>("checking");
  const chimedRef = useRef(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = window.localStorage.getItem(SPLASH_SEEN_KEY) === "true";
    } catch {
      seen = true;
    }
    if (seen) {
      setPhase("done");
      return;
    }
    setPhase("revealing");
    // Best effort: browsers with autoplay permission hear the chime with the
    // reveal; everyone else hears it on Begin (a real user gesture).
    window.setTimeout(() => {
      if (!chimedRef.current) {
        playChime();
        chimedRef.current = true;
      }
    }, 500);
    const readyTimer = window.setTimeout(() => setPhase("ready"), 1600);
    return () => window.clearTimeout(readyTimer);
  }, []);

  const handleBegin = useCallback(() => {
    if (!chimedRef.current) {
      playChime();
      chimedRef.current = true;
    }
    try {
      window.localStorage.setItem(SPLASH_SEEN_KEY, "true");
    } catch {
      // no-op: worst case the splash shows again next visit
    }
    setPhase("leaving");
    window.setTimeout(() => setPhase("done"), 600);
  }, []);

  if (phase === "checking" || phase === "done") return null;

  return (
    <div
      data-testid="first-run-splash"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-canvas transition-opacity duration-500 ${
        phase === "leaving" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="motion-safe:animate-[splash-logo-in_900ms_ease-out_both]">
        <Logo size={88} />
      </div>
      <h1 className="mt-7 font-serif text-[40px] text-ink motion-safe:animate-[splash-rise_700ms_ease-out_300ms_both]">
        Granite
      </h1>
      <p className="mt-2 font-sans text-[15px] text-muted motion-safe:animate-[splash-rise_700ms_ease-out_550ms_both]">
        ISF grant writing, thought through.
      </p>
      <button
        onClick={handleBegin}
        disabled={phase !== "ready" && phase !== "leaving"}
        className={`mt-14 border-b border-ink pb-0.5 font-sans text-[15px] tracking-[0.02em] text-ink transition-opacity duration-700 ${
          phase === "revealing" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        Begin
      </button>
    </div>
  );
}
