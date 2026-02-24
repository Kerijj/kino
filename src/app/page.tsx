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
              const rawRating = String(find(['рейтинг', 'rating', 'оценка']));
              const rawStatus = String(find(['статус', 'status'])).toLowerCase();
              const isWatched = /\d/.test(rawRating) || rawStatus.includes('смотр') || rawStatus.includes('да');

              return {
                title: find(['название', 'title']),
                genre: find(['жанр', 'genre']) || 'Кино',
                desc: find(['описание', 'description']),
                year: String(find(['год', 'year'])),
                isWatched: isWatched,
                rating: rawRating || '—'
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
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        
        html, body { 
          margin: 0; padding: 0; background-color: var(--olive) !important; 
          font-family: sans-serif; height: 100%; scroll-behavior: smooth;
        }

        .app { display: flex; flex-direction: row; min-height: 100vh; background: var(--olive); }

        /* ОСНОВНАЯ ПАНЕЛЬ */
        .main { flex: 1; padding: 20px; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        
        /* БОКОВАЯ ПАНЕЛЬ */
        .side { width: 350px; background: var(--sand); padding: 30px; border-left: 4px solid var(--dark); overflow-y: auto; }

        .h1 { font-size: clamp(30px, 8vw, 60px); font-weight: 900; text-transform: uppercase; color: var(--dark); margin-bottom: 20px; letter-spacing: -2px; }
        
        /* АДАПТИВНЫЕ ФИЛЬТРЫ */
        .filter-container { display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 30px; }
        .filter-selectors { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; }
        
        .ui-el { 
          width: 100%; background: var(--sand); border: 3px solid var(--dark); 
          padding: 12px; border-radius: 12px; font-weight: 800; color: var(--dark); outline: none; 
        }

        /* АДАПТИВНАЯ СЕТКА */
        .movie-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
          gap: 20px; 
        }
        
        .scene { height: 420px; perspective: 1200px; }
        .card { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); transform-style: preserve-3d; }
        .scene.flipped .card { transform: rotateY(180deg); }

        .face { 
          position: absolute; width: 100%; height: 100%; backface-visibility: hidden; 
          border-radius: 25px; border: 4px solid var(--dark); padding: 25px; 
          display: flex; flex-direction: column; 
        }
        
        .face.front.is-watched-bg { background: var(--rose) !important; }
        .face.front.is-queue-bg { background: var(--green) !important; }
        .face.back { background: var(--sand); transform: rotateY(180deg); border-style: dashed; }

        .m-status { font-size: 10px; font-weight: 900; color: var(--yellow); text-transform: uppercase; margin-bottom: 5px; }
        .m-title { font-size: 26px; font-weight: 900; color: var(--yellow); text-transform: uppercase; line-height: 1; margin: 5px 0; }
        .m-meta { font-size: 12px; font-weight: 700; color: var(--yellow); opacity: 0.8; margin-bottom: 10px; }
        .m-desc { font-size: 14px; line-height: 1.4; color: var(--yellow); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
        .m-rating-big { margin-top: auto; font-size: 40px; font-weight: 900; color: var(--yellow); }

        .note-input { width: 100%; flex: 1; background: rgba(0,0,0,0.03); border: 2px dashed var(--dark); border-radius: 15px; padding: 15px; font-weight: 700; color: var(--dark); resize: none; margin: 10px 0; }

        /* МЕДИА-ЗАПРОСЫ ДЛЯ МОБИЛОК */
        @media (max-width: 1024px) {
          .app { flex-direction: column; }
          .main { flex: none; width: 100%; overflow-y: visible; }
          .side { width: 100%; border-left: none; border-top: 4px solid var(--dark); height: auto; }
          .movie-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
        }

        @media (min-width: 1400px) {
          .movie-grid { grid-template-columns: 1fr 1fr; }
          .filter-container { grid-template-columns: 1fr 1fr; }
        }

        .loader { height: 100vh; background: var(--olive); display: flex; align-items: center; justify-content: center; font-weight: 900; color: var(--dark); }
      `}</style>

      <div className="main">
        <h1 className="h1">КИНО АРХИВ</h1>
        
        <div className="filter-container">
          <input className="ui-el" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
          <div className="filter-selectors">
            <select className="ui-el" onChange={e => setGenreFilter(e.target.value)}>
              <option value="ALL">ЖАНР</option>
              {genres.map(g => g !== 'ALL' && <option key={g} value={g}>{g.toUpperCase()}</option>)}
            </select>
            <select className="ui-el" onChange={e => setYearFilter(e.target.value)}>
              <option value="ALL">ГОД</option>
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
                <div className={`face front ${m.isWatched ? 'is-watched-bg' : 'is-queue-bg'}`}>
                  <div className="m-status">{m.isWatched ? '● ПРОСМОТРЕНО' : '○ В ОЧЕРЕДИ'}</div>
                  <div className="m-title">{m.title}</div>
                  <div className="m-meta">{m.genre} • {m.year}</div>
                  <div className="m-desc">{m.desc}</div>
                  <div className="m-rating-big">{m.rating}</div>
                </div>
                <div className="face back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight: 900, fontSize: '12px'}}>ЗАМЕТКИ:</div>
                  <textarea 
                    className="note-input"
                    value={notes[m.title] || ''}
                    placeholder="Мысли о фильме..."
                    onChange={(e) => {
                      const n = { ...notes, [m.title]: e.target.value };
                      setNotes(n);
                      localStorage.setItem('movie_notes_shared', JSON.stringify(n));
                    }}
                  />
                  <div style={{textAlign: 'center', fontSize: '10px', fontWeight: 900, cursor: 'pointer'}} onClick={() => setFlipped({...flipped, [i]: false})}>
                    [ ЗАКРЫТЬ ]
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="side">
        <h2 style={{fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', borderBottom: '3px solid var(--dark)', paddingBottom: '10px'}}>Лента заметок</h2>
        {Object.entries(notes).map(([title, text]) => text.trim() && (
          <div key={title} style={{marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid rgba(0,0,0,0.1)'}}>
            <div style={{color: 'var(--rose)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase'}}>{title}</div>
            <div style={{fontSize: '13px', fontWeight: 600, marginTop: '2px'}}>{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
