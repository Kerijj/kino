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

  // УМНЫЙ СПИСОК ЖАНРОВ: дробление сложных строк типа "Драма / Комедия"
  const genres = useMemo(() => {
    const allGenres = new Set<string>();
    movies.forEach(m => {
      if (m.genre) {
        // Разделяем по слешу, запятой или союзу "и"
        const splitGenres = m.genre.split(/[/,]| и /).map(g => g.trim());
        splitGenres.forEach(g => {
          if (g && g.length > 2) {
            allGenres.add(g.charAt(0).toUpperCase() + g.slice(1).toLowerCase());
          }
        });
      }
    });
    return ['ALL', ...Array.from(allGenres)].sort();
  }, [movies]);

  const years = useMemo(() => ['ALL', ...Array.from(new Set(movies.map(m => m.year).filter(Boolean)))].sort((a,b) => b.localeCompare(a)), [movies]);

  // УМНАЯ ФИЛЬТРАЦИЯ
  const filtered = useMemo(() => {
    return movies.filter(m => {
      const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchYear = yearFilter === 'ALL' || m.year === yearFilter;
      const matchStatus = statusFilter === 'ALL' || (statusFilter === 'WATCHED' ? m.isWatched : !m.isWatched);
      
      // Ищем вхождение выбранного жанра в строку (например "Драма" найдется в "Комедия / Драма")
      const matchGenre = genreFilter === 'ALL' || 
                         m.genre.toLowerCase().includes(genreFilter.toLowerCase());
      
      return matchSearch && matchGenre && matchYear && matchStatus;
    });
  }, [movies, search, genreFilter, yearFilter, statusFilter]);

  if (loading) return <div className="loader">ЗАГРУЗКА АРХИВА...</div>;

  return (
    <div className="app">
      <style>{`
        :root {
          --olive: #8C9B81; --sand: #EAD9A6; --rose: #A67575; --green: #7A9680; --yellow: #F2C94C; --dark: #2D2926;
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        
        html, body { 
          margin: 0; padding: 0; background-color: var(--olive) !important; 
          font-family: 'Inter', sans-serif; height: 100%; scroll-behavior: smooth;
        }

        .app { display: flex; flex-direction: row; min-height: 100vh; background: var(--olive); }

        .main { flex: 1; padding: clamp(20px, 4vw, 40px); overflow-y: auto; -webkit-overflow-scrolling: touch; }
        
        .side { width: 350px; background: var(--sand); padding: 30px; border-left: 4px solid var(--dark); overflow-y: auto; }

        .h1 { font-size: clamp(32px, 7vw, 60px); font-weight: 900; text-transform: uppercase; color: var(--dark); margin: 0 0 25px 0; letter-spacing: -3px; }
        
        .filter-container { display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 35px; }
        .filter-selectors { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
        
        .ui-el { 
          width: 100%; background: var(--sand); border: 3px solid var(--dark); 
          padding: 14px; border-radius: 14px; font-weight: 800; color: var(--dark); outline: none; font-size: 14px;
          cursor: pointer;
        }

        .movie-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
          gap: 25px; 
        }
        
        .scene { height: 440px; perspective: 1500px; }
        .card { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); transform-style: preserve-3d; cursor: pointer; }
        .scene.flipped .card { transform: rotateY(180deg); }

        .face { 
          position: absolute; width: 100%; height: 100%; backface-visibility: hidden; 
          border-radius: 30px; border: 4px solid var(--dark); padding: 30px; 
          display: flex; flex-direction: column; 
        }
        
        .face.front.is-watched-bg { background: var(--rose) !important; }
        .face.front.is-queue-bg { background: var(--green) !important; }
        .face.back { background: var(--sand); transform: rotateY(180deg); border-style: dashed; }

        .m-status { font-size: 10px; font-weight: 900; color: var(--yellow); text-transform: uppercase; margin-bottom: 8px; }
        .m-title { font-size: 28px; font-weight: 900; color: var(--yellow); text-transform: uppercase; line-height: 1; margin: 5px 0 12px 0; }
        .m-meta { font-size: 13px; font-weight: 700; color: var(--yellow); opacity: 0.9; margin-bottom: 15px; }
        .m-desc { font-size: 15px; line-height: 1.4; color: var(--yellow); display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
        .m-rating-big { margin-top: auto; font-size: 45px; font-weight: 900; color: var(--yellow); letter-spacing: -2px; }

        .note-input { width: 100%; flex: 1; background: rgba(0,0,0,0.04); border: 2px dashed var(--dark); border-radius: 20px; padding: 20px; font-weight: 700; color: var(--dark); resize: none; margin: 15px 0; outline: none; }

        /* АДАПТИВНОСТЬ */
        @media (max-width: 1024px) {
          .app { flex-direction: column; }
          .main { flex: none; width: 100%; overflow-y: visible; }
          .side { width: 100%; border-left: none; border-top: 5px solid var(--dark); height: auto; min-height: 300px; }
          .movie-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
          .h1 { font-size: 40px; }
        }

        @media (min-width: 1400px) {
          .filter-container { grid-template-columns: 1fr 1fr; }
        }

        .loader { height: 100vh; background: var(--olive); display: flex; align-items: center; justify-content: center; font-weight: 900; color: var(--dark); font-size: 20px; }
      `}</style>

      <div className="main">
        <h1 className="h1">КИНО АРХИВ</h1>
        
        <div className="filter-container">
          <input className="ui-el" placeholder="ПОИСК ПО НАЗВАНИЮ..." onChange={e => setSearch(e.target.value)} />
          <div className="filter-selectors">
            <select className="ui-el" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}>
              <option value="ALL">ЖАНР</option>
              {genres.map(g => g !== 'ALL' && <option key={g} value={g}>{g.toUpperCase()}</option>)}
            </select>
            <select className="ui-el" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
              <option value="ALL">ГОД</option>
              {years.map(y => y !== 'ALL' && <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="ui-el" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
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
                  <div style={{fontWeight: 900, fontSize: '14px', textTransform: 'uppercase'}}>Ваша заметка:</div>
                  <textarea 
                    className="note-input"
                    value={notes[m.title] || ''}
                    placeholder="Напишите впечатления..."
                    onChange={(e) => {
                      const n = { ...notes, [m.title]: e.target.value };
                      setNotes(n);
                      localStorage.setItem('movie_notes_shared', JSON.stringify(n));
                    }}
                  />
                  <div style={{textAlign: 'center', fontSize: '11px', fontWeight: 900, opacity: 0.6}} onClick={() => setFlipped({...flipped, [i]: false})}>
                    КЛИКНИТЕ, ЧТОБЫ ЗАКРЫТЬ
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="side">
        <h2 style={{fontSize: '22px', fontWeight: 900, textTransform: 'uppercase', borderBottom: '4px solid var(--dark)', paddingBottom: '12px', marginBottom: '20px'}}>Лента событий</h2>
        {Object.entries(notes).map(([title, text]) => text.trim() && (
          <div key={title} style={{marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.1)'}}>
            <div style={{color: 'var(--rose)', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px'}}>{title}</div>
            <div style={{fontSize: '14px', fontWeight: 600, color: 'var(--dark)', lineHeight: '1.4'}}>{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
