import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './CookieConsent.css';

const COOKIE_STORAGE_KEY = 'gc_cookie_consent';

function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const savedChoice = localStorage.getItem(COOKIE_STORAGE_KEY);

    if (!savedChoice) {
      setVisible(true);
    }
  }, []);

  const saveChoice = (choice) => {
    localStorage.setItem(COOKIE_STORAGE_KEY, choice);
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="cookie-consent">
      <div className="cookie-consent-content">
        <div>
          <strong>Folosim cookies</strong>

          <p>
            Folosim cookies necesare pentru funcționarea site-ului și pentru experiența de navigare.
            Poți accepta sau refuza cookies opționale.
          </p>

          <Link to="/cookies" className="cookie-link">
            Citește politica de cookies
          </Link>
        </div>

        <div className="cookie-actions">
          <button
            type="button"
            className="cookie-btn secondary"
            onClick={() => saveChoice('rejected')}
          >
            Refuz
          </button>

          <button
            type="button"
            className="cookie-btn primary"
            onClick={() => saveChoice('accepted')}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;