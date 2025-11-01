import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AudioProvider } from './context/AudioContextProvider';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AudioProvider>
      <App />
    </AudioProvider>
  </React.StrictMode>
);
