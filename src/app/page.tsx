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
              
              const rawStatus = String(find(['статус', 'status'])).toLowerCase();
              const rawRating = String(find(['рейтинг', 'rating', 'оценка']));
              
              // ЕСЛИ ЕСТЬ ЛЮБАЯ ЦИФРА В РЕЙТИНГЕ ИЛИ СЛОВО "СМОТРЕЛИ" -> КАРТОЧКА РОЗОВАЯ
              const hasRating = /\d/.test(rawRating); 
              const isWatchedText = rawStatus.includes('смотр') || rawStatus.includes('да') || rawStatus.includes('watch');
              
              return {
                title: find(['название', 'title']),
                genre: find(['жанр', 'genre']) || 'Кино',
                desc: find(['описание', 'description']),
                year: String(find(['год', 'year'])),
                isWatched: hasRating || isWatchedText,
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

  if (loading) return <div className="loader">СИНХРОНИЗАЦИЯ С БАЗОЙ...</div>;

  return (
    <div className="app">
      <style>{`
        :root {
          --olive: #8C9B81; --sand: #EAD9A6; --rose: #A67575; --green: #7A9680; --yellow: #F2C94C; --dark: #2D2926;
        }
        * { box-sizing: border-box; }
        html, body { 
          margin: 0; padding: 0; background-color: var(--olive) !important; 
          height: 100%; width: 100%; font-family: sans-serif;
        }
        
        .app { display: flex; width: 100vw; height: 100vh; background: var(--olive); }
        
        .main { flex: 0 0 70%; height: 100vh; overflow-y: auto; padding: 40px; border-right: 4px solid var(--dark); }
        .side { flex: 0 0 30%; background: var(--sand); height: 100vh; overflow-y: auto; padding: 30px; }

        .h1 { font-size: 60px; font-weight: 900; text-transform: uppercase; color: var(--dark); margin: 0 0 30px 0; letter-spacing: -3px; }
        
        /* ФИЛЬТРЫ 1 К 1 НАД КАРТОЧКАМИ */
        .filter-container { 
          display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px;
        }
        .filter-selectors { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        
        .ui-el { 
          width: 100%; background: var(--sand); border: 3px solid var(--dark); 
          padding: 15px; border-radius: 14px; font-weight: 800; color: var(--dark); outline: none; font-size: 14px;
        }

        /* СЕТКА 2x2 */
        .movie-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
        
        .scene { height: 460px; perspective: 1500px; }
        .card { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); transform-style: preserve-3d; cursor: pointer; }
        .scene.flipped .card { transform: rotateY(180deg); }

        .face { 
          position: absolute; width: 100%; height: 100%; backface-visibility: hidden; 
          border-radius: 30px; border: 4px solid var(--dark); padding: 35px; 
          display: flex; flex-direction: column; 
        }
        
        .face.front.watched { background: var(--rose); } /* СМОТРЕЛИ */
        .face.front.queue { background: var(--green); }   /* В ОЧЕРЕДИ */
        .face.back { background: var(--sand); transform: rotateY(180deg); border-style: dashed; }

        .m-status { font-size: 11px; font-weight: 900; color: var(--yellow); text-transform: uppercase; margin-bottom: 10px; }
        .m-title { font-size: 32px; font-weight: 900; color: var(--yellow); text-transform: uppercase; line-height: 0.9; margin: 5px 0 15px 0; }
        .m-meta { font-size: 13px; font-weight: 700; color: var(--yellow); opacity: 0.8; margin-bottom: 20px; }
        .m-desc { font-size: 15px; line-height: 1.4; color: var(--yellow); display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
        .m-rating-big { margin-top: auto; font-size: 50px; font-weight: 900; color: var(--yellow); letter-spacing: -2px; }

        .note-input { width: 100%; flex: 1; background: rgba(0,0,0,0.03); border: 2px dashed var(--dark); border-radius: 20px; padding: 20px; font-weight: 700; color: var(--dark); resize: none; outline: none; margin: 15px 0; }
        .side-title { font-size: 24px; font-weight: 900; text-transform: uppercase; border-bottom: 4px solid var(--dark); padding-bottom: 10px; margin-bottom: 25px; color: var(--dark); }
        .loader { height: 100vh; background: var(--olive); display: flex; align-items: center; justify-content: center; font-weight: 900; color: var(--dark); font-size: 24px; }
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
                <div className={`face front ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div className="m-status">{m.isWatched ? '● ПРОСМОТРЕНО' : '○ В ОЧЕРЕДИ'}</div>
                  <div className="m-title">{m.title}</div>
                  <div className="m-meta">{m.genre} • {m.year}</div>
                  <div className="m-desc">{m.desc}</div>
                  <div className="m-rating-big">{m.rating}</div>
                </div>

                <div className="face back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight: 900}}>ЗАМЕТКА:</div>
                  <textarea 
                    className="note-input"
                    value={notes[m.title] || ''}
                    placeholder="Напиши что-нибудь..."
                    onChange={(e) => {
                      const n = { ...notes, [m.title]: e.target.value };
                      setNotes(n);
                      localStorage.setItem('movie_notes_shared', JSON.stringify(n));
                    }}
                  />
                  <div style={{textAlign: 'center', fontSize: '11px', fontWeight: 900, opacity: 0.6}} onClick={() => setFlipped({...flipped, [i]: false})}>
                    КЛИКНИ, ЧТОБЫ ЗАКРЫТЬ
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="side">
        <h2 className="side-title">Лента</h2>
        {Object.entries(notes).map(([title, text]) => text.trim() && (
          <div key={title} style={{marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '12px'}}>
            <div style={{color: 'var(--rose)', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase'}}>{title}</div>
            <div style={{fontSize: '14px', fontWeight: 600, color: 'var(--dark)', marginTop: '4px'}}>{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
