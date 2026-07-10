"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createCoughDetector } from "@/lib/cough-detector";
import type { CoughRecording } from "@/store/session.store";

export type RecorderState = "idle" | "requesting" | "recording" | "denied" | "error";

const WEBM_TYPES = ["audio/webm;codecs=opus", "audio/webm"];

/** Hard cap on a single cough recording. Auto-stops and captures at this point. */
export const RECORDING_MS = 90_000;

/** Countdown/UI refresh cadence for `elapsedMs`. */
const ELAPSED_INTERVAL_MS = 250;

export function selectRecorderMimeType(isTypeSupported: (type: string) => boolean) {
  const mimeType = WEBM_TYPES.find(isTypeSupported);
  if (!mimeType) throw new Error("WebM audio recording is unavailable.");
  return mimeType;
}

/**
 * Per-take mutable session, created inside start() and closed over by that
 * take's recorder handlers and sampling loop. Nothing here is shared across
 * takes, so a stale async `onstop` from a discarded take can neither capture
 * nor corrupt a newer take.
 */
interface Take {
  discarded: boolean;
  startMs: number;
  durationMs: number;
  coughEvents: number[];
}

/**
 * Single-session cough recorder.
 *
 * `start()` records with a hard `RECORDING_MS` cap (auto-stop → capture);
 * `stop()` captures whatever has been recorded so far; `restart()` discards the
 * current take and immediately re-arms a fresh recording ("Record again").
 *
 * While recording, the AnalyserNode's time-domain RMS is sampled each animation
 * frame and fed to a heuristic cough detector; each detection appends a
 * millisecond offset to `coughEvents`. The capture callback receives the full
 * `CoughRecording` (file + durationMs + coughEvents).
 */
export function useCoughRecorder(onCaptured: (rec: CoughRecording) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [coughEvents, setCoughEvents] = useState<number[]>([]);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  // Generation counter: bumped by every teardown and every start(). Async work
  // (the getUserMedia continuation, the RAF sampling loop, the cap timer)
  // captures the generation it belongs to and bails if it no longer matches —
  // so a stop()/restart()/unmount during `await getUserMedia` cancels the
  // start, and a cancelled sampling loop can never reschedule itself.
  const genRef = useRef(0);
  const takeRef = useRef<Take | null>(null);
  const startingRef = useRef(false);

  const rafRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const capTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest capture callback without forcing start/restart to re-create.
  const onCapturedRef = useRef(onCaptured);
  useEffect(() => {
    onCapturedRef.current = onCaptured;
  }, [onCaptured]);

  const clearTimers = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (elapsedTimerRef.current !== null) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (capTimerRef.current !== null) {
      clearTimeout(capTimerRef.current);
      capTimerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  /**
   * End the active take. With `discard: false` the recorder's async `onstop`
   * fires the capture using `durationMs`; with `discard: true` it is dropped.
   * Bumps the generation so any in-flight start(), sampling frame, or cap
   * timer belonging to this (or a pending) take bails.
   */
  const teardown = useCallback(
    (discard: boolean, durationMs = 0) => {
      genRef.current += 1;
      const take = takeRef.current;
      if (take) {
        take.discarded = discard;
        take.durationMs = durationMs;
      }
      takeRef.current = null;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      recorderRef.current = null;
      clearTimers();
      cleanup();
    },
    [cleanup, clearTimers],
  );

  const stop = useCallback(() => {
    const take = takeRef.current;
    teardown(false, take ? performance.now() - take.startMs : 0);
    setState("idle");
  }, [teardown]);

  const start = useCallback(async () => {
    if (startingRef.current || recorderRef.current?.state === "recording") return;
    startingRef.current = true;
    const gen = ++genRef.current;
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (genRef.current !== gen) {
        // stop()/restart()/unmount won the race while we awaited permission —
        // release the just-acquired stream and bail without arming anything.
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const mimeType = selectRecorderMimeType(MediaRecorder.isTypeSupported);
      const recorder = new MediaRecorder(stream, { mimeType });

      // Per-take state, closed over by this recorder's handlers only.
      const take: Take = { discarded: false, startMs: 0, durationMs: 0, coughEvents: [] };
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onstop = () => {
        if (take.discarded) return;
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size === 0) return;
        onCapturedRef.current({
          file: new File([blob], `cough-${Date.now()}.webm`, {
            type: mimeType,
            lastModified: Date.now(),
          }),
          durationMs: take.durationMs,
          coughEvents: take.coughEvents.slice(),
        });
      };
      recorderRef.current = recorder;
      takeRef.current = take;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      const sampleBuf = new Float32Array(analyser.fftSize);
      const detector = createCoughDetector();

      setCoughEvents([]);
      take.startMs = performance.now();
      setElapsedMs(0);

      recorder.start();

      // Sample the AnalyserNode RMS each frame and feed the detector.
      const sample = () => {
        if (genRef.current !== gen) return; // cancelled — never reschedule
        if (typeof analyser.getFloatTimeDomainData === "function") {
          analyser.getFloatTimeDomainData(sampleBuf);
          let sum = 0;
          for (let i = 0; i < sampleBuf.length; i += 1) sum += sampleBuf[i] * sampleBuf[i];
          const rms = Math.sqrt(sum / sampleBuf.length);
          const atMs = performance.now() - take.startMs;
          if (detector.push(rms, atMs)) {
            take.coughEvents.push(atMs);
            setCoughEvents(take.coughEvents.slice());
          }
        }
        rafRef.current = requestAnimationFrame(sample);
      };
      rafRef.current = requestAnimationFrame(sample);

      elapsedTimerRef.current = setInterval(() => {
        setElapsedMs(Math.min(performance.now() - take.startMs, RECORDING_MS));
      }, ELAPSED_INTERVAL_MS);

      // Hard cap: auto-stop and capture at RECORDING_MS.
      capTimerRef.current = setTimeout(() => {
        if (genRef.current !== gen) return;
        setElapsedMs(RECORDING_MS);
        teardown(false, RECORDING_MS);
        setState("idle");
      }, RECORDING_MS);

      setState("recording");
    } catch (err) {
      if (genRef.current === gen) {
        teardown(true);
        const denied = err instanceof DOMException && err.name === "NotAllowedError";
        setState(denied ? "denied" : "error");
      }
    } finally {
      startingRef.current = false;
    }
  }, [teardown]);

  /** Discard the current take (no capture) and immediately re-arm recording. */
  const restart = useCallback(() => {
    teardown(true);
    setCoughEvents([]);
    setElapsedMs(0);
    setState("idle");
    return start();
  }, [teardown, start]);

  useEffect(
    () => () => {
      // On unmount, tear down without capturing.
      teardown(true);
    },
    [teardown],
  );

  return { state, start, stop, restart, elapsedMs, coughEvents, analyserRef };
}
