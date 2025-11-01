import React, { useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import axios from "axios";
import { Play, Pause, Loader2 } from "lucide-react";

export default function MergedAudioItem({ fileId, fileName }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const waveformRef = useRef(null);
  const ws = useRef(null);

  const createWaveSurfer = (blobUrl) => {
    ws.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#94a3b8",
      progressColor: "#3b82f6",
      cursorColor: "#1e293b",
      height: 70,
      responsive: true
    });
    ws.current.load(blobUrl);

    ws.current.on("ready", () => {
      setIsLoading(false);
      ws.current.play();
      setIsPlaying(true);
    });

    ws.current.on("finish", () => {
      setIsPlaying(false);
    });
  };

  const handlePlayPause = async () => {
    if (isPlaying && ws.current) {
      ws.current.pause();
      setIsPlaying(false);
      return;
    }

    // first time play → lazy load
    if (!ws.current) {
      try {
        setIsLoading(true);
        const res = await axios.get(
          `http://localhost:4000/api/drive/file/${fileId}`,
          { responseType: "blob", withCredentials: true }
        );
        const blobUrl = URL.createObjectURL(res.data);
        createWaveSurfer(blobUrl);
      } catch (err) {
        console.error("❌ Failed to load:", err.message);
        setIsLoading(false);
      }
    } else {
      ws.current.play();
      setIsPlaying(true);
    }
  };

  // cleanup on unmount
  React.useEffect(() => {
    return () => ws.current?.destroy();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="font-medium truncate w-3/4" title={fileName}>
          {fileName}
        </div>
        <button
          onClick={handlePlayPause}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
          {isLoading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* waveform container */}
      <div
        ref={waveformRef}
        className="w-full h-[80px] bg-slate-100 rounded-lg overflow-hidden"
      />
    </div>
  );
}
