import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MasterDashboard.css';

function MasterDashboard() {
  const navigate = useNavigate();
  
  // --- STATE-URI ---
  const [stats, setStats] = useState({
    azi: 0,
    luna: 0,
    total: 0,
    topFrizer: 'N/A'
  });
  const [programariRecente, setProgramariRecente] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE PENTRU MENIU BURGER (MOBILE) ---
  const [menuOpen, setMenuOpen] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    // Securitate: Doar șeful intră aici
    if (!token || !isAdmin) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/programari', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        calculeazaStatistici(data);
      } catch (err) {
        console.error("Eroare:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

 // --- LOGICĂ STATISTICI (UPDATE: FĂRĂ PAUZE LA TOTAL) ---
  const calculeazaStatistici = (data) => {
    const azi = new Date().toISOString().split('T')[0];
    const lunaCurenta = new Date().getMonth();

    // 1. Bani Azi (Doar clienți, fără pauze)
    const countAzi = data.filter(p => p.data === azi && p.tip !== 'blocat').length;
    
    // 2. Bani Luna (Doar clienți, fără pauze)
    const countLuna = data.filter(p => {
       const d = new Date(p.data);
       return d.getMonth() === lunaCurenta && p.tip !== 'blocat';
    }).length;

    // 3. Top Frizer
    const frizeriCount = {};
    data.forEach(p => {
       if(p.tip !== 'blocat') { // Numărăm doar dacă a tuns pe bune
         frizeriCount[p.frizer] = (frizeriCount[p.frizer] || 0) + 1;
       }
    });
    
    const sortedFrizeri = Object.entries(frizeriCount).sort((a,b) => b[1] - a[1]);
    const topName = sortedFrizeri.length > 0 ? sortedFrizeri[0][0] : 'N/A';

    // 4. TOTAL PROGRAMĂRI (AICI ERA PROBLEMA)
    // Acum filtrăm tot ce e 'blocat' sau 'pauza'
    const totalReale = data.filter(p => p.tip !== 'blocat').length;

    setStats({
      azi: countAzi * 50, 
      luna: countLuna * 50,
      total: totalReale, // <--- ACUM AFIȘEAZĂ DOAR CLIENȚII
      topFrizer: topName
    });

    // Tabel Recente
    const recente = data
      .filter(p => p.tip !== 'blocat') // Nici în tabel nu arătăm pauzele
      .sort((a, b) => new Date(b.data + 'T' + b.ora) - new Date(a.data + 'T' + a.ora))
      .slice(0, 5);
      
    setProgramariRecente(recente);
  };

  // --- FUNCȚIE TOGGLE MENIU ---
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="master-wrapper">
      
      {/* 1. SIDEBAR (NAVBAR LATERAL) */}
      {/* Adăugăm clasa 'open' dacă meniul e deschis pe mobil */}
      <aside className={`master-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>GENTLEMAN <span>MASTER</span></h2>
          {/* Buton X pentru mobil */}
          <button className="btn-close-sidebar" onClick={() => setMenuOpen(false)}>✕</button>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">📊 Dashboard</button>
          <button className="nav-item" onClick={() => navigate('/admin/andrei')}>✂️ Agenda Andrei</button>
          <button className="nav-item" onClick={() => navigate('/admin/alex')}>✂️ Agenda Alex</button>
          <button className="nav-item" onClick={() => navigate('/admin/mihai')}>✂️ Agenda Mihai</button>
          <div className="divider"></div>
          <button className="nav-item logout" onClick={() => { localStorage.clear(); navigate('/login'); }}>⏻ Deconectare</button>
        </nav>
      </aside>

      {/* OVERLAY (Filtru negru când e meniul deschis pe mobil) */}
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>}

      {/* 2. CONȚINUT PRINCIPAL */}
      <main className="master-content">
        
        {/* HEADER SUPERIOR */}
     <header className="content-header">
  <div className="header-left">
    
    
    {!menuOpen && (
      <button className="burger-btn" onClick={toggleMenu}>
        ☰
      </button>
    )}

    <h1>Panou Administrare</h1>
  </div>
  
  <div className="user-info">
    <span>👋 Salut, Master Admin</span>
  </div>
</header>

        {/* CARDURI STATISTICI */}
        <div className="stats-grid">
          <div className="stat-card gold">
            <h3>Încasări Azi (Est.)</h3>
            <p className="stat-value">{stats.azi} RON</p>
          </div>
          <div className="stat-card">
            <h3>Încasări Lună (Est.)</h3>
            <p className="stat-value">{stats.luna} RON</p>
          </div>
          <div className="stat-card">
            <h3>Top Frizer</h3>
            <p className="stat-value small">{stats.topFrizer}</p>
          </div>
          <div className="stat-card">
            <h3>Total Programări</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>

        {/* TABEL PROGRAMĂRI RECENTE */}
        <div className="recent-section">
          <div className="section-header">
            <h3>Ultimii Clienți</h3>
            {/* AM SCOS BUTONUL "VEZI TOT" AICI */}
          </div>

          <div className="table-container">
            {loading ? <p>Se încarcă...</p> : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Frizer</th>
                    <th>Data & Ora</th>
                    <th>Telefon</th>
                  </tr>
                </thead>
                <tbody>
                  {programariRecente.map((p, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{p.nume_client}</td>
                      <td><span className="badge-frizer">{p.frizer.split(' ')[0]}</span></td>
                      <td>{p.data} / {p.ora}</td>
                      <td><a href={`tel:${p.telefon}`} className="phone-link">{p.telefon}</a></td>
                    </tr>
                  ))}
                  {programariRecente.length === 0 && (
                    <tr><td colSpan="4" style={{textAlign:'center'}}>Nicio programare recentă.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default MasterDashboard;