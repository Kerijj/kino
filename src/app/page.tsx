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

  if (loading) return <div style={{backgroundColor:'#8C9B81', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'black', fontWeight:900}}>ЗАГРУЗКА...</div>;

  return (
    <div className="archive-container">
      <style>{`
        html, body { 
          background-color: #8C9B81 !important; 
          margin: 0; 
          padding: 0; 
        }

        .archive-container { 
          background-color: #8C9B81; 
          min-height: 100vh; 
          padding: 30px 20px; 
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .title-main { 
          font-size: clamp(40px, 10vw, 90px); 
          font-weight: 900; 
          color: #2A2A2A;
          text-transform: uppercase;
          margin-bottom: 40px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          letter-spacing: -3px;
        }

        .filter-bar { 
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 15px;
          max-width: 1200px;
          margin: 0 auto 60px;
        }

        .select-custom { 
          background-color: #EAD9A6 !important; 
          border: none; 
          padding: 18px 25px; 
          border-radius: 15px; 
          font-weight: 800;
          font-size: 13px;
          color: #2A2A2A !important;
          outline: none;
          text-transform: uppercase;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .cards-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
          gap: 40px; 
          max-width: 1200px; 
          margin: 0 auto; 
          perspective: 2000px;
          padding-bottom: 50px;
        }

        .card-item { 
          height: 480px; 
          cursor: pointer; 
          position: relative; 
          transform-style: preserve-3d; 
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 1;
        }

        .card-item.flipped { transform: rotateY(180deg); z-index: 10; }

        .card-side { 
          position: absolute; 
          width: 100%; 
          height: 100%; 
          backface-visibility: hidden; 
          border-radius: 30px; 
          padding: 40px; 
          display: flex; 
          flex-direction: column; 
          box-shadow: 0 20px 40px rgba(0,0,0,0.25);
        }

        .front-side.watched { background-color: #A67575 !important; }
        .front-side.queue { background-color: #7A9680 !important; }
        
        .back-side { 
          background-color: #EAD9A6 !important; 
          color: #2A2A2A; 
          transform: rotateY(180deg); 
          border: 3px solid #2A2A2A;
        }

        .status-text {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          color: #F2C94C;
          margin-bottom: 25px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .movie-name { 
          font-size: 32px; 
          font-weight: 900; 
          line-height: 1; 
          color: #F2C94C;
          margin: 0 0 15px 0;
          text-transform: uppercase;
          letter-spacing: -1px;
        }

        .movie-details { 
          font-size: 14px; 
          font-weight: 800; 
          color: #F2C94C; 
          margin-bottom: 25px;
          opacity: 0.85;
        }

        .movie-bio { 
          font-size: 15px; 
          line-height: 1.6; 
          color: #F2C94C;
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 30px;
        }

        .rating-num {
          margin-top: auto;
          font-size: 60px;
          font-weight: 900;
          color: #F2C94C;
          line-height: 1;
          letter-spacing: -3px;
        }

        .note-field { 
          background: rgba(0,0,0,0.04); 
          border: 3px dashed #2A2A2A; 
          border-radius: 20px; 
          padding: 25px; 
          height: 100%; 
          width: 100%; 
          resize: none; 
          font-family: inherit;
          color: #2A2A2A;
          font-weight: 700;
          font-size: 16px;
          outline: none;
        }

        .close-hint {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          font-weight: 900;
          opacity: 0.6;
          text-transform: uppercase;
        }
      `}</style>

      <h1 className="title-main">Кино Архив</h1>

      <div className="filter-bar">
        <input className="select-custom" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
        <select className="select-custom" onChange={e => setSelectedGenre(e.target.value)}>
          {categories.genres.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select-custom" onChange={e => setYearFilter(e.target.value)}>
          <option value="ВСЕ ГОДА">ГОД</option>
          {categories.years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="select-custom" onChange={e => setRatingFilter(e.target.value)}>
          <option value="ВСЕ ОЦЕНКИ">РЕЙТИНГ</option>
          {categories.ratings.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="select-custom" style={{backgroundColor: '#A67575', color: 'white'}} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ВСЕ">СТАТУС: ВСЕ</option>
          <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
          <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
        </select>
      </div>

      <div className="cards-grid">
        {filtered.map((m, i) => (
          <div key={i} className={`card-item ${flipped[i] ? 'flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
            
            {/* FRONT */}
            <div className={`card-side front-side ${m.isWatched ? 'watched' : 'queue'}`}>
              <div className="status-text">
                {m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}
              </div>
              
              <h2 className="movie-name">{m.title}</h2>
              <div className="movie-details">{m.genre} • {m.year}</div>
              <p className="movie-bio">{m.desc || 'Описание отсутствует...'}</p>
              
              <div style={{fontSize:'12px', fontWeight:900, color:'#F2C94C', opacity:0.6, marginBottom:'5px'}}>РЕЙТИНГ</div>
              <div className="rating-num">{m.rating || '—'}</div>
            </div>

            {/* BACK */}
            <div className="card-side back-side" onClick={(e) => e.stopPropagation()}>
              <div style={{fontWeight: 900, fontSize: '18px', marginBottom: '20px'}}>МОИ МЫСЛИ:</div>
              <textarea 
                className="note-field" 
                placeholder="Что ты думаешь об этом фильме?"
                value={notes[m.title] || ''}
                onChange={(e) => {
                  const newNotes = { ...notes, [m.title]: e.target.value };
                  setNotes(newNotes);
                  localStorage.setItem('movie_notes', JSON.stringify(newNotes));
                }}
              />
              <div className="close-hint" onClick={() => setFlipped({...flipped, [i]: false})}>
                [ Нажми, чтобы закрыть ]
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
