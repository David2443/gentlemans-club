import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.succes) {
        // 1. Salvăm datele esențiale în browser
        localStorage.setItem('token', data.token);
        localStorage.setItem('userNume', data.nume);
        
        // 2. Verificăm dacă e BOSS (Master sau Admin)
        // Verificăm dacă serverul a zis că e admin SAU dacă e userul 'master' sau 'alex' explicit
        const esteSef = data.isAdmin || username === 'master' || username === 'alex';

        if (esteSef) {
            // --- Cazul 1: Ești ȘEF ---
            localStorage.setItem('isAdmin', 'true');
            console.log("👑 Login ca ȘEF -> Mergem la Dashboard");
            navigate('/master'); // <--- AICI TE TRIMITE LA DASHBOARD
        } else {
            // --- Cazul 2: Ești Angajat Simplu ---
            localStorage.setItem('isAdmin', 'false');
            console.log("✂️ Login ca Frizer -> Mergem la Calendar");
            navigate(`/admin/${username}`); // <--- AICI TE TRIMITE LA CALENDAR
        }

      } else {
        setError(data.mesaj || 'Date incorecte!');
      }
    } catch (err) {
      setError('Eroare conexiune server!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🔐 Acces Personal</h2>
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Utilizator</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value.toLowerCase())} 
              placeholder="ex: andrei"
              required 
            />
          </div>
          
          <div className="input-group">
            <label>Parolă</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••"
              required 
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Se verifică...' : 'Intră în Cont'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;