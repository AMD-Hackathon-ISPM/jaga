"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CoughRecording } from "@/store/session.store";
import { useT } from "@/hooks/use-t";
import {
  computeGlowField,
  computeLabelLayout,
  downsamplePeaks,
  localRmsAtEvents,
} from "./cough-focus-utils";

const BAR_COUNT = 240;
const WAVE_SIGMA_MS = 700;
const HEAT_SIGMA_MS = 480;
const WAVE_GLOW_MAX_ALPHA = 0.5;
const NAMED_LABEL_MAX = 8;
const LABEL_MIN_GAP_PX = 56;

interface DecodedFigure {
  peaks: number[];
  intensities: number[];
  durationMs: number;
}

type Status = "loading" | "ready" | "error";

function readVar(el: Element, name: string, fallback: string): string {
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || fallback;
}

export function CoughFocusFigure({ recording }: { recording: CoughRecording }) {
  const t = useT();
  const waveRef = useRef<HTMLCanvasElement>(null);
  const heatRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const captionId = useId();
  const [decoded, setDecoded] = useState<DecodedFigure | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [width, setWidth] = useState(0);

  const events = recording.coughEvents;
  const coughCount = events.length;
  const caption = t("result.coughFocus.caption");
  const ariaLabel = t("result.coughFocus.aria").replace("{n}", String(coughCount));

  useEffect(() => {
    let cancelled = false;
    const OfflineAudioCtor =
      typeof window !== "undefined"
        ? window.OfflineAudioContext ||
          (window as unknown as {
            webkitOfflineAudioContext?: typeof OfflineAudioContext;
          }).webkitOfflineAudioContext
        : undefined;

    if (!OfflineAudioCtor) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    const ctx = new OfflineAudioCtor(1, 1, 44_100);

    (async () => {
      try {
        const buffer = await recording.file.arrayBuffer();
        const audio = await ctx.decodeAudioData(buffer);
        if (cancelled) return;
        const mono = audio.getChannelData(0);
        setDecoded({
          peaks: downsamplePeaks(mono, BAR_COUNT),
          intensities: localRmsAtEvents(mono, audio.sampleRate, recording.coughEvents),
          durationMs: recording.durationMs,
        });
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [recording.file, recording.durationMs, recording.coughEvents]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (status !== "ready" || !decoded || width <= 0) return;
    const wave = waveRef.current;
    const heat = heatRef.current;
    if (!wave || !heat) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const ink = readVar(wave, "--ink", "#2D3748");
    const orange = readVar(wave, "--focus-ramp-5", "#B33A00");
    const focusRamp = [
      readVar(heat, "--focus-ramp-1", "#FDF3E5"),
      readVar(heat, "--focus-ramp-2", "#F7D5A7"),
      readVar(heat, "--focus-ramp-3", "#EEA45F"),
      readVar(heat, "--focus-ramp-4", "#DC6B25"),
      readVar(heat, "--focus-ramp-5", "#B33A00"),
    ];

    const wCtx = wave.getContext("2d");
    if (wCtx) {
      const w = Math.floor(wave.clientWidth * dpr);
      const h = Math.floor(wave.clientHeight * dpr);
      wave.width = w;
      wave.height = h;
      wCtx.clearRect(0, 0, w, h);

      const glow = computeGlowField(
        w,
        decoded.durationMs > 0 ? events : [],
        decoded.durationMs,
        decoded.intensities,
        WAVE_SIGMA_MS,
      );
      wCtx.fillStyle = orange;
      for (let x = 0; x < glow.length; x++) {
        const a = glow[x];
        if (a <= 0) continue;
        wCtx.globalAlpha = a * WAVE_GLOW_MAX_ALPHA;
        wCtx.fillRect(x, 0, 1, h);
      }

      wCtx.globalAlpha = 1;
      wCtx.fillStyle = ink;
      const mid = h / 2;
      const slot = w / decoded.peaks.length;
      const barW = Math.max(dpr, slot * 0.62);
      const radius = Math.min(barW / 2, 2 * dpr);
      const minBar = 1.5 * dpr;
      for (let i = 0; i < decoded.peaks.length; i++) {
        const barH = Math.max(minBar, decoded.peaks[i] * h * 0.9);
        const x = i * slot + (slot - barW) / 2;
        wCtx.beginPath();
        wCtx.roundRect(x, mid - barH / 2, barW, barH, radius);
        wCtx.fill();
      }
    }

    const hCtx = heat.getContext("2d");
    if (hCtx) {
      const w = Math.floor(heat.clientWidth * dpr);
      const h = Math.floor(heat.clientHeight * dpr);
      heat.width = w;
      heat.height = h;
      hCtx.clearRect(0, 0, w, h);
      hCtx.fillStyle = focusRamp[0];
      hCtx.fillRect(0, 0, w, h);

      const field = computeGlowField(
        w,
        decoded.durationMs > 0 ? events : [],
        decoded.durationMs,
        decoded.intensities,
        HEAT_SIGMA_MS,
      );
      for (let x = 0; x < field.length; x++) {
        const rampIndex = Math.round(field[x] * (focusRamp.length - 1));
        if (rampIndex === 0) continue;
        hCtx.fillStyle = focusRamp[rampIndex];
        hCtx.fillRect(x, 0, 1, h);
      }
    }
  }, [status, decoded, width, events]);

  const ramp = [
    "bg-focus-ramp-1",
    "bg-focus-ramp-2",
    "bg-focus-ramp-3",
    "bg-focus-ramp-4",
    "bg-focus-ramp-5",
  ];

  if (status === "error") {
    return (
      <figure className="flex flex-col gap-3">
        <div
          className="flex h-28 items-center justify-center rounded-control border border-border-subtle bg-surface-sunken px-4 text-center"
          role="status"
        >
          <span className="text-sm text-ink-muted">{t("result.coughFocus.unavailable")}</span>
        </div>
        <figcaption id={captionId} className="text-sm text-ink-muted">
          {caption}
        </figcaption>
      </figure>
    );
  }

  const labels =
    status === "ready" && decoded
      ? computeLabelLayout(events, decoded.durationMs, width || 320, LABEL_MIN_GAP_PX)
      : [];
  const useNumerals = coughCount > NAMED_LABEL_MAX;

  return (
    <figure className="flex flex-col gap-3">
      <div
        className="flex flex-col gap-3"
        role="img"
        aria-label={ariaLabel}
        aria-describedby={captionId}
      >
        <div
          ref={containerRef}
          className="rounded-control border border-border-subtle bg-surface p-4"
        >
          <canvas ref={waveRef} className="h-28 w-full" aria-hidden="true" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-muted">{t("result.coughFocus.focusLabel")}</p>
          <div className="h-4 w-full overflow-hidden rounded-full border border-border-subtle">
            <canvas ref={heatRef} className="h-full w-full" aria-hidden="true" />
          </div>

          {coughCount > 0 && (
            <div className="relative h-4">
              {labels.map((placement, i) => {
                if (!useNumerals && !placement.show) return null;
                const renderedWidth = width || 320;
                const x = placement.fraction * renderedWidth;
                const edgePadding = useNumerals ? 8 : LABEL_MIN_GAP_PX / 2;
                const transform =
                  x <= edgePadding
                    ? "none"
                    : renderedWidth - x <= edgePadding
                      ? "translateX(-100%)"
                      : "translateX(-50%)";

                return (
                  <span
                    key={i}
                    className="absolute whitespace-nowrap text-xs text-ink-muted tabular-nums"
                    style={{ left: `${placement.fraction * 100}%`, transform }}
                  >
                    {useNumerals
                      ? String(i + 1)
                      : t("result.coughFocus.coughLabel").replace("{n}", String(i + 1))}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span>{t("result.coughFocus.legendLow")}</span>
          <span className="flex items-center gap-1" aria-hidden="true">
            {ramp.map((cls) => (
              <span key={cls} className={`h-3 w-5 rounded-sm ${cls}`} />
            ))}
          </span>
          <span>{t("result.coughFocus.legendHigh")}</span>
        </div>
      </div>

      <figcaption id={captionId} className="text-sm text-ink-muted">
        {caption}
      </figcaption>
    </figure>
  );
}
