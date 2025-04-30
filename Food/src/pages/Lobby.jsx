import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame, joinGame } from '../api/game';

export default function Lobby() {
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleCreate = async () => {
    setError('');
    console.log('🤖 token en Lobby:', token);
    console.log('📡 POST a createGame…');
    try {
      const res = await createGame(token);
      console.log('📨 createGame res:', res);
      if (!res.code) throw new Error('Falta “code” en la respuesta');
      navigate(`/game/${res.code}`, { state: { isHost: true } });
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
      const res = await joinGame(codeInput, token);
      console.log('📨 joinGame res:', res);
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

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-white p-6 rounded shadow-[0px_2px_13px_-3px_rgba(255,_255,_255,_1)] w-full max-w-sm background-opacity">
        <h2 className="text-2xl mb-4">Lobby</h2>
        {error && <p className="text-red-400 mb-2">{error}</p>}
        <button
          onClick={handleCreate}
          className="w-full bg-blue-500 px-4 py-2 rounded mb-4 hover:bg-blue-600"
        >
          Crear Partida
        </button>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Código de partida"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            className="flex-1 border px-3 py-2 rounded"
          />
          <button
            onClick={handleJoin}
            className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
          >
            Unirse
          </button>
        </div>
      </div>
    </div>
  );
}
