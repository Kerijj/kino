'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

export default function MovieArchive() {
  const [movies, setMovies] = useState<any[]>([]);
  const [notes, setNotes] = useState<{[key: string]: string}>({});
  const [flipped, setFlipped] = useState<{[key: number]: boolean}>({});
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ВСЕ ЖАНРЫ');
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
    <div className="app-container">
      <style>{`
        :root {
          --bg-olive: #8C9B81;
          --dark-text: #2A241F; /* Темный кофейный вместо черного */
          --accent-sand: #EAD9A6;
          --card-watched: #946363; /* Более насыщенный розово-коричневый */
          --card-queue: #6B8571;   /* Глубокий зеленый */
          --yellow-text: #F2C94C;
        }

        body { margin: 0; background-color: var(--bg-olive) !important; color: var(--dark-text); font-family: 'Inter', sans-serif; }
        
        .app-container { display: flex; min-height: 100vh; }

        /* ОСНОВНАЯ ЧАСТЬ */
        .main-view { flex: 1; padding: 40px; max-width: calc(100% - 380px); }

        /* ЛЕНТА ЗАМЕТОК */
        .sidebar-notes { 
          width: 380px; background: var(--accent-sand); 
          border-left: 5px solid var(--dark-text); padding: 35px;
          height: 100vh; position: sticky; top: 0; overflow-y: auto;
        }
        .sidebar-notes h2 { text-transform: uppercase; border-bottom: 3px solid var(--dark-text); padding-bottom: 15px; margin-bottom: 25px; font-weight: 900; }
        .note-preview { margin-bottom: 20px; font-size: 14px; border-bottom: 1px dashed var(--dark-text); padding-bottom: 10px; }
        .note-preview b { display: block; color: var(--card-watched); text-transform: uppercase; margin-bottom: 4px; }

        .header-title { font-size: 80px; font-weight: 900; text-transform: uppercase; letter-spacing: -4px; margin: 0 0 40px 0; }

        .search-box { 
          background: var(--accent-sand); border: 3px solid var(--dark-text); 
          padding: 15px 25px; border-radius: 15px; font-weight: 900; 
          margin-bottom: 50px; width: 300px; outline: none;
        }

        .movie-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); 
          gap: 45px; 
          align-items: start;
        }

        /* КАРТОЧКА БЕЗ НАПЛЫВОВ */
        .flip-box { height: 480px; perspective: 1500px; }
        .flip-inner { 
          position: relative; width: 100%; height: 100%; 
          transition: transform 0.6s; transform-style: preserve-3d; 
        }
        .flip-box.is-flipped .flip-inner { transform: rotateY(180deg); }

        .card-face { 
          position: absolute; width: 100%; height: 100%; 
          backface-visibility: hidden; border-radius: 30px; padding: 35px;
          border: 4px solid var(--dark-text); box-sizing: border-box;
          display: flex; flex-direction: column;
        }

        .front-face.watched { background-color: var(--card-watched); color: var(--yellow-text); }
        .front-face.queue { background-color: var(--card-queue); color: var(--yellow-text); }
        .back-face { background-color: var(--accent-sand); transform: rotateY(180deg); color: var(--dark-text); }

        .title { font-size: 30px; font-weight: 900; line-height: 1; margin: 15px 0; text-transform: uppercase; }
        .meta { font-size: 13px; font-weight: 800; opacity: 0.8; margin-bottom: 20px; }
        .description { font-size: 14px; line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; }
        
        .rating-bottom { margin-top: auto; font-size: 55px; font-weight: 900; letter-spacing: -3px; }

        .note-editor { 
          flex: 1; background: rgba(0,0,0,0.05); border: 2px dashed var(--dark-text); 
          border-radius: 15px; padding: 15px; resize: none; font-family: inherit; font-weight: 700;
        }

        @media (max-width: 1100px) {
          .app-container { flex-direction: column; }
          .main-view { max-width: 100%; }
          .sidebar-notes { width: 100%; height: auto; border-left: none; border-top: 5px solid var(--dark-text); }
        }

        .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 30px; }
      `}</style>

      <main className="main-view">
        <h1 className="header-title">Кино Архив</h1>
        
        <div style={{display: 'flex', gap: '20px'}}>
          <input className="search-box" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
          <select className="search-box" style={{width: '200px'}} onChange={e => setStatusFilter(e.target.value)}>
            <option value="ВСЕ">СТАТУС: ВСЕ</option>
            <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
            <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
          </select>
        </div>

        <div className="movie-grid">
          {filtered.map((m, i) => (
            <div key={i} className={`flip-box ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
              <div className="flip-inner">
                {/* ПЕРЕД */}
                <div className={`card-face front-face ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div style={{fontSize:'11px', fontWeight:900}}>
                    {m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}
                  </div>
                  <div className="title">{m.title}</div>
                  <div className="meta">{m.genre} • {m.year}</div>
                  <div className="description">{m.desc}</div>
                  <div className="rating-bottom">{m.rating || '—'}</div>
                </div>

                {/* ЗАД */}
                <div className="card-face back-face" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight:900, marginBottom:'15px'}}>МОИ ЗАМЕТКИ:</div>
                  <textarea 
                    className="note-editor"
                    value={notes[m.title] || ''}
                    placeholder="Напишите что-нибудь..."
                    onChange={(e) => saveNote(m.title, e.target.value)}
                  />
                  <div style={{marginTop:'15px', textAlign:'center', fontSize:'11px', fontWeight:900}} onClick={() => setFlipped({...flipped, [i]: false})}>
                    [ ЗАКРЫТЬ ]
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <aside className="sidebar-notes">
        <h2>Лента заметок</h2>
        {Object.entries(notes).map(([title, text]) => (
          text && (
            <div key={title} className="note-preview">
              <b>{title}</b>
              {text}
            </div>
          )
        ))}
      </aside>
    </div>
  );
}
