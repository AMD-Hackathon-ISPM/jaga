"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "requesting" | "recording" | "denied" | "error";

const WEBM_TYPES = ["audio/webm;codecs=opus", "audio/webm"];

export function selectRecorderMimeType(isTypeSupported: (type: string) => boolean) {
  const mimeType = WEBM_TYPES.find(isTypeSupported);
  if (!mimeType) throw new Error("WebM audio recording is unavailable.");
  return mimeType;
}

export function useCoughRecorder(onCaptured: (file: File) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

      const mimeType = selectRecorderMimeType(MediaRecorder.isTypeSupported);
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size > 0) {
          onCaptured(
            new File([blob], `cough-${Date.now()}.webm`, {
              type: mimeType,
              lastModified: Date.now(),
            }),
          );
        }
        chunksRef.current = [];
      };
      recorderRef.current = recorder;
      recorder.start();

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
  }, [state, cleanup, onCaptured]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recorderRef.current = null;
    cleanup();
    setState("idle");
  }, [cleanup]);

  useEffect(
    () => () => {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      cleanup();
    },
    [cleanup],
  );

  return { state, start, stop, analyserRef };
}
