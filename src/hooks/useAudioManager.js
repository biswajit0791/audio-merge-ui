import { useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

export default function useAudioManager() {
  const ws = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);

  const fade = (from, to, duration = 800) => {
    const steps = 25;
    const stepTime = duration / steps;
    const volStep = (to - from) / steps;
    let current = from;

    const interval = setInterval(() => {
      current += volStep;
      ws.current?.setVolume(Math.max(0, Math.min(1, current)));
      if ((volStep > 0 && current >= to) || (volStep < 0 && current <= to))
        clearInterval(interval);
    }, stepTime);
  };

  const createGradient = (ctx, width) => {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#6366F1"); // indigo
    gradient.addColorStop(0.5, "#3B82F6"); // blue
    gradient.addColorStop(1, "#06B6D4"); // cyan
    return gradient;
  };

  const playTrack = (blobUrl, trackMeta) => {
    setCurrentTrack(trackMeta);

    const waitForContainer = setInterval(() => {
      const container = document.querySelector("#global-waveform");
      if (!container) return;
      clearInterval(waitForContainer);

      if (ws.current) ws.current.destroy();

      const tempCanvas = document.createElement("canvas");
      const ctx = tempCanvas.getContext("2d");
      const gradient = createGradient(ctx, 400);

      const instance = WaveSurfer.create({
        container,
        waveColor: gradient,
        progressColor: "#10B981",
        cursorColor: "rgba(0,0,0,0.15)",
        cursorWidth: 1,
        height: 80,
        barWidth: 2.5,
        barGap: 1.5,
        barRadius: 3,
        normalize: true,
        responsive: true,
        fillParent: true,
        minPxPerSec: 40,
        pixelRatio: 2,
        interact: true,
        backend: "WebAudio",
      });

      ws.current = instance;
      instance.load(blobUrl);

      instance.on("ready", () => {
        setDuration(instance.getDuration());
        instance.setVolume(0);
        instance.play();
        fade(0, 1, 800);
        setIsPlaying(true);
        const waveEl = container.querySelector("wave");
        if (waveEl) {
          waveEl.style.opacity = "0";
          waveEl.style.transition = "opacity 0.8s ease-in-out";
          requestAnimationFrame(() => (waveEl.style.opacity = "1"));
        }
      });

      instance.on("play", () => {
        container.style.boxShadow = "0 0 25px rgba(59,130,246,0.5)";
        container.style.transition = "box-shadow 0.4s ease";
      });
      instance.on("pause", () => {
        container.style.boxShadow = "none";
      });
      instance.on("finish", () => {
        setIsPlaying(false);
        setProgress(100);
        container.style.boxShadow = "none";
      });

      instance.on("audioprocess", () => {
        const t = instance.getCurrentTime();
        setCurrentTime(t);
        setProgress((t / instance.getDuration()) * 100);
      });

      instance.on("seek", () => {
        const t = instance.getCurrentTime();
        setCurrentTime(t);
        setProgress((t / instance.getDuration()) * 100);
      });
    }, 100);
  };

  const pause = () => {
    if (!ws.current) return;
    fade(ws.current.getVolume(), 0, 400);
    setTimeout(() => {
      ws.current.pause();
      ws.current.setVolume(1);
      setIsPlaying(false);
    }, 400);
  };

  const resume = () => {
    if (!ws.current) return;
    ws.current.play();
    ws.current.setVolume(0);
    fade(0, 1, 400);
    setIsPlaying(true);
  };

  const stop = () => {
    ws.current?.destroy();
    ws.current = null;
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  };

  return {
    ws,
    currentTrack,
    isPlaying,
    playTrack,
    pause,
    resume,
    stop,
    currentTime,
    duration,
    progress,
  };
}
