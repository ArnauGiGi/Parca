import React from 'react';

export default function Question({ question, onAnswer }) {
  return (
    <div className="bg-white p-4 rounded shadow-md">
      <h3 className="text-xl mb-4">{question.question}</h3>
      <div className="grid gap-2">
        {question.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onAnswer(opt)}
            className="w-full border px-3 py-2 rounded hover:bg-gray-100"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}