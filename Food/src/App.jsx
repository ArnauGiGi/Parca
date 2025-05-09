import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUser } from './contexts/UserContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import GameSummary from './pages/GameSummary';
import Admin from './pages/Admin';
import { me } from './api/auth';

function App() {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await me();
        if (userData) {
          setUser(userData);
          sessionStorage.setItem('userId', userData.id);
          sessionStorage.setItem('username', userData.username);
        } else {
          setUser(null);
          sessionStorage.removeItem('userId');
          sessionStorage.removeItem('username');
        }
      } catch (err) {
        setUser(null);
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('username');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/lobby" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/lobby" />} />
      <Route path="/lobby" element={user ? <Lobby /> : <Navigate to="/login" />} />
      <Route path="/game/:code" element={user ? <Game /> : <Navigate to="/login" />} />
      <Route path="/game-summary" element={user ? <GameSummary /> : <Navigate to="/login" />} />
      <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;