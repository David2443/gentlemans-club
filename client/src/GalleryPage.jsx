// src/GalleryPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

function GalleryPage() {
  const [filtruActiv, setFiltruActiv] = useState('all');
  const [imagineSelectata, setImagineSelectata] = useState(null);
  const [portofoliu, setPortofoliu] = useState([]);

  // Încărcăm pozele de pe server (sau lista ta fixă)
  useEffect(() => {
    // Dacă ai serverul pornit, decomentează fetch-ul. Dacă nu, lasă lista fixă momentan.
    /*
    fetch('http://localhost:5000/api/galerie')
      .then(res => res.json())
      .then(data => setPortofoliu(data));
    */
   
    // LISTA FIXĂ DE TEST (ca să meargă acum)
    setPortofoliu([
      { id: 1, cat: 'tuns', src: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800', titlu: 'Skin Fade' },
      { id: 2, cat: 'barba', src: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800', titlu: 'Royal Beard' },
      { id: 3, cat: 'styling', src: 'https://images.unsplash.com/photo-1593702295094-aea8cdd39d68?w=800', titlu: 'Scissors Cut' },
      { id: 4, cat: 'tuns', src: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800', titlu: 'Classic Look' },
      { id: 5, cat: 'styling', src: 'https://images.unsplash.com/photo-1503951914875-befca74f4e90?w=800', titlu: 'Pompadour' },
      { id: 6, cat: 'barba', src: 'https://images.unsplash.com/photo-1532710093739-9470acff878f?w=800', titlu: 'Hot Towel' },
    ]);
  }, []);

  const imaginiFiltrate = filtruActiv === 'all' 
    ? portofoliu 
    : portofoliu.filter(img => img.cat === filtruActiv);

  return (
    <div style={{ background: "#0b0b0b", minHeight: "100vh", paddingBottom: "50px" }}>
      
      {/* NAVBAR SIMPLU PENTRU PAGINA ASTA */}
      <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #333" }}>
        <h2 style={{ color: "#d4af37", margin: 0, fontFamily: "Oswald" }}>GALERIE FOTO</h2>
        <Link to="/" className="btn-gold" style={{ textDecoration: "none", fontSize: "14px" }}>← Înapoi Acasă</Link>
      </div>

      <div className="gallery-section">
        {/* FILTRE */}
        <div className="gallery-filters">
          <button className={`filter-btn ${filtruActiv === 'all' ? 'active' : ''}`} onClick={() => setFiltruActiv('all')}>Toate</button>
          <button className={`filter-btn ${filtruActiv === 'tuns' ? 'active' : ''}`} onClick={() => setFiltruActiv('tuns')}>Tuns</button>
          <button className={`filter-btn ${filtruActiv === 'barba' ? 'active' : ''}`} onClick={() => setFiltruActiv('barba')}>Barbă</button>
          <button className={`filter-btn ${filtruActiv === 'styling' ? 'active' : ''}`} onClick={() => setFiltruActiv('styling')}>Styling</button>
        </div>

        {/* GRID COMPLET (Fără limită) */}
        <div className="gallery-grid">
          {imaginiFiltrate.map((item) => (
            <div key={item.id} className="gallery-item" onClick={() => setImagineSelectata(item.src)}>
              <img src={item.src} alt={item.titlu} />
              <div className="gallery-overlay">
                <div className="overlay-text">{item.titlu}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIGHTBOX */}
      {imagineSelectata && (
        <div className="lightbox" onClick={() => setImagineSelectata(null)}>
          <span className="close-lightbox">&times;</span>
          <img src={imagineSelectata} alt="Zoom" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default GalleryPage;