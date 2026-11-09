"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const MAX_RECORDING_SECONDS = 120;

export type VoiceState = "idle" | "recording" | "denied";

/** Grava áudio com MediaRecorder e libera o microfone ao parar ou desmontar. */
export function useVoiceRecorder(onAudio: (audio: Blob) => void) {
  const [state, setState] = useState<VoiceState>("idle");
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const send = useRef(false);
  const onAudioRef = useRef(onAudio);

  useEffect(() => {
    onAudioRef.current = onAudio;
  });

  const stop = useCallback((deliver: boolean) => {
    send.current = deliver;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
    else recorder.current?.stream.getTracks().forEach((t) => t.stop());
    recorder.current = null;
    setState("idle");
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("denied");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (send.current && chunks.length) onAudioRef.current(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
      };
      recorder.current = rec;
      rec.start();
      setSeconds(0);
      setState("recording");
      let elapsed = 0;
      timer.current = setInterval(() => {
        elapsed += 1;
        setSeconds(elapsed);
        if (elapsed >= MAX_RECORDING_SECONDS) stop(true);
      }, 1000);
    } catch {
      setState("denied");
    }
  }, [stop]);

  useEffect(() => () => stop(false), [stop]);

  return { state, seconds, start, stop };
}
