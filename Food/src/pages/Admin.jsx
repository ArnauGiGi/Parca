import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuestion } from '../api/question';

export default function Admin() {
  const [form, setForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    category: '',
    difficulty: 'fácil'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    if (name.startsWith('option')) {
      const index = parseInt(name.replace('option', ''), 10);
      const opts = [...form.options];
      opts[index] = value;
      setForm({ ...form, options: opts });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await createQuestion(form);
      setSuccess('Pregunta creada con éxito');
      setForm({ question: '', options: ['', '', '', ''], correctAnswer: '', category: '', difficulty: 'fácil' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear pregunta');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className='text-white p-6 rounded shadow-[0px_2px_13px_-3px_rgba(255,_255,_255,_1)] w-full max-w-1/3 background-opacity'>
        <h2 className="text-2xl mb-4">Panel de Administración</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        {success && <p className="text-green-500 mb-2">{success}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Pregunta</label>
            <input
              type="text"
              name="question"
              value={form.question}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          {[0,1,2,3].map(i => (
            <div key={i}>
              <label className="block mb-1">Opción {i+1}</label>
              <input
                type="text"
                name={`option${i}`}
                value={form.options[i]}
                onChange={handleChange}
                required
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          ))}

          <div>
            <label className="block mb-1">Respuesta Correcta</label>
            <select
              name="correctAnswer"
              value={form.correctAnswer}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">-- Elige la opción --</option>
              {form.options.map((opt, idx) => (
                <option key={idx} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1">Categoría</label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1">Dificultad</label>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="fácil">Fácil</option>
              <option value="media">Media</option>
              <option value="difícil">Difícil</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
          >
            Crear Pregunta
          </button>
        </form>
      </div>
    </div>
  );
}