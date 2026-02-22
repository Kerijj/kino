'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

export default function MovieArchive() {
  const [movies, setMovies] = useState<any[]>([]);
  const [notes, setNotes] = useState<{[key: string]: string}>({});
  const [flipped, setFlipped] = useState<{[key: number]: boolean}>({});
  
  // Состояния фильтров
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
              desc: getVal(['описание', 'description']), 
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

  // Списки для выпадающих фильтров
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

  const handleNoteChange = (title: string, value: string) => {
    const newNotes = { ...notes, [title]: value };
    setNotes(newNotes);
    localStorage.setItem('movie_notes', JSON.stringify(newNotes));
  };

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
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;600;900&display=swap');
        
        :root { 
          --bg: #E5D5D0; 
          --accent: #4A0E0E; 
          --card-front: #5D3B76; 
          --card-back: #F2EBE5;
          --text-light: #F9F4F0;
        }

        .main-container { 
          background: var(--bg); 
          min-height: 100vh; 
          padding: 40px 20px; 
          color: var(--accent); 
          font-family: 'Montserrat', sans-serif; 
        }

        .header h1 { 
          font-size: clamp(32px, 8vw, 64px); 
          font-weight: 900; 
          text-align: center; 
          text-transform: uppercase; 
          letter-spacing: -2px; 
          margin-bottom: 40px;
        }

        .control-panel { 
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 15px;
          max-width: 1100px;
          margin: 0 auto 60px;
        }

        .input-style { 
          background: rgba(255,255,255,0.7); 
          border: 1px solid rgba(74, 14, 14, 0.1); 
          padding: 12px 15px; 
          border-radius: 12px; 
          color: var(--accent);
          font-weight: 600;
          font-size: 13px;
          outline: none;
          backdrop-filter: blur(5px);
        }

        .movie-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
          gap: 40px; 
          max-width: 1200px; 
          margin: 0 auto; 
          perspective: 2000px;
        }

        .flip-card { 
          height: 450px; 
          cursor: pointer; 
          position: relative; 
          transform-style: preserve-3d; 
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          z-index: 1;
        }

        .flip-card.is-flipped { 
          transform: rotateY(180deg); 
          z-index: 10;
        }

        .card-face { 
          position: absolute; 
          width: 100%; 
          height: 100%; 
          backface-visibility: hidden; 
          border-radius: 30px; 
          padding: 30px; 
          display: flex; 
          flex-direction: column; 
          box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }

        .face-front { 
          background: var(--accent); 
          color: var(--text-light);
        }
        
        .face-back { 
          background: var(--card-back); 
          color: var(--accent);
          transform: rotateY(180deg); 
          border: 2px solid var(--accent);
        }

        .status-badge {
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 20px;
          display: inline-block;
          width: fit-content;
        }

        .movie-title { font-size: 26px; font-weight: 900; line-height: 1.1; margin: 15px 0; }
        .genre-info { font-size: 11px; opacity: 0.7; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

        .rating-circle {
          background: var(--accent);
          color: white;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          margin-bottom: 20px;
        }

        .note-area { 
          background: white; 
          border: 1px solid rgba(0,0,0,0.05); 
          border-radius: 15px; 
          padding: 15px; 
          height: 200px; 
          width: 100%; 
          resize: none; 
          font-family: inherit;
          font-size: 14px;
          color: var(--accent);
          outline: none;
        }

        .loader { display: flex; height: 100vh; align-items: center; justify-content: center; font-weight: 900; color: var(--accent); letter-spacing: 3px; }
      `}</style>

      <div className="header">
        <h1>Кино Архив</h1>
      </div>

      <div className="control-panel">
        <input className="input-style" placeholder="Поиск по названию..." onChange={e => setSearch(e.target.value)} />
        
        <select className="input-style" onChange={e => setSelectedGenre(e.target.value)}>
          {categories.genres.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="input-style" onChange={e => setYearFilter(e.target.value)}>
          <option value="ВСЕ ГОДА">ВСЕ ГОДА</option>
          {categories.years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <select className="input-style" onChange={e => setRatingFilter(e.target.value)}>
          <option value="ВСЕ ОЦЕНКИ">ВСЕ ОЦЕНКИ</option>
          {categories.ratings.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select className="input-style" style={{background: 'var(--accent)', color: 'white'}} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ВСЕ">ЛЮБОЙ СТАТУС</option>
          <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
          <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
        </select>
      </div>

      <div className="movie-grid">
        {filtered.map((m, i) => (
          <div key={i} className={`flip-card ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
            
            {/* ЛИЦЕВАЯ СТОРОНА */}
            <div className="card-face face-front">
              <div className="status-badge" style={{background: m.isWatched ? '#8E443D' : '#D4A373'}}>
                {m.isWatched ? '✓ Просмотрено' : '○ В очереди'}
              </div>
              <h2 className="movie-title">{m.title}</h2>
              <p className="genre-info">{m.genre}</p>
              <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600}}>
                <span>{m.year} г.</span>
                <span style={{opacity: 0.5}}>ПОДРОБНЕЕ →</span>
              </div>
            </div>

            {/* ОБРАТНАЯ СТОРОНА */}
            <div className="card-face face-back" onClick={(e) => e.stopPropagation()}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div className="rating-circle">{m.rating || '—'}</div>
                <span style={{fontSize:'10px', fontWeight:900, opacity:0.4}}>ОЦЕНКА</span>
              </div>
              <p style={{fontSize: '11px', fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase'}}>Мои заметки:</p>
              <textarea 
                className="note-area" 
                placeholder="Что вы думаете об этом фильме?.."
                value={notes[m.title] || ''}
                onChange={(e) => handleNoteChange(m.title, e.target.value)}
              />
              <div 
                onClick={() => setFlipped({...flipped, [i]: false})}
                style={{marginTop: 'auto', textAlign: 'center', fontSize: '11px', fontWeight: 900, cursor: 'pointer', opacity: 0.6}}
              >
                ← НАЗАД К КАРТОЧКЕ
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
