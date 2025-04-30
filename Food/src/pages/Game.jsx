import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { initSocket } from '../services/socket';
import Question from '../components/Question';

export default function Game() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const username = localStorage.getItem('username');
  const token    = localStorage.getItem('token');
  const myUserId = localStorage.getItem('userId');

  // Mantén siempre la misma instancia
  const socketRef = useRef(null);

  const [roomData,    setRoomData]    = useState({ players: [], hostUserId: null });
  const [gameStarted, setGameStarted] = useState(false);
  const [question,    setQuestion]    = useState(null);
  const [errorMsg,    setErrorMsg]    = useState(null);

  useEffect(() => {
    const sock = initSocket(token);
    socketRef.current = sock;

    sock.on('connect', () => {
      // Si vienes con isHost desde Lobby, crear sala; si no, unirse
      if (location.state?.isHost) {
        sock.emit('createRoom', { code, username });
        // limpiar state para que en un refresh no vuelvas a emitir createRoom
        navigate(location.pathname, { replace: true, state: {} });
      } else {
        sock.emit('joinRoom', { code, username });
      }
    });

    sock.on('roomData', data => {
      setRoomData(data);
    });
    
    sock.on('errorMessage', setErrorMsg);
    sock.on('gameStarted', () => setGameStarted(true));
    sock.on('newQuestion', setQuestion);

    const handleUnload = () => {
      sock.emit('leaveRoom', { code });
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      sock.off();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [code, token, navigate, location]);

  const toggleReady = () => {
    socketRef.current.emit('playerReady', { code });
  };
  const startGame = () => {
    socketRef.current.emit('startGame', { code });
  };
  const leaveRoom = () => {
    socketRef.current.disconnect();
    navigate('/lobby');
  };

  const { players, hostUserId } = roomData;
  const amIHost = hostUserId === myUserId;

  if (gameStarted) {
    return question ? (
      <Question
        question={question}
        onAnswer={answer =>
          socketRef.current.emit('submitAnswer', { code, answer })
        }
      />
    ) : (
      <p>Cargando pregunta…</p>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl">Sala: {code}</h2>
      {errorMsg && <p className="text-red-500">{errorMsg}</p>}

      <ul className="space-y-2">
        {players.map((p, i) => (
          <li key={i} className="flex justify-between bg-white p-2 rounded">
            <span>{p.username}</span>
            <span className={`px-2 py-1 rounded ${p.ready ? 'bg-green-200' : 'bg-red-200'}`}>
              {p.ready ? 'Ready' : 'Not Ready'}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex space-x-2">
        <button
          onClick={toggleReady}
          className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
        >
          {players.find(p => p.userId === myUserId)?.ready
            ? 'Desmarcar Ready'
            : 'Marcar Ready'}
        </button>
        {amIHost && (
          <button
            onClick={startGame}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Iniciar Partida
          </button>
        )}
      </div>

      <button
        onClick={leaveRoom}
        className="mt-4 text-sm text-gray-600 hover:underline"
      >
        Salir de la sala
      </button>
    </div>
  );
}
