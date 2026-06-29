"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "requesting" | "recording" | "denied" | "error";

/**
 * useCoughRecorder — live mic capture for the cough visualizer.
 *
 * Sets up getUserMedia → AudioContext → AnalyserNode so the waveform can read
 * live time-domain data. Mic permission is requested ONLY when start() is
 * called (design §3.4: permission requested when capture begins). Nothing is
 * persisted or uploaded; the audio graph lives in memory and is torn down on
 * stop/unmount.
 */
export function useCoughRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (state === "recording" || state === "requesting") return;
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

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

      setState("recording");
    } catch (err) {
      cleanup();
      const denied = err instanceof DOMException && err.name === "NotAllowedError";
      setState(denied ? "denied" : "error");
    }
  }, [state, cleanup]);

  const stop = useCallback(() => {
    cleanup();
    setState("idle");
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  return { state, start, stop, analyserRef };
}
