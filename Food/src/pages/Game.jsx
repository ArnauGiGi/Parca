import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { initSocket } from '../services/socket';
import Question from '../components/Question';

export default function Game() {
  const { code }      = useParams();
  const location      = useLocation();
  const navigate      = useNavigate();

  const username      = localStorage.getItem('username');
  const token         = localStorage.getItem('token');
  const myUserId      = localStorage.getItem('userId');

  // Sólo en la primera renderización tras venir del Lobby
  const initialHostRef = useRef(location.state?.isHost === true);

  const [roomData,    setRoomData]    = useState({
    players: [],    // { socketId, userId, username, ready }
    host: null,     
    hostUserId: null
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [question,    setQuestion]    = useState(null);
  const [errorMsg,    setErrorMsg]    = useState('');

  useEffect(() => {
    const sock = initSocket(token);

    // 1) Registramos TODOS los listeners ANTES de emitir
    sock.on('roomData', data => {
      setRoomData(data);
      // Si venimos como host por primera vez, limpiamos el state
      if (initialHostRef.current) {
        navigate(location.pathname, { replace: true, state: {} });
        initialHostRef.current = false;
      }
    });

    sock.on('errorMessage', msg => setErrorMsg(msg));
    sock.on('gameStarted', () => setGameStarted(true));
    sock.on('newQuestion', q => setQuestion(q));

    // 2) Emitimos create/join con acknowledge
    sock.on('connect', () => {
      if (initialHostRef.current) {
        sock.emit(
          'createRoom',
          { code, username },
          // callback recibe roomData inmediatamente
          (data) => setRoomData(data)
        );
      } else {
        sock.emit(
          'joinRoom',
          { code, username },
          (data) => setRoomData(data)
        );
      }
    });

    // 3) Cleanup (no emitimos leaveRoom en unload para evitar problemas en F5)
    return () => {
      sock.off();
      sock.disconnect();
    };
  }, [code, token, navigate, location.pathname]);

  // Handlers usan la misma instancia
  const toggleReady = () => {
    initSocket(token).emit('playerReady', { code });
  };
  const startGame = () => {
    initSocket(token).emit('startGame', { code });
  };
  const leaveRoom = () => {
    initSocket(token).emit('leaveRoom', { code });
    initSocket(token).disconnect();
    navigate('/lobby');
  };

  const { players, hostUserId } = roomData;
  const amIHost = hostUserId === myUserId;

  if (gameStarted) {
    return question ? (
      <Question
        question={question}
        onAnswer={answer =>
          initSocket(token).emit('submitAnswer', { code, answer })
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
          <li
            key={i}
            className="flex justify-between bg-white p-2 rounded"
          >
            <span>{p.username}</span>
            <span
              className={`px-2 py-1 rounded ${
                p.ready ? 'bg-green-200' : 'bg-red-200'
              }`}
            >
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
