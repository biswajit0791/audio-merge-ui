import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Trash2,
  Loader2,
  UploadCloud,
  Clock,
  Disc,
  CloudUpload,
  GripVertical,
  FolderX
} from "lucide-react";
import API from "../api";
import { useAudio } from "../context/AudioContextProvider";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function HomePage() {
  const fileRef = useRef();
  const [tracks, setTracks] = useState([]);
  const [mergedFiles, setMergedFiles] = useState([]);
  const [mergeName, setMergeName] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0); // 🔁 Global spinner tracker
  const { playTrack } = useAudio();

  // 🟢 Manage global loading count
  const startLoading = () => setLoadingCount((c) => c + 1);
  const stopLoading = () => setLoadingCount((c) => Math.max(0, c - 1));
  const isLoading = loadingCount > 0;

  useEffect(() => {
    checkAuth();
  }, []);

  // ✅ Check Google Drive auth
  const checkAuth = async () => {
    try {
      startLoading();
      const res = await API.get("/auth/status", { withCredentials: true });
      setAuthenticated(res.data.authenticated);
    } catch (e) {
      console.error("Auth check failed:", e.message);
    } finally {
      stopLoading();
    }
  };

  // ✅ Connect to Google Drive
  const getAuthUrl = async () => {
    try {
      startLoading();
      const res = await API.get("/auth/url");
      const w = window.open(
        res.data.url,
        "google-auth",
        "width=600,height=700"
      );
      const timer = setInterval(async () => {
        const s = await API.get("/auth/status", { withCredentials: true });
        if (s.data.authenticated) {
          clearInterval(timer);
          setAuthenticated(true);
          if (w) w.close();
        }
      }, 1000);
    } catch (err) {
      console.error("❌ Auth popup failed:", err.message);
    } finally {
      stopLoading();
    }
  };

  // ✅ Upload file
  const onFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      startLoading();
      const formData = new FormData();
      formData.append("audio", file);

      const uploadRes = await API.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });

      const metaRes = await API.get(
        `/api/metadata/${uploadRes.data.filename}`,
        {
          withCredentials: true
        }
      );

      const newTrack = {
        id: uploadRes.data.filename,
        name: uploadRes.data.originalname,
        filename: uploadRes.data.filename,
        size: metaRes.data.size,
        duration: metaRes.data.duration
      };

      setTracks((prev) => [...prev, newTrack]);
      e.target.value = null;
    } catch (err) {
      console.error("❌ Upload failed:", err.message);
    } finally {
      stopLoading();
    }
  };

  // ✅ Reorder tracks
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(tracks);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setTracks(reordered);
  };

  // ✅ Play track
  const handlePlay = async (file, fromMerged = false) => {
    setLoadingId(file.id || file.name);
    try {
      startLoading();
      const url = fromMerged
        ? `http://localhost:4000/merged/${file.name}`
        : `http://localhost:4000/uploads/${file.filename}`;

      const res = await API.get(url, { responseType: "blob" });
      const blobUrl = URL.createObjectURL(res.data);
      playTrack(blobUrl, { name: file.name, thumbnailUrl: "/music1.jpg" });
    } catch (err) {
      console.error("❌ Failed to play:", err.message);
    } finally {
      stopLoading();
      setLoadingId(null);
    }
  };

  // ✅ Delete uploaded track
  const deleteTrack = async (track) => {
    if (!window.confirm(`Delete "${track.name}"?`)) return;
    try {
      startLoading();
      await API.delete(`/api/delete/uploads/${track.filename}`, {
        withCredentials: true
      });
      setTracks((prev) => prev.filter((t) => t.id !== track.id));
    } catch (err) {
      console.error("❌ Delete failed:", err.message);
    } finally {
      stopLoading();
    }
  };

  // ✅ Delete all uploads
  const deleteAllUploads = async () => {
    if (!window.confirm("Delete ALL uploaded files?")) return;
    try {
      startLoading();
      for (const t of tracks) {
        await API.delete(`/api/delete/uploads/${t.filename}`, {
          withCredentials: true
        });
      }
      setTracks([]);
    } catch (err) {
      console.error("❌ Bulk delete failed:", err.message);
    } finally {
      stopLoading();
    }
  };

  // ✅ Merge tracks
  const handleMerge = async () => {
    if (tracks.length < 1) return alert("Upload at least one file to merge.");
    if (!mergeName.trim()) return alert("Please enter a merge name.");

    try {
      startLoading();
      setMergeLoading(true);
      const files = tracks.map((t) => t.filename);
      const res = await API.post(
        "/api/merge",
        { files, name: mergeName },
        { withCredentials: true }
      );

      const newMerged = {
        name: res.data.mergedFile,
        size: 0,
        modified: new Date()
      };
      setMergedFiles((prev) => [...prev, newMerged]);
      alert("✅ Audio merged successfully!");
    } catch (err) {
      console.error("❌ Merge failed:", err.message);
    } finally {
      setMergeLoading(false);
      stopLoading();
    }
  };

  // ✅ Delete merged file
  const deleteMerged = async (file) => {
    if (!window.confirm(`Delete merged file "${file.name}"?`)) return;
    try {
      startLoading();
      await API.delete(`/api/delete/merged/${file.name}`, {
        withCredentials: true
      });
      setMergedFiles((prev) => prev.filter((f) => f.name !== file.name));
    } catch (err) {
      console.error("❌ Delete failed:", err.message);
    } finally {
      stopLoading();
    }
  };

  // ✅ Delete all merged
  const deleteAllMerged = async () => {
    if (!window.confirm("Delete ALL merged files from this session?")) return;
    try {
      startLoading();
      for (const f of mergedFiles) {
        await API.delete(`/api/delete/merged/${f.name}`, {
          withCredentials: true
        });
      }
      setMergedFiles([]);
    } catch (err) {
      console.error("❌ Bulk delete merged failed:", err.message);
    } finally {
      stopLoading();
    }
  };

  // ✅ Upload merged to Drive
  const uploadToDrive = async (file) => {
    try {
      startLoading();
      const res = await API.post(
        "/api/uploadToDrive",
        { filename: file.name },
        { withCredentials: true }
      );
      alert(`✅ Uploaded to Drive: ${res.data.name}`);
    } catch (err) {
      console.error("❌ Upload to Drive failed:", err.message);
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto mt-10 px-4 pb-32">
      {/* 🔁 Global Spinner Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        </div>
      )}

      {/* ===== Header ===== */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold text-slate-800">
          🎧 Audio Merge Studio
        </h1>
        {!authenticated ? (
          <button
            onClick={getAuthUrl}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Connect Google Drive
          </button>
        ) : (
          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            ✅ Drive Connected
          </div>
        )}
      </div>

      {/* ===== Two Columns ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-indigo-700 flex items-center gap-2">
              <UploadCloud className="w-5 h-5" /> Uploaded Files
            </h2>
            {tracks.length > 0 && (
              <button
                onClick={deleteAllUploads}
                className="flex items-center gap-2 text-red-600 border border-red-300 px-3 py-1.5 rounded hover:bg-red-50 transition">
                <FolderX className="w-4 h-4" /> Delete All
              </button>
            )}
          </div>

          {/* Upload Button */}
          <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition w-fit mb-4">
            <UploadCloud className="w-5 h-5" />
            Upload Audio
            <input
              type="file"
              accept="audio/*"
              ref={fileRef}
              onChange={onFileChange}
              className="hidden"
            />
          </label>

          {/* Uploaded List */}
          <div className="flex-1 overflow-auto">
            {tracks.length === 0 ? (
              <p className="text-slate-500">No files uploaded yet.</p>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="uploads">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {tracks.map((track, i) => (
                        <Draggable
                          key={track.id}
                          draggableId={track.id}
                          index={i}>
                          {(prov) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              className="flex justify-between items-center bg-slate-50 p-4 rounded-xl mb-3 border hover:shadow transition">
                              <div className="flex items-start gap-3 w-3/4">
                                <div
                                  {...prov.dragHandleProps}
                                  className="cursor-grab text-slate-400 hover:text-slate-600">
                                  <GripVertical className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="font-medium text-slate-800 truncate">
                                    {track.name}
                                  </div>
                                  <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {(track.size / 1024 / 1024).toFixed(2)} MB
                                      •{" "}
                                      {track.duration
                                        ? track.duration.toFixed(2) + "s"
                                        : "Loading..."}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handlePlay(track)}
                                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                                  <Play className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => deleteTrack(track)}
                                  className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>

          {/* Merge Input */}
          <div className="mt-5 flex gap-3">
            <input
              type="text"
              placeholder="Enter merge name"
              value={mergeName}
              onChange={(e) => setMergeName(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1"
            />
            <button
              onClick={handleMerge}
              disabled={mergeLoading || tracks.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              {mergeLoading ? "Merging..." : "Merge"}
            </button>
          </div>
        </section>

        {/* Merged Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-green-700 flex items-center gap-2">
              <Disc className="w-5 h-5" /> Merged (This Session)
            </h2>
            {mergedFiles.length > 0 && (
              <button
                onClick={deleteAllMerged}
                className="flex items-center gap-2 text-red-600 border border-red-300 px-3 py-1.5 rounded hover:bg-red-50 transition">
                <FolderX className="w-4 h-4" /> Delete All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto">
            {mergedFiles.length === 0 ? (
              <p className="text-slate-500">No merged files yet.</p>
            ) : (
              <div className="space-y-3">
                {mergedFiles.map((file) => (
                  <div
                    key={file.name}
                    className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border hover:shadow transition">
                    <div>
                      <div className="font-medium text-slate-800 truncate">
                        {file.name}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(file.modified).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePlay(file, true)}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                        <Play className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => uploadToDrive(file)}
                        className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
                        disabled={!authenticated}>
                        <CloudUpload className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteMerged(file)}
                        className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
