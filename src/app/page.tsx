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

  // Фильтры
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const savedNotes = localStorage.getItem('shared_movie_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    // ТВОЯ ССЫЛКА НА ЭКСПОРТ (CSV)
    const csvUrl = "https://docs.google.com/spreadsheets/d/1pge7MWZuBDMc_3gRfNYwnwBUVDDMA-g3emCDbGlZFwc/export?format=csv";
    
    fetch(csvUrl)
      .then(r => r.text())
      .then(text => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (res) => {
            const parsed = res.data.map((row: any) => {
              // Авто-поиск полей (на случай если в таблице заголовки на русском или английском)
              const getVal = (keys: string[]) => {
                const foundKey = Object.keys(row).find(k => keys.includes(k.trim().toLowerCase()));
                return foundKey ? row[foundKey] : '';
              };

              return {
                title: getVal(['название', 'title', 'фильм']),
                genre: getVal(['жанр', 'genre']) || 'Кино',
                desc: getVal(['описание', 'description']) || '',
                year: getVal(['год', 'year']) || '',
                isWatched: String(getVal(['статус', 'status'])).toLowerCase().includes('смотр'),
                rating: getVal(['рейтинг', 'rating', 'оценка']) || '0'
              };
            }).filter((m: Movie) => m.title.length > 0);

            setMovies(parsed);
            setLoading(false);
          },
          error: () => setLoading(false)
        });
      })
      .catch(() => setLoading(false));
  }, []);

  // Формирование списков для выпадашек
  const genres = useMemo(() => ['ALL', ...Array.from(new Set(movies.map(m => m.genre)))].filter(Boolean), [movies]);
  const years = useMemo(() => ['ALL', ...Array.from(new Set(movies.map(m => m.year)))].filter(Boolean).sort((a,b) => b.localeCompare(a)), [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchesGenre = genreFilter === 'ALL' || m.genre === genreFilter;
      const matchesYear = yearFilter === 'ALL' || m.year === yearFilter;
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'WATCHED' ? m.isWatched : !m.isWatched);
      return matchesSearch && matchesGenre && matchesYear && matchesStatus;
    });
  }, [movies, search, genreFilter, yearFilter, statusFilter]);

  if (loading) return <div style={{background:'#8C9B81', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', color:'#F2C94C', fontWeight:900}}>СИНХРОНИЗАЦИЯ С ТАБЛИЦЕЙ...</div>;

  return (
    <div className="app-container">
      <style>{`
        :root {
          --bg-olive: #8C9B81;
          --ui-sand: #EAD9A6;
          --card-green: #7A9680;
          --card-rose: #A67575;
          --text-yellow: #F2C94C;
          --deep-brown: #2D2926;
        }
        body { margin: 0; padding: 0; background: var(--bg-olive) !important; }
        .app-container { display: flex; width: 100vw; height: 100vh; font-family: sans-serif; }
        
        .gallery { flex: 0 0 70%; padding: 40px; overflow-y: auto; border-right: 4px solid var(--deep-brown); background: var(--bg-olive); }
        .sidebar { flex: 0 0 30%; background: var(--ui-sand); padding: 30px; overflow-y: auto; }

        .h1 { font-size: 70px; font-weight: 900; text-transform: uppercase; margin-top: 0; color: var(--deep-brown); letter-spacing: -4px; }
        
        .filters { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 40px; }
        .ui-el { background: var(--ui-sand); border: 3px solid var(--deep-brown); padding: 15px; border-radius: 15px; font-weight: 800; color: var(--deep-brown); outline: none; }

        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        
        .card-scene { height: 450px; perspective: 1200px; }
        .card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; cursor: pointer; }
        .card-scene.flipped .card-inner { transform: rotateY(180deg); }

        .face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 30px; border: 4px solid var(--deep-brown); padding: 30px; display: flex; flex-direction: column; box-sizing: border-box; }
        .front.watched { background: var(--card-rose); }
        .front.queue { background: var(--card-green); }
        .back { background: var(--ui-sand); transform: rotateY(180deg); }

        .m-status { font-size: 11px; font-weight: 900; color: var(--text-yellow); text-transform: uppercase; }
        .m-title { font-size: 32px; font-weight: 900; color: var(--text-yellow); text-transform: uppercase; margin: 15px 0; line-height: 1; }
        .m-desc { font-size: 15px; line-height: 1.4; color: var(--text-yellow); display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
        .m-rating { margin-top: auto; font-size: 50px; font-weight: 900; color: var(--text-yellow); }

        .note-edit { flex: 1; background: rgba(0,0,0,0.05); border: 2px dashed var(--deep-brown); border-radius: 20px; padding: 20px; font-weight: 700; color: var(--deep-brown); resize: none; }
        
        .sidebar-title { font-size: 24px; font-weight: 900; border-bottom: 4px solid var(--deep-brown); padding-bottom: 10px; margin-bottom: 30px; }
        .note-item { margin-bottom: 25px; padding-bottom: 10px; border-bottom: 1px dashed var(--deep-brown); }
        .note-item b { color: var(--card-rose); font-size: 12px; display: block; text-transform: uppercase; }
      `}</style>

      <div className="gallery">
        <h1 className="h1">Кино Архив</h1>
        <div className="filters">
          <input className="ui-el" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
          <select className="ui-el" onChange={e => setGenreFilter(e.target.value)}>
            <option value="ALL">ЖАНРЫ</option>
            {genres.map(g => g !== 'ALL' && <option key={g} value={g}>{g}</option>)}
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

        <div className="grid">
          {filteredMovies.map((m, i) => (
            <div key={i} className={`card-scene ${flipped[i] ? 'flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
              <div className="card-inner">
                <div className={`face front ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div className="m-status">{m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}</div>
                  <div className="m-title">{m.title}</div>
                  <div style={{color: 'var(--text-yellow)', fontWeight: 700, marginBottom: '15px'}}>{m.genre} • {m.year}</div>
                  <div className="m-desc">{m.desc}</div>
                  <div className="m-rating">{m.rating}</div>
                </div>
                <div className="face back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight: 900, marginBottom: '10px'}}>МЫСЛИ:</div>
                  <textarea 
                    className="note-edit"
                    value={notes[m.title] || ''}
                    onChange={(e) => {
                      const n = { ...notes, [m.title]: e.target.value };
                      setNotes(n);
                      localStorage.setItem('shared_movie_notes', JSON.stringify(n));
                    }}
                  />
                  <div style={{marginTop: '10px', textAlign: 'center', fontSize: '10px', fontWeight: 900}} onClick={() => setFlipped({...flipped, [i]: false})}>[ ЗАКРЫТЬ ]</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sidebar">
        <div className="sidebar-title">Лента заметок</div>
        {Object.entries(notes).map(([title, text]) => text.trim() && (
          <div key={title} className="note-item">
            <b>{title}</b>
            <div style={{fontSize: '14px'}}>{text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
