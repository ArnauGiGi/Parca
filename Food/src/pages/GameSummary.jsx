import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function GameSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { winner, duration, deathOrder } = location.state || {};

  useEffect(() => {
    if (!location.state?.winner) {
      navigate('/lobby');
    }
  }, [location.state, navigate]);

  if (!winner) {
    return null;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-8 rounded-xl text-center">
        <h2 className="text-4xl font-bold title-gradient mb-8">
          ¡Fin de la Partida!
        </h2>
        
        {/* Ganador */}
        <div className="glass-card p-6 mb-12 bg-green-900/20">
          <div className="text-2xl text-green-400 mb-2">¡Ganador!</div>
          <div className="text-3xl font-bold text-white text-shadow-lg">
            {winner.username}
          </div>
        </div>

        {/* Duración */}
        <div className="glass-card p-6 mb-8">
          <div className="text-xl text-blue-400 mb-2">Duración de la Partida</div>
          <div className="text-2xl text-white">
            {Math.floor(duration / 60)}m {duration % 60}s
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
                  className="glass-card p-3 flex justify-between items-center"
                >
                  <span className="text-gray-400">#{index + 1}</span>
                  <span className="text-white">{player.username}</span>
                  <span className="text-gray-400">
                    {Math.floor(player.timeEliminated / 60)}m {player.timeEliminated % 60}s
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