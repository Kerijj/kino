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
            title: row['Название'] || row['Title'] || '',
            genre: row['Жанр'] || row['Genre'] || '',
            desc: row['Описание'] || row['Description'] || '',
            year: row['Год'] || row['Year'] || '',
            isWatched: (row['Статус'] || row['Status'] || '').toLowerCase().includes('смотр'),
            rating: row['Рейтинг'] || row['Rating'] || ''
          })).filter(m => m.title);
          setMovies(data);
          setLoading(false);
        }
      });
    });
  }, []);

  const saveNote = (title: string, text: string) => {
    const newNotes = { ...notes, [title]: text };
    setNotes(newNotes);
    localStorage.setItem('shared_movie_notes', JSON.stringify(newNotes));
  };

  const filtered = useMemo(() => {
    return movies.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ВСЕ' || (statusFilter === 'СМОТРЕЛИ' ? m.isWatched : !m.isWatched);
      return matchesSearch && matchesStatus;
    });
  }, [movies, search, statusFilter]);

  if (loading) return <div className="loader">ЗАГРУЗКА...</div>;

  return (
    <div className="app-layout">
      <style>{`
        :root {
          --color-bg: #8C9B81;
          --color-sand: #EAD9A6;
          --color-green: #7A9680;
          --color-rose: #A67575;
          --color-yellow: #F2C94C;
          --color-dark: #2D2926; /* Замена черному */
        }

        html, body {
          background-color: var(--color-bg) !important;
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, sans-serif;
          color: var(--color-dark);
        }

        .app-layout {
          display: flex;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ОСНОВНОЙ КОНТЕНТ */
        .content-area {
          flex: 1;
          padding: 40px;
          max-width: calc(100% - 350px);
        }

        /* ЛЕНТА ЗАМЕТОК */
        .notes-sidebar {
          width: 350px;
          background-color: var(--color-sand);
          border-left: 4px solid var(--color-dark);
          padding: 30px;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
          box-shadow: -5px 0 15px rgba(0,0,0,0.1);
        }

        .sidebar-header {
          font-weight: 900;
          text-transform: uppercase;
          font-size: 20px;
          margin-bottom: 25px;
          border-bottom: 2px solid var(--color-dark);
          padding-bottom: 10px;
        }

        .sidebar-note {
          margin-bottom: 20px;
          font-size: 14px;
          line-height: 1.4;
          padding-bottom: 15px;
          border-bottom: 1px dashed rgba(0,0,0,0.2);
        }

        .sidebar-note b {
          display: block;
          color: var(--color-rose);
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        /* ЗАГОЛОВОК И ПОИСК */
        .archive-header {
          font-size: clamp(35px, 8vw, 75px);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -2px;
          margin-bottom: 30px;
        }

        .filters-row {
          display: flex;
          gap: 15px;
          margin-bottom: 50px;
          flex-wrap: wrap;
        }

        .input-box {
          background-color: var(--color-sand) !important;
          border: 3px solid var(--color-dark);
          padding: 15px 20px;
          border-radius: 12px;
          font-weight: 800;
          color: var(--color-dark);
          outline: none;
          font-size: 14px;
        }

        /* СЕТКА КАРТОЧЕК */
        .movie-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 40px;
          align-items: start;
        }

        /* КОНТЕЙНЕР КАРТОЧКИ */
        .card-container {
          height: 480px;
          perspective: 1500px;
          position: relative;
        }

        .card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }

        .card-container.is-flipped .card-inner {
          transform: rotateY(180deg);
        }

        .card-face {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          border-radius: 25px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          border: 3px solid var(--color-dark);
          box-shadow: 10px 10px 0px rgba(0,0,0,0.1);
          box-sizing: border-box;
        }

        .face-front.watched { background-color: var(--color-rose) !important; }
        .face-front.queue { background-color: var(--color-green) !important; }
        
        .face-back {
          background-color: var(--color-sand) !important;
          transform: rotateY(180deg);
          color: var(--color-dark);
        }

        .movie-status {
          font-size: 11px;
          font-weight: 900;
          margin-bottom: 15px;
          color: var(--color-yellow);
          text-transform: uppercase;
        }

        .movie-title {
          font-size: 28px;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 10px;
          color: var(--color-yellow);
          text-transform: uppercase;
        }

        .movie-meta {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-yellow);
          margin-bottom: 15px;
          opacity: 0.9;
        }

        .movie-desc {
          font-size: 14px;
          line-height: 1.5;
          color: var(--color-yellow);
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .rating-display {
          margin-top: auto;
          font-size: 55px;
          font-weight: 900;
          color: var(--color-yellow);
          letter-spacing: -3px;
        }

        .note-textarea {
          flex: 1;
          background: rgba(0,0,0,0.05);
          border: 2px dashed var(--color-dark);
          border-radius: 15px;
          padding: 15px;
          resize: none;
          font-family: inherit;
          font-weight: 700;
          color: var(--color-dark);
          outline: none;
        }

        @media (max-width: 1024px) {
          .app-layout { flex-direction: column; }
          .content-area { max-width: 100%; padding: 20px; }
          .notes-sidebar { width: 100%; height: auto; border-left: none; border-top: 4px solid var(--color-dark); position: static; }
        }

        .loader { 
          height: 100vh; 
          background: var(--color-bg); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          font-weight: 900; 
        }
      `}</style>

      {/* ОСНОВНОЙ БЛОК */}
      <main className="content-area">
        <h1 className="archive-header">Кино Архив</h1>
        
        <div className="filters-row">
          <input className="input-box" style={{width: '250px'}} placeholder="ПОИСК ПО НАЗВАНИЮ..." onChange={e => setSearch(e.target.value)} />
          <select className="input-box" onChange={e => setStatusFilter(e.target.value)}>
            <option value="ВСЕ">ВСЕ ФИЛЬМЫ</option>
            <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
            <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
          </select>
        </div>

        <div className="movie-grid">
          {filtered.map((m, i) => (
            <div 
              key={i} 
              className={`card-container ${flipped[i] ? 'is-flipped' : ''}`} 
              onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}
            >
              <div className="card-inner">
                {/* ЛИЦЕВАЯ СТОРОНА */}
                <div className={`card-face face-front ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div className="movie-status">
                    {m.isWatched ? '● ПРОСМОТРЕНО' : '○ В ОЧЕРЕДИ'}
                  </div>
                  <div className="movie-title">{m.title}</div>
                  <div className="movie-meta">{m.genre} • {m.year}</div>
                  <div className="movie-desc">{m.desc}</div>
                  <div className="rating-display">{m.rating || '—'}</div>
                </div>

                {/* ОБРАТНАЯ СТОРОНА */}
                <div className="card-face face-back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight: 900, marginBottom: '15px', textTransform: 'uppercase'}}>Мысли о фильме:</div>
                  <textarea 
                    className="note-textarea"
                    value={notes[m.title] || ''}
                    placeholder="Напишите заметку..."
                    onChange={(e) => saveNote(m.title, e.target.value)}
                  />
                  <div 
                    style={{marginTop: '15px', textAlign: 'center', fontSize: '11px', fontWeight: 900, cursor: 'pointer'}} 
                    onClick={() => setFlipped({...flipped, [i]: false})}
                  >
                    [ ВЕРНУТЬ КАРТОЧКУ ]
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* БОКОВАЯ ПАНЕЛЬ */}
      <aside className="notes-sidebar">
        <div className="sidebar-header">Лента заметок</div>
        {Object.entries(notes).length === 0 ? (
          <p style={{opacity: 0.5}}>Пока нет ни одной заметки...</p>
        ) : (
          Object.entries(notes).map(([title, text]) => (
            text.trim() && (
              <div key={title} className="sidebar-note">
                <b>{title}</b>
                {text}
              </div>
            )
          ))
        )}
      </aside>
    </div>
  );
}
