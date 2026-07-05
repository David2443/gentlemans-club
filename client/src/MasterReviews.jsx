import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPatch, apiDelete } from './api';
import { useAuth } from './AuthGate';
import './MasterReviews.css';

function MasterReviews() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);

    try {
      const query = status === 'all' ? '' : `?status=${status}`;
      const data = await apiGet(`/api/admin/reviews${query}`);

      setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
    } catch (err) {
      console.error('Eroare administrare recenzii:', err);

      if (err.status === 401 || err.status === 403) {
        await logout();
        navigate('/login', { replace: true });
        return;
      }

      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [status, logout, navigate]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const updateReview = async (reviewId, payload) => {
    setActionLoadingId(reviewId);

    try {
      const data = await apiPatch(`/api/admin/reviews/${reviewId}`, payload);
      const updated = data?.review;

      if (updated) {
        setReviews((prev) =>
          prev.map((review) => (review._id === reviewId ? updated : review))
        );
      }
    } catch (err) {
      console.error('Eroare update recenzie:', err);
      alert(err.message || 'Eroare la actualizarea recenziei.');
    } finally {
      setActionLoadingId('');
    }
  };

  const deleteReview = async (reviewId) => {
    const sigur = window.confirm('Ștergi definitiv această recenzie?');

    if (!sigur) return;

    setActionLoadingId(reviewId);

    try {
      await apiDelete(`/api/admin/reviews/${reviewId}`);

      setReviews((prev) =>
        prev.filter((review) => review._id !== reviewId)
      );
    } catch (err) {
      console.error('Eroare ștergere recenzie:', err);
      alert(err.message || 'Eroare la ștergerea recenziei.');
    } finally {
      setActionLoadingId('');
    }
  };

  const renderStars = (rating) => {
    const value = Math.max(1, Math.min(5, Number(rating) || 5));
    return '★'.repeat(value) + '☆'.repeat(5 - value);
  };

  return (
    <main className="master-reviews-page">
      <header className="master-reviews-header">
        <div>
          <button
            type="button"
            className="master-reviews-back"
            onClick={() => navigate('/master')}
          >
            ← Înapoi la dashboard
          </button>

          <h1>Administrare recenzii</h1>

          <p>
            Aici aprobi, ascunzi sau ștergi recenziile. Pe site apar doar cele aprobate.
          </p>
        </div>

        <button
          type="button"
          className="master-reviews-refresh"
          onClick={loadReviews}
          disabled={loading}
        >
          {loading ? 'Se încarcă...' : 'Reîncarcă'}
        </button>
      </header>

      <section className="master-reviews-filters">
        <button
          type="button"
          className={status === 'pending' ? 'active' : ''}
          onClick={() => setStatus('pending')}
        >
          În așteptare
        </button>

        <button
          type="button"
          className={status === 'active' ? 'active' : ''}
          onClick={() => setStatus('active')}
        >
          Aprobate
        </button>

        <button
          type="button"
          className={status === 'all' ? 'active' : ''}
          onClick={() => setStatus('all')}
        >
          Toate
        </button>
      </section>

      <section className="master-reviews-list">
        {loading ? (
          <div className="master-reviews-empty">Se încarcă recenziile...</div>
        ) : reviews.length === 0 ? (
          <div className="master-reviews-empty">
            Nu există recenzii pentru filtrul ales.
          </div>
        ) : (
          reviews.map((review) => (
            <article
              key={review._id}
              className={`master-review-card ${review.active ? 'approved' : 'pending'}`}
            >
              <div className="master-review-top">
                <div>
                  <span className="master-review-status">
                    {review.active ? 'Aprobată' : 'În așteptare'}
                  </span>

                  <h2>{review.name || 'Client'}</h2>
                </div>

                <strong>{renderStars(review.rating)}</strong>
              </div>

              <p>{review.text}</p>

              <div className="master-review-meta">
                <span>{review.dateLabel || 'Recent'}</span>
                <span>Ordine: {review.order ?? 99}</span>
              </div>

              <div className="master-review-actions">
                {!review.active ? (
                  <button
                    type="button"
                    className="approve"
                    disabled={actionLoadingId === review._id}
                    onClick={() => updateReview(review._id, { active: true })}
                  >
                    Aprobă
                  </button>
                ) : (
                  <button
                    type="button"
                    className="hide"
                    disabled={actionLoadingId === review._id}
                    onClick={() => updateReview(review._id, { active: false })}
                  >
                    Ascunde
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoadingId === review._id}
                  onClick={() => updateReview(review._id, { order: 1 })}
                >
                  Pune sus
                </button>

                <button
                  type="button"
                  className="delete"
                  disabled={actionLoadingId === review._id}
                  onClick={() => deleteReview(review._id)}
                >
                  Șterge
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default MasterReviews;