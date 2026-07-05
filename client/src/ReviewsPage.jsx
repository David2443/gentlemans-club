import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from './api';
import { setPageSeo } from './seo';
import './ReviewsPage.css';

const REVIEWS_LIMIT = 10;

function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    rating: 5,
    text: ''
  });

  useEffect(() => {
    setPageSeo({
      title: "Recenzii clienți | Gentleman's Club Pitești",
      description: 'Citește recenziile clienților Gentleman’s Club Pitești și lasă propria ta părere despre experiența la salon.',
      path: '/recenzii'
    });
  }, []);

  const loadReviews = async ({ pageToLoad = 1, replace = true } = {}) => {
    setLoading(true);

    try {
      const data = await apiGet(`/api/reviews?limit=${REVIEWS_LIMIT}&page=${pageToLoad}`);
      const list = Array.isArray(data?.reviews) ? data.reviews : [];

      setReviews((prev) => (replace ? list : [...prev, ...list]));
      setPage(pageToLoad);
      setHasMore(Boolean(data?.hasMore));
    } catch (err) {
      console.error('Eroare recenzii:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews({ pageToLoad: 1, replace: true });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.text.trim()) {
      setMessage('Completează numele și recenzia.');
      return;
    }

    if (form.text.trim().length < 10) {
      setMessage('Recenzia trebuie să aibă minim 10 caractere.');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      const data = await apiPost('/api/reviews', {
        name: form.name.trim(),
        rating: Number(form.rating),
        text: form.text.trim()
      });

      setMessage(data?.mesaj || 'Mulțumim! Recenzia ta va apărea după aprobare.');

      setForm({
        name: '',
        rating: 5,
        text: ''
      });
    } catch (err) {
      setMessage(err.message || 'Nu am putut trimite recenzia.');
    } finally {
      setSending(false);
    }
  };

  const renderStars = (rating) => {
    const value = Math.max(1, Math.min(5, Number(rating) || 5));
    return '★'.repeat(value) + '☆'.repeat(5 - value);
  };

  const averageRating = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + (Number(review.rating) || 5), 0) /
        reviews.length
      ).toFixed(1)
    : '5.0';

  return (
    <main className="reviews-page">
      <div className="reviews-bg-glow one"></div>
      <div className="reviews-bg-glow two"></div>

      <nav className="reviews-topbar">
        <Link to="/" className="reviews-home-btn">
          ← Acasă
        </Link>

        <a href="/#contact" className="reviews-book-btn">
          Programează-te
        </a>
      </nav>

      <section className="reviews-hero">
        <span className="reviews-eyebrow">Recenzii reale</span>

        <h1>Experiențele clienților Gentleman’s Club</h1>

        <p>
          Citește părerile clienților și lasă-ne o recenzie sinceră.
          Recenzia apare pe site doar după aprobare.
        </p>

        <div className="reviews-hero-stats">
          <article>
            <strong>{averageRating}</strong>
            <span>rating mediu</span>
          </article>

          <article>
            <strong>{reviews.length}</strong>
            <span>recenzii afișate</span>
          </article>

          <article>
            <strong>100%</strong>
            <span>moderate manual</span>
          </article>
        </div>
      </section>

      <section className="reviews-layout">
        <aside className="review-form-card">
          <span className="review-card-label">Lasă părerea ta</span>

          <h2>Scrie o recenzie</h2>

          <p className="review-form-intro">
            Spune-ne cum a fost experiența ta la salon. Nu afișăm poze de profil,
            doar numele, ratingul și mesajul.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="review-input-group">
              <label>Numele tău</label>
              <input
                type="text"
                placeholder="Ex: Andrei"
                value={form.name}
                maxLength="80"
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value
                  })
                }
              />
            </div>

            <div className="review-input-group">
              <label>Rating</label>
              <select
                value={form.rating}
                onChange={(e) =>
                  setForm({
                    ...form,
                    rating: e.target.value
                  })
                }
              >
                <option value="5">★★★★★ — Excelent</option>
                <option value="4">★★★★☆ — Foarte bine</option>
                <option value="3">★★★☆☆ — Ok</option>
                <option value="2">★★☆☆☆ — Slab</option>
                <option value="1">★☆☆☆☆ — Foarte slab</option>
              </select>
            </div>

            <div className="review-input-group">
              <label>Recenzia ta</label>
              <textarea
                rows="6"
                placeholder="Scrie experiența ta..."
                value={form.text}
                maxLength="700"
                onChange={(e) =>
                  setForm({
                    ...form,
                    text: e.target.value
                  })
                }
              />
            </div>

            <div className="review-form-bottom">
              <span>{form.text.length}/700</span>
            </div>

            {message && <p className="review-form-message">{message}</p>}

            <button type="submit" className="review-submit-btn" disabled={sending}>
              {sending ? 'SE TRIMITE...' : 'TRIMITE RECENZIA'}
            </button>
          </form>
        </aside>

        <section className="reviews-list-area">
          <div className="reviews-list-head">
            <div>
              <span className="review-card-label">Feedback clienți</span>
              <h2>Recenzii aprobate</h2>
            </div>

            <span className="reviews-count">{reviews.length} afișate</span>
          </div>

          <div className="reviews-list">
            {reviews.map((review, index) => (
              <article key={review._id || index} className="review-public-card">
                <div className="review-public-top">
                  <div>
                    <span className="review-verified">Client Gentleman’s Club</span>
                    <h3>{review.name || 'Client'}</h3>
                  </div>

                  <strong>{renderStars(review.rating)}</strong>
                </div>

                <p>“{review.text}”</p>

                <div className="review-public-footer">
                  <span>{review.dateLabel || 'Recent'}</span>
                  <span>Recenzie aprobată</span>
                </div>
              </article>
            ))}

            {!loading && reviews.length === 0 && (
              <div className="reviews-empty">
                <strong>Nu există recenzii aprobate momentan.</strong>
                <p>Fii primul care lasă o recenzie după vizita la salon.</p>
              </div>
            )}
          </div>

          {hasMore && (
            <button
              type="button"
              className="reviews-load-more"
              onClick={() =>
                loadReviews({
                  pageToLoad: page + 1,
                  replace: false
                })
              }
              disabled={loading}
            >
              {loading ? 'SE ÎNCARCĂ...' : 'ÎNCARCĂ MAI MULTE'}
            </button>
          )}
        </section>
      </section>
    </main>
  );
}

export default ReviewsPage;