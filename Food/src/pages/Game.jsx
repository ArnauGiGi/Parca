import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { initSocket } from '../services/socket';
import Question from '../components/Question';

export default function Game() {
  const { code } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const username = sessionStorage.getItem('username');
  const myUserId = sessionStorage.getItem('userId');
  const initialHostRef = useRef(location.state?.isHost === true);

  // Sala y estado de juego
  const [roomData, setRoomData] = useState({ players: [], host: null, hostUserId: null });
  const [gameStarted, setGameStarted] = useState(false);
  const [question, setQuestion] = useState(null);
  const [turnUserId, setTurnUserId] = useState(null);
  const [lives, setLives] = useState({});
  const [answering, setAnswering] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const socketRef = useRef(null);

  useEffect(() => {
    const sock = initSocket();
    socketRef.current = sock;

    // LISTENERS
    sock.on('roomData', data => setRoomData(data));

    sock.on('gameStarted', ({ question, turnUserId, lives }) => {
      setGameStarted(true);
      setQuestion(question);
      setTurnUserId(turnUserId);
      setLives(lives);
      setAnswering(true);
    });

    sock.on('answerResult', ({ userId, username, answer, correct, correctAnswer, lives }) => {
      // Mostrar feedback global
      alert(`${username} respondió “${answer}” – ${correct ? '✅ Correcto' : `❌ Incorrecto (res. correcta: ${correctAnswer})`}`);
      setLives(lives);
    });

    sock.on('nextTurn', ({ question, turnUserId, lives }) => {
      setQuestion(question);
      setTurnUserId(turnUserId);
      setLives(lives);
      setAnswering(true);
    });

    sock.on('gameEnded', ({ winner }) => {
      const winnerName = roomData.players.find(p => p.userId === winner)?.username;
      alert(winnerName === username ? '¡Ganaste!' : `Fin del juego. Ganador: ${winnerName}`);
      navigate('/lobby');
    });

    sock.on('errorMessage', msg => setErrorMsg(msg));

    // EMIT CREATE/JOIN
    sock.on('connect', () => {
      if (initialHostRef.current) {
        sock.emit('createRoom', { code, username }, data => {
          setRoomData(data);
          initialHostRef.current = false;
        });
      } else {
        sock.emit('joinRoom', { code, username }, data => {
          setRoomData(data);
        });
      }
    });

    return () => {
      sock.off();
      sock.disconnect();
    };
  }, [code, navigate, location.pathname]);

  // Handlers
  const toggleReady = () => socketRef.current.emit('playerReady', { code });
  const startGame = () => socketRef.current.emit('startGame', { code });
  const submitAnswer = answer => {
    if (!answering || turnUserId !== myUserId) return;
    setAnswering(false);
    socketRef.current.emit('submitAnswer', { code, answer });
  };
  const leaveRoom = () => {
    socketRef.current.emit('leaveRoom', { code });
    socketRef.current.disconnect();
    navigate('/lobby');
  };

  const { players, hostUserId } = roomData;
  const amIHost = hostUserId === myUserId;

  // RENDER
  if (!gameStarted) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-2xl">Sala: {code}</h2>
        {errorMsg && <p className="text-red-500">{errorMsg}</p>}
        <ul className="space-y-2">
          {players.map(p => (
            <li key={p.userId} className="flex justify-between bg-white p-2 rounded">
              <span>{p.username}</span>
              <span className={`px-2 py-1 rounded ${p.ready ? 'bg-green-200' : 'bg-red-200'}`}>{p.ready ? 'Ready' : 'Not Ready'}</span>
            </li>
          ))}
        </ul>
        <div className="flex space-x-2">
          <button onClick={toggleReady} className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600">
            {players.find(p => p.userId === myUserId)?.ready ? 'Desmarcar Ready' : 'Marcar Ready'}
          </button>
          {amIHost && <button onClick={startGame} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Iniciar Partida</button>}
        </div>
        <button onClick={leaveRoom} className="mt-4 text-sm text-gray-600 hover:underline">Salir de la sala</button>
      </div>
    );
  }

  // Game in progress
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl">Sala: {code}</h2>
      <p className="font-semibold">Turno de: {players.find(p => p.userId === turnUserId)?.username}</p>
      <div>
        <h3 className="font-medium">Vidas:</h3>
        <ul className="space-y-1">
          {players.map(p => (
            <li key={p.userId}>{p.username}: {lives[p.userId] ?? 0} ❤</li>
          ))}
        </ul>
      </div>
      {question ? (
        <Question question={question} onAnswer={submitAnswer} disabled={turnUserId !== myUserId || !answering} />
      ) : (
        <p>Cargando pregunta…</p>
      )}
      <button onClick={leaveRoom} className="mt-4 text-sm text-gray-600 hover:underline">Salir de la sala</button>
    </div>
  );
}
