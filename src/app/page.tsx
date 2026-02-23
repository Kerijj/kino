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
          header: true,
          skipEmptyLines: true,
          complete: (res) => {
            const parsed = res.data.map((row: any) => {
              const find = (keys: string[]) => {
                const k = Object.keys(row).find(key => keys.includes(key.trim().toLowerCase()));
                return k ? row[k] : '';
              };
              return {
                title: find(['название', 'title', 'имя']),
                genre: find(['жанр', 'genre']) || 'Кино',
                desc: find(['описание', 'description', 'о чем']) || '',
                year: String(find(['год', 'year']) || ''),
                isWatched: String(find(['статус', 'status'])).toLowerCase().includes('смотр'),
                rating: find(['рейтинг', 'rating', 'оценка']) || '—'
              };
            }).filter((m: Movie) => m.title);
            setMovies(parsed);
            setLoading(false);
          }
        });
      });
  }, []);

  // Динамические списки для фильтров
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

  if (loading) return <div className="loader">ЗАГРУЗКА БАЗЫ...</div>;

  return (
    <div className="container">
      <style>{`
        :root {
          --olive: #8C9B81; --sand: #EAD9A6; --rose: #A67575; --green: #7A9680; --yellow: #F2C94C; --dark: #2D2926;
        }
        body { margin: 0; background: var(--olive); font-family: 'Inter', sans-serif; overflow: hidden; }
        .container { display: flex; width: 100vw; height: 100vh; background: var(--olive); }
        
        /* ГАЛЕРЕЯ */
        .main { flex: 0 0 70%; padding: 40px; overflow-y: auto; border-right: 3px solid var(--dark); box-sizing: border-box; }
        .h1 { font-size: 60px; font-weight: 900; text-transform: uppercase; color: var(--dark); margin: 0 0 30px 0; letter-spacing: -3px; }
        
        /* ФИЛЬТРЫ */
        .filter-bar { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 40px; }
        .ui-input { background: var(--sand); border: 3px solid var(--dark); padding: 12px; border-radius: 12px; font-weight: 800; color: var(--dark); outline: none; font-size: 14px; }

        /* СЕТКА 2x2 */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
        
        .scene { height: 420px; perspective: 1200px; }
        .card { position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; cursor: pointer; }
        .scene.is-flipped .card { transform: rotateY(180deg); }

        .face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 25px; border: 4px solid var(--dark); padding: 25px; display: flex; flex-direction: column; box-sizing: border-box; }
        .front.watched { background: var(--rose); }
        .front.queue { background: var(--green); }
        .back { background: var(--sand); transform: rotateY(180deg); }

        .m-title { font-size: 28px; font-weight: 900; color: var(--yellow); text-transform: uppercase; margin: 10px 0; line-height: 1; }
        .m-desc { font-size: 14px; color: var(--yellow); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
        .m-rating { margin-top: auto; font-size: 45px; font-weight: 900; color: var(--yellow); }

        /* ЗАМЕТКИ */
        .side { flex: 0 0 30%; background: var(--sand); padding: 30px; overflow-y: auto; box-sizing: border-box; }
        .side-h { font-size: 22px; font-weight: 900; text-transform: uppercase; border-bottom: 3px solid var(--dark); padding-bottom: 10px; margin-bottom: 20px; }
        .note-card { margin-bottom: 20px; border-bottom: 1px dashed var(--dark); padding-bottom: 10px; }
        .note-card b { color: var(--rose); font-size: 12px; display: block; text-transform: uppercase; }
        
        .textarea { flex: 1; background: rgba(0,0,0,0.05); border: 2px dashed var(--dark); border-radius: 15px; padding: 15px; font-weight: 700; color: var(--dark); resize: none; }
        .loader { height: 100vh; background: var(--olive); display: flex; align-items: center; justify-content: center; font-weight: 900; color: var(--yellow); font-size: 24px; }
      `}</style>

      <div className="main">
        <h1 className="h1">Кино Архив</h1>
        <div className="filter-bar">
          <input className="ui-input" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
          <select className="ui-input" value={genreFilter} onChange={e => setGenreFilter(e.target.value)}>
            <option value="ALL">ВСЕ ЖАНРЫ</option>
            {genres.map(g => g !== 'ALL' && <option key={g} value={g}>{g.toUpperCase()}</option>)}
          </select>
          <select className="ui-input" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
            <option value="ALL">ГОДЫ</option>
            {years.map(y => y !== 'ALL' && <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="ui-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">СТАТУС</option>
            <option value="WATCHED">СМОТРЕЛИ</option>
            <option value="QUEUE">В ОЧЕРЕДИ</option>
          </select>
        </div>

        <div className="grid">
          {filtered.map((m, i) => (
            <div key={i} className={`scene ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
              <div className="card">
                <div className={`face front ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div style={{fontSize: '10px', fontWeight: 900, color: 'var(--yellow)'}}>{m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}</div>
                  <div className="m-title">{m.title}</div>
                  <div style={{fontSize: '12px', fontWeight: 700, color: 'var(--yellow)', marginBottom: '10px'}}>{m.genre} • {m.year}</div>
                  <div className="m-desc">{m.desc}</div>
                  <div className="m-rating">{m.rating}</div>
                </div>
                <div className="face back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight: 900, marginBottom: '10px'}}>ВАШИ МЫСЛИ:</div>
                  <textarea 
                    className="textarea"
                    value={notes[m.title] || ''}
                    onChange={(e) => {
                      const n = { ...notes, [m.title]: e.target.value };
                      setNotes(n);
                      localStorage.setItem('movie_notes_shared', JSON.stringify(n));
                    }}
                  />
                  <div style={{marginTop: '10px', textAlign: 'center', fontSize: '10px', fontWeight: 900}} onClick={() => setFlipped({...flipped, [i]: false})}>[ ЗАКРЫТЬ ]</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="side">
        <div className="side-h">Лента заметок</div>
        {Object.entries(notes).map(([title, text]) => text.trim() && (
          <div key={title} className="note-card">
            <b>{title}</b>
            <div style={{fontSize: '14px', lineHeight: '1.4'}}>{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
