import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame, joinGame } from '../api/game';

export default function Lobby() {
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleCreate = async () => {
    try {
      const { code } = await createGame(token);
      navigate(`/game/${code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear partida');
    }
  };

  const handleJoin = async () => {
    try {
      await joinGame(codeInput, token);
      navigate(`/game/${codeInput}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al unirse a la partida');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <h2 className="text-2xl">Lobby</h2>
      {error && <p className="text-red-500">{error}</p>}
      <button
        onClick={handleCreate}
        className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
      >
        Crear Partida
      </button>
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Código de partida"
          value={codeInput}
          onChange={e => setCodeInput(e.target.value.toUpperCase())}
          className="border px-3 py-2 rounded"
        />
        <button
          onClick={handleJoin}
          className="bg-green-500 px-4 py-2 text-white rounded hover:bg-green-600"
        >
          Unirse
        </button>
      </div>
    </div>
  );
}