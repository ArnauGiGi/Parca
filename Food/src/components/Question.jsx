import React from 'react';

export default function Question({ question, onAnswer, disabled }) {
  return (
    <div className="glass-card p-8 rounded-xl">
      <h3 className="text-2xl font-semibold text-white text-shadow-lg mb-8">
        {question.question}
      </h3>
      <div className="grid gap-4">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => !disabled && onAnswer(opt)}
            disabled={disabled}
            className={`w-full text-left text-white p-4 rounded-lg
                       glass-card hover:bg-white/10 transition-all duration-200
                       active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                       text-shadow-sm`}
          >
            <span className="font-medium text-blue-400 mr-2">
              {String.fromCharCode(65 + idx)}.
            </span> 
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}