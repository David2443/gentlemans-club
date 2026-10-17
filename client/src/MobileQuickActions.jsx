import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './MobileQuickActions.css';

// Numarul public al salonului (acelasi folosit in App.jsx si pe pagina de recrutare).
const SALON_PHONE = '+40741844684';
const SALON_WHATSAPP = '40741844684';
const WHATSAPP_MESSAGE = 'Salut! Aș dori să fac o programare la Gentleman’s Club Pitești. Mă puteți ajuta, vă rog?';
const WHATSAPP_LINK = `https://wa.me/${SALON_WHATSAPP}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const scrollToSection = (element) => {
  if (!element) return;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
};

const isInternalRoute = (pathname) =>
  pathname === '/login' ||
  pathname === '/master' ||
  pathname.startsWith('/master/') ||
  pathname === '/dashboard' ||
  pathname === '/mesaje' ||
  pathname === '/admin' ||
  pathname.startsWith('/admin/');

function MobileQuickActions() {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const [keyboardInputFocused, setKeyboardInputFocused] = useState(false);

  // Nu acoperim campurile de introducere atunci cand apare tastatura de mobil.
  useEffect(() => {
    const updateFocus = () => {
      const focusedElement = document.activeElement;
      setKeyboardInputFocused(Boolean(
        focusedElement?.matches?.('input:not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable="true"]')
      ));
    };

    document.addEventListener('focusin', updateFocus);
    document.addEventListener('focusout', updateFocus);
    return () => {
      document.removeEventListener('focusin', updateFocus);
      document.removeEventListener('focusout', updateFocus);
    };
  }, []);

  const visible = !isInternalRoute(pathname) && !keyboardInputFocused;

  // Lasam loc sub continut pentru bara fixa si pentru zona de gesturi de pe telefon.
  useEffect(() => {
    document.body.classList.toggle('gc-mobile-actionbar-active', visible);
    return () => document.body.classList.remove('gc-mobile-actionbar-active');
  }, [visible]);

  // Cand venim de pe alta pagina la /#echipa, facem scroll dupa randarea homepage-ului.
  useEffect(() => {
    if (pathname !== '/' || hash !== '#echipa') return;
    const timer = window.setTimeout(() => {
      scrollToSection(document.getElementById('echipa'));
    }, 100);
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);

  const goToBooking = () => {
    if (pathname.startsWith('/frizer/')) {
      const bookingForm = document.querySelector('.booking-card-supreme');
      if (bookingForm) {
        scrollToSection(bookingForm);
        return;
      }
    }

    if (pathname === '/') {
      const team = document.getElementById('echipa');
      if (team) {
        scrollToSection(team);
        return;
      }
    }

    navigate({ pathname: '/', hash: '#echipa' });
  };

  if (!visible) return null;

  return (
    <nav className="gc-mobile-actionbar" aria-label="Acțiuni rapide Gentleman’s Club">
      <button
        type="button"
        className="gc-mobile-actionbar__book"
        onClick={goToBooking}
        aria-label="Programează-te online"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M7.5 3v4M16.5 3v4M3.5 10h17M8 15l2.2 2 4-4" />
        </svg>
        <span>Programează-te</span>
      </button>
      <a className="gc-mobile-actionbar__secondary" href={`tel:${SALON_PHONE}`} aria-label="Sună la salon">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16.4v3a2 2 0 0 1-2.2 2A18.4 18.4 0 0 1 2.6 5.2 2 2 0 0 1 4.6 3h3A2 2 0 0 1 9.6 4.7l.6 3a2 2 0 0 1-.6 1.8L8 11.1a15 15 0 0 0 4.9 4.9l1.6-1.6a2 2 0 0 1 1.8-.6l3 .6A2 2 0 0 1 21 16.4Z" />
        </svg>
        <span>Sună</span>
      </a>
      <a
        className="gc-mobile-actionbar__secondary"
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Scrie pe WhatsApp salonului"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5.2 18.4 3.6 21l3.8-1.1a9 9 0 1 0-2.2-1.5Z" />
          <path d="M8.4 8.2c.4-.3.8-.2 1 .2l.8 1.6c.1.3 0 .6-.3.9l-.5.5a8 8 0 0 0 3.3 3.3l.5-.5c.3-.3.6-.4.9-.2l1.6.8c.4.2.5.6.2 1a2.3 2.3 0 0 1-2.4 1.2 9 9 0 0 1-6.3-6.3 2.3 2.3 0 0 1 1.2-2.4Z" />
        </svg>
        <span>WhatsApp</span>
      </a>
    </nav>
  );
}

export default MobileQuickActions;
