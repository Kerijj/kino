'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

export default function MovieArchive() {
  const [movies, setMovies] = useState<any[]>([]);
  const [notes, setNotes] = useState<{[key: string]: string}>({});
  const [flipped, setFlipped] = useState<{[key: number]: boolean}>({});
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ВСЕ ЖАНРЫ');
  const [statusFilter, setStatusFilter] = useState('ВСЕ');
  const [loading, setLoading] = useState(true);

  // Загрузка данных и заметок
  useEffect(() => {
    const savedNotes = localStorage.getItem('movie_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const csvUrl = "https://docs.google.com/spreadsheets/d/1pge7MWZuBDMc_3gRfNYwnwBUVDDMA-g3emCDbGlZFwc/export?format=csv";
    fetch(csvUrl).then(r => r.text()).then(text => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const data = res.data.map((row: any) => {
            const getVal = (names: string[]) => {
              const key = Object.keys(row).find(k => names.some(n => k.toLowerCase().trim() === n.toLowerCase()));
              return key ? row[key]?.toString().trim() : "";
            };
            const title = getVal(['название', 'фильм', 'title']);
            const isWatched = getVal(['смотрели', 'статус', 'status']).length > 0;
            return { 
              title, 
              genre: getVal(['жанр', 'genre']), 
              desc: getVal(['описание', 'description']), 
              year: getVal(['год', 'year']), 
              isWatched, 
              rating: getVal(['оценка', 'рейтинг', 'rating']) 
            };
          }).filter(m => m.title && m.title.length > 1);
          setMovies(data);
          setLoading(false);
        }
      });
    });
  }, []);

  const handleNoteChange = (title: string, value: string) => {
    const newNotes = { ...notes, [title]: value };
    setNotes(newNotes);
    localStorage.setItem('movie_notes', JSON.stringify(newNotes));
  };

  const toggleFlip = (index: number) => {
    setFlipped(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const filtered = useMemo(() => {
    return movies.filter(m => {
      const matchesGenre = selectedGenre === 'ВСЕ ЖАНРЫ' || m.genre?.toUpperCase().includes(selectedGenre);
      const matchesSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ВСЕ' || (statusFilter === 'СМОТРЕЛИ' ? m.isWatched : !m.isWatched);
      return matchesGenre && matchesSearch && matchesStatus;
    });
  }, [movies, selectedGenre, search, statusFilter]);

  if (loading) return <div className="loader">ЗАГРУЗКА АРХИВА...</div>;

  return (
    <div className="main-container">
      <style>{`
        :root { --bg: #F9F4F0; --accent: #4A0E0E; --card-front: #FFFFFF; --card-back: #F2EBE5; }
        .main-container { background: var(--bg); min-height: 100vh; padding: 40px 20px; color: var(--accent); font-family: 'Inter', sans-serif; }
        .header { text-align: center; margin-bottom: 50px; }
        .header h1 { font-size: 70px; font-weight: 900; letter-spacing: -3px; text-transform: uppercase; margin: 0; }
        
        .control-panel { display: flex; gap: 15px; justify-content: center; margin-bottom: 50px; }
        .input-style { background: white; border: 1px solid rgba(74,14,14,0.1); padding: 12px 20px; border-radius: 15px; color: var(--accent); outline: none; }
        
        .movie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px; max-width: 1200px; margin: 0 auto; perspective: 1000px; }
        
        /* Механика переворота */
        .flip-card { height: 350px; cursor: pointer; position: relative; transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .flip-card.is-flipped { transform: rotateY(180deg); }
        
        .card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 35px; padding: 30px; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        
        .face-front { background: var(--card-front); }
        .face-back { background: var(--card-back); transform: rotateY(180deg); border: 2px dashed var(--accent); }
        
        .status-pill { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; color: #E88E7D; }
        .movie-title { font-size: 28px; font-weight: 800; line-height: 1.1; margin: 10px 0; flex-grow: 1; }
        .genre-tag { font-size: 11px; opacity: 0.5; font-weight: 600; text-transform: uppercase; }
        
        .rating-stars { font-size: 40px; font-weight: 900; font-style: italic; color: var(--accent); opacity: 0.2; margin-bottom: 15px; }
        .note-area { background: transparent; border: 1px solid rgba(74,14,14,0.1); border-radius: 15px; padding: 15px; height: 150px; width: 100%; resize: none; font-size: 14px; color: var(--accent); }
        
        .loader { display: flex; height: 100vh; align-items: center; justify-content: center; background: var(--bg); color: var(--accent); font-weight: 900; letter-spacing: 5px; }
      `}</style>

      <div className="header">
        <h1>Movie Archive</h1>
        <p style={{opacity: 0.4, fontWeight: 700}}>Curated Collection / 2026</p>
      </div>

      <div className="control-panel">
        <input className="input-style" placeholder="Название..." onChange={e => setSearch(e.target.value)} />
        <select className="input-style" onChange={e => setSelectedGenre(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input-style" style={{background: 'var(--accent)', color: 'white'}} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ВСЕ">ВСЕ СТАТУСЫ</option>
          <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
          <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
        </select>
      </div>

      <div className="movie-grid">
        {filtered.map((m, i) => (
          <div key={i} className={`flip-card ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => toggleFlip(i)}>
            {/* ЛИЦЕВАЯ СТОРОНА */}
            <div className="card-face face-front">
              <span className="status-pill">{m.isWatched ? '● Просмотрено' : '○ В очереди'}</span>
              <h2 className="movie-title">{m.title}</h2>
              <span className="genre-tag">{m.genre}</span>
              <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'space-between', opacity: 0.3, fontSize: '12px'}}>
                <span>{m.year}</span>
                <span>Нажми для деталей →</span>
              </div>
            </div>

            {/* ОБРАТНАЯ СТОРОНА */}
            <div className="card-face face-back" onClick={(e) => e.stopPropagation()}>
              <div className="rating-stars">★ {m.rating || '0'}/10</div>
              <p style={{fontSize: '12px', marginBottom: '10px', fontWeight: 600}}>МОИ ЗАМЕТКИ:</p>
              <textarea 
                className="note-area" 
                placeholder="Что ты думаешь об этом фильме?.."
                value={notes[m.title] || ''}
                onChange={(e) => handleNoteChange(m.title, e.target.value)}
              />
              <button 
                onClick={() => toggleFlip(i)}
                style={{marginTop: 'auto', background: 'var(--accent)', color: 'white', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer'}}
              >
                ← НАЗАД
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
