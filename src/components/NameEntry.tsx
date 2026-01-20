import { useState, useEffect } from 'react';
import './NameEntry.css';

interface NameEntryProps {
  onSubmit: (name: string) => void;
  savedName?: string;
}

export function NameEntry({ onSubmit, savedName }: NameEntryProps) {
  const [name, setName] = useState(savedName || '');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (savedName) {
      setName(savedName);
    }
  }, [savedName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim().toUpperCase();
    
    if (trimmedName.length < 2) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    
    onSubmit(trimmedName);
  };

  return (
    <div className="name-entry-overlay">
      <div className={`name-entry-modal ${isShaking ? 'shake' : ''}`}>
        <div className="modal-header">
          <span className="header-emoji">🦸</span>
          <h2>ENTER YOUR NAME</h2>
          <p>Join the global leaderboard!</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            placeholder="YOUR NAME"
            maxLength={20}
            autoFocus
            className="name-input"
          />
          
          <button type="submit" className="submit-button">
            <span>LET'S FLY</span>
            <span className="button-emoji">🚀</span>
          </button>
        </form>

        <div className="name-tips">
          <p>💡 Your name will appear on the leaderboard</p>
        </div>
      </div>
    </div>
  );
}
