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
    const steps = 20;
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

  const playTrack = (blobUrl, trackMeta) => {
    setCurrentTrack(trackMeta);

    // ✅ wait until DOM has #global-waveform before creating WaveSurfer
    const waitForContainer = setInterval(() => {
      const container = document.querySelector("#global-waveform");
      if (container) {
        clearInterval(waitForContainer);
        if (ws.current) ws.current.destroy();

        const instance = WaveSurfer.create({
          container,
          waveColor: "#d1d5db",
          progressColor: "#2563eb",
          cursorColor: "#1e293b",
          height: 70,
          responsive: true,
          barWidth: 2,
          barGap: 2
        });

        ws.current = instance;

        instance.load(blobUrl);

        instance.on("ready", () => {
          setDuration(instance.getDuration());
          instance.setVolume(0);
          instance.play();
          fade(0, 1, 800);
          setIsPlaying(true);
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

        instance.on("finish", () => {
          setIsPlaying(false);
          setProgress(100);
        });
      }
    }, 100);
  };

  const pause = () => {
    if (!ws.current) return;
    fade(ws.current.getVolume(), 0, 500);
    setTimeout(() => {
      ws.current.pause();
      ws.current.setVolume(1);
      setIsPlaying(false);
    }, 500);
  };

  const resume = () => {
    if (!ws.current) return;
    ws.current.play();
    ws.current.setVolume(0);
    fade(0, 1, 500);
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
    progress
  };
}
