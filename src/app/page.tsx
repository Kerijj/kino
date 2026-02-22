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

  if (loading) return <div className="loader">ЗАГРУЗКА...</div>;

  return (
    <div className="main-container">
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        :root { 
          --bg: #F4F1EE; 
          --watched-color: #5C1A1A; /* Бордовый */
          --queue-color: #24293E;   /* Глубокий синий */
          --text-light: #FFFFFF;
          --text-dark: #24293E;
        }

        .main-container { 
          background: var(--bg); 
          min-height: 100vh; 
          padding: 20px; 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .header h1 { 
          font-size: clamp(32px, 8vw, 56px); 
          font-weight: 900; 
          text-align: center; 
          color: var(--text-dark);
          margin-bottom: 30px;
          letter-spacing: -2px;
        }

        .control-panel { 
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          max-width: 1000px;
          margin: 0 auto 40px;
        }

        .input-style { 
          background: white; 
          border: 2px solid rgba(36, 41, 62, 0.1); 
          padding: 12px; 
          border-radius: 12px; 
          color: var(--text-dark);
          font-weight: 700;
          font-size: 13px;
          width: 100%;
          outline: none;
        }

        .movie-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
          gap: 25px; 
          max-width: 1200px; 
          margin: 0 auto; 
          perspective: 1500px;
        }

        .flip-card { 
          height: 380px; 
          cursor: pointer; 
          position: relative; 
          transform-style: preserve-3d; 
          transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .flip-card.is-flipped { transform: rotateY(180deg); }

        .card-face { 
          position: absolute; 
          width: 100%; 
          height: 100%; 
          backface-visibility: hidden; 
          border-radius: 30px; 
          padding: 30px; 
          display: flex; 
          flex-direction: column; 
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        }

        /* Цвета лицевых сторон */
        .face-front.is-watched { background: var(--watched-color); }
        .face-front.is-queue { background: var(--queue-color); }
        
        .face-front { color: var(--text-light); }
        .face-back { 
          background: white; 
          color: var(--text-dark); 
          transform: rotateY(180deg); 
          border: 3px solid var(--text-dark);
        }

        .status-badge {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          background: rgba(255,255,255,0.2);
          padding: 5px 12px;
          border-radius: 10px;
          width: fit-content;
          margin-bottom: 20px;
        }

        .movie-title { font-size: 28px; font-weight: 800; line-height: 1.1; margin: 0 0 10px 0; }
        .genre-info { font-size: 12px; opacity: 0.7; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

        .note-area { 
          background: #F9F9F9; 
          border: 1px solid #DDD; 
          border-radius: 15px; 
          padding: 15px; 
          height: 100%; 
          width: 100%; 
          resize: none; 
          font-family: inherit;
          color: var(--text-dark);
          font-size: 14px;
          outline: none;
        }

        .bottom-info {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          font-weight: 800;
        }

        .rating-display { font-size: 40px; line-height: 1; letter-spacing: -2px; }

        .loader { display: flex; height: 100vh; align-items: center; justify-content: center; font-weight: 900; }
      `}</style>

      <div className="header">
        <h1>Мой Архив</h1>
      </div>

      <div className="control-panel">
        <input className="input-style" placeholder="НАЗВАНИЕ..." onChange={e => setSearch(e.target.value)} />
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
        <select className="input-style" style={{background: 'var(--watched-color)', color: 'white'}} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ВСЕ">СТАТУС: ВСЕ</option>
          <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
          <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
        </select>
      </div>

      <div className="movie-grid">
        {filtered.map((m, i) => (
          <div key={i} className={`flip-card ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
            
            {/* ЛИЦЕВАЯ СТОРОНА */}
            <div className={`card-face face-front ${m.isWatched ? 'is-watched' : 'is-queue'}`}>
              <div className="status-badge">{m.isWatched ? 'Смотрели' : 'В очереди'}</div>
              <h2 className="movie-title">{m.title}</h2>
              <p className="genre-info">{m.genre}</p>
              
              <div className="bottom-info">
                <span>{m.year}</span>
                <div className="rating-display">
                  <span style={{fontSize: '12px', display: 'block', marginBottom: '5px'}}>Оценка</span>
                  {m.rating || '—'}
                </div>
              </div>
            </div>

            {/* ОБРАТНАЯ СТОРОНА */}
            <div className="card-face face-back" onClick={(e) => e.stopPropagation()}>
              <p style={{fontSize: '11px', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase'}}>Мои мысли:</p>
              <textarea 
                className="note-area" 
                placeholder="Напишите здесь свои впечатления..."
                value={notes[m.title] || ''}
                onChange={(e) => {
                  const newNotes = { ...notes, [m.title]: e.target.value };
                  setNotes(newNotes);
                  localStorage.setItem('movie_notes', JSON.stringify(newNotes));
                }}
              />
              <div style={{marginTop: '15px', textAlign: 'center', fontSize: '11px', fontWeight: 900}} onClick={() => setFlipped({...flipped, [i]: false})}>
                [ НАЖМИТЕ, ЧТОБЫ ВЕРНУТЬ ]
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
