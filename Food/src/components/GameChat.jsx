import React, { useState, useRef, useEffect } from 'react';

export default function GameChat({ onSendMessage, messages = [], myUserId }) {
  const [newMessage, setNewMessage] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isCollapsed) {
      scrollToBottom();
    }
  }, [messages, isCollapsed]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="fixed bottom-4 right-4">
      <div className={`${isCollapsed ? 'w-16' : 'w-80'} 
                      glass-card rounded-lg overflow-hidden transition-all duration-300 relative`}>
        {/* Header del chat con botón de colapsar */}
        <div className="flex items-center justify-between bg-gray-800/50 p-2 cursor-pointer"
             onClick={() => setIsCollapsed(!isCollapsed)}>
          {!isCollapsed && <span className="text-white text-sm font-medium">Chat</span>}
          <button className="text-gray-400 hover:text-white transition-colors p-1">
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm0 6a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        {/* Contenido del chat (solo visible cuando no está colapsado) */}
        {!isCollapsed && (
          <>
            <div className="h-64 overflow-y-auto p-4 space-y-2 messages-container">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg ${
                    msg.userId === myUserId
                      ? 'bg-blue-500/30 ml-auto text-right'
                      : 'bg-gray-700/30'
                  } max-w-[80%] break-words`}
                >
                  <div className={`text-xs ${
                    msg.userId === myUserId ? 'text-blue-300' : 'text-gray-400'
                  }`}>
                    {msg.username}
                  </div>
                  <div className="text-white text-sm">{msg.message}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="p-2 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-black/20 text-white text-sm rounded px-3 py-2 
                          outline-none focus:ring-1 focus:ring-blue-500"
                  maxLength={200}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded
                          hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </form>
          </>
        )}
      </div>
      
      {isCollapsed && messages.length > 0 && (
        <div className="absolute -top-3 -right-3 min-w-[28px] h-7 bg-red-500 rounded-full 
                      flex items-center justify-center text-white text-sm font-medium
                      border-2 border-gray-900 px-2 shadow-lg z-10">
          {messages.length}
        </div>
      )}
    </div>
  );
}