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
    // 1. Загрузка заметок
    const savedNotes = localStorage.getItem('shared_movie_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    // 2. Загрузка данных
    const csvUrl = "https://docs.google.com/spreadsheets/d/1pge7MWZuBDMc_3gRfNYwnwBUVDDMA-g3emCDbGlZFwc/export?format=csv";
    
    fetch(csvUrl)
      .then(r => r.text())
      .then(text => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (res) => {
            const parsed = res.data.map((row: any) => ({
              title: row['Название'] || row['Title'] || 'Без названия',
              genre: row['Жанр'] || row['Genre'] || 'Кино',
              desc: row['Описание'] || row['Description'] || '',
              year: row['Год'] || row['Year'] || '',
              isWatched: String(row['Статус'] || row['Status']).toLowerCase().includes('смотр'),
              rating: row['Рейтинг'] || row['Rating'] || ''
            })).filter(m => m.title !== 'Без названия');

            setMovies(parsed.length > 0 ? parsed : []); // Если пусто, будет пустой массив
            setLoading(false);
          },
          error: () => {
            setLoading(false);
          }
        });
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return movies.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ВСЕ' || (statusFilter === 'СМОТРЕЛИ' ? m.isWatched : !m.isWatched);
      return matchesSearch && matchesStatus;
    });
  }, [movies, search, statusFilter]);

  if (loading) return <div style={{background:'#8C9B81', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#F2C94C', fontWeight:900, fontSize:'30px'}}>ЗАГРУЗКА...</div>;

  return (
    <div className="app-wrapper">
      <style>{`
        :root {
          --bg-olive: #8C9B81;
          --ui-sand: #EAD9A6;
          --card-green: #7A9680;
          --card-rose: #A67575;
          --text-yellow: #F2C94C;
          --deep-brown: #2D2926;
        }

        * { box-sizing: border-box; }
        
        body { 
          margin: 0; 
          background: var(--bg-olive) !important; 
          font-family: 'Inter', sans-serif; 
          overflow: hidden; 
        }

        .app-wrapper { 
          display: flex; 
          width: 100vw; 
          height: 100vh; 
        }

        /* ЛЕВАЯ ЧАСТЬ (КАРТОЧКИ) */
        .main-content { 
          flex: 0 0 70%; 
          height: 100vh; 
          overflow-y: auto; 
          padding: 50px;
          border-right: 4px solid var(--deep-brown);
        }

        /* ПРАВАЯ ЧАСТЬ (ЛЕНТА) */
        .notes-sidebar { 
          flex: 0 0 30%; 
          background: var(--ui-sand); 
          height: 100vh; 
          overflow-y: auto; 
          padding: 40px;
        }

        .main-title { 
          font-size: 80px; 
          font-weight: 900; 
          text-transform: uppercase; 
          color: var(--deep-brown);
          margin: 0 0 40px 0;
          letter-spacing: -4px;
        }

        .filter-bar { 
          display: flex; 
          gap: 20px; 
          margin-bottom: 50px; 
        }

        .ui-el { 
          background: var(--ui-sand); 
          border: 3px solid var(--deep-brown); 
          padding: 15px 25px; 
          border-radius: 15px; 
          font-weight: 800; 
          color: var(--deep-brown);
          outline: none;
        }

        /* СЕТКА */
        .movie-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
          gap: 40px; 
        }

        /* КАРТОЧКА */
        .movie-scene { 
          height: 480px; 
          perspective: 1500px; 
        }

        .movie-card { 
          position: relative; 
          width: 100%; 
          height: 100%; 
          transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); 
          transform-style: preserve-3d; 
          cursor: pointer;
        }

        .movie-scene.is-flipped .movie-card { transform: rotateY(180deg); }

        .face { 
          position: absolute; 
          width: 100%; 
          height: 100%; 
          backface-visibility: hidden; 
          border-radius: 30px; 
          padding: 35px; 
          border: 4px solid var(--deep-brown);
          display: flex;
          flex-direction: column;
        }

        .face-front.watched { background: var(--card-rose); }
        .face-front.queue { background: var(--card-green); }
        
        .face-back { 
          background: var(--ui-sand); 
          transform: rotateY(180deg); 
          color: var(--deep-brown); 
        }

        .movie-status { font-size: 11px; font-weight: 900; color: var(--text-yellow); text-transform: uppercase; }
        .movie-name { font-size: 32px; font-weight: 900; color: var(--text-yellow); text-transform: uppercase; margin: 15px 0; line-height: 1; }
        .movie-info { font-size: 14px; font-weight: 700; color: var(--text-yellow); opacity: 0.8; margin-bottom: 20px; }
        .movie-text { font-size: 15px; line-height: 1.5; color: var(--text-yellow); display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
        .movie-rating { margin-top: auto; font-size: 60px; font-weight: 900; color: var(--text-yellow); letter-spacing: -3px; }

        .note-field { 
          flex: 1; background: rgba(0,0,0,0.05); border: 2px dashed var(--deep-brown); 
          border-radius: 20px; padding: 20px; font-weight: 700; color: var(--deep-brown); resize: none; outline: none;
        }

        .sidebar-title { font-size: 24px; font-weight: 900; text-transform: uppercase; border-bottom: 4px solid var(--deep-brown); padding-bottom: 10px; margin-bottom: 30px; }
        .note-item { margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px dashed var(--deep-brown); }
        .note-item b { display: block; color: var(--card-rose); text-transform: uppercase; margin-bottom: 5px; }
      `}</style>

      {/* ЛЕВАЯ ПАНЕЛЬ */}
      <div className="main-content">
        <h1 className="main-title">Кино Архив</h1>
        
        <div className="filter-bar">
          <input className="ui-el" placeholder="ПОИСК..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="ui-el" onChange={e => setStatusFilter(e.target.value)}>
            <option value="ВСЕ">СТАТУС: ВСЕ</option>
            <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
            <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
          </select>
        </div>

        <div className="movie-grid">
          {filtered.length > 0 ? filtered.map((m, i) => (
            <div key={i} className={`movie-scene ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
              <div className="movie-card">
                {/* ЛИЦЕВАЯ */}
                <div className={`face face-front ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div className="movie-status">{m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}</div>
                  <div className="movie-name">{m.title}</div>
                  <div className="movie-info">{m.genre} • {m.year}</div>
                  <div className="movie-text">{m.desc}</div>
                  <div className="movie-rating">{m.rating}</div>
                </div>

                {/* ОБРАТНАЯ */}
                <div className="face face-back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight: 900, marginBottom: '15px'}}>МОИ МЫСЛИ:</div>
                  <textarea 
                    className="note-field"
                    value={notes[m.title] || ''}
                    placeholder="Напиши что-нибудь..."
                    onChange={(e) => {
                      const newNotes = { ...notes, [m.title]: e.target.value };
                      setNotes(newNotes);
                      localStorage.setItem('shared_movie_notes', JSON.stringify(newNotes));
                    }}
                  />
                  <div style={{marginTop: '15px', textAlign: 'center', fontSize: '12px', fontWeight: 900}} onClick={() => setFlipped({...flipped, [i]: false})}>
                    [ ЗАКРЫТЬ ]
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div style={{color: 'var(--deep-brown)', fontWeight: 900}}>ФИЛЬМЫ НЕ НАЙДЕНЫ</div>
          )}
        </div>
      </div>

      {/* ПРАВАЯ ПАНЕЛЬ */}
      <div className="notes-sidebar">
        <div className="sidebar-title">Лента заметок</div>
        {Object.entries(notes).map(([title, text]) => (
          text.trim() && (
            <div key={title} className="note-item">
              <b>{title}</b>
              <div style={{fontSize: '14px', lineHeight: '1.4'}}>{text}</div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
