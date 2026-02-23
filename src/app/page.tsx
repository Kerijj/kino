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
            desc: row['Описание'] || row['Description'] || 'Нет описания',
            year: row['Год'] || row['Year'] || '—',
            isWatched: (row['Статус'] || row['Status'] || '').toLowerCase().includes('смотр'),
            rating: row['Рейтинг'] || row['Rating'] || '—'
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

  if (loading) return <div className="loader">ЗАГРУЗКА...</div>;

  return (
    <div className="app-container">
      <style>{`
        :root {
          --bg: #8C9B81;
          --sand: #EAD9A6;
          --green-card: #7A9680;
          --rose-card: #A67575;
          --yellow-text: #F2C94C;
          --dark-brown: #2D2926;
        }

        body { 
          background-color: var(--bg) !important; 
          margin: 0; 
          color: var(--dark-brown);
          font-family: sans-serif;
        }

        .app-container { display: flex; min-height: 100vh; width: 100%; }

        /* ГЛАВНАЯ ЧАСТЬ */
        .main-view { 
          flex: 1; 
          padding: 40px; 
          display: flex; 
          flex-direction: column;
          box-sizing: border-box;
        }

        /* ЛЕНТА ЗАМЕТОК */
        .sidebar { 
          width: 380px; 
          background: var(--sand); 
          border-left: 4px solid var(--dark-brown); 
          padding: 30px; 
          height: 100vh; 
          position: sticky; 
          top: 0; 
          overflow-y: auto;
          box-sizing: border-box;
        }

        .sidebar-h2 { 
          font-size: 24px; 
          font-weight: 900; 
          text-transform: uppercase; 
          border-bottom: 2px solid var(--dark-brown); 
          padding-bottom: 15px; 
          margin-bottom: 30px;
        }

        .sidebar-note { margin-bottom: 25px; font-size: 15px; border-bottom: 1px dashed var(--dark-brown); padding-bottom: 10px; }
        .sidebar-note b { display: block; color: var(--rose-card); text-transform: uppercase; margin-bottom: 4px; }

        .header-big { font-size: 70px; font-weight: 900; text-transform: uppercase; letter-spacing: -3px; margin-bottom: 40px; }

        .filters { display: flex; gap: 20px; margin-bottom: 40px; }
        .ui-input { 
          background: var(--sand); 
          border: 3px solid var(--dark-brown); 
          padding: 15px 20px; 
          border-radius: 15px; 
          font-weight: 800; 
          color: var(--dark-brown); 
          outline: none;
        }

        /* СЕТКА КАРТОЧЕК */
        .grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
          gap: 40px; 
          width: 100%;
        }

        .card-box { 
          height: 500px; 
          perspective: 1500px; 
          cursor: pointer;
        }

        .card-inner { 
          position: relative; 
          width: 100%; 
          height: 100%; 
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); 
          transform-style: preserve-3d; 
        }

        .card-box.flipped .card-inner { transform: rotateY(180deg); }

        .face { 
          position: absolute; 
          width: 100%; 
          height: 100%; 
          backface-visibility: hidden; 
          border-radius: 30px; 
          padding: 35px; 
          border: 4px solid var(--dark-brown); 
          box-sizing: border-box;
          display: flex; 
          flex-direction: column;
        }

        .front.watched { background: var(--rose-card); color: var(--yellow-text); }
        .front.queue { background: var(--green-card); color: var(--yellow-text); }
        
        .back { 
          background: var(--sand); 
          transform: rotateY(180deg); 
          color: var(--dark-brown); 
        }

        .m-title { font-size: 28px; font-weight: 900; text-transform: uppercase; line-height: 1.1; margin: 15px 0; }
        .m-meta { font-size: 13px; font-weight: 700; opacity: 0.9; margin-bottom: 15px; }
        .m-desc { font-size: 14px; line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; }
        .m-rating { margin-top: auto; font-size: 50px; font-weight: 900; letter-spacing: -2px; }

        .note-input { 
          flex: 1; 
          background: rgba(0,0,0,0.05); 
          border: 2px dashed var(--dark-brown); 
          border-radius: 15px; 
          padding: 15px; 
          resize: none; 
          font-family: inherit; 
          font-weight: 700; 
          color: var(--dark-brown);
        }

        @media (max-width: 1200px) {
          .app-container { flex-direction: column; }
          .sidebar { width: 100%; height: auto; border-left: none; border-top: 4px solid var(--dark-brown); position: static; }
          .main-view { padding: 20px; }
        }

        .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 900; }
      `}</style>

      <main className="main-view">
        <h1 className="header-big">Кино Архив</h1>
        
        <div className="filters">
          <input className="ui-input" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
          <select className="ui-input" onChange={e => setStatusFilter(e.target.value)}>
            <option value="ВСЕ">ВСЕ ФИЛЬМЫ</option>
            <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
            <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
          </select>
        </div>

        <div className="grid">
          {filtered.map((m, i) => (
            <div key={i} className={`card-box ${flipped[i] ? 'flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
              <div className="card-inner">
                {/* ЛИЦО */}
                <div className={`face front ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div style={{fontSize: '11px', fontWeight: 900, textTransform: 'uppercase'}}>
                    {m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}
                  </div>
                  <div className="m-title">{m.title}</div>
                  <div className="m-meta">{m.genre} • {m.year}</div>
                  <div className="m-desc">{m.desc}</div>
                  <div className="m-rating">{m.rating}</div>
                </div>

                {/* ОБРАТНАЯ СТОРОНА */}
                <div className="face back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight: 900, marginBottom: '10px', textTransform: 'uppercase'}}>Мысли о фильме:</div>
                  <textarea 
                    className="note-input"
                    value={notes[m.title] || ''}
                    placeholder="Напишите здесь..."
                    onChange={(e) => {
                      const newNotes = { ...notes, [m.title]: e.target.value };
                      setNotes(newNotes);
                      localStorage.setItem('shared_movie_notes', JSON.stringify(newNotes));
                    }}
                  />
                  <div style={{marginTop: '15px', textAlign: 'center', fontSize: '11px', fontWeight: 900}} onClick={() => setFlipped({...flipped, [i]: false})}>
                    [ ЗАКРЫТЬ ]
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <aside className="sidebar">
        <div className="sidebar-h2">Лента заметок</div>
        {Object.entries(notes).map(([title, text]) => (
          text.trim() && (
            <div key={title} className="sidebar-note">
              <b>{title}</b>
              {text}
            </div>
          )
        ))}
      </aside>
    </div>
  );
}
