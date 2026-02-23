'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

interface Movie {
  title: string;
  genre: string;
  desc: string;
  year: string;
  isWatched: boolean;
  rating: string;
}

export default function MovieArchive() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const savedNotes = localStorage.getItem('movie_notes_shared');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const csvUrl = "https://docs.google.com/spreadsheets/d/1pge7MWZuBDMc_3gRfNYwnwBUVDDMA-g3emCDbGlZFwc/export?format=csv";
    
    fetch(csvUrl)
      .then(r => r.text())
      .then(text => {
        Papa.parse(text, {
          header: true, skipEmptyLines: true,
          complete: (res) => {
            const parsed = res.data.map((row: any) => {
              const find = (keys: string[]) => {
                const k = Object.keys(row).find(key => keys.includes(key.trim().toLowerCase()));
                return k ? row[k] : '';
              };
              const status = String(find(['статус', 'status'])).toLowerCase();
              return {
                title: find(['название', 'title']),
                genre: find(['жанр', 'genre']) || 'Кино',
                desc: find(['описание', 'description']),
                year: String(find(['год', 'year'])),
                isWatched: status.includes('смотр') || status.includes('да') || status.includes('watch'),
                rating: find(['рейтинг', 'rating']) || '—'
              };
            }).filter((m: Movie) => m.title);
            setMovies(parsed);
            setLoading(false);
          }
        });
      });
  }, []);

  const genres = useMemo(() => ['ALL', ...Array.from(new Set(movies.map(m => m.genre).filter(Boolean)))].sort(), [movies]);
  const years = useMemo(() => ['ALL', ...Array.from(new Set(movies.map(m => m.year).filter(Boolean)))].sort((a,b) => b.localeCompare(a)), [movies]);

  const filtered = useMemo(() => {
    return movies.filter(m => {
      const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchGenre = genreFilter === 'ALL' || m.genre === genreFilter;
      const matchYear = yearFilter === 'ALL' || m.year === yearFilter;
      const matchStatus = statusFilter === 'ALL' || (statusFilter === 'WATCHED' ? m.isWatched : !m.isWatched);
      return matchSearch && matchGenre && matchYear && matchStatus;
    });
  }, [movies, search, genreFilter, yearFilter, statusFilter]);

  if (loading) return <div className="loader">ЗАГРУЗКА...</div>;

  return (
    <div className="app">
      <style>{`
        :root {
          --olive: #8C9B81; --sand: #EAD9A6; --rose: #A67575; --green: #7A9680; --yellow: #F2C94C; --dark: #2D2926;
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--olive) !important; font-family: 'Inter', sans-serif; }
        
        .app { display: flex; width: 100vw; height: 100vh; background: var(--olive); }
        
        .main { flex: 0 0 70%; height: 100vh; overflow-y: auto; padding: 40px; border-right: 4px solid var(--dark); }
        .side { flex: 0 0 30%; background: var(--sand); height: 100vh; overflow-y: auto; padding: 30px; }

        .h1 { font-size: 55px; font-weight: 900; text-transform: uppercase; color: var(--dark); margin: 0 0 25px 0; letter-spacing: -3px; }
        
        /* ФИЛЬТРЫ В СЕТКЕ */
        .filter-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 15px; 
          margin-bottom: 35px;
          max-width: 100%;
        }
        .filter-group { display: flex; gap: 10px; }
        .ui-el { 
          width: 100%; background: var(--sand); border: 3px solid var(--dark); 
          padding: 14px; border-radius: 12px; font-weight: 800; color: var(--dark); outline: none;
        }

        /* КАРТОЧКИ 2x2 */
        .movie-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
        
        .scene { height: 440px; perspective: 1200px; }
        .card { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; cursor: pointer; }
        .scene.flipped .card { transform: rotateY(180deg); }

        .face { 
          position: absolute; width: 100%; height: 100%; backface-visibility: hidden; 
          border-radius: 25px; border: 4px solid var(--dark); padding: 30px; 
          display: flex; flex-direction: column; 
        }
        
        /* Цвета статусов */
        .face.front.watched { background: var(--rose); }
        .face.front.queue { background: var(--green); }
        .face.back { background: var(--sand); transform: rotateY(180deg); }

        .m-badge { font-size: 10px; font-weight: 900; color: var(--yellow); text-transform: uppercase; margin-bottom: 8px; }
        .m-title { font-size: 30px; font-weight: 900; color: var(--yellow); text-transform: uppercase; line-height: 1; margin: 10px 0; }
        .m-meta { font-size: 13px; font-weight: 700; color: var(--yellow); opacity: 0.9; margin-bottom: 15px; }
        .m-desc { font-size: 15px; line-height: 1.4; color: var(--yellow); display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
        .m-rating { margin-top: auto; font-size: 50px; font-weight: 900; color: var(--yellow); letter-spacing: -2px; }

        .side-title { font-size: 24px; font-weight: 900; text-transform: uppercase; border-bottom: 4px solid var(--dark); padding-bottom: 10px; margin-bottom: 25px; }
        .note-block { margin-bottom: 20px; border-bottom: 1px dashed var(--dark); padding-bottom: 12px; }
        .note-block b { color: var(--rose); font-size: 12px; display: block; text-transform: uppercase; margin-bottom: 4px; }
        
        .note-input { flex: 1; background: rgba(0,0,0,0.05); border: 2px dashed var(--dark); border-radius: 15px; padding: 15px; font-weight: 700; color: var(--dark); resize: none; outline: none; }
        .loader { height: 100vh; background: var(--olive); display: flex; align-items: center; justify-content: center; font-weight: 900; color: var(--dark); font-size: 24px; }
      `}</style>

      <div className="main">
        <h1 className="h1">Кино Архив</h1>
        
        <div className="filter-grid">
          <input className="ui-el" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
          <div className="filter-group">
            <select className="ui-el" onChange={e => setGenreFilter(e.target.value)}>
              <option value="ALL">ЖАНРЫ</option>
              {genres.map(g => g !== 'ALL' && <option key={g} value={g}>{g.toUpperCase()}</option>)}
            </select>
            <select className="ui-el" onChange={e => setYearFilter(e.target.value)}>
              <option value="ALL">ГОДЫ</option>
              {years.map(y => y !== 'ALL' && <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="ui-el" onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">СТАТУС</option>
              <option value="WATCHED">СМОТРЕЛИ</option>
              <option value="QUEUE">В ОЧЕРЕДИ</option>
            </select>
          </div>
        </div>

        <div className="movie-grid">
          {filtered.map((m, i) => (
            <div key={i} className={`scene ${flipped[i] ? 'flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
              <div className="card">
                {/* ЛИЦЕВАЯ СТОРОНА */}
                <div className={`face front ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div className="m-badge">{m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}</div>
                  <div className="m-title">{m.title}</div>
                  <div className="m-meta">{m.genre} • {m.year}</div>
                  <div className="m-desc">{m.desc}</div>
                  <div className="m-rating">{m.rating}</div>
                </div>

                {/* ОБРАТНАЯ СТОРОНА */}
                <div className="face back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight: 900, marginBottom: '10px', fontSize: '14px'}}>ЗАМЕТКИ:</div>
                  <textarea 
                    className="note-input"
                    value={notes[m.title] || ''}
                    placeholder="Напишите мысли..."
                    onChange={(e) => {
                      const n = { ...notes, [m.title]: e.target.value };
                      setNotes(n);
                      localStorage.setItem('movie_notes_shared', JSON.stringify(n));
                    }}
                  />
                  <div style={{marginTop: '12px', textAlign: 'center', fontSize: '10px', fontWeight: 900}} onClick={() => setFlipped({...flipped, [i]: false})}>
                    [ ЗАКРЫТЬ КАРТОЧКУ ]
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="side">
        <h2 className="side-title">Лента заметок</h2>
        {Object.entries(notes).map(([title, text]) => text.trim() && (
          <div key={title} className="note-block">
            <b>{title}</b>
            <div style={{fontSize: '14px', lineHeight: '1.4', color: 'var(--dark)'}}>{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
