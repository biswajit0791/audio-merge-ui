import React, { createContext, useContext } from "react";
import useAudioManager from "../components/useAudioManager";

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const audioManager = useAudioManager();
  return (
    <AudioContext.Provider value={audioManager}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext);
