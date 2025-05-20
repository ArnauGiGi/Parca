const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const auth = require('../middleware/authMiddleware');

router.post('/send-summary', auth, async (req, res) => {
  const { email, gameData } = req.body;
  if (!email || !gameData) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email y datos del juego son requeridos' 
    });
  }

  try {
    const pythonScript = path.join(__dirname, '../scripts/email_service.py');
    const pythonProcess = spawn('python3', [
      pythonScript,
      email,
      JSON.stringify(gameData)
    ]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error('Python error:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        res.json({ 
          success: true, 
          message: 'Email enviado correctamente',
          output: outputData 
        });
      } else {
        console.error('Process exited with code:', code);
        res.status(500).json({ 
          success: false, 
          message: 'Error al enviar el email',
          error: errorData
        });
      }
    });
  } catch (error) {
    console.error('Error executing Python script:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

module.exports = router;