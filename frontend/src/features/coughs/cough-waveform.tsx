"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * CoughWaveform — full-bleed, voice-memo-style live waveform on a <canvas>.
 *
 * Reads live time-domain RMS from the analyser each frame and scrolls bars
 * right → left (design §7.2). Transparent background so it sits in the cream
 * frame with no box. Under prefers-reduced-motion it renders a static centered
 * level meter instead of a scrolling animation (design §7.2 reduced-motion).
 */
export function CoughWaveform({
  analyserRef,
  active,
}: {
  analyserRef: MutableRefObject<AnalyserNode | null>;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const brand =
      getComputedStyle(canvas).getPropertyValue("--brand").trim() || "#007A87";
    const BAR_W = 3 * dpr;
    const GAP = 3 * dpr;

    const sampleAmplitude = (): number => {
      const analyser = active ? analyserRef.current : null;
      if (!analyser) return 0;
      const buf = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      return Math.min(1, Math.sqrt(sum / buf.length) * 1.8);
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const mid = h / 2;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = brand;

      const amp = sampleAmplitude();

      if (reduce) {
        // Static level meter: one centered bar that grows with input level.
        const barH = Math.max(2 * dpr, amp * h * 0.9);
        ctx.fillRect(w / 2 - BAR_W / 2, mid - barH / 2, BAR_W, barH);
      } else {
        // Scrolling voice-memo waveform.
        const maxBars = Math.max(1, Math.floor(w / (BAR_W + GAP)));
        const hist = historyRef.current;
        hist.push(amp);
        if (hist.length > maxBars) hist.splice(0, hist.length - maxBars);
        for (let i = 0; i < hist.length; i++) {
          const a = hist[hist.length - 1 - i];
          const barH = Math.max(2 * dpr, a * h * 0.9);
          const x = w - (i + 1) * (BAR_W + GAP);
          const radius = BAR_W / 2;
          ctx.beginPath();
          ctx.roundRect(x, mid - barH / 2, BAR_W, barH, radius);
          ctx.fill();
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active, analyserRef]);

  return (
    <canvas
      ref={canvasRef}
      className="h-28 w-full"
      role="img"
      aria-label={active ? "Live cough input level" : "Cough waveform, idle"}
    />
  );
}
