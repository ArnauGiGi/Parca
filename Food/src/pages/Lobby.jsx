import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame, joinGame } from '../api/game';
import { logout } from '../api/auth';

export default function Lobby() {
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleCreate = async () => {
    setError('');
    console.log('📡 POST a createGame…');
    try {
      const { code } = await createGame();
      navigate(`/game/${code}`, { state: { isHost: true } });
    } catch (err) {
      console.error('🚨 createGame Error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Error al crear partida'
      );
    }
  };

  const handleJoin = async () => {
    setError('');
    try {
      await joinGame(codeInput);
      navigate(`/game/${codeInput}`);
    } catch (err) {
      console.error('🚨 joinGame Error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Error al unirse a la partida'
      );
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Limpiar estado
      setUser(null);
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('username');
      navigate('/login');
    } catch (err) {
      setError('Error al cerrar sesión');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="glass-card max-w-md w-full p-8 rounded-xl relative">
        {/* Botón de logout en la esquina superior derecha */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 text-gray-400 hover:text-white 
                     transition-colors duration-300 text-sm"
        >
          Cerrar Sesión
        </button>

        <h2 className="text-3xl font-bold text-white mb-6">Lobby</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={handleCreate}
          className="button-primary w-full mb-4"
        >
          Crear Partida
        </button>
        
        <div className="flex gap-2">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Código de partida"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
          />
          <button
            onClick={handleJoin}
            className="button-secondary"
          >
            Unirse
          </button>
        </div>
      </div>
    </div>
  );
}
