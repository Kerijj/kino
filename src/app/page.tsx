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
            const rawStatus = getVal(['смотрели', 'статус', 'status']);
            return { 
              title: getVal(['название', 'фильм', 'title']), 
              genre: getVal(['жанр', 'genre']), 
              desc: getVal(['описание', 'description']),
              year: getVal(['год', 'year']), 
              isWatched: rawStatus.length > 0, 
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

  if (loading) return <div className="loader">ЗАГРУЗКА АРХИВА...</div>;

  return (
    <div className="main-container">
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        :root { 
          --bg: #2C2C2C; 
          --card-watched: #4A0E0E; /* Винный */
          --card-queue: #1A1A1A;   /* Графит */
          --accent-gold: #D4A373;
          --text-light: #F5F5F5;
          --text-dim: rgba(245, 245, 245, 0.6);
        }

        .main-container { 
          background: var(--bg); 
          min-height: 100vh; 
          padding: 20px; 
          font-family: 'Inter', -apple-system, sans-serif;
          color: var(--text-light);
        }

        .header h1 { 
          font-size: clamp(30px, 7vw, 60px); 
          font-weight: 900; 
          text-align: center; 
          margin-bottom: 40px;
          text-transform: uppercase;
          letter-spacing: -1px;
        }

        .control-panel { 
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          max-width: 1100px;
          margin: 0 auto 50px;
        }

        .input-style { 
          background: #333; 
          border: 1px solid #444; 
          padding: 12px; 
          border-radius: 10px; 
          color: white;
          font-size: 13px;
          outline: none;
          transition: 0.3s;
        }
        .input-style:focus { border-color: var(--accent-gold); }

        .movie-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
          gap: 30px; 
          max-width: 1300px; 
          margin: 0 auto; 
          perspective: 2000px;
        }

        .flip-card { 
          height: 480px; 
          cursor: pointer; 
          position: relative; 
          transform-style: preserve-3d; 
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .flip-card.is-flipped { transform: rotateY(180deg); }

        .card-face { 
          position: absolute; 
          width: 100%; 
          height: 100%; 
          backface-visibility: hidden; 
          border-radius: 25px; 
          padding: 30px; 
          display: flex; 
          flex-direction: column; 
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .face-front.is-watched { background: var(--card-watched); border: 1px solid #631212; }
        .face-front.is-queue { background: var(--card-queue); border: 1px solid #333; }
        
        .face-back { 
          background: #F5F5F5; 
          color: #1A1A1A; 
          transform: rotateY(180deg); 
        }

        .status-badge {
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 5px;
          background: rgba(255,255,255,0.1);
          width: fit-content;
          margin-bottom: 15px;
          letter-spacing: 1px;
        }

        .movie-title { 
          font-size: 24px; 
          font-weight: 800; 
          line-height: 1.1; 
          margin-bottom: 8px;
          color: var(--text-light);
        }

        .movie-meta { 
          font-size: 11px; 
          color: var(--accent-gold); 
          font-weight: 700; 
          margin-bottom: 15px;
          text-transform: uppercase;
        }

        .movie-desc { 
          font-size: 13px; 
          line-height: 1.5; 
          color: var(--text-dim);
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .card-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .rating-val { font-size: 32px; font-weight: 900; color: white; }

        .note-area { 
          background: #EEE; 
          border: none; 
          border-radius: 15px; 
          padding: 15px; 
          height: 100%; 
          width: 100%; 
          resize: none; 
          font-family: inherit;
          color: #333;
          font-size: 14px;
          outline: none;
        }

        .loader { display: flex; height: 100vh; align-items: center; justify-content: center; font-weight: 900; color: var(--accent-gold); letter-spacing: 2px; }
      `}</style>

      <div className="header">
        <h1>Кино Архив</h1>
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
        <select className="input-style" style={{border: '1px solid var(--accent-gold)'}} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ВСЕ">ВСЕ СТАТУСЫ</option>
          <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
          <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
        </select>
      </div>

      <div className="movie-grid">
        {filtered.map((m, i) => (
          <div key={i} className={`flip-card ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
            
            {/* FRONT */}
            <div className={`card-face face-front ${m.isWatched ? 'is-watched' : 'is-queue'}`}>
              <div className="status-badge">{m.isWatched ? 'Просмотрено' : 'В очереди'}</div>
              <h2 className="movie-title">{m.title}</h2>
              <div className="movie-meta">{m.year} • {m.genre}</div>
              <p className="movie-desc">{m.desc || 'Описание отсутствует...'}</p>
              
              <div className="card-footer">
                <span style={{fontSize: '10px', fontWeight: 700, opacity: 0.5}}>РЕЙТИНГ</span>
                <span className="rating-val">{m.rating || '—'}</span>
              </div>
            </div>

            {/* BACK */}
            <div className="card-face face-back" onClick={(e) => e.stopPropagation()}>
              <p style={{fontSize: '11px', fontWeight: 900, marginBottom: '10px'}}>ЛИЧНЫЕ ЗАМЕТКИ:</p>
              <textarea 
                className="note-area" 
                placeholder="Твои впечатления..."
                value={notes[m.title] || ''}
                onChange={(e) => {
                  const newNotes = { ...notes, [m.title]: e.target.value };
                  setNotes(newNotes);
                  localStorage.setItem('movie_notes', JSON.stringify(newNotes));
                }}
              />
              <div style={{marginTop: '15px', textAlign: 'center', fontSize: '10px', fontWeight: 900, color: '#999'}} onClick={() => setFlipped({...flipped, [i]: false})}>
                [ ЗАКРЫТЬ ]
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
