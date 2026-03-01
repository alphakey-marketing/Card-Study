import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { getAllSets, FlashcardSet } from './lib/storage';

function Home() {
  const [sets, setSets] = useState<FlashcardSet[]>([]);

  useEffect(() => {
    setSets(getAllSets());
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Card Creator</h1>
      <p>Welcome to your offline Flashcard App.</p>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Your Sets</h2>
        {sets.length === 0 ? (
          <p>No sets created yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {sets.map(set => (
              <li key={set.id} style={{ background: '#fff', padding: '15px', marginBottom: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3>{set.title}</h3>
                <p>{set.description}</p>
                <small>{set.cards.length} cards</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Router>
  );
}
