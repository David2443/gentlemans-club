import React, { useEffect, useState } from 'react';
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
        name: form.name,
        rating: Number(form.rating),
        text: form.text
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
    const value = Number(rating) || 5;
    return '★'.repeat(value) + '☆'.repeat(5 - value);
  };

  return (
    <main className="reviews-page">
      <section className="reviews-hero">
        <span className="reviews-eyebrow">Recenzii clienți</span>

        <h1>Ce spun clienții despre Gentleman’s Club</h1>

        <p>
          Lasă-ne o recenzie sinceră. Recenzia va apărea pe site după aprobare.
        </p>
      </section>

      <section className="reviews-layout">
        <form className="review-form-card" onSubmit={handleSubmit}>
          <h2>Lasă o recenzie</h2>

          <div className="review-input-group">
            <label>Numele tău</label>
            <input
              type="text"
              placeholder="Ex: Andrei"
              value={form.name}
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
              <option value="5">5 stele</option>
              <option value="4">4 stele</option>
              <option value="3">3 stele</option>
              <option value="2">2 stele</option>
              <option value="1">1 stea</option>
            </select>
          </div>

          <div className="review-input-group">
            <label>Recenzia ta</label>
            <textarea
              rows="5"
              placeholder="Scrie experiența ta..."
              value={form.text}
              onChange={(e) =>
                setForm({
                  ...form,
                  text: e.target.value
                })
              }
            />
          </div>

          {message && <p className="review-form-message">{message}</p>}

          <button type="submit" className="review-submit-btn" disabled={sending}>
            {sending ? 'SE TRIMITE...' : 'TRIMITE RECENZIA'}
          </button>
        </form>

        <div className="reviews-list-area">
          <div className="reviews-list-head">
            <h2>Recenzii aprobate</h2>
            <span>{reviews.length} afișate</span>
          </div>

          <div className="reviews-list">
            {reviews.map((review) => (
              <article key={review._id} className="review-public-card">
                <div className="review-public-top">
                  <strong>{review.name}</strong>
                  <span>{renderStars(review.rating)}</span>
                </div>

                <p>{review.text}</p>

                <small>{review.dateLabel || 'Recent'}</small>
              </article>
            ))}

            {!loading && reviews.length === 0 && (
              <p className="reviews-empty">
                Nu există recenzii aprobate momentan.
              </p>
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
        </div>
      </section>
    </main>
  );
}

export default ReviewsPage;