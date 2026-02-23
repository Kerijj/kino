'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

export default function MovieArchive() {
  const [movies, setMovies] = useState<any[]>([]);
  const [notes, setNotes] = useState<{[key: string]: string}>({});
  const [flipped, setFlipped] = useState<{[key: number]: boolean}>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ВСЕ');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedNotes = localStorage.getItem('shared_movie_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const csvUrl = "https://docs.google.com/spreadsheets/d/1pge7MWZuBDMc_3gRfNYwnwBUVDDMA-g3emCDbGlZFwc/export?format=csv";
    fetch(csvUrl).then(r => r.text()).then(text => {
      Papa.parse(text, {
        header: true, skipEmptyLines: true,
        complete: (res) => {
          const data = res.data.map((row: any) => ({
            title: row['Название'] || row['Title'] || 'Без названия',
            genre: row['Жанр'] || row['Genre'] || 'Кино',
            desc: row['Описание'] || row['Description'] || '',
            year: row['Год'] || row['Year'] || '',
            isWatched: (row['Статус'] || row['Status'] || '').toLowerCase().includes('смотр'),
            rating: row['Рейтинг'] || row['Rating'] || ''
          })).filter(m => m.title !== 'Без названия');
          setMovies(data);
          setLoading(false);
        }
      });
    });
  }, []);

  const filtered = useMemo(() => {
    return movies.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ВСЕ' || (statusFilter === 'СМОТРЕЛИ' ? m.isWatched : !m.isWatched);
      return matchesSearch && matchesStatus;
    });
  }, [movies, search, statusFilter]);

  if (loading) return <div className="loading">ЗАГРУЗКА ДАННЫХ...</div>;

  return (
    <div className="layout">
      <style>{`
        :root {
          --bg-olive: #8C9B81;
          --ui-sand: #EAD9A6;
          --card-green: #7A9680;
          --card-rose: #A67575;
          --text-yellow: #F2C94C;
          --deep-brown: #2D2926; /* Вместо черного */
        }

        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg-olive); font-family: 'Inter', sans-serif; color: var(--deep-brown); }

        .layout { display: flex; width: 100vw; height: 100vh; overflow: hidden; }

        /* ЛЕВАЯ ЧАСТЬ - КОНТЕНТ */
        .content-side { 
          flex: 1; 
          height: 100vh; 
          overflow-y: auto; 
          padding: 40px;
          display: flex;
          flex-direction: column;
        }

        /* ПРАВАЯ ЧАСТЬ - ЛЕНТА */
        .sidebar { 
          width: 350px; 
          background: var(--ui-sand); 
          border-left: 4px solid var(--deep-brown); 
          height: 100vh; 
          overflow-y: auto; 
          padding: 30px;
        }

        .title-main { font-size: clamp(40px, 6vw, 80px); font-weight: 900; text-transform: uppercase; margin: 0 0 30px 0; letter-spacing: -3px; }

        .controls { display: flex; gap: 15px; margin-bottom: 40px; }
        .ui-select, .ui-input { 
          background: var(--ui-sand); border: 3px solid var(--deep-brown); 
          padding: 15px; border-radius: 12px; font-weight: 800; color: var(--deep-brown); outline: none;
        }

        /* СЕТКА КАРТОЧЕК */
        .movie-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
          gap: 30px; 
          padding-bottom: 50px;
        }

        /* 3D КАРТОЧКА */
        .scene { height: 450px; perspective: 1200px; }
        .card-inner { 
          position: relative; width: 100%; height: 100%; 
          transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          transform-style: preserve-3d; cursor: pointer;
        }
        .scene.is-flipped .card-inner { transform: rotateY(180deg); }

        .card-face { 
          position: absolute; width: 100%; height: 100%; 
          backface-visibility: hidden; border-radius: 25px; padding: 25px;
          border: 4px solid var(--deep-brown); display: flex; flex-direction: column;
        }

        .face-front.watched { background: var(--card-rose); }
        .face-front.queue { background: var(--card-green); }
        .face-back { background: var(--ui-sand); transform: rotateY(180deg); color: var(--deep-brown); }

        .m-status { font-size: 11px; font-weight: 900; text-transform: uppercase; color: var(--text-yellow); margin-bottom: 10px; }
        .m-title { font-size: 26px; font-weight: 900; text-transform: uppercase; color: var(--text-yellow); line-height: 1.1; margin-bottom: 10px; }
        .m-meta { font-size: 13px; font-weight: 700; color: var(--text-yellow); opacity: 0.9; margin-bottom: 15px; }
        .m-desc { font-size: 14px; line-height: 1.4; color: var(--text-yellow); display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
        .m-rating { margin-top: auto; font-size: 50px; font-weight: 900; color: var(--text-yellow); letter-spacing: -2px; }

        .note-input { 
          flex: 1; background: rgba(0,0,0,0.05); border: 2px dashed var(--deep-brown); 
          border-radius: 15px; padding: 15px; resize: none; font-family: inherit; font-weight: 700;
        }

        /* ЗАМЕТКИ В ЛЕНТЕ */
        .sidebar-h2 { font-weight: 900; text-transform: uppercase; border-bottom: 3px solid var(--deep-brown); padding-bottom: 10px; margin-bottom: 20px; }
        .sidebar-item { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px dashed var(--deep-brown); }
        .sidebar-item b { display: block; color: var(--card-rose); text-transform: uppercase; font-size: 12px; }

        .loading { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 30px; }
      `}</style>

      {/* ЛЕВАЯ СТОРОНА */}
      <section className="content-side">
        <h1 className="title-main">Кино Архив</h1>
        
        <div className="controls">
          <input className="ui-input" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
          <select className="ui-select" onChange={e => setStatusFilter(e.target.value)}>
            <option value="ВСЕ">ВСЕ ФИЛЬМЫ</option>
            <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
            <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
          </select>
        </div>

        <div className="movie-grid">
          {filtered.map((m, i) => (
            <div key={i} className={`scene ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
              <div className="card-inner">
                {/* ПЕРЕД */}
                <div className={`card-face face-front ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div className="m-status">{m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}</div>
                  <div className="m-title">{m.title}</div>
                  <div className="m-meta">{m.genre} • {m.year}</div>
                  <div className="m-desc">{m.desc}</div>
                  <div className="m-rating">{m.rating || '—'}</div>
                </div>

                {/* ЗАД */}
                <div className="card-face face-back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight: 900, marginBottom: '10px'}}>ЗАМЕТКА:</div>
                  <textarea 
                    className="note-input"
                    value={notes[m.title] || ''}
                    placeholder="Ваши мысли..."
                    onChange={(e) => {
                      const n = { ...notes, [m.title]: e.target.value };
                      setNotes(n);
                      localStorage.setItem('shared_movie_notes', JSON.stringify(n));
                    }}
                  />
                  <div style={{marginTop: '10px', textAlign: 'center', fontSize: '10px', fontWeight: 900}} onClick={() => setFlipped({...flipped, [i]: false})}>
                    [ ЗАКРЫТЬ ]
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ПРАВАЯ СТОРОНА */}
      <aside className="sidebar">
        <div className="sidebar-h2">Лента заметок</div>
        {Object.entries(notes).map(([title, text]) => (
          text.trim() && (
            <div key={title} className="sidebar-item">
              <b>{title}</b>
              {text}
            </div>
          )
        ))}
      </aside>
    </div>
  );
}
