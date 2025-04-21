import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

import rockImg from './assets/rock.jpg';
import paperImg from './assets/paper.jpg';
import scissorsImg from './assets/scissors.jpg';

const actions = { rock: rockImg, paper: paperImg, scissors: scissorsImg };

export default function App() {
  // Splash screen state
  const [name, setName] = useState('');
  const [started, setStarted] = useState(false);

  // Game flow
  const [mode, setMode] = useState('training');
  const trainingLimit = 10;
  const [moveCount, setMoveCount] = useState(0);

  // UI & moves
  const [you, setYou] = useState(null);
  const [ai, setAi] = useState(null);
  const [result, setResult] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Scores
  const [tScores, setTScores] = useState({ you: 0, ai: 0, draws: 0 });
  const [bScores, setBScores] = useState({ you: 0, ai: 0, draws: 0 });
  const [final, setFinal] = useState({ you: 0, ai: 0, draws: 0 });

  // Battle end
  const [over, setOver] = useState(false);
  const [winner, setWinner] = useState(null);

  const startGame = () => {
    if (name.trim()) setStarted(true);
  };

  const play = async (move) => {
    if (loading || over) return;
    setLoading(true);
    setYou(move);
    setAi(null);
    setResult(' ');
    setMsg(' ');

    const url =
      mode === 'training'
        ? 'http://localhost:5000/train'
        : 'http://localhost:5000/battle';

    try {
      const { data } = await axios.post(url, { move });
      await new Promise((r) => setTimeout(r, 400));

      setAi(data.ai_move);
      setResult(
        data.result === 'win'
          ? 'You Win! 🎉'
          : data.result === 'lose'
          ? 'AI Wins! 😞'
          : 'Draw! 🤝'
      );
      setMsg(data.message);

      if (mode === 'training') {
        setMoveCount((c) => c + 1);
        setTScores((s) => ({
          you: s.you + (data.result === 'win' ? 1 : 0),
          ai: s.ai + (data.result === 'lose' ? 1 : 0),
          draws: s.draws + (data.result === 'draw' ? 1 : 0),
        }));
      } else {
        setBScores((s) => ({
          you: s.you + (data.result === 'win' ? 1 : 0),
          ai: s.ai + (data.result === 'lose' ? 1 : 0),
          draws: s.draws + (data.result === 'draw' ? 1 : 0),
        }));
      }
    } catch {
      setResult('Error contacting server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'training' && moveCount >= trainingLimit) {
      setResult('✅ Training complete!');
      setTimeout(() => {
        setMode('battle');
        setResult('');
        setMsg('');
      }, 1200);
    }
  }, [moveCount, mode]);

  useEffect(() => {
    if (mode === 'battle') {
      const y = bScores.you,
        a = bScores.ai;
      if (y >= 3 || a >= 3) {
        setOver(true);
        setWinner(y >= 3 ? 'you' : 'ai');
        setFinal(bScores);
      }
    }
  }, [bScores, mode]);

  if (!started) {
    return (
      <div
        style={{ backgroundColor: '#EDF6FF' }}
        className="h-screen flex flex-col items-center justify-center px-4"
      >
        <h1 className="text-5xl mb-4">👋 Welcome to AI‑RPS!</h1>
        <input
          type="text"
          placeholder="Your Name"
          className="max-w-md w-full px-4 py-2 text-xl rounded-2xl shadow border-2 border-transparent focus:ring-4 focus:ring-blue-300 mb-4 text-center transition"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={startGame}
          disabled={!name.trim()}
          className={`px-6 py-2 text-xl font-bold rounded-full transition ${
            name.trim()
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
          }`}
        >
          Play 🎮
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: '#EDF6FF' }}
      className="min-h-screen p-4 flex flex-col items-center relative"
    >
      <h1 className="text-4xl font-bold mt-2">{name}'s AI‑RPS</h1>
      <div className="mt-2 mb-3">
        {mode === 'training' ? (
          <span className="text-lg font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full">
            ⚙️ Training Round
          </span>
        ) : (
          <span className="text-lg font-semibold bg-red-100 text-red-800 px-3 py-1 rounded-full">
            🔥 Battle Round
          </span>
        )}
      </div>

      <div className="flex justify-around w-full max-w-2xl bg-white p-3 rounded-xl shadow mb-4 text-2xl font-semibold">
        <div className="text-blue-600">
          {name}: {mode === 'training' ? tScores.you : bScores.you}
        </div>
        <div className="text-red-600">
          AI: {mode === 'training' ? tScores.ai : bScores.ai}
        </div>
        <div className="text-gray-600">
          Draws: {mode === 'training' ? tScores.draws : bScores.draws}
        </div>
      </div>

      <div className="flex items-center justify-center space-x-12 mb-6">
        <motion.img
          src={you ? actions[you] : rockImg}
          className="w-32 h-32 p-2 bg-white rounded-2xl shadow"
          animate={{ x: loading ? [-10, 10, -10] : 0 }}
          transition={{ duration: 0.15, repeat: loading ? Infinity : 0 }}
        />
        <motion.img
          src={ai ? actions[ai] : rockImg}
          className="w-32 h-32 p-2 bg-white rounded-2xl shadow"
          animate={{ x: loading ? [10, -10, 10] : 0 }}
          transition={{ duration: 0.15, repeat: loading ? Infinity : 0 }}
        />
      </div>

      <div className="flex space-x-6 mb-6">
        {Object.keys(actions).map((act) => (
          <motion.button
            key={act}
            onClick={() => play(act)}
            whileTap={{ scale: 0.9 }}
            disabled={loading}
            className="flex flex-col items-center bg-white p-2 rounded-full shadow hover:bg-gray-200 disabled:opacity-50"
          >
            <img src={actions[act]} className="w-16 h-16" />
            <span className="mt-1 text-base font-bold">{act.toUpperCase()}</span>
          </motion.button>
        ))}
      </div>

      <div
        className="flex justify-between w-full max-w-2xl mb-6 text-xl font-bold"
        style={{ minHeight: 30 }}
      >
        <div>{result}</div>
        <div className="italic">{msg}</div>
      </div>

      {mode === 'battle' && over && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-50 p-4"
          style={{ backgroundColor: '#EDF6FF' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h1 className="text-4xl font-bold mb-4">
            {winner === 'you' ? '🎉 YOU WIN!' : '😞 AI WINS!'}
          </h1>
          <p className="text-xl mb-6 font-semibold">
            Final: {name}: {final.you} | AI: {final.ai} | Draws: {final.draws}
          </p>
          <motion.button
            onClick={() => {
              setBScores({ you: 0, ai: 0, draws: 0 });
              setFinal({ you: 0, ai: 0, draws: 0 });
              setOver(false);
              setWinner(null);
              setResult('');
              setMsg('');
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-red-500 text-white text-xl font-bold rounded-full shadow hover:bg-red-700 transition"
          >
            Play Again
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
