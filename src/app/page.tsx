'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

// Определяем структуру данных фильма
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

  // Состояния фильтров
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const savedNotes = localStorage.getItem('shared_movie_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const csvUrl = "https://docs.google.com/spreadsheets/d/1pge7MWZuBDMc_3gRfNYwnwBUVDDMA-g3emCDbGlZFwc/export?format=csv";
    
    fetch(csvUrl)
      .then(r => r.text())
      .then(text => {
        Papa.parse(text, {
          header: true, 
          skipEmptyLines: true,
          complete: (res) => {
            const parsed = res.data.map((row: any) => ({
              title: row['Название'] || row['Title'] || '',
              genre: row['Жанр'] || row['Genre'] || 'Не указан',
              desc: row['Описание'] || row['Description'] || '',
              year: row['Год'] || row['Year'] || '',
              isWatched: String(row['Статус'] || row['Status']).toLowerCase().includes('смотр'),
              rating: row['Рейтинг'] || row['Rating'] || ''
            })).filter((m: Movie) => m.title !== '');
            setMovies(parsed);
            setLoading(false);
          }
        });
      })
      .catch(() => setLoading(false));
  }, []);

  const genres = useMemo(() => ['ALL', ...Array.from(new Set(movies.map(m => m.genre)))].sort(), [movies]);
  const years = useMemo(() => ['ALL', ...Array.from(new Set(movies.map(m => m.year)))].sort((a,b) => b.localeCompare(a)), [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchesGenre = genreFilter === 'ALL' || m.genre === genreFilter;
      const matchesYear = yearFilter === 'ALL' || m.year === yearFilter;
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'WATCHED' ? m.isWatched : !m.isWatched);
      return matchesSearch && matchesGenre && matchesYear && matchesStatus;
    });
  }, [movies, search, genreFilter, yearFilter, statusFilter]);

  const toggleFlip = (index: number) => {
    setFlipped(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const saveNote = (title: string, text: string) => {
    const newNotes = { ...notes, [title]: text };
    setNotes(newNotes);
    localStorage.setItem('shared_movie_notes', JSON.stringify(newNotes));
  };

  if (loading) return <div className="loader">ЗАГРУЗКА...</div>;

  return (
    <div className="layout">
      <style>{`
        :root {
          --bg-olive: #8C9B81;
          --ui-sand: #EAD9A6;
          --card-green: #7A9680;
          --card-rose: #A67575;
          --text-yellow: #F2C94C;
          --deep-brown: #2D2926;
        }
        body { margin: 0; background: var(--bg-olive); font-family: sans-serif; overflow: hidden; }
        .layout { display: flex; width: 100vw; height: 100vh; }
        .main-pane { flex: 0 0 70%; height: 100vh; overflow-y: auto; padding: 40px; border-right: 4px solid var(--deep-brown); }
        .side-pane { flex: 0 0 30%; background: var(--ui-sand); height: 100vh; overflow-y: auto; padding: 30px; }
        .header-title { font-size: 60px; font-weight: 900; text-transform: uppercase; margin-bottom: 30px; color: var(--deep-brown); }
        .filter-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 40px; }
        .ui-input { background: var(--ui-sand); border: 3px solid var(--deep-brown); padding: 15px; border-radius: 12px; font-weight: 800; color: var(--deep-brown); outline: none; }
        .movie-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
        .scene { height: 420px; perspective: 1200px; }
        .card { position: relative; width: 100%; height: 100%; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; cursor: pointer; }
        .scene.is-flipped .card { transform: rotateY(180deg); }
        .face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 25px; padding: 30px; border: 4px solid var(--deep-brown); display: flex; flex-direction: column; box-sizing: border-box; }
        .face-front.watched { background: var(--card-rose); }
        .face-front.queue { background: var(--card-green); }
        .face-back { background: var(--ui-sand); transform: rotateY(180deg); color: var(--deep-brown); }
        .m-title { font-size: 28px; font-weight: 900; color: var(--text-yellow); text-transform: uppercase; margin: 10px 0; line-height: 1.1; }
        .m-info { font-size: 13px; font-weight: 700; color: var(--text-yellow); opacity: 0.9; margin-bottom: 10px; }
        .m-desc { font-size: 14px; line-height: 1.4; color: var(--text-yellow); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; }
        .m-rating { margin-top: auto; font-size: 45px; font-weight: 900; color: var(--text-yellow); letter-spacing: -2px; }
        .note-area { flex: 1; background: rgba(0,0,0,0.05); border: 2px dashed var(--deep-brown); border-radius: 15px; padding: 15px; resize: none; font-weight: 700; color: var(--deep-brown); }
        .sidebar-h2 { font-size: 22px; font-weight: 900; text-transform: uppercase; border-bottom: 3px solid var(--deep-brown); padding-bottom: 10px; margin-bottom: 25px; }
        .note-row { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px dashed var(--deep-brown); }
        .note-row b { display: block; color: var(--card-rose); text-transform: uppercase; font-size: 12px; }
        .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 900; color: var(--text-yellow); }
      `}</style>

      <div className="main-pane">
        <h1 className="header-title">Кино Архив</h1>
        <div className="filter-grid">
          <input className="ui-input" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
          <select className="ui-input" onChange={e => setGenreFilter(e.target.value)}>
            <option value="ALL">ЖАНРЫ</option>
            {genres.map(g => g !== 'ALL' && <option key={g} value={g}>{g}</option>)}
          </select>
          <select className="ui-input" onChange={e => setYearFilter(e.target.value)}>
            <option value="ALL">ГОДЫ</option>
            {years.map(y => y !== 'ALL' && <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="ui-input" onChange={e => setStatusFilter(e.target.value)}>
            <option value="ALL">СТАТУС</option>
            <option value="WATCHED">СМОТРЕЛИ</option>
            <option value="QUEUE">В ОЧЕРЕДИ</option>
          </select>
        </div>

        <div className="movie-grid">
          {filteredMovies.map((m, i) => (
            <div key={i} className={`scene ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => toggleFlip(i)}>
              <div className="card">
                <div className={`face face-front ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div style={{fontSize: '10px', fontWeight: 900, color: 'var(--text-yellow)'}}>{m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}</div>
                  <div className="m-title">{m.title}</div>
                  <div className="m-info">{m.genre} • {m.year}</div>
                  <div className="m-desc">{m.desc}</div>
                  <div className="m-rating">{m.rating}</div>
                </div>
                <div className="face face-back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight: 900, marginBottom: '10px'}}>ЗАМЕТКА:</div>
                  <textarea 
                    className="note-area"
                    value={notes[m.title] || ''}
                    onChange={(e) => saveNote(m.title, e.target.value)}
                  />
                  <div style={{marginTop: '10px', textAlign: 'center', fontSize: '10px', fontWeight: 900}} onClick={() => toggleFlip(i)}>[ ЗАКРЫТЬ ]</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="side-pane">
        <h2 className="sidebar-h2">Лента заметок</h2>
        {Object.entries(notes).map(([title, text]) => text.trim() && (
          <div key={title} className="note-row">
            <b>{title}</b>
            <div style={{fontSize: '14px'}}>{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
