import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { initSocket } from '../services/socket';
import Question from '../components/Question';

export default function Game() {
  const { code }      = useParams();
  const location      = useLocation();
  const navigate      = useNavigate();

  const username      = sessionStorage.getItem('username');
  const myUserId      = sessionStorage.getItem('userId');

  // Sólo en la primera renderización tras venir del Lobby
  const initialHostRef = useRef(location.state?.isHost === true);
  const [roomData,    setRoomData]    = useState({
    players: [],
    host: null,     
    hostUserId: null
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [question,    setQuestion]    = useState(null);
  const [errorMsg,    setErrorMsg]    = useState('');

  const socketRef = useRef(null);

  useEffect(() => {
    const sock = initSocket();
    socketRef.current = sock;
    
    // 1) Listeners
    sock.on('roomData', data => setRoomData(data));
    sock.on('gameStarted', () => setGameStarted(true));
    sock.on('newQuestion', q => setQuestion(q));
    sock.on('errorMessage', msg => setErrorMsg(msg));
  
    sock.on('connect', () => {
      if (initialHostRef.current) {
        sock.emit('createRoom', { code, username }, data => {
          setRoomData(data);
          navigate(`/game/${code}`, { replace: true });
          initialHostRef.current = false;
        });
      } else {
        sock.emit('joinRoom', { code, username }, data => {
          setRoomData(data);
          navigate(`/game/${code}`, { replace: true });
        });
      }
    });
  
    return () => { sock.off(); sock.disconnect(); };
  }, [code]);

  const toggleReady = () => socketRef.current.emit('playerReady', { code });
  const startGame  = () => socketRef.current.emit('startGame',   { code });
  const leaveRoom  = () => {
    socketRef.current.emit('leaveRoom', { code });
    socketRef.current.disconnect();
    navigate('/lobby');
  };

  const { players, hostUserId } = roomData;
  const amIHost = hostUserId === myUserId;

  if (gameStarted) {
    return question ? (
      <Question
        question={question}
        onAnswer={answer => socketRef.current.emit('submitAnswer', { code, answer })}
      />
    ) : (
      <p>Cargando pregunta…</p>
    );
  }
  console.log(players);
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl">Sala: {code}</h2>
      {errorMsg && <p className="text-red-500">{errorMsg}</p>}
      
      <ul className="space-y-2">
        {players.map(p => (
          <li
            key={p.userId}
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
