// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, Link } from 'react-router-dom';

import './App.css';
import { getApiBase } from './api';
import { AuthProvider, ProtectedRoute } from './AuthGate';

import BarberProfile from './BarberProfile';
import AdminPanel from './AdminPanel';
import GalleryPage from './GalleryPage';
import ScrollToTop from './ScrollToTop';
import Login from './Login';
import MasterDashboard from './MasterDashboard';
import MasterMessages from './MasterMessages';

const BRAND_NAME = "Gentleman's Club";
const CONTACT_PHONE_DISPLAY = '+40 741 844 684';
const CONTACT_PHONE_HREF = 'tel:+40741844684';
const CONTACT_ADDRESS = 'Strada Victoriei Nr. 38, Pitești';

const MAP_QUERY = encodeURIComponent(CONTACT_ADDRESS);
const GOOGLE_MAPS_LINK = 'https://share.google/N7PNzkqwQKnzkqyIP';
const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/gentlemensclubpitesti?utm_source=qr',
  tiktok: 'https://www.tiktok.com/@gentlemenss.club0?_r=1&_t=ZN-97U7b7CzB0o',
  facebook: 'https://www.facebook.com/share/1HJzuyujP1/?mibextid=wwXIfr'
};

const LEGAL_LINKS = {
  anaf: 'https://www.anaf.ro/',
  anpc: 'https://anpc.ro/',
  sal: 'https://reclamatiisal.anpc.ro/'
};
const API_BASE = getApiBase();
const COMPANY_INFO = {
  legalName: "DIAMOND GENTLEMAN'S CLUB S.R.L.",
  cui: '52204852',
  registrationDate: '23.07.2025',
  activityCode: '9621',
  activity: 'Activități de coafură și frizerie',
  workPoint: CONTACT_ADDRESS,
  phone: CONTACT_PHONE_DISPLAY,
  slogan: 'Aspect îngrijit, atenție la detalii și servicii premium pentru bărbați.'
};

const BARBERS = [
  {
    id: 'dani-frizeru',
    name: 'Dani Frizeru',
    role: 'Master Barber',
    label: 'MASTER',
    specialty: 'Stil. Încredere. Distincție.',
    description: 'Nu este doar o tunsoare, este o experiență.',
    image: '/dani-frizeru.png',
    isMaster: true
  },
  {
    id: 'flavius-frizeru',
    name: 'Flavius Frizeru',
    role: 'Barber Specialist',
    label: 'STIL & PRECIZIE',
    specialty: 'Tunsori moderne, fade-uri curate și barbă aranjată impecabil.',
    description: 'Mai mult decât o tunsoare, e despre stilul tău.',
    image: '/flavius-frizeru.png',
    isMaster: false
  },
  {
    id: 'alex-frizeru',
    name: 'Alex Frizeru',
    role: 'Premium Barber',
    label: 'TUNSORI PREMIUM',
    specialty: 'Tunsori premium, bărbi perfecte, stil și eleganță.',
    description: 'Stil premium, detalii curate și finisaj elegant.',
    image: '/alex-frizeru.png',
    isMaster: false
  },
  {
    id: 'vali-frizeru',
    name: 'Vali Frizeru',
    role: 'Barber Specialist',
    label: 'SONIC STYLE',
    specialty: 'Tuns bărbați, barbă & contur, styling profesional.',
    description: 'Stilul tău, semnătura noastră.',
    image: '/vali-frizeru.png',
    isMaster: false
  },
  {
    id: 'pensat-precis',
    name: 'Pensat Precis',
    role: 'Brow Specialist',
    label: 'STIL PERFECT',
    specialty: 'Pensat precis, formă curată și detaliu premium.',
    description: 'Detaliul face diferența.',
    image: '/pensat-precis.png',
    isMaster: false
  }
];


const WHY_ITEMS = [
  {
    title: 'Specialiști reali',
    text: 'Alegi direct frizerul sau specialistul potrivit, cu programare clară și serviciu selectat.'
  },
  {
    title: 'Servicii premium',
    text: 'Tuns, barbă, pensat, vopsit și pachete VIP într-o experiență completă.'
  },
  {
    title: 'Programare simplă',
    text: 'Clientul alege ziua, ora și serviciul, iar programarea ajunge direct în panoul specialistului.'
  },
  {
    title: 'Locație centrală',
    text: 'Ne găsești în Pitești, pe Strada Victoriei Nr. 38, într-un spațiu premium.'
  }
];

function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categorieActiva, setCategorieActiva] = useState('tuns');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  const [reviews, setReviews] = useState([]);

  const toggleMenu = () => {
    const nextState = !menuOpen;
    setMenuOpen(nextState);
    document.body.style.overflow = nextState ? 'hidden' : 'auto';
  };

  const closeMenu = () => {
    setMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  const normalizeGalleryUrl = (url) => {
    if (!url) return '';

    const clean = String(url).trim();

    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }

    if (clean.startsWith('/')) {
      return `${API_BASE}${clean}`;
    }

    return `${API_BASE}/${clean}`;
  };

  useEffect(() => {
    document.title = `${BRAND_NAME} Pitești | Frizerie premium, tuns, barbă și pensat`;

    let metaDescription = document.querySelector('meta[name="description"]');

    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }

    metaDescription.setAttribute(
      'content',
      `${BRAND_NAME} Pitești — frizerie premium pe ${CONTACT_ADDRESS}. Programări online pentru tuns, barbă, pensat, vopsit și pachete VIP.`
    );
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadAllGallery = async () => {
      setGalleryLoading(true);

      try {
        const response = await fetch(`${API_BASE}/api/galerie`);

        if (!response.ok) {
          throw new Error('Nu s-a putut încărca galeria.');
        }

        const data = await response.json();

        const arr = Array.isArray(data)
          ? data
          : data.poze || data.galerie || data.images || [];

        const urls = arr
          .map((item) => item.url || item.image || item.src)
          .filter(Boolean)
          .map(normalizeGalleryUrl);

        const uniqueUrls = [...new Set(urls)];

        if (!ignore) {
          setGalleryImages(uniqueUrls);
        }
      } catch (error) {
        console.error('Eroare galerie homepage:', error);

        if (!ignore) {
          setGalleryImages([]);
        }
      } finally {
        if (!ignore) {
          setGalleryLoading(false);
        }
      }
    };

    loadAllGallery();

    return () => {
      ignore = true;
    };
  }, []);


  useEffect(() => {
    let ignore = false;

    const loadReviews = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/reviews?limit=8`);

        if (!response.ok) {
          throw new Error('Nu s-au putut încărca recenziile.');
        }

        const data = await response.json();

        if (!ignore && Array.isArray(data)) {
          setReviews(data);
        }
      } catch (error) {
        console.error('Eroare recenzii homepage:', error);

        if (!ignore) {
          setReviews([]);
        }
      }
    };

    loadReviews();

    return () => {
      ignore = true;
    };
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    const telefonCurat = String(payload.telefon || '').replace(/\s/g, '');
    const regexTelefon = /^(07\d{8}|\+407\d{8})$/;

    if (!regexTelefon.test(telefonCurat)) {
      setStatus('❌ Introdu un număr valid: 07xxxxxxxx sau +407xxxxxxxx');
      setLoading(false);
      return;
    }

    payload.telefon = telefonCurat;

    try {
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
      console.error('Eroare contact:', error);
      setStatus('❌ Eroare de conexiune. Verifică serverul!');
    } finally {
      setLoading(false);

      setTimeout(() => {
        setStatus('');
      }, 5000);
    }
  };

  const servicii = {
    tuns: [
      {
        nume: 'TUNS',
        pret: '50 LEI',
        desc: 'Tuns curat, finisat atent și adaptat stilului tău.'
      },
      {
        nume: 'SPĂLAT',
        pret: '25 LEI',
        desc: 'Spălat profesional pentru prospețime și confort.'
      },
      {
        nume: 'STYLING',
        pret: 'LA SALON',
        desc: 'Spălat, aranjat și finisaj cu produse premium.'
      }
    ],

    barba: [
      {
        nume: 'BARBĂ',
        pret: '30 LEI',
        desc: 'Aranjare barbă pentru un aspect curat și îngrijit.'
      },
      {
        nume: 'CONTUR / ARANJAT BARBĂ',
        pret: '30 LEI',
        desc: 'Contur clar, simetrie și finisaj precis.'
      },
      {
        nume: 'VOPSIT BARBĂ',
        pret: '30 LEI',
        desc: 'Vopsit barbă pentru un aspect uniform și definit.'
      },
      {
        nume: 'TUNS + BARBĂ',
        pret: '75 LEI',
        desc: 'Tuns complet plus barbă aranjată și finisată.',
        vip: true
      }
    ],

    pensat: [
      {
        nume: 'PENSAT',
        pret: '35 LEI',
        desc: 'Pensat precis pentru un aspect curat și îngrijit.'
      },
      {
        nume: 'PENSAT + VOPSIT',
        pret: '50 LEI',
        desc: 'Pensat precis plus vopsit pentru definire și stil.',
        vip: true
      },
      {
        nume: 'PENSAT + PĂR NAS',
        pret: '45 LEI',
        desc: 'Pensat și îngrijire detalii pentru un look complet.'
      },
      {
        nume: 'TRATAMENT FACIAL',
        pret: '50 LEI',
        desc: 'Tratament facial pentru prospețime și aspect îngrijit.'
      },
      {
        nume: 'PACHET COMPLET',
        pret: '100 LEI',
        desc: 'Pensat + vopsit + păr nas + tratament facial.',
        vip: true
      }
    ],

    vopsit: [
      {
        nume: 'ȘUVIȚE',
        pret: '300 LEI',
        desc: 'Șuvițe lucrate atent pentru un rezultat premium.'
      },
      {
        nume: 'GLOBAL / TOTAL — O CULOARE',
        pret: '300 LEI',
        desc: 'Vopsit total într-o singură culoare.'
      },
      {
        nume: 'GLOBAL / TOTAL — MODEL',
        pret: '400 LEI',
        desc: 'Vopsit total cu model personalizat.',
        vip: true
      }
    ],

    pachete: [
      {
        nume: 'PACHET VIP',
        pret: '200 LEI',
        desc: 'Tuns + barbă + spălat + aranjat + prosop fierbinte + tratament facial.',
        vip: true
      }
    ]
  };

  const heroStats = [
    { value: '4.9★', label: 'rating clienți' },
    { value: '500+', label: 'recenzii' },
    { value: '5', label: 'specialiști' }
  ];

  const highlights = [
    {
      icon: '✂',
      title: 'Tuns premium',
      text: 'Fiecare detaliu este lucrat curat, cu atenție și experiență.'
    },
    {
      icon: '♛',
      title: 'Master barber',
      text: 'Dani Frizeru este masterul salonului și imaginea experienței premium.'
    },
    {
      icon: '◇',
      title: 'Detaliu perfect',
      text: 'Pensat precis, stil, formă și finisaj pentru un look complet.'
    }
  ];
const maleReviewAvatars = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/men/46.jpg',
  'https://randomuser.me/api/portraits/men/65.jpg',
  'https://randomuser.me/api/portraits/men/75.jpg',
  'https://randomuser.me/api/portraits/men/22.jpg',
  'https://randomuser.me/api/portraits/men/12.jpg'
];

const femaleReviewAvatars = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/women/26.jpg',
  'https://randomuser.me/api/portraits/women/52.jpg'
];

const femaleNameHints = [
  'elena',
  'maria',
  'ana',
  'andreea',
  'ioana',
  'alexandra',
  'cristina',
  'diana',
  'bianca',
  'georgiana',
  'raluca',
  'teodora'
];

const getReviewGender = (review) => {
  const rawGender = String(review?.gender || review?.sex || '').toLowerCase();

  if (['female', 'femeie', 'woman'].includes(rawGender)) {
    return 'female';
  }

  if (['male', 'barbat', 'bărbat', 'man'].includes(rawGender)) {
    return 'male';
  }

  const name = String(review?.name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return femaleNameHints.some((hint) => name.includes(hint)) ? 'female' : 'male';
};

const getReviewAvatar = (review, index) => {
  const customAvatar = String(review?.avatar || review?.image || review?.photo || '').trim();

  if (customAvatar && !customAvatar.includes('pravatar.cc')) {
    return customAvatar;
  }

  const avatars = getReviewGender(review) === 'female'
    ? femaleReviewAvatars
    : maleReviewAvatars;

  return avatars[index % avatars.length];
};
  const fallbackReviews = [
    {
      name: 'Andrei Ionescu',
      date: 'Acum 2 zile',
      text: 'Experiență premium de la intrare până la final. Dani are atenție mare la detalii și totul iese impecabil.',
      avatar: 'https://i.pravatar.cc/100?u=gentlemans-1'
    },
    {
      name: 'Marius Popa',
      date: 'Săptămâna trecută',
      text: 'Am venit pentru un fade și am plecat cu cel mai curat look de până acum. Recomand cu încredere.',
      avatar: 'https://i.pravatar.cc/100?u=gentlemans-2'
    },
    {
      name: 'Răzvan Dima',
      date: 'Acum 3 zile',
      text: 'Salon curat, atmosferă premium și frizeri foarte atenți. Programarea a mers super rapid.',
      avatar: 'https://i.pravatar.cc/100?u=gentlemans-3'
    },
    {
      name: 'Cătălin Stoica',
      date: 'Acum 5 zile',
      text: 'Flavius lucrează foarte precis. Fade-ul a ieșit exact cum am vrut, fără grabă și fără compromis.',
      avatar: 'https://i.pravatar.cc/100?u=gentlemans-4'
    },
    {
      name: 'Vlad Marinescu',
      date: 'Acum o săptămână',
      text: 'Alex are stil și atenție la detalii. Mi-a explicat ce se potrivește mai bine și rezultatul a fost top.',
      avatar: 'https://i.pravatar.cc/100?u=gentlemans-5'
    },
    {
      name: 'Bogdan Pavel',
      date: 'Acum 8 zile',
      text: 'Am făcut tuns + barbă și totul a fost la nivel premium. Revin sigur.',
      avatar: 'https://i.pravatar.cc/100?u=gentlemans-6'
    },
    {
      name: 'Elena Radu',
      date: 'Acum 10 zile',
      text: 'La pensat a fost super curat și atent lucrat. Forma a ieșit naturală și elegantă.',
      avatar: 'https://i.pravatar.cc/100?u=gentlemans-7'
    },
    {
      name: 'George Popescu',
      date: 'Acum 2 săptămâni',
      text: 'Un loc unde chiar simți că serviciul e premium. Personal serios, vibe bun și rezultat foarte curat.',
      avatar: 'https://i.pravatar.cc/100?u=gentlemans-8'
    }
  ];

  const displayedReviews = reviews.length > 0 ? reviews : fallbackReviews;

  const galleryPreviewImages = galleryImages.slice(0, 6);

  return (
    <div className="home-wrapper">
      <nav className={`custom-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo">{BRAND_NAME}</div>

          <div className="nav-schedule">
            <span>Luni - Vineri: 09:00 - 20:00</span>
            <span>• {CONTACT_PHONE_DISPLAY}</span>
          </div>

          <button
            type="button"
            className="burger-btn"
            onClick={toggleMenu}
            aria-label="Deschide meniul"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div
        className={`menu-backdrop ${menuOpen ? 'active' : ''}`}
        onClick={closeMenu}
      ></div>

      <div className={`sidebar-menu ${menuOpen ? 'active' : ''}`}>
        <button
          type="button"
          className="close-menu-btn"
          onClick={closeMenu}
          aria-label="Închide meniul"
        >
          ✕
        </button>

        <div className="sidebar-content">
          <span className="sidebar-title">Meniu</span>

          <div className="sidebar-links">
            <a href="#acasa" onClick={closeMenu}>Acasă</a>
            <a href="#experienta" onClick={closeMenu}>Experiență</a>
            <a href="#de-ce-noi" onClick={closeMenu}>De ce noi</a>
            <a href="#echipa" onClick={closeMenu}>Specialiști</a>
            <a href="#preturi" onClick={closeMenu}>Tarife</a>
            <a href="#galerie" onClick={closeMenu}>Galerie</a>
            <a href="#recenzii" onClick={closeMenu}>Recenzii</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
          </div>

          <div className="sidebar-footer">
            <a href="#echipa" onClick={closeMenu} className="btn-gold-sidebar">
              Programează-te
            </a>

            <div className="sidebar-contact-info">
              <p>{CONTACT_ADDRESS}</p>
              <p>{CONTACT_PHONE_DISPLAY}</p>
            </div>

            <div className="sidebar-legal-mini">
              <Link to="/confidentialitate" onClick={closeMenu}>Confidențialitate</Link>
              <Link to="/termeni" onClick={closeMenu}>Termeni</Link>
              <Link to="/cookies" onClick={closeMenu}>Cookies</Link>
            </div>
          </div>
        </div>
      </div>

      <div id="acasa" className="hero">
        <div
          className="hero-badge-mobile-safe"
          style={{
            position: 'relative',
            zIndex: 5,
            marginBottom: '22px',
            padding: '10px 18px',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            borderRadius: '999px',
            background: 'rgba(0, 0, 0, 0.42)',
            color: '#d4af37',
            fontWeight: 800,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontSize: '0.8rem'
          }}
        >
          {BRAND_NAME} • Premium Grooming Experience
        </div>

        <h1>
          Nu e doar tuns.
          <br />
          <span className="flicker-text" style={{ color: '#d4af37' }}>
            Este o experiență.
          </span>
        </h1>

        <p>
          Tuns premium, barbă definită, vopsit și pensat precis într-un salon unde
          detaliul face diferența.
        </p>

        <div
          className="hero-actions-mobile-safe"
          style={{
            position: 'relative',
            zIndex: 5,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '14px',
            marginBottom: '30px'
          }}
        >
          <a href="#echipa" className="btn-gold">
            Programează-te
          </a>

          <a
            href={CONTACT_PHONE_HREF}
            className="btn-outline-gold"
            style={{
              borderRadius: '50px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Sună: {CONTACT_PHONE_DISPLAY}
          </a>
        </div>

        <div
          className="hero-stats-mobile-safe"
          style={{
            position: 'relative',
            zIndex: 5,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(90px, 1fr))',
            gap: '12px',
            width: 'min(520px, calc(100% - 30px))',
            marginTop: '6px'
          }}
        >
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '15px 12px',
                border: '1px solid rgba(212, 175, 55, 0.28)',
                borderRadius: '16px',
                background: 'rgba(0, 0, 0, 0.42)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <strong
                style={{
                  display: 'block',
                  color: '#fff',
                  fontSize: '1.4rem',
                  lineHeight: 1,
                  fontWeight: 900
                }}
              >
                {stat.value}
              </strong>

              <span
                style={{
                  display: 'block',
                  marginTop: '7px',
                  color: '#aaa',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <section id="experienta" className="about-premium">
        <div className="about-bg-text">GENTLEMAN</div>

        <div className="about-container">
          <div className="about-image-wrapper">
            <div className="gold-frame"></div>

            <img
              src="/hero-barber.png"
              alt={`Interior ${BRAND_NAME}`}
              className="about-img-main"
            />

            <div className="experience-badge">
              <span style={{ fontSize: '24px' }}>5</span>
              <span style={{ fontSize: '12px' }}>ANI</span>
            </div>
          </div>

          <div className="about-content">
            <span className="about-subtitle">Experiența noastră</span>

            <h2 className="about-title">
              Stil. Încredere.
              <br />
              <span style={{ color: '#fff', borderBottom: '3px solid #d4af37' }}>
                Distincție.
              </span>
            </h2>

            <p className="about-desc">
              {BRAND_NAME} este locul unde serviciile premium se întâlnesc cu
              atenția pentru detalii. Tuns, barbă, vopsit, pensat și stil, toate
              într-o experiență completă.
            </p>

            <div className="about-features">
              {highlights.map((item) => (
                <div className="feature-item" key={item.title}>
                  <span className="feature-icon">{item.icon}</span>
                  <span className="feature-text">{item.title}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '34px',
                display: 'grid',
                gap: '12px'
              }}
            >
              {highlights.map((item) => (
                <div
                  key={item.text}
                  style={{
                    padding: '16px 18px',
                    border: '1px solid rgba(212, 175, 55, 0.18)',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)'
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      color: '#fff',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                  >
                    {item.title}
                  </strong>

                  <p
                    style={{
                      margin: 0,
                      color: '#888',
                      lineHeight: 1.6
                    }}
                  >
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="de-ce-noi" className="why-section">
        <div className="container">
          <h2 className="section-title">De ce Gentleman&apos;s Club</h2>

          <p className="section-subtitle">
            Un loc făcut pentru bărbați care vor servicii clare, atmosferă premium și atenție la detalii.
          </p>

          <div className="why-grid">
            {WHY_ITEMS.map((item, index) => (
              <div className="why-card" key={item.title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="echipa" className="team-section">
        <div className="container">
          <h2 className="section-title">Alege-ți specialistul</h2>

          <p className="section-subtitle">
            Dani Frizeru este masterul. Tu alegi experiența potrivită pentru stilul tău.
          </p>

          <div className="team-slider">
            {BARBERS.map((barber) => (
              <div className="team-card" key={barber.id}>
                <div className="card-inner">
                  <img loading="lazy" src={barber.image} alt={barber.name} />

                  <div className="card-info">
                    <h3>{barber.name}</h3>

                    <span>
                      {barber.role}
                      {barber.isMaster ? ' • MASTER' : ''}
                    </span>

                    <p
                      style={{
                        color: '#aaa',
                        fontSize: '0.95rem',
                        lineHeight: 1.5,
                        margin: '0 0 18px'
                      }}
                    >
                      {barber.description}
                    </p>

                    {barber.isMaster && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '16px',
                          padding: '6px 12px',
                          border: '1px solid rgba(212, 175, 55, 0.45)',
                          borderRadius: '999px',
                          color: '#d4af37',
                          fontSize: '0.7rem',
                          fontWeight: 900,
                          letterSpacing: '1.5px',
                          textTransform: 'uppercase',
                          background: 'rgba(212, 175, 55, 0.08)'
                        }}
                      >
                        Masterul salonului
                      </div>
                    )}

                    <Link to={`/frizer/${barber.id}`} className="btn-direct-book">
                      Programează-te
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="preturi" className="prices-section">
        <div className="container">
          <div className="price-header-area">
            <h2 className="section-title">Servicii & Tarife</h2>

            <p className="section-subtitle">
              Alege serviciul potrivit pentru look-ul tău
            </p>
          </div>

          <div className="prices-content">
            <div className="price-tabs">
              <button
                type="button"
                className={`tab-btn ${categorieActiva === 'tuns' ? 'active' : ''}`}
                onClick={() => setCategorieActiva('tuns')}
              >
                TUNS
              </button>

              <button
                type="button"
                className={`tab-btn ${categorieActiva === 'barba' ? 'active' : ''}`}
                onClick={() => setCategorieActiva('barba')}
              >
                BARBĂ
              </button>

              <button
                type="button"
                className={`tab-btn ${categorieActiva === 'pensat' ? 'active' : ''}`}
                onClick={() => setCategorieActiva('pensat')}
              >
                PENSAT
              </button>

              <button
                type="button"
                className={`tab-btn ${categorieActiva === 'vopsit' ? 'active' : ''}`}
                onClick={() => setCategorieActiva('vopsit')}
              >
                VOPSIT
              </button>

              <button
                type="button"
                className={`tab-btn ${categorieActiva === 'pachete' ? 'active' : ''}`}
                onClick={() => setCategorieActiva('pachete')}
              >
                PACHETE
              </button>
            </div>

            <div className="price-list-container">
              {(servicii[categorieActiva] || []).map((item, index) => (
                <div
                  key={`${item.nume}-${index}`}
                  className={`price-item-box ${item.vip ? 'vip-item' : ''}`}
                >
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

      <section id="galerie" className="gallery-section">
        <h2 className="section-title">Galerie</h2>

        <p className="section-subtitle">
          Poze încărcate direct din portofoliile frizerilor.
        </p>

        {galleryLoading ? (
          <div
            style={{
              width: 'min(760px, calc(100% - 32px))',
              margin: '0 auto 34px',
              padding: '42px 24px',
              border: '1px dashed rgba(212, 175, 55, 0.32)',
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.035)',
              color: '#d4af37',
              textAlign: 'center',
              fontWeight: 900,
              letterSpacing: '1.5px',
              textTransform: 'uppercase'
            }}
          >
            Se încarcă galeria...
          </div>
        ) : galleryPreviewImages.length > 0 ? (
          <div className="gallery-grid preview-grid">
            {galleryPreviewImages.map((src, index) => (
              <div
                className={`gallery-item ${index >= 4 ? 'fade-item' : ''}`}
                key={`${src}-${index}`}
              >
                <img loading="lazy" src={src} alt={`Lucrare ${BRAND_NAME} ${index + 1}`} />
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              width: 'min(760px, calc(100% - 32px))',
              margin: '0 auto 34px',
              padding: '42px 24px',
              border: '1px dashed rgba(212, 175, 55, 0.32)',
              borderRadius: '24px',
              background:
                'radial-gradient(circle at top, rgba(212, 175, 55, 0.09), transparent 42%), rgba(255, 255, 255, 0.035)',
              textAlign: 'center'
            }}
          >
            <span
              style={{
                display: 'block',
                marginBottom: '10px',
                color: '#d4af37',
                fontSize: '0.75rem',
                fontWeight: 900,
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}
            >
              Galerie goală
            </span>

            <h3
              style={{
                margin: '0 0 8px',
                color: '#fff',
                fontSize: 'clamp(1.4rem, 4vw, 2rem)',
                fontWeight: 900,
                textTransform: 'uppercase'
              }}
            >
              Nu sunt poze încărcate încă
            </h3>

            <p
              style={{
                margin: '0 auto',
                maxWidth: '520px',
                color: '#aaa',
                lineHeight: 1.6
              }}
            >
              Pozele vor apărea aici automat după ce frizerii încarcă lucrări din panoul lor.
            </p>
          </div>
        )}

        <div
          style={{
            textAlign: 'center',
            marginTop: '0',
            position: 'relative',
            zIndex: '2'
          }}
        >
          <Link
            to="/galerie"
            className="btn-gold"
            style={{ padding: '15px 40px', textDecoration: 'none' }}
          >
            VEZI TOATĂ GALERIA →
          </Link>
        </div>
      </section>

      <section id="recenzii" className="reviews-section">
        <div className="container">
          <div className="reviews-header">
            <h2 className="section-title">Clienții vorbesc</h2>

            <div className="overall-rating">
              <span className="rating-score">4.9</span>
              <div className="stars-gold">★★★★★</div>
              <p className="rating-count">Din peste 500 de recenzii ale clienților</p>
            </div>
          </div>

          <div className="reviews-grid">
            {displayedReviews.map((review, index) => {
              const rating = Math.max(1, Math.min(5, Number(review.rating) || 5));
              const reviewName = review.name || 'Client Gentleman’s Club';

              return (
                <div className="review-card" key={`${reviewName}-${index}`}>
                  <div className="review-user">
                    <img
  src={getReviewAvatar(review, index)}
  alt={reviewName}
  className="user-avatar"
  loading="lazy"
  decoding="async"
/>

                    <div className="user-info">
                      <h4>{reviewName}</h4>
                      <span>{review.dateLabel || review.date || 'Recent'}</span>
                    </div>
                  </div>

                  <div className="review-stars">{'★'.repeat(rating)}</div>

                  <p className="review-text">“{review.text}”</p>
                </div>
              );
            })}
          </div>

          <div className="reviews-cta">
            <a href="#contact" className="btn-outline-gold">
              Programează-te la {BRAND_NAME}
            </a>
          </div>
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2 className="section-title">Hai să vorbim</h2>

              <div className="contact-details">
                <p>📍 {CONTACT_ADDRESS}</p>
                <p>📞 {CONTACT_PHONE_DISPLAY}</p>
                <p>⏱️ Răspundem cât de repede putem.</p>
              </div>

              <a
                href={CONTACT_PHONE_HREF}
                className="btn-gold"
                style={{
                  marginTop: '22px',
                  display: 'inline-flex',
                  textDecoration: 'none'
                }}
              >
                Sună acum
              </a>
            </div>

            <div className="contact-form-wrapper">
              <form onSubmit={handleContactSubmit} className="premium-form">
                <input
                  type="text"
                  name="nume"
                  placeholder="Numele tău"
                  required
                />

                <input
                  type="tel"
                  name="telefon"
                  placeholder="Telefon (07xxxxxxxx sau +407xxxxxxxx)"
                  required
                />

                <textarea
                  name="mesaj"
                  placeholder="Cu ce te putem ajuta?"
                  rows="5"
                  required
                ></textarea>

                <button
                  type="submit"
                  className="btn-gold-large"
                  disabled={loading}
                >
                  {loading ? 'SE TRIMITE...' : 'TRIMITE MESAJUL'}
                </button>

                {status && <p className="form-status">{status}</p>}
              </form>
            </div>
          </div>
        </div>
      </section>

<section className="map-section premium-map-section">
  <div className="map-background premium-map-background">
    <iframe
      src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
      allowFullScreen
      loading="lazy"
      title={`Locație ${BRAND_NAME}`}
    ></iframe>
  </div>

  <div className="map-fade-overlay"></div>

  <div className="contact-card premium-location-card">
    <span className="location-kicker">Ne găsești aici</span>

    <h3>Vizitează-ne</h3>

    <div className="contact-info-item">
      <strong>📍 Adresă</strong>
      <span>{CONTACT_ADDRESS}</span>
    </div>

    <div className="contact-info-item">
      <strong>📞 Telefon</strong>
      <span>{CONTACT_PHONE_DISPLAY}</span>
    </div>

    <div className="map-actions">
      <a
        href={`https://waze.com/ul?q=${MAP_QUERY}&navigate=yes`}
        target="_blank"
        rel="noopener noreferrer"
        className="map-action-btn waze"
      >
        Deschide Waze
      </a>

      <a
  href={GOOGLE_MAPS_LINK}
  target="_blank"
  rel="noopener noreferrer"
  className="map-action-btn maps"
>
  Google Maps
</a>

      <a
        href={CONTACT_PHONE_HREF}
        className="map-action-btn call"
      >
        Sună acum
      </a>
    </div>
  </div>
</section>

      <footer className="bomba-footer">
        <div className="footer-container">
          <div className="footer-section brand-box">
            <span
              style={{
                display: 'inline-flex',
                marginBottom: '12px',
                padding: '7px 13px',
                border: '1px solid rgba(212,175,55,.35)',
                borderRadius: '999px',
                color: '#d4af37',
                fontSize: '.72rem',
                fontWeight: 900,
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}
            >
              Pitești • Premium Grooming
            </span>

            <h2 className="footer-logo">
              {BRAND_NAME}
            </h2>

            <p
              style={{
                maxWidth: '420px',
                color: '#aaa',
                lineHeight: 1.7,
                margin: '14px 0 22px'
              }}
            >
              {COMPANY_INFO.slogan}
            </p>

            <div className="footer-socials">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                IG
              </a>

              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                FB
              </a>

              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
              >
                TK
              </a>
            </div>
          </div>

          <div className="footer-section hours-box">
            <h3>PROGRAM</h3>

            <ul>
              <li>Luni - Vineri: 09:00 - 20:00</li>
              <li>Sâmbătă: 09:00 - 16:00</li>
              <li>Duminică: Închis</li>
              <li>Telefon: {CONTACT_PHONE_DISPLAY}</li>
            </ul>
          </div>

          <div className="footer-section contact-box">
            <h3>DATE FIRMĂ</h3>

            <div
              style={{
                display: 'grid',
                gap: '9px',
                color: '#aaa',
                lineHeight: 1.55,
                fontSize: '0.9rem'
              }}
            >
              <p style={{ margin: 0 }}>
                <strong style={{ color: '#fff' }}>{COMPANY_INFO.legalName}</strong>
              </p>

              <p style={{ margin: 0 }}>
                CUI: {COMPANY_INFO.cui}
              </p>

              <p style={{ margin: 0 }}>
                Înregistrată din data de: {COMPANY_INFO.registrationDate}
              </p>

              <p style={{ margin: 0 }}>
                Activitate principală: {COMPANY_INFO.activityCode} — {COMPANY_INFO.activity}
              </p>

              <p style={{ margin: 0 }}>
                Punct de lucru: {COMPANY_INFO.workPoint}
              </p>
            </div>

            <a href={CONTACT_PHONE_HREF} className="footer-btn call">
              📞 Sună acum
            </a>
          </div>

          <div className="footer-section legal-box">
            <h3>LEGAL</h3>

            <div
              style={{
                display: 'grid',
                gap: '10px'
              }}
            >
              <Link to="/confidentialitate" className="footer-legal-link">
                Politica de confidențialitate
              </Link>

              <Link to="/termeni" className="footer-legal-link">
                Termeni și condiții
              </Link>

              <Link to="/cookies" className="footer-legal-link">
                Cookies
              </Link>

              <a
                href={LEGAL_LINKS.anaf}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-legal-link"
              >
                ANAF
              </a>

              <a
                href={LEGAL_LINKS.anpc}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-legal-link"
              >
                ANPC
              </a>

              <a
                href={LEGAL_LINKS.sal}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-legal-link"
              >
                SAL — Reclamații consumatori
              </a>
            </div>
          </div>
        </div>

        <div
          className="footer-bottom-legal"
          style={{
            width: 'min(1300px, calc(100% - 32px))',
            margin: '34px auto 0',
            padding: '20px',
            borderTop: '1px solid rgba(212,175,55,.18)',
            borderBottom: '1px solid rgba(212,175,55,.12)',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}
        >
          <span
            style={{
              color: '#777',
              fontSize: '.82rem',
              lineHeight: 1.5
            }}
          >
            Informații fiscale și protecția consumatorilor disponibile prin platformele oficiale.
          </span>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}
          >
            <a
              href={LEGAL_LINKS.anaf}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#d4af37',
                textDecoration: 'none',
                fontWeight: 900,
                fontSize: '.78rem',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              Verifică ANAF
            </a>

            <a
              href={LEGAL_LINKS.sal}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#d4af37',
                textDecoration: 'none',
                fontWeight: 900,
                fontSize: '.78rem',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              Reclamații / SAL
            </a>
          </div>
        </div>

        <div className="footer-copyright">
          © 2026 {BRAND_NAME} — Pitești. Toate drepturile rezervate.
        </div>
      </footer>
    </div>
  );
}


function LegalLayout({ title, children }) {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-back-link">
          ← Înapoi acasă
        </Link>

        <h1>{title}</h1>

        <div className="legal-content">
          {children}
        </div>
      </div>
    </main>
  );
}

function PrivacyPage() {
  return (
    <LegalLayout title="Politica de confidențialitate">
      <p>
        {COMPANY_INFO.legalName} folosește datele transmise prin site doar pentru contact,
        programări și administrarea serviciilor oferite de {BRAND_NAME}.
      </p>

      <h2>Date colectate</h2>

      <p>
        Putem colecta numele, numărul de telefon, mesajul transmis, specialistul ales,
        serviciul, data și ora programării.
      </p>

      <h2>Scop</h2>

      <p>
        Datele sunt folosite pentru confirmarea programărilor, contactarea clientului
        și buna funcționare a salonului.
      </p>

      <h2>Contact</h2>

      <p>
        Pentru întrebări legate de date, ne poți contacta la {CONTACT_PHONE_DISPLAY}.
      </p>
    </LegalLayout>
  );
}

function TermsPage() {
  return (
    <LegalLayout title="Termeni și condiții">
      <p>
        Folosirea site-ului {BRAND_NAME} presupune acceptarea acestor termeni.
      </p>

      <h2>Programări</h2>

      <p>
        Programările trimise prin site ajung în agenda specialistului. Salonul poate contacta
        clientul pentru confirmare sau clarificări.
      </p>

      <h2>Prețuri</h2>

      <p>
        Prețurile afișate sunt informative. Pentru servicii personalizate, prețul final poate
        fi confirmat în salon.
      </p>

      <h2>Date firmă</h2>

      <p>
        {COMPANY_INFO.legalName}, CUI {COMPANY_INFO.cui}, CAEN {COMPANY_INFO.activityCode} — {COMPANY_INFO.activity}.
      </p>
    </LegalLayout>
  );
}

function CookiesPage() {
  return (
    <LegalLayout title="Politica de cookies">
      <p>
        Site-ul poate folosi tehnologii necesare funcționării normale, inclusiv pentru
        navigare și sesiunea de autentificare din panourile interne.
      </p>

      <h2>Cookies necesare</h2>

      <p>
        Acestea ajută site-ul să funcționeze corect și să păstreze sesiunea utilizatorului autentificat.
      </p>

      <h2>Control</h2>

      <p>
        Poți șterge sau bloca cookies din setările browserului.
      </p>
    </LegalLayout>
  );
}
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />

        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Home />} />

          <Route path="/frizer/:id" element={<BarberProfile />} />

          <Route path="/galerie" element={<GalleryPage />} />

          <Route path="/login" element={<Login />} />

          <Route path="/confidentialitate" element={<PrivacyPage />} />

          <Route path="/termeni" element={<TermsPage />} />

          <Route path="/cookies" element={<CookiesPage />} />

          {/* ADMIN / FRIZER */}
          <Route
            path="/admin/:id"
            element={
              <ProtectedRoute enforceBarber>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* BOSS / MASTER */}
          <Route
            path="/master"
            element={
              <ProtectedRoute requireAdmin>
                <MasterDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/master/mesaje"
            element={
              <ProtectedRoute requireAdmin>
                <MasterMessages />
              </ProtectedRoute>
            }
          />

          {/* REDIRECTURI VECHI */}
          <Route
            path="/mesaje"
            element={<Navigate to="/master/mesaje" replace />}
          />

          <Route
            path="/dashboard"
            element={<Navigate to="/master" replace />}
          />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

