import React, { useEffect, useState } from "react";
import axios from "axios";
import { Play, Trash2, Loader2, Clock } from "lucide-react";
import { useAudio } from "../context/AudioContextProvider";
import API from "../api";

export default function MergedListPage() {
  const [mergedFiles, setMergedFiles] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const { playTrack } = useAudio();

  useEffect(() => {
    loadMergedFiles();
  }, []);

  // ✅ Fetch merged files list from Google Drive ("programs" folder)
  const loadMergedFiles = async () => {
    try {
      const res = await API.get("/api/merged", { withCredentials: true });
      setMergedFiles(res.data || []);
    } catch (err) {
      console.error("❌ Error loading merged files:", err.message);
    }
  };

  // ✅ Handle play with Drive → Local fallback
  const handlePlay = async (file) => {
    setLoadingId(file.id || file.name);
    try {
      let blobUrl;

      // 🔹 1️⃣ Try Google Drive stream first
      try {
        console.log("🎧 Fetching from Google Drive:", file.name);
        const driveRes = await axios.get(
          `http://localhost:4000/api/drive/file/${file.id}`,
          { responseType: "blob", withCredentials: true }
        );
        blobUrl = URL.createObjectURL(driveRes.data);
      } catch (driveErr) {
        console.warn(
          "⚠️ Drive fetch failed, falling back to local:",
          driveErr.message
        );

        // 🔹 2️⃣ Fallback to backend/merged folder
        const localRes = await axios.get(
          `http://localhost:4000/merged/${file.name}`,
          { responseType: "blob" }
        );
        blobUrl = URL.createObjectURL(localRes.data);
      }

      // ✅ Play in global audio context
      playTrack(blobUrl, {
        name: file.name,
        thumbnailUrl: "/music1.jpg"
      });
    } catch (err) {
      console.error("❌ Failed to play merged file:", err.message);
    } finally {
      setLoadingId(null);
    }
  };

  // ✅ Delete only from backend/merged
  const deleteMergedFile = async (file) => {
    if (!window.confirm(`Delete local copy of "${file.name}"?`)) return;
    try {
      await API.delete(`/api/delete/merged/${file.name}`, {
        withCredentials: true
      });
      setMergedFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      console.error("❌ Delete failed:", err.message);
    }
  };

  // ✅ Helper for initials (2 letters) if no cover image
  const getInitials = (name) => {
    if (!name) return "AA";
    const base = name.split(".")[0].trim();
    return base.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4 pb-32">
      <h1 className="text-2xl font-semibold mb-6 text-slate-800 flex items-center gap-2">
        🎵 Merged Audio Files
      </h1>

      {mergedFiles.length === 0 ? (
        <div className="text-slate-500">No merged files found.</div>
      ) : (
        <div className="space-y-4">
          {mergedFiles.map((file) => (
            <div
              key={file.id || file.name}
              className="flex justify-between items-center bg-white shadow p-4 rounded-xl border border-slate-200 hover:shadow-md transition">
              {/* Left Side: Thumbnail + Info */}
              <div className="flex items-center gap-4 w-3/4">
                {/* Default cover */}
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                  <img
                    src="/music1.jpg"
                    alt="cover"
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                  <span className="relative z-10">
                    {getInitials(file.name)}
                  </span>
                </div>

                <div className="flex flex-col truncate">
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-slate-800 hover:underline truncate max-w-xs">
                    {file.name.length > 40
                      ? file.name.slice(0, 40) + "..."
                      : file.name}
                  </a>
                  <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {new Date(file.modified).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePlay(file)}
                  disabled={loadingId === (file.id || file.name)}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                  {loadingId === (file.id || file.name) ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => deleteMergedFile(file)}
                  className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
