import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function GameSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { winner, duration, deathOrder, gameStats } = location.state || {};
  const myUserId = sessionStorage.getItem('userId');
  const myUsername = sessionStorage.getItem('username');
  const didIWin = winner?.userId === myUserId;

  useEffect(() => {
    console.log('GameStats recibidos:', gameStats);
  }, [gameStats]);

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0s';
    
    // Solo minutos y segundos ya que las partidas son cortas
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  useEffect(() => {
    if (!location.state?.winner) {
      navigate('/lobby');
    }
  }, [location.state, navigate]);

  if (!winner) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-8 rounded-xl text-center">
        <h2 className={`text-4xl font-bold mb-8 ${
          didIWin ? 'text-green-400' : 'text-red-400'
        }`}>
          {didIWin ? '¡Has Ganado!' : '¡Has Perdido!'}
        </h2>
        
        <div className="glass-card p-6 mb-8">
          <div className="text-xl text-blue-400 mb-2">Tu Partida</div>
          <div className="text-lg text-white">
            {myUsername}
          </div>
          <div className="text-md text-gray-400 mt-2">
            Respuestas correctas: {gameStats?.correctAnswers ?? 0}
          </div>
        </div>

        {/* Ganador */}
        <div className="glass-card p-6 mb-12 bg-green-900/20">
          <div className="text-2xl text-green-400 mb-2">Ganador</div>
          <div className="text-3xl font-bold text-white text-shadow-lg">
            {winner.username}
          </div>
        </div>

        {/* Duración */}
        <div className="glass-card p-6 mb-8">
          <div className="text-xl text-blue-400 mb-2">Duración de la Partida</div>
          <div className="text-2xl text-white">
            {formatDuration(duration)}
          </div>
        </div>

        {/* Orden de eliminación */}
        {deathOrder && deathOrder.length > 0 && (
          <div className="glass-card p-6 mb-8">
            <div className="text-xl text-purple-400 mb-4">Orden de Eliminación</div>
            <div className="space-y-2">
              {deathOrder.map((player, index) => (
                <div 
                  key={player.userId}
                  className={`glass-card p-3 flex justify-between items-center
                    ${player.userId === myUserId ? 'border-red-500/30' : ''}`}
                >
                  <span className="text-gray-400">#{index + 1}</span>
                  <span className="text-white">
                    {player.username} 
                    {player.userId === myUserId && ' (Tú)'}
                  </span>
                  <span className="text-gray-400">
                    {formatDuration(player.timeEliminated)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón volver al lobby */}
        <button
          onClick={() => navigate('/lobby')}
          className="button-primary text-lg px-8 py-3"
        >
          Volver al Lobby
        </button>
      </div>
    </div>
  );
}