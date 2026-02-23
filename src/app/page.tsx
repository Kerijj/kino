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

  if (loading) return <div style={{background:'#8C9B81', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900}}>ЗАГРУЗКА...</div>;

  return (
    <div className="main-container">
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        
        :root { 
          --bg-olive: #8C9B81;
          --accent-sand: #EAD9A6;
          --card-green: #7A9680;
          --card-red: #A67575;
          --text-yellow: #F2C94C;
          --text-dark: #2A2A2A;
          --note-bg: #EAD9A6;
        }

        body { margin: 0; background: var(--bg-olive); }

        .main-container { 
          min-height: 100vh; 
          padding: 20px; 
          font-family: 'Inter', sans-serif;
        }

        .header-title { 
          font-size: clamp(40px, 10vw, 80px); 
          font-weight: 900; 
          color: var(--text-dark);
          text-transform: uppercase;
          margin-bottom: 30px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        .control-panel { 
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          max-width: 1200px;
          margin: 0 auto 50px;
        }

        .filter-item { 
          background: var(--accent-sand); 
          border: none; 
          padding: 15px 20px; 
          border-radius: 12px; 
          font-weight: 800;
          font-size: 14px;
          color: var(--text-dark);
          outline: none;
          width: 100%;
          text-transform: uppercase;
        }

        .movie-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
          gap: 30px; 
          max-width: 1200px; 
          margin: 0 auto; 
          perspective: 2000px;
        }

        .flip-card { 
          height: 450px; 
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
          border-radius: 25px; 
          padding: 35px; 
          display: flex; 
          flex-direction: column; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          border: 1px solid rgba(0,0,0,0.1);
        }

        .face-front.is-watched { background: var(--card-red); }
        .face-front.is-queue { background: var(--card-green); }
        
        .face-back { 
          background: var(--note-bg); 
          color: var(--text-dark); 
          transform: rotateY(180deg); 
        }

        .movie-status {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          color: var(--text-yellow);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .movie-title { 
          font-size: 28px; 
          font-weight: 900; 
          line-height: 1.1; 
          color: var(--text-yellow);
          margin-bottom: 15px;
          text-transform: uppercase;
        }

        .movie-meta { 
          font-size: 13px; 
          font-weight: 700; 
          color: var(--text-yellow); 
          margin-bottom: 20px;
          opacity: 0.9;
        }

        .movie-desc { 
          font-size: 14px; 
          line-height: 1.5; 
          color: var(--text-yellow);
          opacity: 0.8;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .rating-label {
          margin-top: auto;
          font-size: 11px;
          font-weight: 900;
          color: var(--text-yellow);
          opacity: 0.6;
          margin-bottom: 5px;
        }

        .rating-score {
          font-size: 48px;
          font-weight: 900;
          color: var(--text-yellow);
          line-height: 1;
        }

        .note-area { 
          background: rgba(0,0,0,0.05); 
          border: 2px dashed var(--text-dark); 
          border-radius: 15px; 
          padding: 20px; 
          height: 100%; 
          width: 100%; 
          resize: none; 
          font-family: inherit;
          color: var(--text-dark);
          font-weight: 700;
          outline: none;
        }
      `}</style>

      <h1 className="header-title">Кино Архив</h1>

      <div className="control-panel">
        <input className="filter-item" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
        <select className="filter-item" onChange={e => setSelectedGenre(e.target.value)}>
          {categories.genres.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-item" onChange={e => setYearFilter(e.target.value)}>
          <option value="ВСЕ ГОДА">ГОД</option>
          {categories.years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="filter-item" onChange={e => setRatingFilter(e.target.value)}>
          <option value="ВСЕ ОЦЕНКИ">РЕЙТИНГ</option>
          {categories.ratings.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="filter-item" style={{background: '#A67575', color: 'white'}} onChange={e => setStatusFilter(e.target.value)}>
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
              <div className="movie-status">
                {m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}
              </div>
              
              <h2 className="movie-title">{m.title}</h2>
              <div className="movie-meta">{m.genre} • {m.year}</div>
              <p className="movie-desc">{m.desc || 'Описание готовится...'}</p>
              
              <div className="rating-label">РЕЙТИНГ</div>
              <div className="rating-score">{m.rating || '—'}</div>
            </div>

            {/* ОБРАТНАЯ СТОРОНА */}
            <div className="card-face face-back" onClick={(e) => e.stopPropagation()}>
              <div style={{fontWeight: 900, marginBottom: '15px', textTransform: 'uppercase'}}>Мои мысли:</div>
              <textarea 
                className="note-area" 
                placeholder="Что ты думаешь об этом фильме?"
                value={notes[m.title] || ''}
                onChange={(e) => {
                  const newNotes = { ...notes, [m.title]: e.target.value };
                  setNotes(newNotes);
                  localStorage.setItem('movie_notes', JSON.stringify(newNotes));
                }}
              />
              <div style={{marginTop: '20px', textAlign: 'center', fontSize: '11px', fontWeight: 900, opacity: 0.6}}>
                [ НАЖМИ, ЧТОБЫ ЗАКРЫТЬ ]
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
