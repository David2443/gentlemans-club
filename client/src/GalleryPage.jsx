// src/GalleryPage.jsx
import { getApiBase } from './api';
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from 'react';
import { Link } from 'react-router-dom';
import './GaleriePage.css';

const API_BASE = getApiBase();
const BRAND_NAME = "GENTLEMAN'S CLUB";
const CONTACT_PHONE = '+40 741 844 684';

const BARBER_FILTERS = [
  {
    value: 'all',
    label: 'TOATE',
    display: 'Toate lucrările',
    aliases: ['all', 'toate', 'toti', 'toți']
  },
  {
    value: 'dani-frizeru',
    label: 'DANI',
    display: 'Dani Frizeru',
    aliases: ['dani', 'dani frizeru', 'master']
  },
  {
    value: 'flavius-frizeru',
    label: 'FLAVIUS',
    display: 'Flavius Frizeru',
    aliases: ['flavius', 'flavius frizeru']
  },
   {
    value: 'vali-frizeru',
    label: 'VALI',
    display: 'Vali Frizeru',
    aliases: ['vali', 'vali frizeru', 'sonic style']
  },
  {
    value: 'alex-frizeru',
    label: 'ALEX',
    display: 'Alex Frizeru',
    aliases: ['alex', 'alex frizeru', 'alexandru popescu']
  },
  {
    value: 'pensat-precis',
    label: 'PENSAT',
    display: 'Pensat Precis',
    aliases: ['pensat', 'pensat precis', 'brow specialist']
  }
];

const SIZE_PATTERN = [
  'tall',
  'wide',
  'square',
  'wide',
  'tall',
  'square',
  'square',
  'wide'
];

const normalizeText = (value) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const findBarberFilter = (value) => {
  const normalized = normalizeText(value);

  if (!normalized) {
    return BARBER_FILTERS[0];
  }

  const found = BARBER_FILTERS.find((barber) => {
    if (barber.value === value) return true;

    const allValues = [
      barber.value,
      barber.label,
      barber.display,
      ...(barber.aliases || [])
    ];

    return allValues.some((item) => normalizeText(item) === normalized);
  });

  return found || {
    value: normalized.replace(/\s+/g, '-'),
    label: String(value || 'LUCRARE').split(' ')[0].toUpperCase(),
    display: value || 'Lucrare'
  };
};

const normalizeImageUrl = (url) => {
  if (!url) return '';

  const cleanUrl = String(url).trim();

  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith('/')) {
    return `${API_BASE}${cleanUrl}`;
  }

  return `${API_BASE}/${cleanUrl}`;
};

const formatDateRo = (dateValue) => {
  if (!dateValue) return 'Încărcată recent';

  try {
    return new Date(dateValue).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return 'Încărcată recent';
  }
};

const mapBackendPhotoToGalleryItem = (photo, index) => {
  const rawBarber = photo.barberId || photo.frizer || photo.specialist || photo.username;
  const barber = findBarberFilter(rawBarber);
  const url = normalizeImageUrl(photo.url || photo.image || photo.src);

  return {
    id: photo._id || photo.id || `${url}-${index}`,
    cat: barber.value,
    src: url,
    titlu: photo.titlu || photo.title || `Lucrare ${barber.display}`,
    desc: photo.desc || photo.description || `${barber.display} · ${formatDateRo(photo.data || photo.createdAt)}`,
    size: SIZE_PATTERN[index % SIZE_PATTERN.length],
    frizer: barber.display,
    original: photo
  };
};

function Particles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + 5,
        r: Math.random() * 1.2 + 0.2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.4 - 0.1,
        alpha: Math.random() * 0.6 + 0.2,
        life: Math.random() * 200 + 100
      };
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;

        if (p.life <= 0 || p.y < -10) {
          particles[i] = createParticle();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    }

    resize();

    particles = Array.from({ length: 80 }, () => {
      const p = createParticle();
      p.y = Math.random() * canvas.height;
      return p;
    });

    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="gs-particles" />;
}

function GalleryItem({ item, index, onClick }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          obs.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    obs.observe(el);

    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`gs-gallery-item gs-${item.size} gs-reveal`}
      style={{ transitionDelay: `${index * 0.06}s` }}
      onClick={onClick}
    >
      <img src={item.src} loading="lazy" alt={item.titlu} loading="lazy" />

      <div className="gs-gallery-overlay">
        <span className="gs-overlay-index">
          {String(index + 1).padStart(2, '0')}
        </span>

        <span className="gs-overlay-arrow">↗</span>

        <div className="gs-overlay-cat">
          {item.frizer}
        </div>

        <div className="gs-overlay-title">
          {item.titlu}
        </div>
      </div>
    </div>
  );
}

function ListItem({ item, index, onClick }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;

    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          obs.unobserve(el);
        }
      },
      { threshold: 0.05 }
    );

    obs.observe(el);

    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="gs-list-item gs-reveal"
      style={{ transitionDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      <img
        className="gs-list-thumb"
        src={item.src}
        alt={item.titlu}
        loading="lazy"
      />

      <div className="gs-list-info">
        <div className="gs-list-cat">
          {item.frizer}
        </div>

        <div className="gs-list-title">
          {item.titlu}
        </div>

        <div className="gs-list-desc">
          {item.desc}
        </div>
      </div>

      <div className="gs-list-action">
        ZOOM →
      </div>
    </div>
  );
}

function Lightbox({ items, index, onClose, onNav }) {
  const item = items[index];

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNav(1);
      if (e.key === 'ArrowLeft') onNav(-1);
    }

    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onNav]);

  if (!item) return null;

  return (
    <div
      className="gs-lightbox-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="gs-lightbox-inner">
        <div className="gs-lightbox-frame" />

        <img
          className="gs-lightbox-img"
          src={item.src}
          alt={item.titlu}
        />

        <div className="gs-lightbox-meta">
          <div>
            <div className="gs-lightbox-cat">
              {item.frizer}
            </div>

            <div className="gs-lightbox-title">
              {item.titlu}
            </div>
          </div>

          <div className="gs-cat-badge">
            {item.desc}
          </div>
        </div>
      </div>

      <button className="gs-lightbox-close" onClick={onClose}>
        ✕
      </button>

      <button className="gs-lightbox-nav gs-lightbox-prev" onClick={() => onNav(-1)}>
        ‹
      </button>

      <button className="gs-lightbox-nav gs-lightbox-next" onClick={() => onNav(1)}>
        ›
      </button>

      <div className="gs-lightbox-counter">
        {index + 1} / {items.length}
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const [filtruActiv, setFiltruActiv] = useState('all');
  const [currentView, setCurrentView] = useState('masonry');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [tooltip, setTooltip] = useState(false);

  const [portofoliu, setPortofoliu] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [galleryError, setGalleryError] = useState('');

  const tooltipTimeout = useRef(null);

  const fetchGallery = useCallback(async () => {
    setLoadingGallery(true);
    setGalleryError('');

    try {
      const response = await fetch(`${API_BASE}/api/galerie`);

      if (!response.ok) {
        throw new Error('Nu s-a putut încărca galeria.');
      }

      const data = await response.json();

      const arr = Array.isArray(data)
        ? data
        : data.poze || data.galerie || data.images || [];

      const mapped = arr
        .map((photo, index) => mapBackendPhotoToGalleryItem(photo, index))
        .filter((item) => item.src);

      setPortofoliu(mapped);
    } catch (err) {
      console.error('Eroare la galeria completă:', err);
      setGalleryError('Nu am putut încărca pozele din backend.');
      setPortofoliu([]);
    } finally {
      setLoadingGallery(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const filteredItems = useMemo(() => {
    if (filtruActiv === 'all') return portofoliu;

    return portofoliu.filter((p) => p.cat === filtruActiv);
  }, [filtruActiv, portofoliu]);

  const counts = useMemo(() => {
    const base = {
      all: portofoliu.length
    };

    BARBER_FILTERS.forEach((filter) => {
      if (filter.value !== 'all') {
        base[filter.value] = portofoliu.filter((p) => p.cat === filter.value).length;
      }
    });

    return base;
  }, [portofoliu]);

  const openLightbox = (i) => {
    setLightboxIndex(i);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const navLightbox = useCallback((dir) => {
    setLightboxIndex((prev) => {
      if (!filteredItems.length) return null;

      return (prev + dir + filteredItems.length) % filteredItems.length;
    });
  }, [filteredItems.length]);

  const showTooltip = () => {
    setTooltip(true);
    clearTimeout(tooltipTimeout.current);

    tooltipTimeout.current = setTimeout(() => {
      setTooltip(false);
    }, 2000);
  };

  return (
    <div className="gs-root">
      <Particles />

      <div className="gs-grid-decor" />

      <nav className="gs-navbar">
        <div className="gs-navbar-brand">
          <div className="gs-brand-icon">
            <div className="gs-brand-icon-inner">
              ✦
            </div>
          </div>

          <div>
            <div className="gs-brand-name">
              GENTLEMAN&apos;S
            </div>

            <div className="gs-brand-sub">
              CLUB · PORTOFOLIU
            </div>
          </div>
        </div>

        <div className="gs-navbar-center">
          LUNI — VINERI · 09:00 — 20:00 · {CONTACT_PHONE}
        </div>

        <Link to="/" className="gs-navbar-back">
          ← ACASĂ
        </Link>
      </nav>

      <section className="gs-hero">
        <p className="gs-hero-eyebrow">
          ✦ &nbsp; GALERIE FOTO &nbsp; ✦
        </p>

        <h1 className="gs-hero-title">
          MUNCA
          <br />
          <span className="gs-gold-shimmer">
            NOASTRĂ
          </span>
        </h1>

        <div className="gs-hero-line" />

        <p className="gs-hero-desc">
          Toate lucrările încărcate de frizeri apar aici automat din backend.
        </p>

        <div className="gs-hero-stats">
          <div className="gs-hero-stat">
            <div className="gs-stat-num">
              {portofoliu.length}
            </div>
            <div className="gs-stat-label">
              LUCRĂRI ÎNCĂRCATE
            </div>
          </div>

          <div className="gs-hero-stat">
            <div className="gs-stat-num">
              5
            </div>
            <div className="gs-stat-label">
              SPECIALIȘTI
            </div>
          </div>

          <div className="gs-hero-stat">
            <div className="gs-stat-num">
              100%
            </div>
            <div className="gs-stat-label">
              PORTOFOLIU REAL
            </div>
          </div>
        </div>

        <div className="gs-hero-divider" />
      </section>

      <div className="gs-filters-section">
        <div className="gs-filters-inner">
          {BARBER_FILTERS.map((filter, i) => (
            <React.Fragment key={filter.value}>
              {i > 0 && <div className="gs-filters-divider" />}

              <button
                className={`gs-filter-btn${filtruActiv === filter.value ? ' active' : ''}`}
                onClick={() => {
                  setFiltruActiv(filter.value);
                  setLightboxIndex(null);
                }}
              >
                {filter.label}
                <span className="gs-filter-count">
                  {counts[filter.value] || 0}
                </span>
              </button>
            </React.Fragment>
          ))}

          <div className="gs-filter-view-toggle">
            <button
              className={`gs-view-btn${currentView === 'masonry' ? ' active' : ''}`}
              onClick={() => setCurrentView('masonry')}
              title="Grilă"
            >
              ⊞
            </button>

            <button
              className={`gs-view-btn${currentView === 'list' ? ' active' : ''}`}
              onClick={() => setCurrentView('list')}
              title="Listă"
            >
              ≡
            </button>
          </div>
        </div>
      </div>

      <div className="gs-gallery-wrapper">
        <div className="gs-section-label">
          <div className="gs-section-label-line" />

          <span className="gs-section-label-text">
            LUCRĂRI ÎNCĂRCATE DE FRIZERI
          </span>

          <div className="gs-section-label-line gs-line-right" />

          <span className="gs-section-label-count">
            {filteredItems.length} / {portofoliu.length}
          </span>
        </div>

        {loadingGallery && (
          <div className="gs-empty-state">
            <div className="gs-empty-icon">✦</div>
            <div className="gs-empty-text">
              SE ÎNCARCĂ GALERIA...
            </div>
          </div>
        )}

        {!loadingGallery && galleryError && (
          <div className="gs-empty-state">
            <div className="gs-empty-icon">!</div>
            <div className="gs-empty-text">
              {galleryError}
            </div>

            <button
              type="button"
              className="gs-filter-btn active"
              style={{
                marginTop: '22px'
              }}
              onClick={fetchGallery}
            >
              REÎNCEARCĂ
            </button>
          </div>
        )}

        {!loadingGallery && !galleryError && filteredItems.length === 0 && (
          <div className="gs-empty-state">
            <div className="gs-empty-icon">✦</div>

            <div className="gs-empty-text">
              NU EXISTĂ POZE ÎNCĂRCATE ÎN ACEASTĂ CATEGORIE
            </div>

            <p
              style={{
                marginTop: '12px',
                color: '#8d877d',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                textAlign: 'center'
              }}
            >
              Pozele apar aici automat după ce frizerii le încarcă din panoul lor.
            </p>
          </div>
        )}

        {!loadingGallery && !galleryError && currentView === 'masonry' && filteredItems.length > 0 && (
          <div className="gs-masonry-grid">
            {filteredItems.map((item, i) => (
              <GalleryItem
                key={item.id}
                item={item}
                index={i}
                onClick={() => {
                  openLightbox(i);
                  showTooltip();
                }}
              />
            ))}
          </div>
        )}

        {!loadingGallery && !galleryError && currentView === 'list' && filteredItems.length > 0 && (
          <div className="gs-list-grid">
            {filteredItems.map((item, i) => (
              <ListItem
                key={item.id}
                item={item}
                index={i}
                onClick={() => openLightbox(i)}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="gs-footer">
        <div className="gs-footer-brand">
          {BRAND_NAME}
        </div>

        <div className="gs-footer-line" />

        <div className="gs-footer-gold">
          Stilul tău, semnătura noastră.
        </div>
      </footer>

      {lightboxIndex !== null && (
        <Lightbox
          items={filteredItems}
          index={lightboxIndex}
          onClose={closeLightbox}
          onNav={navLightbox}
        />
      )}

      <div className={`gs-tooltip${tooltip ? ' visible' : ''}`}>
        CLICK PENTRU ZOOM
      </div>
    </div>
  );
}