import React from "react";
import { Play, Pause, X } from "lucide-react";
import { useAudio } from "../context/AudioContextProvider";

function formatTime(sec) {
  if (!sec || isNaN(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function GlobalAudioBar() {
  const {
    currentTrack,
    isPlaying,
    pause,
    resume,
    stop,
    currentTime,
    duration,
    progress
  } = useAudio();

  if (!currentTrack) return null;

  // 🎵 Extract 2 letters from file name
  const getShortName = (name) => {
    if (!name) return "AA";
    const base = name.split(".")[0];
    const letters = base.replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (letters.length === 0) return "AA";
    return letters.slice(0, 2);
  };

  const shortName = getShortName(currentTrack.name);
  const cover =
    currentTrack.thumbnailUrl || currentTrack.coverImage || "/music1.jpg";

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur border-t border-slate-200 shadow-lg p-3 flex flex-col gap-2 z-50 transition-all">
      <div className="flex items-center justify-between">
        {/* Left: Track Info */}
        <div className="flex items-center gap-3 w-1/3">
          <div className="relative w-12 h-12 rounded-md overflow-hidden shadow-md flex-shrink-0">
            <img
              src={cover}
              alt="cover"
              className="w-full h-full object-cover opacity-90"
            />
            {/* Overlay with 2-letter short name */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white font-semibold text-sm select-none">
              {shortName}
            </div>
          </div>

          <div className="truncate">
            <div className="font-semibold text-slate-800 truncate">
              {currentTrack.name}
            </div>
            <div className="text-sm text-slate-500 truncate">
              Playing from Merged List
            </div>
          </div>
        </div>

        {/* Center Controls */}
        <div className="flex flex-col items-center w-1/3">
          <div className="flex items-center gap-4 mb-1">
            {isPlaying ? (
              <button
                onClick={pause}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow transition">
                <Pause className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={resume}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow transition">
                <Play className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={stop}
              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 shadow transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-xs text-slate-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Right: Waveform */}
        <div className="w-1/3 flex justify-end">
          <div
            id="global-waveform"
            className="w-[80%] h-[60px] bg-slate-100 rounded-lg overflow-hidden cursor-pointer"
          />
        </div>
      </div>

      {/* progress bar */}
      <div className="relative w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
        <div
          className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-200"
          style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}
