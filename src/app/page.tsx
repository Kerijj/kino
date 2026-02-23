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
            genre: row['Жанр'] || row['Genre'] || '',
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

  if (loading) return <div className="loader">ЗАГРУЗКА...</div>;

  return (
    <div className="layout">
      <style>{`
        :root {
          --bg: #8C9B81;
          --sand: #EAD9A6;
          --green: #7A9680;
          --rose: #A67575;
          --yellow: #F2C94C;
          --dark-brown: #2D2926; /* Замена черному */
        }

        body { background-color: var(--bg) !important; margin: 0; font-family: 'Inter', sans-serif; color: var(--dark-brown); }
        .layout { display: flex; min-height: 100vh; }

        /* ОСНОВНОЙ КОНТЕНТ */
        .main { flex: 1; padding: 40px; max-width: calc(100% - 350px); }

        /* ЛЕНТА ЗАМЕТОК */
        .sidebar { 
          width: 350px; background: var(--sand); border-left: 4px solid var(--dark-brown); 
          padding: 30px; height: 100vh; position: sticky; top: 0; overflow-y: auto;
        }
        .sidebar-title { font-weight: 900; text-transform: uppercase; border-bottom: 2px solid var(--dark-brown); padding-bottom: 10px; margin-bottom: 20px; }
        .sidebar-item { margin-bottom: 20px; font-size: 14px; line-height: 1.4; border-bottom: 1px dashed var(--dark-brown); padding-bottom: 10px; }
        .sidebar-item b { display: block; color: var(--rose); text-transform: uppercase; }

        .title-main { font-size: 80px; font-weight: 900; text-transform: uppercase; margin: 0 0 40px 0; letter-spacing: -4px; }

        .controls { display: flex; gap: 15px; margin-bottom: 50px; }
        .ui-element { 
          background: var(--sand); border: 3px solid var(--dark-brown); 
          padding: 15px 25px; border-radius: 15px; font-weight: 800; color: var(--dark-brown); outline: none;
        }

        /* СЕТКА И КАРТОЧКИ */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 40px; align-items: start; }
        
        .card { height: 480px; perspective: 1500px; cursor: pointer; }
        .card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; }
        .card.flipped .card-inner { transform: rotateY(180deg); }

        .card-face { 
          position: absolute; width: 100%; height: 100%; backface-visibility: hidden; 
          border-radius: 30px; padding: 35px; border: 3px solid var(--dark-brown);
          box-sizing: border-box; display: flex; flex-direction: column;
          box-shadow: 10px 10px 0px rgba(45, 41, 38, 0.1);
        }

        .face-front.watched { background: var(--rose); color: var(--yellow); }
        .face-front.queue { background: var(--green); color: var(--yellow); }
        .face-back { background: var(--sand); transform: rotateY(180deg); color: var(--dark-brown); }

        .m-title { font-size: 30px; font-weight: 900; line-height: 1; text-transform: uppercase; margin: 15px 0; color: var(--yellow); }
        .m-desc { font-size: 14px; line-height: 1.5; color: var(--yellow); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; }
        .m-rating { margin-top: auto; font-size: 60px; font-weight: 900; letter-spacing: -3px; color: var(--yellow); }

        .note-area { 
          flex: 1; background: rgba(0,0,0,0.05); border: 2px dashed var(--dark-brown); 
          border-radius: 15px; padding: 15px; resize: none; font-family: inherit; font-weight: 700; color: var(--dark-brown); outline: none;
        }

        @media (max-width: 1100px) {
          .layout { flex-direction: column; }
          .main { max-width: 100%; }
          .sidebar { width: 100%; height: auto; border-left: none; border-top: 4px solid var(--dark-brown); }
        }

        .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 40px; }
      `}</style>

      <main className="main">
        <h1 className="title-main">Кино Архив</h1>
        
        <div className="controls">
          <input className="ui-element" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
          <select className="ui-element" onChange={e => setStatusFilter(e.target.value)}>
            <option value="ВСЕ">СТАТУС: ВСЕ</option>
            <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
            <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
          </select>
        </div>

        <div className="grid">
          {filtered.map((m, i) => (
            <div key={i} className={`card ${flipped[i] ? 'flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
              <div className="card-inner">
                {/* ЛИЦО */}
                <div className={`card-face face-front ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div style={{fontSize:'12px', fontWeight:900}}>
                    {m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}
                  </div>
                  <div className="m-title">{m.title}</div>
                  <div style={{fontSize:'13px', fontWeight:800, marginBottom:'15px'}}>{m.genre} • {m.year}</div>
                  <div className="m-desc">{m.desc}</div>
                  <div className="m-rating">{m.rating || '—'}</div>
                </div>

                {/* ОБРАТНАЯ СТОРОНА */}
                <div className="card-face face-back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight:900, marginBottom:'15px', textTransform:'uppercase'}}>Заметки для всех:</div>
                  <textarea 
                    className="note-area"
                    value={notes[m.title] || ''}
                    placeholder="Напиши что-нибудь..."
                    onChange={(e) => {
                      const newNotes = { ...notes, [m.title]: e.target.value };
                      setNotes(newNotes);
                      localStorage.setItem('shared_movie_notes', JSON.stringify(newNotes));
                    }}
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

      <aside className="sidebar">
        <div className="sidebar-title">Лента заметок</div>
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
