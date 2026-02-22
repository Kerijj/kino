'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

export default function MovieArchive() {
  const [movies, setMovies] = useState<any[]>([]);
  const [notes, setNotes] = useState<{[key: string]: string}>({});
  const [flipped, setFlipped] = useState<{[key: number]: boolean}>({});
  
  // Фильтры
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ВСЕ ЖАНРЫ');
  const [statusFilter, setStatusFilter] = useState('ВСЕ');
  const [yearFilter, setYearFilter] = useState('ВСЕ ГОДА');
  const [ratingFilter, setRatingFilter] = useState('ВСЕ ОЦЕНКИ');
  const [loading, setLoading] = useState(true);

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
            return { 
              title: getVal(['название', 'фильм', 'title']), 
              genre: getVal(['жанр', 'genre']), 
              year: getVal(['год', 'year']), 
              isWatched: getVal(['смотрели', 'статус', 'status']).length > 0, 
              rating: getVal(['оценка', 'рейтинг', 'rating']) 
            };
          }).filter(m => m.title && m.title.length > 1);
          setMovies(data);
          setLoading(false);
        }
      });
    });
  }, []);

  const categories = useMemo(() => {
    const genres = new Set<string>();
    const years = new Set<string>();
    const ratings = new Set<string>();
    movies.forEach(m => {
      if (m.genre) m.genre.split(/[\\/;,]/).forEach((g: any) => genres.add(g.trim().toUpperCase()));
      if (m.year) years.add(m.year);
      if (m.rating) ratings.add(m.rating);
    });
    return {
      genres: ['ВСЕ ЖАНРЫ', ...Array.from(genres)].sort(),
      years: ['ВСЕ ГОДА', ...Array.from(years)].sort((a,b) => parseInt(b)-parseInt(a)),
      ratings: ['ВСЕ ОЦЕНКИ', ...Array.from(ratings)].sort((a,b) => parseInt(b)-parseInt(a))
    };
  }, [movies]);

  const filtered = useMemo(() => {
    return movies.filter(m => {
      const matchesGenre = selectedGenre === 'ВСЕ ЖАНРЫ' || m.genre?.toUpperCase().includes(selectedGenre);
      const matchesSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ВСЕ' || (statusFilter === 'СМОТРЕЛИ' ? m.isWatched : !m.isWatched);
      const matchesYear = yearFilter === 'ВСЕ ГОДА' || m.year === yearFilter;
      const matchesRating = ratingFilter === 'ВСЕ ОЦЕНКИ' || m.rating === ratingFilter;
      return matchesGenre && matchesSearch && matchesStatus && matchesYear && matchesRating;
    });
  }, [movies, selectedGenre, search, statusFilter, yearFilter, ratingFilter]);

  if (loading) return <div className="loader">ЗАГРУЗКА...</div>;

  return (
    <div className="main-container">
      <style>{`
        * { box-sizing: border-box; }
        :root { 
          --bg: #B8A9C9; /* Мягкий лавандовый */
          --accent: #4A0E0E; /* Винный */
          --card-front: #5A3E5D; /* Пыльный фиолетовый */
          --card-back: #EADBC8; /* Теплый беж */
          --text-main: #2D132C;
        }

        .main-container { 
          background: var(--bg); 
          min-height: 100vh; 
          padding: 20px; 
          color: var(--text-main); 
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }

        .header h1 { 
          font-size: clamp(28px, 10vw, 50px); 
          font-weight: 900; 
          text-align: center; 
          text-transform: lowercase;
          color: var(--accent);
          margin-bottom: 30px;
        }

        .control-panel { 
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 10px;
          max-width: 1000px;
          margin: 0 auto 40px;
        }

        .input-style { 
          background: rgba(255,255,255,0.2); 
          border: 1.5px solid var(--accent); 
          padding: 10px; 
          border-radius: 15px; 
          color: var(--accent);
          font-weight: 700;
          font-size: 12px;
          backdrop-filter: blur(10px);
        }

        .movie-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
          gap: 25px; 
          max-width: 1200px; 
          margin: 0 auto; 
          perspective: 1500px;
        }

        .flip-card { 
          height: 420px; 
          cursor: pointer; 
          position: relative; 
          transform-style: preserve-3d; 
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .flip-card.is-flipped { transform: rotateY(180deg); }

        .card-face { 
          position: absolute; 
          width: 100%; 
          height: 100%; 
          backface-visibility: hidden; 
          border-radius: 40px; 
          padding: 30px; 
          display: flex; 
          flex-direction: column; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border: 2px solid var(--accent);
        }

        .face-front { background: var(--card-front); color: #F9F4F0; }
        .face-back { background: var(--card-back); color: var(--accent); transform: rotateY(180deg); }

        .status-tag {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          background: var(--accent);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          width: fit-content;
          margin-bottom: 15px;
        }

        .movie-title { font-size: 24px; font-weight: 900; line-height: 1.2; margin: 10px 0; }
        .genre-info { font-size: 12px; opacity: 0.8; font-style: italic; }

        .note-area { 
          background: rgba(255,255,255,0.4); 
          border: 2px dashed var(--accent); 
          border-radius: 20px; 
          padding: 15px; 
          height: 100%; 
          width: 100%; 
          resize: none; 
          font-family: inherit;
          color: var(--accent);
          font-weight: 600;
          outline: none;
        }

        .loader { text-align: center; margin-top: 100px; font-weight: 900; color: var(--accent); }
      `}</style>

      <div className="header">
        <h1>Movie Diary // 2026</h1>
      </div>

      <div className="control-panel">
        <input className="input-style" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
        <select className="input-style" onChange={e => setSelectedGenre(e.target.value)}>
          {categories.genres.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input-style" onChange={e => setYearFilter(e.target.value)}>
          <option value="ВСЕ ГОДА">ГОД</option>
          {categories.years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="input-style" onChange={e => setRatingFilter(e.target.value)}>
          <option value="ВСЕ ОЦЕНКИ">ОЦЕНКА</option>
          {categories.ratings.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="input-style" style={{background: 'var(--accent)', color: 'white'}} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ВСЕ">СТАТУС</option>
          <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
          <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
        </select>
      </div>

      <div className="movie-grid">
        {filtered.map((m, i) => (
          <div key={i} className={`flip-card ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
            <div className="card-face face-front">
              <div className="status-tag">{m.isWatched ? '✓ watched' : '○ queue'}</div>
              <h2 className="movie-title">{m.title}</h2>
              <p className="genre-info">{m.genre}</p>
              <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontWeight: 900}}>
                <span>{m.year}</span>
                <span>★ {m.rating}</span>
              </div>
            </div>

            <div className="card-face face-back" onClick={(e) => e.stopPropagation()}>
              <p style={{fontSize: '10px', fontWeight: 900, marginBottom: '10px'}}>ЗАМЕТКИ:</p>
              <textarea 
                className="note-area" 
                placeholder="Твои мысли..."
                value={notes[m.title] || ''}
                onChange={(e) => {
                  const newNotes = { ...notes, [m.title]: e.target.value };
                  setNotes(newNotes);
                  localStorage.setItem('movie_notes', JSON.stringify(newNotes));
                }}
              />
              <div style={{marginTop: '15px', textAlign: 'center', fontSize: '10px', fontWeight: 900}} onClick={() => setFlipped({...flipped, [i]: false})}>
                [ ЗАКРЫТЬ ]
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
