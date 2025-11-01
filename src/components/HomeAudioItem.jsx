import React, { useState } from "react";
import axios from "axios";
import { Play, Loader2 } from "lucide-react";

export default function HomeAudioItem({ track, onPlay }) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePlay = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:4000/api/drive/file/${track.id}`,
        { responseType: "blob", withCredentials: true }
      );
      const blobUrl = URL.createObjectURL(res.data);
      onPlay(blobUrl, track);
    } catch (err) {
      console.error("❌ Error loading:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4 flex justify-between items-center">
      <div className="flex items-center gap-3 w-3/4">
        <img
          src={track.thumbnailUrl || "/placeholder.jpg"}
          alt=""
          className="w-12 h-12 rounded-md object-cover"
        />
        <div className="truncate font-medium" title={track.name}>
          {track.name}
        </div>
      </div>
      <button
        onClick={handlePlay}
        disabled={isLoading}
        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
        {isLoading ? (
          <Loader2 className="animate-spin w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
