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
            return { 
              title, 
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

  const filtered = useMemo(() => {
    return movies.filter(m => {
      const matchesGenre = selectedGenre === 'ВСЕ ЖАНРЫ' || m.genre?.toUpperCase().includes(selectedGenre);
      const matchesSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ВСЕ' || (statusFilter === 'СМОТРЕЛИ' ? m.isWatched : !m.isWatched);
      return matchesGenre && matchesSearch && matchesStatus;
    });
  }, [movies, selectedGenre, search, statusFilter]);

  if (loading) return <div className="loader">CREATING MAGIC...</div>;

  return (
    <div className="main-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;600;900&display=swap');
        
        :root { 
          --bg: #F0EAF2; 
          --accent: #5D3B76; 
          --card-front: #FFFFFF; 
          --card-back: #F9F4F0;
          --watched: #B5EAD7;
          --queue: #FFDAC1;
        }

        .main-container { 
          background: var(--bg); 
          min-height: 100vh; 
          padding: 40px 20px; 
          color: var(--accent); 
          font-family: 'Outfit', sans-serif; 
        }

        .header h1 { 
          font-size: 60px; 
          font-weight: 900; 
          text-align: center; 
          text-transform: lowercase; 
          letter-spacing: -2px; 
          margin-bottom: 40px;
        }

        .control-panel { 
          display: flex; 
          gap: 10px; 
          justify-content: center; 
          margin-bottom: 50px; 
          flex-wrap: wrap; 
        }

        .input-style { 
          background: white; 
          border: none; 
          padding: 12px 25px; 
          border-radius: 30px; 
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
          color: var(--accent);
          font-weight: 600;
        }

        .movie-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
          gap: 30px; 
          max-width: 1200px; 
          margin: 0 auto; 
          perspective: 1000px;
        }

        .flip-card { 
          height: 420px; 
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
          border-radius: 45px; 
          padding: 30px; 
          display: flex; 
          flex-direction: column; 
          box-shadow: 0 20px 40px rgba(93, 59, 118, 0.1);
        }

        .face-front { background: var(--card-front); border: 8px solid white; }
        
        .face-back { 
          background: var(--card-back); 
          transform: rotateY(180deg); 
          border: 4px dashed var(--accent);
        }

        .status-badge {
          align-self: flex-start;
          padding: 6px 15px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 20px;
        }

        .movie-title { font-size: 28px; font-weight: 900; line-height: 1; margin: 10px 0; }
        .genre-info { font-size: 12px; opacity: 0.6; font-weight: 600; }

        .rating-box {
          background: var(--accent);
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 20px;
          margin-bottom: 20px;
        }

        .note-area { 
          background: rgba(255,255,255,0.5); 
          border: none; 
          border-radius: 20px; 
          padding: 15px; 
          height: 180px; 
          width: 100%; 
          resize: none; 
          font-family: inherit;
          color: var(--accent);
        }

        .loader { display: flex; height: 100vh; align-items: center; justify-content: center; font-weight: 900; color: var(--accent); }
      `}</style>

      <div className="header">
        <h1>movie diary .</h1>
      </div>

      <div className="control-panel">
        <input className="input-style" placeholder="поиск..." onChange={e => setSearch(e.target.value)} />
        <select className="input-style" onChange={e => setSelectedGenre(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input-style" style={{background: 'var(--accent)', color: 'white'}} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ВСЕ">все статусы</option>
          <option value="СМОТРЕЛИ">смотрели</option>
          <option value="В ОЧЕРЕДИ">в очереди</option>
        </select>
      </div>

      <div className="movie-grid">
        {filtered.map((m, i) => (
          <div key={i} className={`flip-card ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
            
            {/* FRONT */}
            <div className="card-face face-front">
              <div className="status-badge" style={{background: m.isWatched ? 'var(--watched)' : 'var(--queue)'}}>
                {m.isWatched ? 'watched' : 'in queue'}
              </div>
              <h2 className="movie-title">{m.title}</h2>
              <p className="genre-info">{m.genre}</p>
              <div style={{marginTop: 'auto', fontSize: '12px', fontWeight: 900, opacity: 0.3}}>
                {m.year} • click to write
              </div>
            </div>

            {/* BACK */}
            <div className="card-face face-back" onClick={(e) => e.stopPropagation()}>
              <div className="rating-box">{m.rating || '?'}</div>
              <p style={{fontSize: '11px', fontWeight: 900, marginBottom: '10px'}}>MY THOUGHTS:</p>
              <textarea 
                className="note-area" 
                placeholder="Напиши что-нибудь..."
                value={notes[m.title] || ''}
                onChange={(e) => handleNoteChange(m.title, e.target.value)}
              />
              <button 
                onClick={() => setFlipped({...flipped, [i]: false})}
                style={{marginTop: 'auto', border: 'none', background: 'transparent', fontWeight: 900, color: 'var(--accent)', cursor: 'pointer'}}
              >
                ← закрыть
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
