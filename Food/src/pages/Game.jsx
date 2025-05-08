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
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <h2 className="room-code text-center mb-8">
          Sala: {code}
        </h2>
        {errorMsg && (
          <p className="text-red-400 bg-red-900/50 p-3 rounded-lg text-shadow">
            {errorMsg}
          </p>
        )}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-xl text-white text-shadow mb-4">Jugadores</h3>
          <ul className="space-y-3">
            {players.map(p => (
              <li key={p.userId} 
                  className={`glass-card p-4 rounded-lg flex justify-between items-center
                             ${p.ready ? 'border-green-500/30' : 'border-red-500/30'}`}>
                <span className="text-white text-shadow">{p.username}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium
                                ${p.ready ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                  {p.ready ? 'Listo' : 'No Listo'}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-4">
          <button onClick={toggleReady} 
                  className="flex-1 button-primary text-lg">
            {players.find(p => p.userId === myUserId)?.ready ? 'No Listo' : 'Listo'}
          </button>
          {amIHost && (
            <button onClick={startGame} 
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500
                              text-white text-lg py-3 px-6 rounded-lg hover:from-purple-700 
                              hover:to-blue-600 transition-all duration-300">
              Iniciar Partida
            </button>
          )}
        </div>
        <button onClick={leaveRoom} 
                className="text-gray-400 hover:text-white transition-colors duration-300
                          underline text-shadow">
          Salir de la sala
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h2 className="room-code text-center mb-8">
        Sala: {code}
      </h2>
      <div className="glass-card p-6 rounded-xl mb-6">
        <h3 className="text-xl text-white text-shadow mb-4">Jugadores</h3>
        <div className="grid grid-cols-2 gap-4">
          {players.map(p => (
            <div key={p.userId} 
                className={`p-4 rounded-lg ${
                  p.userId === turnUserId 
                  ? 'bg-gradient-to-r from-purple-600/30 to-blue-500/30 border border-white/20' 
                  : 'glass-card'
                }`}>
              <p className="text-white text-shadow mb-2">{p.username}</p>
              <p className="text-xl">
                {'❤️'.repeat(Math.max(0, lives[p.userId] || 0))}
                {'🖤'.repeat(Math.max(0, 4 - (lives[p.userId] || 0)))}
              </p>
            </div>
          ))}
        </div>
      </div>
      {question ? (
        <Question question={question} 
                  onAnswer={submitAnswer} 
                  disabled={turnUserId !== myUserId || !answering} />
      ) : (
        <p className="text-white text-shadow text-xl text-center">
          Cargando pregunta...
        </p>
      )}
      <button onClick={leaveRoom} 
              className="text-gray-400 hover:text-white transition-colors duration-300
                        underline text-shadow">
        Salir de la sala
      </button>
    </div>
  );
}
