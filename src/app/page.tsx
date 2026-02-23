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
    // В будущем здесь будет запрос к API БД для получения общих заметок
    const savedNotes = localStorage.getItem('shared_movie_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const csvUrl = "https://docs.google.com/spreadsheets/d/1pge7MWZuBDMc_3gRfNYwnwBUVDDMA-g3emCDbGlZFwc/export?format=csv";
    fetch(csvUrl).then(r => r.text()).then(text => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const data = res.data.map((row: any) => {
            const getVal = (names: string[]) => {
              const key = Object.keys(row).find(k => names.some(n => k.toLowerCase().trim() === n.toLowerCase()));
              return key ? row[key]?.toString().trim() : "";
            };
            const rawStatus = getVal(['смотрели', 'статус', 'status']);
            return { 
              title: getVal(['название', 'фильм', 'title']), 
              genre: getVal(['жанр', 'genre']), 
              desc: getVal(['описание', 'description']),
              year: getVal(['год', 'year']), 
              isWatched: rawStatus.length > 0, 
              rating: getVal(['оценка', 'рейтинг', 'rating']) 
            };
          }).filter(m => m.title && m.title.length > 1);
          setMovies(data);
          setLoading(false);
        }
      });
    });
  }, []);

  const saveNote = (title: string, text: string) => {
    const newNotes = { ...notes, [title]: text };
    setNotes(newNotes);
    // Для "общего" доступа сейчас используем localStorage, 
    // но это место для fetch('/api/save-note')
    localStorage.setItem('shared_movie_notes', JSON.stringify(newNotes));
  };

  const filtered = useMemo(() => {
    return movies.filter(m => {
      const matchesGenre = selectedGenre === 'ВСЕ ЖАНРЫ' || m.genre?.toUpperCase().includes(selectedGenre);
      const matchesSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ВСЕ' || (statusFilter === 'СМОТРЕЛИ' ? m.isWatched : !m.isWatched);
      return matchesGenre && matchesSearch && matchesStatus;
    });
  }, [movies, selectedGenre, search, statusFilter]);

  if (loading) return <div className="loader">Загрузка архива...</div>;

  return (
    <div className="layout-wrapper">
      <style>{`
        html, body { background-color: #8C9B81 !important; margin: 0; color: #2A2A2A; }
        
        .layout-wrapper { 
          display: flex; 
          flex-direction: row; 
          min-height: 100vh;
          background-color: #8C9B81;
        }

        /* ОСНОВНОЙ КОНТЕНТ */
        .main-content { 
          flex: 1; 
          padding: 40px; 
          max-width: calc(100% - 350px);
        }

        /* БОКОВАЯ ПАНЕЛЬ ЗАМЕТОК */
        .notes-sidebar { 
          width: 350px; 
          background: #EAD9A6; 
          border-left: 4px solid #2A2A2A;
          padding: 30px;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
        }

        .sidebar-title { font-weight: 900; text-transform: uppercase; margin-bottom: 20px; border-bottom: 2px solid #2A2A2A; padding-bottom: 10px; }
        .sidebar-note-item { margin-bottom: 20px; font-size: 14px; line-height: 1.4; }
        .sidebar-note-item b { display: block; text-transform: uppercase; color: #A67575; }

        .header-title { font-size: 70px; font-weight: 900; text-transform: uppercase; margin-bottom: 30px; letter-spacing: -3px; }

        .filters { display: flex; gap: 15px; margin-bottom: 40px; flex-wrap: wrap; }
        .filter-input { 
          background: #EAD9A6; border: 2px solid #2A2A2A; padding: 12px 20px; 
          border-radius: 10px; font-weight: 800; outline: none; 
        }

        .cards-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
          gap: 30px; 
        }

        .card { 
          height: 450px; perspective: 1000px; cursor: pointer;
        }

        .card-inner { 
          position: relative; width: 100%; height: 100%; 
          transition: transform 0.6s; transform-style: preserve-3d; 
        }
        .card.flipped .card-inner { transform: rotateY(180deg); }

        .card-face { 
          position: absolute; width: 100%; height: 100%; 
          backface-visibility: hidden; border-radius: 20px; 
          padding: 30px; display: flex; flex-direction: column;
          border: 3px solid #2A2A2A; /* Очерченность */
          box-shadow: 8px 8px 0px rgba(0,0,0,0.1);
        }

        .face-front.watched { background: #A67575; color: #F2C94C; }
        .face-front.queue { background: #7A9680; color: #F2C94C; }
        .face-back { background: #EAD9A6; transform: rotateY(180deg); color: #2A2A2A; }

        .movie-title { font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 10px; }
        .movie-info { font-size: 12px; font-weight: 700; opacity: 0.9; margin-bottom: 15px; }
        .movie-desc { font-size: 14px; line-height: 1.5; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; }
        
        .rating-huge { margin-top: auto; font-size: 40px; font-weight: 900; }

        .note-input { 
          flex: 1; background: rgba(255,255,255,0.3); border: 2px dashed #2A2A2A; 
          border-radius: 10px; padding: 15px; resize: none; font-family: inherit; font-weight: 600;
        }

        /* АДАПТИВНОСТЬ */
        @media (max-width: 1024px) {
          .layout-wrapper { flex-direction: column; }
          .main-content { max-width: 100%; padding: 20px; }
          .notes-sidebar { width: 100%; height: auto; border-left: none; border-top: 4px solid #2A2A2A; position: static; }
          .header-title { font-size: 40px; }
        }

        .loader { background: #8C9B81; height: 100vh; display: flex; alignItems: center; justifyContent: center; font-weight: 900; }
      `}</style>

      {/* ОСНОВНАЯ ЧАСТЬ */}
      <main className="main-content">
        <h1 className="header-title">Кино Архив</h1>
        
        <div className="filters">
          <input className="filter-input" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
          <select className="filter-input" onChange={e => setSelectedGenre(e.target.value)}>
            <option value="ВСЕ ЖАНРЫ">ЖАНР</option>
            {/* Тут можно добавить маппинг жанров */}
          </select>
          <select className="filter-input" onChange={e => setStatusFilter(e.target.value)}>
            <option value="ВСЕ">СТАТУС</option>
            <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
            <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
          </select>
        </div>

        <div className="cards-grid">
          {filtered.map((m, i) => (
            <div key={i} className={`card ${flipped[i] ? 'flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
              <div className="card-inner">
                {/* ЛИЦО */}
                <div className={`card-face face-front ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div style={{fontSize:'10px', fontWeight:900, marginBottom:'10px'}}>
                    {m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}
                  </div>
                  <div className="movie-title">{m.title}</div>
                  <div className="movie-info">{m.genre} • {m.year}</div>
                  <div className="movie-desc">{m.desc}</div>
                  <div className="rating-huge">{m.rating || '—'}</div>
                </div>

                {/* ОБОРОТ */}
                <div className="card-face face-back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight:900, marginBottom:'10px'}}>ОБЩИЕ ЗАМЕТКИ:</div>
                  <textarea 
                    className="note-input"
                    value={notes[m.title] || ''}
                    placeholder="Напишите что-то для всех..."
                    onChange={(e) => saveNote(m.title, e.target.value)}
                  />
                  <div style={{marginTop:'10px', fontSize:'10px', textAlign:'center', fontWeight:800}} onClick={() => setFlipped({...flipped, [i]: false})}>
                    [ ЗАКРЫТЬ ]
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ПАНЕЛЬ ЗАМЕТОК СПРАВА */}
      <aside className="notes-sidebar">
        <div className="sidebar-title">Лента заметок</div>
        {Object.entries(notes).length === 0 ? (
          <p style={{opacity:0.6}}>Заметок пока нет...</p>
        ) : (
          Object.entries(notes).map(([title, text]) => (
            text && (
              <div key={title} className="sidebar-note-item">
                <b>{title}</b>
                <span>{text}</span>
              </div>
            )
          ))
        )}
      </aside>
    </div>
  );
}
