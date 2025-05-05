import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Admin from './pages/Admin';

function App() {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');

  return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lobby" element={token ? <Lobby /> : <Navigate to="/login" />} />
        <Route path="/game/:code" element={token ? <Game /> : <Navigate to="/login" />} />
        <Route
          path="/admin"
          element={token && role === 'admin' ? <Admin /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
  );
}

export default App;