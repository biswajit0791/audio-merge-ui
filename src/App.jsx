import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MergedListPage from './pages/MergedListPage';
import GlobalAudioBar from './components/GlobalAudioBar';

export default function App(){ 
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 pb-32">
        <header className="p-4 bg-white shadow flex justify-between items-center sticky top-0 z-40">
          <h1 className="text-2xl font-bold text-blue-600">🎶 Audio Merge App</h1>
          <nav className="flex gap-4 text-slate-600">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <Link to="/merged" className="hover:text-blue-600">Merged Files</Link>
          </nav>
        </header>

        <main className="p-6">
          <Routes>
            <Route path='/' element={<HomePage/>} />
            <Route path='/merged' element={<MergedListPage/>} />
          </Routes>
        </main>

        <GlobalAudioBar />
      </div>
    </Router>
  );
}
