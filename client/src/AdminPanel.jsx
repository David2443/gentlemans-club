import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AdminPanel.css';

const ORE_PROGRAM = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

function AdminPanel() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State-uri Date
  const [programari, setProgramari] = useState([]);
  const [userNume] = useState(localStorage.getItem('userNume') || '');
  const [isBoss, setIsBoss] = useState(false);
  
  // Calendar
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal Adăugare
  const [modalDeschis, setModalDeschis] = useState(false);
  const [oraActiva, setOraActiva] = useState(null);
  const [formRezervare, setFormRezervare] = useState({ nume: '', telefon: '' });
  
  // --- MODAL CONFIRMARE (NOU) ---
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'delete' sau 'block_day'
    data: null, // ID-ul programării sau null
    title: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);

  // 1. VERIFICARE DREPTURI
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!token) navigate('/login');
    if (isAdmin || id === 'master') setIsBoss(true);
  }, [id, navigate]);

  // 2. FETCH DATA
  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    try {
      const raspuns = await fetch(`http://localhost:5000/api/programari`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (raspuns.status === 401 || raspuns.status === 403) {
          localStorage.clear(); navigate('/login'); return;
      }
      const data = await raspuns.json();
      setProgramari(data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 3. CALENDAR
  const changeMonth = (offset) => {
    setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + offset)));
  };

  const generateSquareCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    let frizerCurent = userNume;
    if (id === 'andrei') frizerCurent = "Andrei Radu";
    if (id === 'alex') frizerCurent = "Alexandru Popescu";
    if (id === 'mihai') frizerCurent = "Mihai Ionescu";

    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasApps = programari.some(p => p.data === dateStr && (isBoss || p.frizer === frizerCurent));
      days.push({ day: d, fullDate: dateStr, hasApps });
    }
    return days;
  };

  // --- LOGICA PENTRU MODAL CONFIRMARE ---
  
  // A. Trigger pentru Ștergere
  const deschideActiune = (ora, app) => {
    if (app) {
      // ÎN LOC DE WINDOW.CONFIRM, DESCHIDEM MODALUL NOSTRU
      setConfirmModal({
        isOpen: true,
        type: 'delete',
        data: app._id,
        title: 'ANULARE PROGRAMARE',
        message: `Ești sigur că vrei să anulezi programarea pentru ${app.nume_client}?`
      });
    } else {
      setOraActiva(ora);
      setModalDeschis(true);
    }
  };

  // B. Trigger pentru Blocare Zi
  const handleBlockDayRequest = () => {
    setConfirmModal({
        isOpen: true,
        type: 'block_day',
        data: null,
        title: 'BLOCHEAZĂ ZIUA',
        message: `Vrei să blochezi toate orele libere din ${selectedDay}? Clienții deja programați nu vor fi afectați.`
    });
  };

  // C. Executare Acțiune (Când apeși DA)
  const executeConfirmAction = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    // --- CAZ 1: ȘTERGERE ---
    if (confirmModal.type === 'delete') {
        try {
            await fetch(`http://localhost:5000/api/programari/${confirmModal.data}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (err) { alert("Eroare la ștergere"); }
    }

    // --- CAZ 2: BLOCARE ZI ---
    if (confirmModal.type === 'block_day') {
        const mapareNumeOficiale = {
            'andrei': 'Andrei Radu',
            'alex':   'Alexandru Popescu',
            'mihai':  'Mihai Ionescu',
            'master': 'MASTER ADMIN'
        };
        let frizerTinta = mapareNumeOficiale[id] || userNume;

        const oreLibere = ORE_PROGRAM.filter(ora => {
            const esteOcupat = programari.some(p => p.data === selectedDay && p.ora === ora && p.frizer === frizerTinta);
            return !esteOcupat;
        });

        if (oreLibere.length > 0) {
            try {
                const promises = oreLibere.map(ora => {
                    return fetch('http://localhost:5000/api/programari', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                            frizer: frizerTinta, data: selectedDay, ora: ora, tip: 'blocat', nume_client: "CONCEDIU / LIBER", telefon: "N/A"
                        })
                    });
                });
                await Promise.all(promises);
                fetchData();
            } catch (err) { alert("Eroare server."); }
        }
    }

    // Închidem modalul și oprim loading
    setLoading(false);
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  // --- SALVARE NORMALĂ (CLIENT NOU) ---
  const salveazaProgramare = async (tip) => {
    const mapareNumeOficiale = {
      'andrei': 'Andrei Radu',
      'alex':   'Alexandru Popescu',
      'mihai':  'Mihai Ionescu',
      'master': 'MASTER ADMIN'
    };
    let frizerTinta = mapareNumeOficiale[id] || userNume;

    let payload = {
      frizer: frizerTinta, 
      data: selectedDay,
      ora: oraActiva,
      tip: tip,
      nume_client: tip === 'blocat' ? "PAUZĂ / BLOCAT" : formRezervare.nume,
      telefon: tip === 'blocat' ? "N/A" : formRezervare.telefon
    };

    if (tip === 'client' && (!formRezervare.nume || !formRezervare.telefon)) {
      return alert("Completează numele și telefonul!");
    }

    const token = localStorage.getItem('token');
    try {
      const raspuns = await fetch('http://localhost:5000/api/programari', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (raspuns.ok) {
        setModalDeschis(false);
        setFormRezervare({ nume: '', telefon: '' });
        fetchData();
      } else { alert("Ora ocupată!"); }
    } catch (err) { alert("Server Error"); }
  };

  return (
    <div className="admin-wrapper">
      <nav className="top-navbar">
        <div className="nav-left">
          {localStorage.getItem('isAdmin') === 'true' && (
            <button className="btn-back-dash" onClick={() => navigate('/master')}>⬅ Panou</button>
          )}
          <div className="nav-brand">AGENDA {userNume.split(' ')[0].toUpperCase()}</div>
        </div>
        <div className="nav-actions">
          <button onClick={fetchData} className={`btn-icon refresh ${loading ? 'spinning' : ''}`}>🔄</button>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="btn-icon logout">⏻</button>
        </div>
      </nav>

      <div className="dashboard-grid">
        <aside className="sidebar-calendar">
          <div className="calendar-card-premium">
            <div className="month-header">
              <button onClick={() => changeMonth(-1)}>‹</button>
              <div className="month-title">{viewDate.toLocaleString('ro-RO', { month: 'long' }).toUpperCase()} <span>{viewDate.getFullYear()}</span></div>
              <button onClick={() => changeMonth(1)}>›</button>
            </div>
            <div className="weekdays-grid">{['LU', 'MA', 'MI', 'JO', 'VI', 'SÂ', 'DU'].map(d => <span key={d}>{d}</span>)}</div>
            <div className="days-grid">
              {generateSquareCalendar().map((item, idx) => (
                <div key={idx} className={`day-cell ${!item ? 'empty' : ''} ${item?.fullDate === selectedDay ? 'active' : ''}`} onClick={() => item && setSelectedDay(item.fullDate)}>
                  {item?.day}
                  {item?.hasApps && <span className="dot"></span>}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="schedule-area">
          <div className="schedule-header">
            <div className="header-left">
                <h2>{new Date(selectedDay).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                <button className="btn-block-day" onClick={handleBlockDayRequest}>⛔ BLOCHEAZĂ ZIUA</button>
            </div>
            <span className="task-count">
              {programari.filter(p => {
                  let frizerCurent = userNume;
                  if (id === 'andrei') frizerCurent = "Andrei Radu";
                  if (id === 'alex') frizerCurent = "Alexandru Popescu";
                  if (id === 'mihai') frizerCurent = "Mihai Ionescu";
                  return p.data === selectedDay && (p.frizer === frizerCurent);
              }).length} programări
            </span>
          </div>

          <div className="slots-list">
            {ORE_PROGRAM.map(ora => {
              const app = programari.find(p => {
                  let frizerCurent = userNume;
                  if (id === 'andrei') frizerCurent = "Andrei Radu";
                  if (id === 'alex') frizerCurent = "Alexandru Popescu";
                  if (id === 'mihai') frizerCurent = "Mihai Ionescu";
                  return p.data === selectedDay && p.ora === ora && p.frizer === frizerCurent;
              });

              return (
                <div key={ora} className={`slot-card ${app ? (app.tip === 'blocat' ? 'blocked' : 'occupied') : 'free'}`}>
                  <div className="slot-time">{ora}</div>
                  <div className="slot-content">
                    {app ? (
                      <>
                        <div className="slot-main-info">
                          <span className={`badge ${app.tip}`}>{app.tip === 'blocat' ? 'MANUAL' : 'WEB'}</span>
                          <span className="client-name">{app.nume_client}</span>
                        </div>
                        {app.tip !== 'blocat' && <a href={`tel:${app.telefon}`} className="client-phone">📞 {app.telefon}</a>}
                        {app.mesaj && <div className="client-msg">💬 "{app.mesaj}"</div>}
                      </>
                    ) : ( <span className="status-label">Disponibil</span> )}
                  </div>
                  <button className={`action-btn ${app ? 'btn-del' : 'btn-add'}`} onClick={() => deschideActiune(ora, app)}>
                    {app ? '✕' : '+'}
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* MODAL 1: ADĂUGARE */}
      {modalDeschis && (
        <div className="modal-backdrop" onClick={(e) => { if(e.target.className === 'modal-backdrop') setModalDeschis(false); }}>
          <div className="modal-box">
            <button className="btn-close-modal" onClick={() => setModalDeschis(false)}>✕</button>
            <h3>Ora {oraActiva}</h3>
            <div className="input-group">
              <label>Nume Client</label>
              <input type="text" placeholder="ex: Client Telefon" value={formRezervare.nume} onChange={(e) => setFormRezervare({...formRezervare, nume: e.target.value})} />
            </div>
            <div className="input-group">
               <label>Telefon</label>
              <input type="tel" placeholder="07xxxxxxxx" value={formRezervare.telefon} onChange={(e) => setFormRezervare({...formRezervare, telefon: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button className="btn-gold" onClick={() => salveazaProgramare('client')}>SALVEAZĂ CLIENT</button>
              <button className="btn-dark" onClick={() => salveazaProgramare('blocat')}>DOAR PAUZĂ</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRMARE (DA / NU) */}
      {confirmModal.isOpen && (
        <div className="modal-backdrop confirm-backdrop" onClick={(e) => { if(e.target.classList.contains('confirm-backdrop')) setConfirmModal({...confirmModal, isOpen: false}); }}>
           <div className="modal-box confirm-box">
              <h3 className="confirm-title">{confirmModal.title}</h3>
              <p className="confirm-msg">{confirmModal.message}</p>
              
              <div className="modal-actions confirm-actions">
                  <button className="btn-confirm-no" onClick={() => setConfirmModal({...confirmModal, isOpen: false})}>
                     NU, ANULEAZĂ
                  </button>
                  <button className="btn-confirm-yes" onClick={executeConfirmAction}>
                     {loading ? 'SE PROCESEAZĂ...' : 'DA, SUNT SIGUR'}
                  </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

export default AdminPanel;