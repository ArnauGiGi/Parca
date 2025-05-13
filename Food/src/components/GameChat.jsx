import React, { useState, useRef, useEffect } from 'react';

export default function GameChat({ onSendMessage, messages = [], myUserId }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="fixed bottom-4 left-4 w-80 glass-card rounded-lg overflow-hidden">
      <div className="h-64 overflow-y-auto p-4 space-y-2">
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
    </div>
  );
}