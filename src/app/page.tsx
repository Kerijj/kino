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

  if (loading) return <div className="loader">ЗАГРУЗКА...</div>;

  return (
    <div className="main-container">
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        :root { 
          --bg: #FDF8E1; 
          --card-watched: #8E443D; 
          --card-queue: #94A684;
          --text-dark: #1A1A1A;
        }

        .main-container { 
          background: var(--bg); 
          min-height: 100vh; 
          padding: 20px; 
          font-family: 'Helvetica Neue', Arial, sans-serif;
          color: var(--text-dark);
        }

        .header h1 { 
          font-size: clamp(32px, 8vw, 64px); 
          font-weight: 900; 
          text-align: left; 
          max-width: 1200px;
          margin: 0 auto 40px;
          letter-spacing: -2px;
        }

        .control-panel { 
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          max-width: 1200px;
          margin: 0 auto 50px;
        }

        .input-style { 
          background: white; 
          border: 1px solid #CCC; 
          padding: 12px 20px; 
          border-radius: 8px; 
          font-weight: 600;
          font-size: 14px;
          color: var(--text-dark);
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
          height: 400px; 
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
          border-radius: 20px; 
          padding: 25px; 
          display: flex; 
          flex-direction: column; 
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .face-front.is-watched { background: var(--card-watched); color: white; }
        .face-front.is-queue { background: var(--card-queue); color: white; }
        
        .face-back { 
          background: white; 
          color: var(--text-dark); 
          transform: rotateY(180deg); 
          border: 2px solid var(--text-dark);
        }

        .movie-title { 
          font-size: 26px; 
          font-weight: 900; 
          line-height: 1.1; 
          margin: 0 0 10px 0;
          color: inherit;
        }

        .movie-info { font-size: 13px; font-weight: 700; margin-bottom: 10px; text-transform: uppercase; }
        
        .movie-desc { 
          font-size: 14px; 
          line-height: 1.4; 
          opacity: 0.9;
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .card-footer {
          margin-top: auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 900;
          font-size: 18px;
        }

        .note-area { 
          background: #F0F0F0; 
          border: none; 
          border-radius: 12px; 
          padding: 15px; 
          height: 100%; 
          width: 100%; 
          resize: none; 
          font-family: inherit;
          color: var(--text-dark);
          outline: none;
        }

        .loader { padding: 50px; text-align: center; font-weight: 900; }
      `}</style>

      <header className="header">
        <h1>Movie Archive .</h1>
      </header>

      <div className="control-panel">
        <input className="input-style" placeholder="Поиск..." onChange={e => setSearch(e.target.value)} />
        <select className="input-style" onChange={e => setSelectedGenre(e.target.value)}>
          {categories.genres.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input-style" onChange={e => setYearFilter(e.target.value)}>
          <option value="ВСЕ ГОДА">ГОД</option>
          {categories.years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="input-style" onChange={e => setRatingFilter(e.target.value)}>
          <option value="ВСЕ ОЦЕНКИ">РЕЙТИНГ</option>
          {categories.ratings.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="input-style" onChange={e => setStatusFilter(e.target.value)}>
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
              <div style={{fontSize:'10px', fontWeight:900, marginBottom:'10px', opacity:0.7}}>
                {m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}
              </div>
              <h2 className="movie-title">{m.title}</h2>
              <div className="movie-info">{m.genre} • {m.year}</div>
              <p className="movie-desc">{m.desc || 'Нет описания...'}</p>
              
              <div className="card-footer">
                <span style={{fontSize:'12px'}}>ОЦЕНКА:</span>
                <span>{m.rating || '—'}</span>
              </div>
            </div>

            {/* ОБРАТНАЯ СТОРОНА */}
            <div className="card-face face-back" onClick={(e) => e.stopPropagation()}>
              <p style={{fontSize: '11px', fontWeight: 900, marginBottom: '10px'}}>МОИ МЫСЛИ:</p>
              <textarea 
                className="note-area" 
                placeholder="Напиши что-нибудь..."
                value={notes[m.title] || ''}
                onChange={(e) => {
                  const newNotes = { ...notes, [m.title]: e.target.value };
                  setNotes(newNotes);
                  localStorage.setItem('movie_notes', JSON.stringify(newNotes));
                }}
              />
              <div style={{marginTop: '10px', fontSize: '10px', fontWeight: 900, textAlign: 'center'}}>
                [ НАЖМИ, ЧТОБЫ ЗАКРЫТЬ ]
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
