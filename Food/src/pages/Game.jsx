import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { initSocket, socket } from '../services/socket';
import Question from '../components/Question';

export default function Game() {
  const { code } = useParams();
  console.log(localStorage);
  const username = localStorage.getItem('username');
  const isHost = localStorage.getItem(`host_${code}`) === 'true';

  const [players, setPlayers] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const sock = initSocket(token);

   if (isHost) {
      sock.emit('createRoom', { code, username });
   } else {
      sock.emit('joinRoom', { code, username });
   }

    sock.on('updatePlayers', list => setPlayers(list));
    sock.on('errorMessage', msg => setErrorMsg(msg));
    sock.on('gameStarted', () => setGameStarted(true));
    sock.on('newQuestion', q => setQuestion(q));

    return () => sock.disconnect();
  }, [code, username, isHost]);

  const toggleReady = () => {
    socket.emit('playerReady', { code, username });
  };

  const startGame = () => {
    socket.emit('startGame', { code });
  };

  if (gameStarted) {
    return question ? (
      <Question
        question={question}
        onAnswer={a => socket.emit('submitAnswer', { code, username, answer: a })}
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
        {console.log('👥 Jugadores:', players)}
        {players.map((p, i) => (
          <li
            key={i}
            className="flex items-center justify-between bg-white p-2 rounded"
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
          {players.find(p => p.username === username)?.ready
            ? 'Desmarcar Ready'
            : 'Marcar Ready'}
        </button>
        {isHost && (
          <button
            onClick={startGame}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Iniciar Partida
          </button>
        )}
      </div>
    </div>
  );
}