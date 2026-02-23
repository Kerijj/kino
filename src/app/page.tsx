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

  // Тестовые данные на случай, если ссылка на таблицу не сработает
  const fallbackData = [
    { title: "ТУРИСТ", genre: "триллер/драма", year: "2011", desc: "Американский турист оказывается втянут в опасную игру...", isWatched: true, rating: "10 из 10" },
    { title: "МИРНЫЙ ВОИН", genre: "драма", year: "2006", desc: "Молодой гимнаст встречает загадочного учителя...", isWatched: false, rating: "8 из 10" }
  ];

  useEffect(() => {
    const savedNotes = localStorage.getItem('shared_movie_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const csvUrl = "https://docs.google.com/spreadsheets/d/1pge7MWZuBDMc_3gRfNYwnwBUVDDMA-g3emCDbGlZFwc/export?format=csv";
    
    fetch(csvUrl)
      .then(r => r.text())
      .then(text => {
        Papa.parse(text, {
          header: true, skipEmptyLines: true,
          complete: (res) => {
            const parsed = res.data.map((row: any) => ({
              title: row['Название'] || row['Title'] || '',
              genre: row['Жанр'] || row['Genre'] || '',
              desc: row['Описание'] || row['Description'] || '',
              year: row['Год'] || row['Year'] || '',
              isWatched: String(row['Статус'] || row['Status']).toLowerCase().includes('смотр'),
              rating: row['Рейтинг'] || row['Rating'] || ''
            })).filter(m => m.title !== '');

            setMovies(parsed.length > 0 ? parsed : fallbackData);
            setLoading(false);
          },
          error: () => { setMovies(fallbackData); setLoading(false); }
        });
      })
      .catch(() => { setMovies(fallbackData); setLoading(false); });
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
          --bg-olive: #8C9B81;
          --ui-sand: #EAD9A6;
          --card-green: #7A9680;
          --card-rose: #A67575;
          --text-yellow: #F2C94C;
          --deep-brown: #2D2926;
        }

        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg-olive) !important; color: var(--deep-brown); font-family: sans-serif; }

        .layout { display: flex; width: 100vw; height: 100vh; overflow: hidden; }

        /* ЛЕВО: КАРТОЧКИ */
        .cards-area { 
          flex: 0 0 70%; 
          padding: 40px; 
          overflow-y: auto; 
          border-right: 3px solid var(--deep-brown);
        }

        /* ПРАВО: ЛЕНТА */
        .notes-area { 
          flex: 0 0 30%; 
          background: var(--ui-sand); 
          padding: 30px; 
          overflow-y: auto; 
        }

        .main-h1 { font-size: 70px; font-weight: 900; text-transform: uppercase; letter-spacing: -3px; margin-bottom: 30px; }

        .filters { display: flex; gap: 15px; margin-bottom: 40px; }
        .ui-input { 
          background: var(--ui-sand); border: 3px solid var(--deep-brown); 
          padding: 12px 20px; border-radius: 12px; font-weight: 800; color: var(--deep-brown);
        }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }

        /* 3D КАРТОЧКА */
        .scene { height: 450px; perspective: 1000px; }
        .card { 
          position: relative; width: 100%; height: 100%; 
          transition: transform 0.6s; transform-style: preserve-3d; cursor: pointer;
        }
        .scene.is-flipped .card { transform: rotateY(180deg); }

        .face { 
          position: absolute; width: 100%; height: 100%; 
          backface-visibility: hidden; border-radius: 25px; padding: 25px;
          border: 4px solid var(--deep-brown); display: flex; flex-direction: column;
        }

        .face-front.watched { background: var(--card-rose); }
        .face-front.queue { background: var(--card-green); }
        .face-back { background: var(--ui-sand); transform: rotateY(180deg); }

        .m-title { font-size: 26px; font-weight: 900; color: var(--text-yellow); text-transform: uppercase; margin: 10px 0; }
        .m-desc { font-size: 14px; color: var(--text-yellow); line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; }
        .m-rating { margin-top: auto; font-size: 45px; font-weight: 900; color: var(--text-yellow); }

        .note-input { 
          flex: 1; background: rgba(0,0,0,0.05); border: 2px dashed var(--deep-brown); 
          border-radius: 15px; padding: 15px; font-weight: 700; color: var(--deep-brown); resize: none;
        }

        .sidebar-title { font-size: 22px; font-weight: 900; text-transform: uppercase; border-bottom: 3px solid var(--deep-brown); padding-bottom: 10px; margin-bottom: 20px; }
        .sidebar-item { margin-bottom: 20px; border-bottom: 1px dashed var(--deep-brown); padding-bottom: 10px; }
        .sidebar-item b { display: block; color: var(--card-rose); text-transform: uppercase; font-size: 13px; }

        .loader { height: 100vh; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 30px; color: var(--text-yellow); }
      `}</style>

      <div className="cards-area">
        <h1 className="main-h1">Кино Архив</h1>
        <div className="filters">
          <input className="ui-input" placeholder="ПОИСК..." onChange={e => setSearch(e.target.value)} />
          <select className="ui-input" onChange={e => setStatusFilter(e.target.value)}>
            <option value="ВСЕ">СТАТУС: ВСЕ</option>
            <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
            <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
          </select>
        </div>

        <div className="grid">
          {filtered.map((m, i) => (
            <div key={i} className={`scene ${flipped[i] ? 'is-flipped' : ''}`} onClick={() => setFlipped({...flipped, [i]: !flipped[i]})}>
              <div className="card">
                <div className={`face face-front ${m.isWatched ? 'watched' : 'queue'}`}>
                  <div style={{fontSize:'10px', fontWeight:900, color: 'var(--text-yellow)'}}>{m.isWatched ? '● СМОТРЕЛИ' : '○ В ОЧЕРЕДИ'}</div>
                  <div className="m-title">{m.title}</div>
                  <div style={{fontSize:'12px', fontWeight:700, color: 'var(--text-yellow)', marginBottom: '10px'}}>{m.genre} • {m.year}</div>
                  <div className="m-desc">{m.desc}</div>
                  <div className="m-rating">{m.rating}</div>
                </div>

                <div className="face face-back" onClick={e => e.stopPropagation()}>
                  <div style={{fontWeight:900, marginBottom:'10px'}}>ЗАМЕТКА:</div>
                  <textarea 
                    className="note-input"
                    value={notes[m.title] || ''}
                    placeholder="Пиши тут..."
                    onChange={(e) => {
                      const n = { ...notes, [m.title]: e.target.value };
                      setNotes(n);
                      localStorage.setItem('shared_movie_notes', JSON.stringify(n));
                    }}
                  />
                  <div style={{marginTop:'10px', textAlign:'center', fontSize:'10px', fontWeight:900}} onClick={() => setFlipped({...flipped, [i]: false})}>[ ЗАКРЫТЬ ]</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="notes-area">
        <div className="sidebar-title">Лента заметок</div>
        {Object.entries(notes).map(([title, text]) => (
          text.trim() && (
            <div key={title} className="sidebar-item">
              <b>{title}</b>
              <div style={{fontSize: '14px'}}>{text}</div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
