import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendGameSummary } from '../api/email';

export default function GameSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const { winner, duration, deathOrder, gameStats } = location.state || {};
  const myUserId = sessionStorage.getItem('userId');
  const myUsername = sessionStorage.getItem('username');
  const didIWin = winner?.userId === myUserId;
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState({ type: '', message: '' });

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setEmailStatus({ type: 'info', message: 'Enviando...' });
    
    try {
      await sendGameSummary(email, {
        didIWin,
        username: myUsername,
        correctAnswers: gameStats?.correctAnswers ?? 0,
        winner: winner.username,
        duration: formatDuration(duration)
      });
      
      setEmailStatus({ type: 'success', message: '¡Email enviado correctamente!' });
      setTimeout(() => setShowEmailModal(false), 2000);
    } catch (err) {
      setEmailStatus({ 
        type: 'error', 
        message: 'Error al enviar el email. Inténtalo de nuevo.' 
      });
    }
  };

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

        {/* Botón para abrir modal de email */}
        <button
          onClick={() => setShowEmailModal(true)}
          className="button-secondary text-lg px-8 py-3 mr-4"
        >
          Enviar Resumen por Email
        </button>

        {/* Modal de Email */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="glass-card p-6 rounded-xl max-w-md w-full">
              <h3 className="text-xl text-white mb-4">Enviar Resumen por Email</h3>
              <form onSubmit={handleSendEmail}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Introduce tu email"
                  className="input-field w-full mb-4"
                  required
                />
                
                {emailStatus.message && (
                  <p className={`mb-4 ${
                    emailStatus.type === 'error' ? 'text-red-400' :
                    emailStatus.type === 'success' ? 'text-green-400' :
                    'text-blue-400'
                  }`}>
                    {emailStatus.message}
                  </p>
                )}

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="button-primary flex-1"
                  >
                    Enviar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="button-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
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