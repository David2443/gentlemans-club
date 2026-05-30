// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import BarberProfile from './BarberProfile';
import AdminPanel from './AdminPanel'; 
import './App.css';
import GalleryPage from './GalleryPage'; 
import ScrollToTop from "./ScrollToTop";
import Login from './Login';
import MasterDashboard from './MasterDashboard';

function Home() {
  // 1. STATE-URI
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categorieActiva, setCategorieActiva] = useState('tuns'); // MOTORUL PENTRU PRETURI
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // 2. LOGICĂ MENIU
  const toggleMenu = () => {
    const nextState = !menuOpen;
    setMenuOpen(nextState);
    document.body.style.overflow = nextState ? 'hidden' : 'auto';
  };

  const closeMenu = () => {
    setMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  // 3. EFFECT PENTRU SCROLL
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.overflow = 'auto';
    };
  }, []);

  // 4. LOGICĂ CONTACT
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    const regexTelefon = /^07\d{8}$/;
    if (!regexTelefon.test(payload.telefon)) {
      setStatus('❌ Introdu un număr de telefon valid!');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.succes) {
        setStatus('✅ Mesaj trimis! Te contactăm imediat.');
        e.target.reset();
      } else {
        setStatus('❌ Eroare la server. Încearcă din nou.');
      }
    } catch (error) {
      setStatus('❌ Eroare de conexiune. Verifică serverul!');
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(''), 5000);
    }
  };

  // 5. DATA DUMP (PREȚURI)
  const servicii = {
    tuns: [
      { nume: "TUNS CLASIC", pret: "60 RON", desc: "Tuns din foarfecă și mașină, spălat, styling." },
      { nume: "SKIN FADE", pret: "70 RON", desc: "Gradient perfect de la zero, spălat, styling.", vip: true },
      { nume: "TUNS LONG HAIR", pret: "80 RON", desc: "Tuns exclusiv din foarfecă pentru păr lung." },
      { nume: "STYLING", pret: "30 RON", desc: "Spălat și aranjat cu produse premium." }
    ],
    barba: [
      { nume: "CONTUR BARBĂ", pret: "30 RON", desc: "Contur cu lama și mașina." },
      { nume: "TUNS BARBĂ", pret: "50 RON", desc: "Scurtat, formă, contur, ulei hidratant." },
      { nume: "ROYAL SHAVE", pret: "70 RON", desc: "Bărbierit tradițional, prosop cald, masaj facial.", vip: true }
    ],
    combo: [
      { nume: "COMBO CLASIC", pret: "100 RON", desc: "Tuns + Barbă + Spălat." },
      { nume: "COMBO FADE", pret: "110 RON", desc: "Skin Fade + Barbă + Spălat." },
      { nume: "KING'S EXPERIENCE", pret: "150 RON", desc: "Tuns, Barbă Royal, Masaj Capilar, Black Mask.", vip: true }
    ]
  };

  return (
    <div className="home-wrapper">
      {/* NAVBAR */}
      <nav className={`custom-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo">GENTLEMAN'S SALOON</div>
          <div className="nav-schedule">
             <span>Luni - Vineri: 09:00 - 20:00</span>
          </div>
          <div className="burger-btn" onClick={toggleMenu}>
            <span></span><span></span><span></span>
          </div>
        </div>
      </nav>

      {/* MENIU SIDEBAR */}
      <div className={`menu-backdrop ${menuOpen ? 'active' : ''}`} onClick={closeMenu}></div>
      <div className={`sidebar-menu ${menuOpen ? 'active' : ''}`}>
        <div className="close-menu-btn" onClick={closeMenu}>✕</div>
        <div className="sidebar-content">
          <span className="sidebar-title">Meniu</span>
          <div className="sidebar-links">
            <a href="#acasa" onClick={closeMenu}>Acasă</a>
            <a href="#preturi" onClick={closeMenu}>Tarife</a>
            <a href="#galerie" onClick={closeMenu}>Galerie</a>
            <a href="#echipa" onClick={closeMenu}>Echipa</a>
            <a href="#recenzii" onClick={closeMenu}>Recenzii</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
          </div>
          <div className="sidebar-footer">
             <a href="#echipa" onClick={closeMenu} className="btn-gold-sidebar">Programează-te</a>
             <div className="sidebar-contact-info">
               <p>📍 Strada Exemplului, Nr. 12</p>
               <p>📞 0712 345 678</p>
             </div>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div id="acasa" className="hero">
        <h1>Stilul tău <br/> <span className="flicker-text" style={{color: '#d4af37'}}>Semnătura noastră</span></h1>
        <p>Experiența supremă de grooming masculin.</p>
        <a href="#echipa" className="btn-gold">Programează-te</a>
      </div>
        
      {/* ABOUT */}
      <section className="about-premium">
        <div className="about-bg-text">EST. 2018</div>
        <div className="about-container">
          <div className="about-image-wrapper">
            <div className="gold-frame"></div>
            <img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800" alt="Interior" className="about-img-main" />
            <div className="experience-badge">
              <span style={{fontSize:'24px'}}>5</span><span style={{fontSize:'12px'}}>ANI</span>
            </div>
          </div>
          <div className="about-content">
            <span className="about-subtitle">Povestea Noastră</span>
            <h2 className="about-title">Nu vindem Tunsori.<br/><span style={{color: '#fff', borderBottom: '3px solid #d4af37'}}>Vindem Atitudine.</span></h2>
            <p className="about-desc">Gentleman's Saloon este sanctuarul bărbatului modern. Am readus ritualul bărbieritului clasic cu precizia secolului 21.</p>
            <div className="about-features">
              <div className="feature-item"><span className="feature-icon">♛</span><span className="feature-text">Master Barbers</span></div>
              <div className="feature-item"><span className="feature-icon">✂</span><span className="feature-text">Produse Premium</span></div>
              <div className="feature-item"><span className="feature-icon">☕</span><span className="feature-text">Cafea & Whiskey</span></div>
            </div>
            <div style={{marginTop: '40px', fontFamily: 'cursive', fontSize: '30px', color: '#d4af37'}}>Gentleman's saloon</div>
          </div>
        </div>
      </section>

      {/* GALERIE PREVIEW */}
      <section id="galerie" className="gallery-section">
        <h2 className="section-title">Arta Noastră</h2>
        <div className="gallery-grid preview-grid">
            <div className="gallery-item"><img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600" alt="Work" /></div>
            <div className="gallery-item"><img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600" alt="Work" /></div>
            <div className="gallery-item"><img src="https://images.unsplash.com/photo-1593702295094-aea8cdd39d68?w=600" alt="Work" /></div>
            <div className="gallery-item"><img src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600" alt="Work" /></div>
            <div className="gallery-item fade-item"><img src="https://images.unsplash.com/photo-1503951914875-befca74f4e90?w=600" alt="Work" /></div>
            <div className="gallery-item fade-item"><img src="https://images.unsplash.com/photo-1532710093739-9470acff878f?w=600" alt="Work" /></div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '-40px', position: 'relative', zIndex: '2' }}>
          <Link to="/galerie" className="btn-gold" style={{ padding: '15px 40px', textDecoration: 'none' }}>VEZI TOATĂ GALERIA →</Link>
        </div>
      </section>

      {/* ECHIPA */}
      <section id="echipa" className="team-section">
        <div className="container">
          <h2 className="section-title">Maeștrii Noștri</h2>
          <div className="team-slider">
            <div className="team-card">
              <div className="card-inner">
                <img src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600" alt="Alex" />
                <div className="card-info">
                  <h3>Alex "The Blade"</h3><span>Master Barber</span>
                  <Link to="/frizer/alex" className="btn-direct-book">Programează-te</Link>
                </div>
              </div>
            </div>
            <div className="team-card">
              <div className="card-inner">
                <img src="https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600" alt="Mihai" />
                <div className="card-info">
                  <h3>Mihai Style</h3><span>Expert Styling</span>
                  <Link to="/frizer/mihai" className="btn-direct-book">Programează-te</Link>
                </div>
              </div>
            </div>
            <div className="team-card">
              <div className="card-inner">
                <img src="https://images.unsplash.com/photo-1503951914875-befca74f4e90?w=600" alt="Andrei" />
                <div className="card-info">
                  <h3>Andrei Beard</h3><span>Beard Specialist</span>
                  <Link to="/frizer/andrei" className="btn-direct-book">Programează-te</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREȚURI (REPARAT) */}
      <section id="preturi" className="prices-section">
        <div className="container">
          <div className="price-header-area">
            <h2 className="section-title">Servicii & Tarife</h2>
            <p className="section-subtitle">Investește în imaginea ta</p>
          </div>
          <div className="prices-content">
            <div className="price-tabs">
              <button className={`tab-btn ${categorieActiva === 'tuns' ? 'active' : ''}`} onClick={() => setCategorieActiva('tuns')}>TUNS</button>
              <button className={`tab-btn ${categorieActiva === 'barba' ? 'active' : ''}`} onClick={() => setCategorieActiva('barba')}>BARBĂ</button>
              <button className={`tab-btn ${categorieActiva === 'combo' ? 'active' : ''}`} onClick={() => setCategorieActiva('combo')}>COMBO</button>
            </div>
            <div className="price-list-container">
              {servicii[categorieActiva].map((item, index) => (
                <div key={index} className={`price-item-box ${item.vip ? 'vip-item' : ''}`}>
                  <div className="price-row-main">
                    <span className="price-item-name">{item.nume}</span>
                    <span className="price-item-dots"></span>
                    <span className="price-item-value">{item.pret}</span>
                  </div>
                  <p className="price-item-desc">{item.desc}</p>
                  {item.vip && <span className="vip-tag">RECOMANDAT</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RECENZII */}
      <section id="recenzii" className="reviews-section">
        <div className="container">
          <div className="reviews-header">
            <h2 className="section-title">Ce spun clienții</h2>
            <div className="overall-rating">
              <span className="rating-score">4.9</span>
              <div className="stars-gold">★★★★★</div>
              <p className="rating-count">Din peste 500 de recenzii Google</p>
            </div>
          </div>
          <div className="reviews-grid">
            <div className="review-card">
              <div className="review-user">
                <img src="https://i.pravatar.cc/100?u=1" alt="User" className="user-avatar" />
                <div className="user-info"><h4>Andrei Ionescu</h4><span>Acum 2 zile</span></div>
              </div>
              <div className="review-stars">★★★★★</div>
              <p className="review-text">"Cea mai bună experiență de tuns. Alex are o atenție la detalii incredibilă."</p>
            </div>
            <div className="review-card">
              <div className="review-user">
                <img src="https://i.pravatar.cc/100?u=2" alt="User" className="user-avatar" />
                <div className="user-info"><h4>Marius Popa</h4><span>Săptămâna trecută</span></div>
              </div>
              <div className="review-stars">★★★★★</div>
              <p className="review-text">"Atmosferă relaxată și servicii de top. Voi reveni cu siguranță!"</p>
            </div>
          </div>
          <div className="reviews-cta">
            <a href="https://search.google.com/local/writereview?placeid=ChIJ_ZBOTTj_sUAR_keHYqlqloE" target="_blank" rel="noopener noreferrer" className="btn-outline-gold">Lasă o recenzie pe Google</a>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2 className="section-title">Hai să vorbim</h2>
              <div className="contact-details">
                <p>📍 Strada Împăratul Traian Nr. 76, Sector 4</p>
                <p>📞 0785 252 211</p>
              </div>
            </div>
            <div className="contact-form-wrapper">
              <form onSubmit={handleContactSubmit} className="premium-form">
                <input type="text" name="nume" placeholder="Numele tău" required />
                <input type="tel" name="telefon" placeholder="Telefon (07xxxxxxxx)" required />
                <textarea name="mesaj" placeholder="Cu ce te putem ajuta?" rows="5" required></textarea>
                <button type="submit" className="btn-gold-large" disabled={loading}>
                  {loading ? 'SE TRIMITE...' : 'TRIMITE MESAJUL'}
                </button>
                {status && <p className="form-status">{status}</p>}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* HARTA */}
      <section className="map-section">
        <div className="map-background">
          <iframe src="https://www.google.com/maps/place/Gentlemen's+Club,+Strada+Victoriei+38,+Pite%C8%99ti+110016/data=!4m2!3m1!1s0x40b2bdbb05c434e5:0xce0e1ad9118aed0f?utm_source=mstt_1&entry=gps&coh=192189&g_ep=CAESBzI1LjM2LjIYACCenQoqqwEsOTQyNjc3MjcsOTQyNzU0MDMsOTQyOTIxOTUsOTQyOTc2NTAsOTQyODQ1MDIsOTQyMjMyOTksOTQyMTY0MTMsOTQyODA1NzYsOTQyMTI0OTYsOTQyMDczOTQsOTQyMDc1MDYsOTQyMDg1MDYsOTQyMTc1MjMsOTQyMTg2NTMsOTQyMjk4MzksOTQyNzUxNjgsOTQyNzk2MTksNDcwODQzOTMsOTQyMTMyMDBCAlJP&skid=5da43895-0bf4-4dc0-9861-810b6485d83a&g_st=aw" allowFullScreen="" loading="lazy" title="Locatie"></iframe>
        </div>
        <div className="map-fade-overlay"></div>
        <div className="contact-card">
          <h3>Vizitează-ne</h3>
          <div className="contact-info-item">📍 Strada Împăratul Traian Nr. 76, București</div>
          <div className="contact-info-item">📞 0785 252 211</div>
          <a href="https://waze.com/ul?q=Strada+Imparatul+Traian+76+Bucuresti&navigate=yes" target="_blank" rel="noopener noreferrer" className="btn-gold" style={{marginTop:'15px', width:'100%', display:'block', textAlign:'center'}}>Waze</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bomba-footer">
        <div className="footer-container">
          <div className="footer-section brand-box">
            <h2 className="footer-logo">GENTLEMAN'S <span>SALOON</span></h2>
            <div className="footer-socials"><span>IG</span> <span>FB</span> <span>TK</span></div>
          </div>
          <div className="footer-section hours-box">
            <h3>PROGRAM</h3>
            <ul>
              <li>Luni - Vineri: 09:00 - 20:00</li>
              <li>Sâmbătă: 09:00 - 16:00</li>
            </ul>
          </div>
          <div className="footer-section contact-box">
            <h3>CONTACT</h3>
            <a href="tel:0785252211" className="footer-btn call">📞 SUNĂ ACUM</a>
          </div>
        </div>
        <div className="footer-copyright">© 2026 Gentleman Saloon.</div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/frizer/:id" element={<BarberProfile />} />
        <Route path="/galerie" element={<GalleryPage />} />
        <Route path="/admin/:id" element={<AdminPanel />} />    
        <Route path="/master" element={<MasterDashboard />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;