import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuestion, getQuestions, deleteQuestion } from '../api/question';
import { getUsers, updateUserRole } from '../api/user';
import DataTable from '../components/DataTable';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('questions'); // questions, questionsList, users
  const [form, setForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    category: '',
    difficulty: 'fácil'
  });
  const [questions, setQuestions] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'questionsList') {
      loadQuestions();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadQuestions = async () => {
    try {
      const data = await getQuestions();
      setQuestions(data);
    } catch (err) {
      setError('Error al cargar las preguntas');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Error al cargar los usuarios');
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      await deleteQuestion(id);
      setSuccess('Pregunta eliminada con éxito');
      loadQuestions();
    } catch (err) {
      setError('Error al eliminar la pregunta');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setSuccess('Rol actualizado con éxito');
      loadUsers();
    } catch (err) {
      setError('Error al actualizar el rol');
    }
  };

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

  const questionColumns = [
    {
      header: 'Pregunta',
      accessorKey: 'question',
    },
    {
      header: 'Categoría',
      accessorKey: 'category',
    },
    {
      header: 'Dificultad',
      accessorKey: 'difficulty',
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <button
          onClick={() => handleDeleteQuestion(row.original._id)}
          className="text-red-400 hover:text-red-300"
        >
          Eliminar
        </button>
      ),
    },
  ];

  const userColumns = [
    {
      header: 'Usuario',
      accessorKey: 'username',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Rol',
      accessorKey: 'role',
    },
    {
      header: 'Acciones',
      cell: ({ row }) => (
        <select
          value={row.original.role}
          onChange={(e) => handleUpdateRole(row.original._id, e.target.value)}
          className="bg-gray-700 text-white rounded px-2 py-1"
        >
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-4">
      <div className='max-w-6xl mx-auto text-white background-opacity rounded-xl shadow-lg p-6 relative'>
        <button
          onClick={() => navigate('/lobby')}
          className="absolute top-4 left-4 text-gray-400 hover:text-white 
                    transition-colors duration-300 text-sm"
        >
          ← Volver al Lobby
        </button>

        <h2 className="text-2xl mb-6 mt-8 text-center">Panel de Administración</h2>
        
        <div className="flex justify-center mb-6 gap-4">
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'questions' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Crear Pregunta
          </button>
          <button
            onClick={() => setActiveTab('questionsList')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'questionsList' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Lista de Preguntas
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'users' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Usuarios
          </button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        {activeTab === 'questions' && (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
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
        )}

        {activeTab === 'questionsList' && (
          <DataTable
            columns={questionColumns}
            data={questions}
            pageSize={8}
          />
        )}

        {activeTab === 'users' && (
          <DataTable
            columns={userColumns}
            data={users}
            pageSize={8}
          />
        )}
      </div>
    </div>
  );
}