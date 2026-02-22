'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';

export default function MovieArchive() {
  const [movies, setMovies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ВСЕ ЖАНРЫ');
  const [statusFilter, setStatusFilter] = useState('ВСЕ'); // 'ВСЕ', 'СМОТРЕЛИ', 'В ОЧЕРЕДИ'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const csvUrl = "https://docs.google.com/spreadsheets/d/1pge7MWZuBDMc_3gRfNYwnwBUVDDMA-g3emCDbGlZFwc/export?format=csv";
    fetch(csvUrl).then(r => r.text()).then(text => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
          const data = res.data.map((row: any) => {
            const getVal = (names: string[]) => {
              const key = Object.keys(row).find(k => 
                names.some(n => k.toLowerCase().trim() === n.toLowerCase())
              );
              return key ? row[key]?.toString().trim() : "";
            };

            const title = getVal(['название', 'фильм', 'title']);
            const genre = getVal(['жанр', 'genre']);
            const desc = getVal(['описание', 'description']);
            const year = getVal(['год', 'year']);
            const rawStatus = getVal(['смотрели', 'статус', 'status']);
            const rating = getVal(['оценка', 'рейтинг', 'rating']);

            const isWatched = rawStatus.length > 0;

            return { title, genre, desc, year, isWatched, rating };
          }).filter(m => m.title && m.title.length > 1);
          
          setMovies(data);
          setLoading(false);
        }
      });
    });
  }, []);

  const categories = useMemo(() => {
    const all = new Set<string>();
    movies.forEach(m => {
      if (m.genre) {
        m.genre.split(/[\\/;,]/).forEach((g: string) => {
          const clean = g.trim().toUpperCase();
          if (clean && clean.length > 1) all.add(clean);
        });
      }
    });
    return ['ВСЕ ЖАНРЫ', ...Array.from(all)].sort();
  }, [movies]);

  const filtered = useMemo(() => {
    return movies.filter(m => {
      // 1. Фильтр по жанру
      const matchesGenre = selectedGenre === 'ВСЕ ЖАНРЫ' || 
        (m.genre && m.genre.toUpperCase().includes(selectedGenre));
      
      // 2. Фильтр по поисковому запросу
      const q = search.toLowerCase();
      const matchesSearch = !search || 
        m.title.toLowerCase().includes(q) || 
        m.year.toLowerCase().includes(q);

      // 3. Фильтр по статусу
      let matchesStatus = true;
      if (statusFilter === 'СМОТРЕЛИ') matchesStatus = m.isWatched;
      if (statusFilter === 'В ОЧЕРЕДИ') matchesStatus = !m.isWatched;

      return matchesGenre && matchesSearch && matchesStatus;
    });
  }, [movies, selectedGenre, search, statusFilter]);

  if (loading) return (
    <div style={{display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'#FDF0E5', color:'#8E443D', fontFamily:'monospace', letterSpacing:'4px'}}>
      ОБНОВЛЕНИЕ ФИЛЬТРОВ...
    </div>
  );

  return (
    <div style={{background: '#FDF0E5', minHeight: '100vh', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', color: '#8E443D'}}>
      <style>{`
        .movie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; max-width: 1200px; margin: 0 auto; }
        .card { padding: 40px; border-radius: 50px; transition: 0.4s ease; display: flex; flex-direction: column; position: relative; border: none; }
        .card-queue { background-color: #FFFFFF !important; box-shadow: 0 10px 20px rgba(142,68,61,0.05); }
        .card-watched { background-color: #F7D8C4 !important; box-shadow: 0 10px 20px rgba(142,68,61,0.08); }
        .card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(142,68,61,0.15); }
        
        .control-panel { display: flex; gap: 20px; justify-content: center; marginBottom: 60px; flex-wrap: wrap; }
        .search-input { background: white; border: none; border-radius: 25px; padding: 15px 25px; width: 280px; color: #8E443D; outline: none; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
        .custom-select { background: #E88E7D; color: white; border: none; border-radius: 25px; padding: 15px 25px; font-weight: bold; cursor: pointer; outline: none; box-shadow: 0 4px 15px rgba(232,142,125,0.2); }
        
        .badge { background: rgba(255,255,255,0.6); padding: 6px 14px; border-radius: 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
        .rating-val { font-size: 64px; font-weight: 900; line-height: 0.8; font-style: italic; letter-spacing: -2px; }
      `}</style>

      <div style={{maxWidth:'1200px', margin:'0 auto'}}>
        <header style={{textAlign:'center', marginBottom: '60px'}}>
          <h1 style={{fontSize: 'clamp(40px, 10vw, 90px)', fontWeight: '900', textTransform: 'uppercase', margin: '0', letterSpacing: '-6px', lineHeight: 0.85}}>Архив</h1>
          <p style={{fontFamily:'monospace', opacity: 0.4, letterSpacing: '6px', fontSize: '10px', marginTop: '15px'}}>FILTERS ENABLED // 2026</p>
        </header>

        <div className="control-panel" style={{marginBottom: '60px'}}>
          {/* Поиск */}
          <input 
            type="text" 
            placeholder="Поиск..." 
            className="search-input" 
            onChange={(e) => setSearch(e.target.value)} 
          />
          
          {/* Фильтр Жанра */}
          <select className="custom-select" onChange={(e) => setSelectedGenre(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* НОВЫЙ Фильтр Статуса */}
          <select 
            className="custom-select" 
            style={{background: '#8E443D'}} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ВСЕ">ВСЕ СТАТУСЫ</option>
            <option value="СМОТРЕЛИ">СМОТРЕЛИ</option>
            <option value="В ОЧЕРЕДИ">В ОЧЕРЕДИ</option>
          </select>
        </div>

        <div className="movie-grid">
          {filtered.map((m, i) => (
            <article 
              key={i} 
              className={`card ${m.isWatched ? 'card-watched' : 'card-queue'}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                <span style={{fontSize:'10px', fontWeight:'900', opacity:0.3, letterSpacing:'2px'}}>{m.genre}</span>
                <span style={{ 
                  fontSize: '9px', 
                  fontWeight: '900', 
                  padding: '4px 10px', 
                  borderRadius: '10px',
                  background: m.isWatched ? 'rgba(142,68,61,0.1)' : 'rgba(232,142,125,0.1)',
                  color: m.isWatched ? '#8E443D' : '#E88E7D'
                }}>
                  {m.isWatched ? 'СМОТРЕЛИ' : 'В ОЧЕРЕДИ'}
                </span>
              </div>

              <h2 style={{fontSize:'32px', fontWeight:'900', margin:'0 0 15px 0', lineHeight:'1.1'}}>{m.title}</h2>
              <p style={{fontSize:'14px', opacity:0.7, lineHeight:'1.6', marginBottom:'40px', flexGrow: 1}}>{m.desc}</p>
              
              <div style={{marginTop:'auto', paddingTop:'20px', borderTop:'1px solid rgba(142,68,61,0.08)', display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                <span className="badge">{m.year}</span>
                <div style={{textAlign:'right'}}>
                  <span style={{fontSize:'9px', fontWeight:'900', opacity:0.2, display:'block', marginBottom: '5px'}}>ОЦЕНКА</span>
                  <span className="rating-val">{m.rating || '—'}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
