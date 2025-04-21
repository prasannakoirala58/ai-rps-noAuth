// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Allow all origins
app.use(cors());
// Parse JSON bodies
app.use(express.json());

const AI_SERVER = 'http://127.0.0.1:5000';

// Proxy the training endpoint
app.post('/train', async (req, res) => {
  try {
    console.log('[TRAIN] Received move:', req.body);
    const response = await axios.post(`${AI_SERVER}/train`, req.body);
    console.log('[TRAIN] AI Response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error in /train:', error.message);
    res.status(502).json({ error: 'Bad gateway: AI backend (training)' });
  }
});

// Proxy the battle endpoint
app.post('/battle', async (req, res) => {
  try {
    console.log('[BATTLE] Received move:', req.body);
    const response = await axios.post(`${AI_SERVER}/battle`, req.body);
    console.log('[BATTLE] AI Response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error in /battle:', error.message);
    res.status(502).json({ error: 'Bad gateway: AI backend (battle)' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Node server running at http://localhost:${PORT}`);
});
