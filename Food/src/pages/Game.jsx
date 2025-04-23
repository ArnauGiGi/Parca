import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { initSocket, socket } from '../services/socket';
import Question from '../components/Question';

export default function Game() {
  const { code } = useParams();
  const username = localStorage.getItem('username');
  const [question, setQuestion] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const sock = initSocket(token);

    sock.emit('joinRoom', { code, username });

    sock.on('newQuestion', q => setQuestion(q));
    sock.on('gameEnded', res => setResults(res));

    return () => sock.disconnect();
  }, [code, username]);

  const handleStart = () => {
    socket.emit('startGame', { code });
  };

  const handleAnswer = answer => {
    socket.emit('submitAnswer', { code, username, answer });
    setQuestion(null);
  };

  if (results) {
    return (
      <div className="p-4">
        <h2 className="text-2xl mb-4">Resultados Finales</h2>
        <ul>
          {results.map((r, idx) => (
            <li key={idx} className="mb-2">
              {r.username}: {r.score}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl">Sala: {code}</h2>
      {!question && (
        <button
          onClick={handleStart}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Iniciar Partida
        </button>
      )}
      {question && <Question question={question} onAnswer={handleAnswer} />}
    </div>
  );
}