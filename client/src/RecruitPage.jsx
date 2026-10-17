import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { setPageSeo } from './seo';
import './RecruitPage.css';

// Numărul de contact este cel deja publicat de salon. Mesajul solicită o discuție cu Dani.
const SALON_PHONE = '+40741844684';
const SALON_WHATSAPP = '40741844684';
const MESSAGE = [
  'Salut! Am văzut anunțul pentru scaunul liber la Gentleman’s Club Pitești.',
  'Sunt interesat(ă) de colaborare ca frizer și aș vrea să discut cu Dani.',
  'Mă numesc: ',
  'Experiența mea: '
].join('\n');
const WHATSAPP_URL = `https://wa.me/${SALON_WHATSAPP}?text=${encodeURIComponent(MESSAGE)}`;

const DISCUSSION_POINTS = [
  { index: '01', title: 'Cum lucrăm împreună', description: 'Stabilim direct forma și condițiile colaborării, fără promisiuni generale.' },
  { index: '02', title: 'Program și disponibilitate', description: 'Discutăm zilele și orele care funcționează pentru ambele părți.' },
  { index: '03', title: 'Stil și experiență', description: 'Ne poți povesti ce tunsori faci și ne poți arăta lucrări din portofoliul tău.' }
];

function RecruitPage() {
  useEffect(() => {
    setPageSeo({
      title: "Recrutare frizer Pitești | Un scaun liber la Gentleman's Club",
      description: "Un scaun liber la Gentleman's Club, Strada Victoriei nr. 38, Pitești. Vezi salonul și discută cu Dani despre o posibilă colaborare ca frizer.",
      path: '/recrutare',
      image: 'https://www.gentlemansclub.ro/hero-barber.png'
    });
  }, []);

  return (
    <main className="gc-careers">
      <div className="gc-careers__header">
        <Link to="/" className="gc-careers__brand">GENTLEMAN'S <span>CLUB</span></Link>
        <Link to="/" className="gc-careers__back">← Înapoi la salon</Link>
      </div>

      <section className="gc-careers__hero" aria-labelledby="gc-careers-title">
        <div className="gc-careers__image-wrap">
          <img className="gc-careers__hero-image" src="/hero-barber.png" alt="Interiorul salonului Gentleman's Club din Pitești" />
          <span className="gc-careers__image-mark">PITEȘTI · STR. VICTORIEI 38</span>
        </div>
        <div className="gc-careers__hero-content">
          <div className="gc-careers__eyebrow"><span className="gc-careers__dot" /> OPORTUNITATE DE COLABORARE</div>
          <h1 id="gc-careers-title">UN SCAUN LIBER.<br /><em>LOCUL TĂU ÎN ECHIPĂ.</em></h1>
          <p className="gc-careers__lead">La Gentleman's Club avem un loc disponibil pentru un frizer. Dacă vrei să afli cum ar fi să lucrezi alături de echipa noastră, hai să discutăm.</p>
          <div className="gc-careers__hero-buttons">
            <a className="gc-careers__primary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Discută cu Dani pe WhatsApp <span aria-hidden="true">↗</span></a>
            <a className="gc-careers__secondary" href={`tel:${SALON_PHONE}`}>Sună la salon <span aria-hidden="true">↗</span></a>
          </div>
          <p className="gc-careers__note">Mesajul ajunge la numărul de WhatsApp public al salonului. Cere să vorbești cu Dani despre colaborare.</p>
        </div>
      </section>

      <section className="gc-careers__details" aria-labelledby="gc-careers-details-title">
        <div className="gc-careers__details-title">
          <div className="gc-careers__eyebrow">CE AR FI BINE SĂ ȘTII</div>
          <h2 id="gc-careers-details-title">Ne cunoaștem.<br /><span>Discutăm detaliile.</span></h2>
          <p>Nu afișăm procente, chirie de scaun sau program fix înainte să stabilim condițiile reale ale colaborării.</p>
        </div>
        <div className="gc-careers__detail-grid">
          {DISCUSSION_POINTS.map((point) => (
            <article className="gc-careers__detail-card" key={point.index}>
              <span className="gc-careers__detail-number">{point.index}</span>
              <h3>{point.title}</h3>
              <p>{point.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="gc-careers__dani" aria-labelledby="gc-careers-dani-title">
        <div className="gc-careers__dani-visual">
          <img src="/dani-frizeru.png" loading="lazy" alt="Dani Frizeru, master barber la Gentleman's Club" />
        </div>
        <div className="gc-careers__dani-content">
          <div className="gc-careers__eyebrow">HAI SĂ VORBIM</div>
          <h2 id="gc-careers-dani-title">Vino să vezi<br /><span>salonul.</span></h2>
          <p>Ne găsești pe Strada Victoriei nr. 38, în Pitești. Poți începe cu un mesaj, un apel sau o vizită stabilită în prealabil.</p>
          <div className="gc-careers__location">PITEȘTI <span>•</span> VICTORIEI 38</div>
          <a className="gc-careers__primary" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Discută cu Dani <span aria-hidden="true">↗</span></a>
        </div>
      </section>

      <div className="gc-careers__closing">
        <span>GENTLEMAN'S CLUB · PITEȘTI</span>
        <p>UN SCAUN LIBER. O CONVERSAȚIE POATE FI ÎNCEPUTUL.</p>
        <Link to="/">Înapoi la pagina principală →</Link>
      </div>
    </main>
  );
}

export default RecruitPage;
