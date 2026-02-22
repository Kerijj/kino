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

  useEffect(() => {
    // Загружаем заметки из памяти браузера
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

  // Вычисляем список жанров (категорий)
  const categories = useMemo(() => {
    const all = new Set<string>();
    movies.forEach(m => {
      if (m.genre) {
        m.genre.split(/[\\/;,]/).forEach((g: string) => {
          const clean = g.trim().toUpperCase();
          if (clean && clean.length > 1) all.add(clean);
        });
      }
    });
    return ['ВСЕ ЖАНРЫ', ...Array.from(all)].sort();
  }, [movies]);

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

  if (loading) return <div className="loader">СИНХРОНИЗАЦИЯ...</div>;

  return (
    <div className="main-container">
      <style>{`
        :root { --bg: #F9F4F0; --accent: #4A0E0E; --card-front: #FFFFFF; --card-back: #F2EBE5; --text-muted: rgba(74,14,14,0.5); }
        .main-container { background: var(--bg); min-height: 100vh; padding: 40px 20px; color: var(--accent); font-family: 'Inter', -apple-system, sans-serif; }
        .header { text-align: center; margin-bottom: 50px; }
        .header h1 { font-size: clamp(40px, 8vw, 70px); font-weight: 900; letter-spacing: -3px; text-transform: uppercase; margin: 0; line-height: 0.9; }
        
        .control-panel { display: flex; gap: 12px; justify-content: center; margin-bottom: 60px; flex-wrap: wrap; }
        .input-style { background: white; border: 1px solid rgba(74,14,14,0.1); padding: 14px 24px; border-radius: 20px; color: var(--accent); outline: none; font-weight: 600; font-size: 14px; transition: 0.3s; }
        .input-style:focus { border-color: var(--accent); }
        
        .movie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto; perspective: 1500px; }
        
        .flip-card { height: 400px; cursor: pointer; position: relative; transform-style: preserve-3d; transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .flip-card.is-flipped { transform: rotateY(180deg); }
        
        .card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 40px; padding: 35px; display: flex; flex-direction: column; box-shadow: 0 15px 35px rgba(74,14,14,0.05); }
        
        .face-front { background: var(--card-front); }
        .face-back { background: var(--card-back); transform: rotateY(180deg); border: 2px dashed rgba(74,14,14,0.2); }
        
        .status-pill { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px; display: flex; align-items: center; gap: 6px; }
        .movie-title { font-size: 30px; font-weight: 900; line-height: 1.1; margin: 15px 0; letter-spacing: -0.5px; }
        .genre-tag { font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        
        .rating-stars { font-size: 50px; font-weight: 900; font-style: italic; color: var(--accent); margin-bottom: 20px; letter-spacing: -2px; }
        .note-area { background: white; border: 1px solid rgba(74,14,14,0.08); border-radius: 20px; padding: 15px; height: 160px; width: 100%; resize: none; font-size: 14px; color: var(--accent); line-height: 1.5; outline: none; }
        
        .btn-back { margin-top: auto; background: var(--accent); color: white; border: none; padding: 12px; border-radius: 15px; font-weight: 800; font-size: 12px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; }
        
        .loader { display: flex; height: 100vh; align-items: center; justify-content: center; background: var(--bg); color: var(--accent); font-weight: 900; letter-spacing: 5px; font-size: 12px; }
      `}</style>

      <div className="header">
        <h1>Private Archive</h1>
        <p style={{opacity: 0.4, fontWeight: 700, fontSize: '11px', letterSpacing: '4px', marginTop: '10px'}}>COLLECTION // 2026</p>
      </div>

      <div className="control-panel">
        <input className="input-style" placeholder="Название..." onChange={e => setSearch(e.target.value)} />
        <select className="input-style" onChange={e => setSelectedGenre(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input-style" style={{background: 'var(--accent)', color: 'white', border: 'none'}} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ВСЕ">СТАТУС: ВСЕ</option>
          <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
          <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
        </select>
      </div>

      <div className="movie-grid">
        {filtered.map((m, i) => (
          <div key={i} className={`flip-card ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => toggleFlip(i)}>
            {/* ЛИЦЕВАЯ СТОРОНА */}
            <div className="card-face face-front">
              <span className="status-pill" style={{color: m.isWatched ? '#4A0E0E' : '#E88E7D'}}>
                {m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}
              </span>
              <h2 className="movie-title">{m.title}</h2>
              <span className="genre-tag">{m.genre}</span>
              <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'space-between', opacity: 0.3, fontSize: '11px', fontWeight: 800}}>
                <span>{m.year}</span>
                <span>ИНФО →</span>
              </div>
            </div>

            {/* ОБРАТНАЯ СТОРОНА */}
            <div className="card-face face-back" onClick={(e) => e.stopPropagation()}>
              <div className="rating-stars">★ {m.rating || '—'}</div>
              <textarea 
                className="note-area" 
                placeholder="Твои мысли о фильме..."
                value={notes[m.title] || ''}
                onChange={(e) => handleNoteChange(m.title, e.target.value)}
              />
              <button className="btn-back" onClick={() => toggleFlip(i)}>Вернуться</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
