import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthGate';
import { apiGet, apiDelete } from './api';
import './MasterMessages.css';

const INITIAL_VISIBLE_COUNT = 60;

const BARBERS = [
  {
    value: 'dani-frizeru',
    label: 'Dani Frizeru',
    short: 'Dani',
    path: '/admin/dani-frizeru'
  },
  {
    value: 'flavius-frizeru',
    label: 'Flavius Frizeru',
    short: 'Flavius',
    path: '/admin/flavius-frizeru'
  },
  {
    value: 'alex-frizeru',
    label: 'Alex Frizeru',
    short: 'Alex',
    path: '/admin/alex-frizeru'
  },
  {
    value: 'vali-frizeru',
    label: 'Vali Frizeru',
    short: 'Vali',
    path: '/admin/vali-frizeru'
  },
  {
    value: 'pensat-precis',
    label: 'Pensat Precis',
    short: 'Pensat',
    path: '/admin/pensat-precis'
  }
];

const RANGE_OPTIONS = [
  { value: 'all', label: 'Toate' },
  { value: 'today', label: 'Azi' },
  { value: '7days', label: '7 zile' },
  { value: 'month', label: 'Luna asta' },
  { value: 'custom', label: 'Custom' }
];

const MESSAGE_FILTERS = [
  { value: 'all', label: 'Toate mesajele' },
  { value: 'withPhone', label: 'Cu telefon' },
  { value: 'withoutPhone', label: 'Fără telefon' },
  { value: 'urgent', label: 'Posibil urgent' }
];

const URGENT_KEYWORDS = [
  'azi',
  'acum',
  'urgent',
  'repede',
  'mâine',
  'maine',
  'programare',
  'liber',
  'disponibil',
  'ora',
  'tuns',
  'barba',
  'barbă'
];

const getField = (item, keys, fallback = '') => {
  for (const key of keys) {
    const value = item?.[key];

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  return fallback;
};

const getBackendId = (message) => {
  return message?._id || message?.id || message?.messageId || null;
};

const getLocalId = (message) => {
  return message?.__localId || getBackendId(message);
};

const getName = (message) => {
  return getField(
    message,
    ['nume', 'name', 'fullName', 'nume_client', 'clientName'],
    'Client necunoscut'
  );
};

const getPhone = (message) => {
  return getField(message, ['telefon', 'phone', 'tel', 'clientPhone'], '');
};

const getMessageText = (message) => {
  return getField(
    message,
    ['mesaj', 'message', 'text', 'continut', 'content'],
    'Fără mesaj.'
  );
};

const getRawDate = (message) => {
  return getField(
    message,
    ['createdAt', 'updatedAt', 'data', 'date', 'timestamp'],
    ''
  );
};

const parseDate = (message) => {
  const raw = getRawDate(message);
  const date = raw ? new Date(raw) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const getLocalDateString = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
};

const getDateOnly = (dateInput) => {
  if (!dateInput) return new Date(0);

  if (dateInput instanceof Date) {
    const date = new Date(dateInput);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const [y, m, d] = String(dateInput).split('-').map(Number);
  const date = new Date(y || 1970, (m || 1) - 1, d || 1);

  date.setHours(0, 0, 0, 0);

  return date;
};

const addDays = (date, days) => {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + days);
  return clone;
};

const formatDate = (message) => {
  const date = parseDate(message);

  if (!date) {
    return 'Dată necunoscută';
  }

  return date.toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (message) => {
  const date = parseDate(message);

  if (!date) {
    return '--:--';
  }

  return date.toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
const formatRelativeDate = (message) => {
  const date = parseDate(message);

  if (!date) {
    return 'Dată necunoscută';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Chiar acum';
  if (diffMinutes < 60) return `Acum ${diffMinutes} min`;
  if (diffHours < 24) return `Acum ${diffHours} ore`;
  if (diffDays === 1) return 'Ieri';
  if (diffDays < 7) return `Acum ${diffDays} zile`;

  return formatDate(message);
};

const isLast24Hours = (message) => {
  const date = parseDate(message);

  if (!date) return false;

  return Date.now() - date.getTime() <= 24 * 60 * 60 * 1000;
};

const formatDateRoFromString = (dateString) => {
  if (!dateString) return 'N/A';

  try {
    return getDateOnly(dateString).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const isToday = (message) => {
  const date = parseDate(message);

  if (!date) {
    return false;
  }

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const normalizeText = (value) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const isUrgentMessage = (message) => {
  const text = normalizeText(`${getName(message)} ${getPhone(message)} ${getMessageText(message)}`);

  return URGENT_KEYWORDS.some((keyword) => text.includes(normalizeText(keyword)));
};

const getInitials = (name) => {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'C';
};

const normalizePhoneForWhatsApp = (phone) => {
  const clean = String(phone || '').replace(/\s+/g, '');

  if (!clean || clean === 'N/A') return '';

  if (clean.startsWith('+40')) {
    return clean.replace('+', '');
  }

  if (clean.startsWith('07')) {
    return `4${clean}`;
  }

  if (clean.startsWith('40')) {
    return clean;
  }

  return clean.replace('+', '');
};

const makeWhatsAppLink = (message) => {
  const phone = normalizePhoneForWhatsApp(getPhone(message));

  const text = [
    'Salut, te contactăm de la Gentleman’s Club.',
    `Am primit mesajul tău: "${getMessageText(message)}"`
  ].join('\n');

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};

const messageMatchesRange = ({
  message,
  activeRange,
  customStartDate,
  customEndDate
}) => {
  const date = parseDate(message);

  if (!date) return activeRange === 'all';

  const current = getDateOnly(date);
  const today = getDateOnly(new Date());

  if (activeRange === 'today') {
    return isToday(message);
  }

  if (activeRange === '7days') {
    const end = getDateOnly(addDays(today, 6));
    return current >= today && current <= end;
  }

  if (activeRange === 'month') {
    const now = new Date();
    return current.getMonth() === now.getMonth() && current.getFullYear() === now.getFullYear();
  }

  if (activeRange === 'custom') {
    let start = getDateOnly(customStartDate);
    let end = getDateOnly(customEndDate);

    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    return current >= start && current <= end;
  }

  return true;
};

function MiniRangeCalendar({ startDate, endDate, onChange }) {
  const [viewDate, setViewDate] = useState(() => getDateOnly(startDate || getLocalDateString()));

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list = [];

    for (let i = 0; i < startOffset; i++) {
      list.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);

      list.push({
        day,
        fullDate: getLocalDateString(date)
      });
    }

    return list;
  }, [viewDate]);

  const isInRange = (dateString) => {
    if (!dateString || !startDate || !endDate) return false;

    let start = getDateOnly(startDate);
    let end = getDateOnly(endDate);
    const current = getDateOnly(dateString);

    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    return current >= start && current <= end;
  };

  const selectDate = (dateString) => {
    if (!dateString) return;

    if (!startDate || (startDate && endDate && startDate !== endDate)) {
      onChange(dateString, dateString);
      return;
    }

    const start = getDateOnly(startDate);
    const clicked = getDateOnly(dateString);

    if (clicked < start) {
      onChange(dateString, startDate);
      return;
    }

    onChange(startDate, dateString);
  };

  const resetToToday = () => {
    const today = getLocalDateString();
    setViewDate(getDateOnly(today));
    onChange(today, today);
  };

  return (
    <div className="messages-mini-calendar">
      <div className="messages-mini-calendar-top">
        <button
          type="button"
          onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
        >
          ‹
        </button>

        <strong>
          {viewDate.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
        </strong>

        <button
          type="button"
          onClick={() => setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
        >
          ›
        </button>
      </div>

      <div className="messages-mini-weekdays">
        {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="messages-mini-days">
        {days.map((item, index) => (
          <button
            key={item?.fullDate || `empty-${index}`}
            type="button"
            disabled={!item}
            className={`
              ${!item ? 'empty' : ''}
              ${item?.fullDate === startDate ? 'start' : ''}
              ${item?.fullDate === endDate ? 'end' : ''}
              ${item && isInRange(item.fullDate) ? 'in-range' : ''}
            `}
            onClick={() => item && selectDate(item.fullDate)}
          >
            {item?.day || ''}
          </button>
        ))}
      </div>

      <div className="messages-mini-footer">
        <span>{formatDateRoFromString(startDate)} → {formatDateRoFromString(endDate)}</span>
        <button type="button" onClick={resetToToday}>Azi</button>
      </div>
    </div>
  );
}

function MessageDetails({
  message,
  copied,
  deletingId,
  onCopy,
  onDelete,
  compact = false
}) {
  if (!message) {
    return (
      <div className="message-detail-empty">
        <span>💬</span>
        <h2>Selectează un mesaj</h2>
        <p>Alege un mesaj din listă ca să vezi detaliile clientului.</p>
      </div>
    );
  }

  const localId = getLocalId(message);
  const phone = getPhone(message);
  const urgent = isUrgentMessage(message);

  return (
    <>
      <div className={`message-detail-head ${compact ? 'compact' : ''}`}>
        <div className="detail-client-main">
          <span className={`detail-avatar ${urgent ? 'urgent' : ''}`}>
            {getInitials(getName(message))}
          </span>

          <div>
            <span className="detail-kicker">
              {urgent ? 'Mesaj posibil urgent' : 'Mesaj client'}
            </span>

            <h2>{getName(message)}</h2>

            <p>
              {formatDate(message)} · {formatTime(message)}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-delete-message"
          onClick={() => onDelete(message)}
          disabled={deletingId === localId}
        >
          {deletingId === localId ? 'Se șterge...' : 'Șterge'}
        </button>
      </div>

      <div className="detail-contact-grid no-email">
        <article>
          <span>Telefon</span>

          {phone ? (
            <a href={`tel:${phone}`}>
              {phone}
            </a>
          ) : (
            <strong>N/A</strong>
          )}
        </article>

        <article>
          <span>Status</span>
          <strong>{urgent ? 'Posibil urgent' : 'Normal'}</strong>
        </article>
      </div>

      <div className="message-text-box">
        <span>Mesaj</span>
        <p>{getMessageText(message)}</p>
      </div>

      <div className="message-detail-actions">
        {phone && (
          <a
            href={makeWhatsAppLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-message-whatsapp"
          >
            WhatsApp
          </a>
        )}

        <button
          type="button"
          className="btn-message-copy"
          onClick={onCopy}
        >
          {copied ? 'Copiat!' : 'Copiază mesajul'}
        </button>
      </div>
    </>
  );
}

function MasterMessages() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortMode, setSortMode] = useState('newest');
  const [activeRange, setActiveRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState(getLocalDateString());
  const [customEndDate, setCustomEndDate] = useState(getLocalDateString());

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const selectedMessage = useMemo(() => {
    return messages.find((message) => getLocalId(message) === selectedId) || null;
  }, [messages, selectedId]);

  

const fetchMessages = useCallback(async () => {
  setLoading(true);
  setError('');

  try {
    const data = await apiGet('/api/contact');

    const rawList = Array.isArray(data)
      ? data
      : Array.isArray(data?.messages)
        ? data.messages
        : Array.isArray(data?.data)
          ? data.data
          : [];

    const normalizedList = rawList.map((message, index) => ({
      ...message,
      __localId: getBackendId(message) || `local-message-${index}`
    }));

    setMessages(normalizedList);

    setSelectedId((prev) => {
      if (prev && normalizedList.some((message) => getLocalId(message) === prev)) {
        return prev;
      }

      return normalizedList[0] ? getLocalId(normalizedList[0]) : null;
    });
  } catch (err) {
    console.error('Eroare mesaje:', err);

    if (err.status === 401 || err.status === 403) {
      await logout();
      navigate('/login', { replace: true });
      return;
    }

    setError(err.message || 'A apărut o eroare.');
    setMessages([]);
    setSelectedId(null);
  } finally {
    setLoading(false);
  }
}, [logout, navigate]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const shouldLock = mobileMenuOpen || mobileDetailOpen;

    document.body.style.overflow = shouldLock ? 'hidden' : 'auto';

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen, mobileDetailOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key !== 'Escape') return;

      setMobileMenuOpen(false);
      setMobileDetailOpen(false);
      setShowMobileFilters(false);
    };

    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

const stats = useMemo(() => {
  const total = messages.length;
  const today = messages.filter(isToday).length;
  const last24h = messages.filter(isLast24Hours).length;
  const withPhone = messages.filter((message) => getPhone(message)).length;
  const withoutPhone = messages.filter((message) => !getPhone(message)).length;
  const urgent = messages.filter(isUrgentMessage).length;
  const normal = Math.max(total - urgent, 0);

  const latest = [...messages]
    .sort((a, b) => (parseDate(b)?.getTime() || 0) - (parseDate(a)?.getTime() || 0))[0];

  const phoneRate = total > 0
    ? Math.round((withPhone / total) * 100)
    : 0;

  return {
    total,
    today,
    last24h,
    withPhone,
    withoutPhone,
    urgent,
    normal,
    phoneRate,
    latestTime: latest ? `${formatRelativeDate(latest)} · ${formatTime(latest)}` : 'N/A',
    latestClient: latest ? getName(latest) : 'N/A'
  };
}, [messages]);

  const filteredMessages = useMemo(() => {
    const searchValue = normalizeText(search);

    let result = messages.filter((message) => {
      return messageMatchesRange({
        message,
        activeRange,
        customStartDate,
        customEndDate
      });
    });

    if (searchValue) {
      result = result.filter((message) => {
        const searchable = normalizeText([
          getName(message),
          getPhone(message),
          getMessageText(message),
          formatDate(message)
        ].join(' '));

        return searchable.includes(searchValue);
      });
    }

    if (filter === 'withPhone') {
      result = result.filter((message) => getPhone(message));
    }

    if (filter === 'withoutPhone') {
      result = result.filter((message) => !getPhone(message));
    }

    if (filter === 'urgent') {
      result = result.filter(isUrgentMessage);
    }

    result.sort((a, b) => {
      const dateA = parseDate(a)?.getTime() || 0;
      const dateB = parseDate(b)?.getTime() || 0;

      if (sortMode === 'oldest') {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

    return result;
  }, [
    messages,
    search,
    filter,
    sortMode,
    activeRange,
    customStartDate,
    customEndDate
  ]);

  const visibleMessages = useMemo(() => {
    return filteredMessages.slice(0, visibleCount);
  }, [filteredMessages, visibleCount]);
  const hasActiveFilters = useMemo(() => {
  return (
    search.trim() !== '' ||
    filter !== 'all' ||
    sortMode !== 'newest' ||
    activeRange !== 'all'
  );
}, [search, filter, sortMode, activeRange]);

const applyMobileFilters = () => {
  setShowMobileFilters(false);
};

  const handleSelect = (message) => {
    setSelectedId(getLocalId(message));
    setCopied(false);

    if (window.innerWidth <= 980) {
      setMobileDetailOpen(true);
      setShowMobileFilters(false);
      setMobileMenuOpen(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!selectedMessage) {
      return;
    }

    const text = [
      `Client: ${getName(selectedMessage)}`,
      `Telefon: ${getPhone(selectedMessage) || 'N/A'}`,
      `Data: ${formatDate(selectedMessage)} ${formatTime(selectedMessage)}`,
      '',
      getMessageText(selectedMessage)
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1400);
    } catch {
      alert('Nu am putut copia mesajul.');
    }
  };

const handleDelete = async (message) => {
  const backendId = getBackendId(message);
  const localId = getLocalId(message);

  if (!backendId) {
    alert('Mesajul nu are ID valid pentru ștergere.');
    return;
  }

  const confirmDelete = window.confirm('Sigur vrei să ștergi acest mesaj?');

  if (!confirmDelete) {
    return;
  }

  setDeletingId(localId);

  try {
    await apiDelete(`/api/contact/${backendId}`);

    const nextMessages = messages.filter((item) => getLocalId(item) !== localId);

    setMessages(nextMessages);

    if (selectedId === localId) {
      setSelectedId(nextMessages[0] ? getLocalId(nextMessages[0]) : null);
    }

    setMobileDetailOpen(false);
  } catch (err) {
    console.error('Eroare ștergere mesaj:', err);
    alert(err.message || 'Eroare la ștergere.');
  } finally {
    setDeletingId(null);
  }
};

  const clearFilters = () => {
    setSearch('');
    setFilter('all');
    setSortMode('newest');
    setActiveRange('all');
    setCustomStartDate(getLocalDateString());
    setCustomEndDate(getLocalDateString());
    setVisibleCount(INITIAL_VISIBLE_COUNT);
    setShowMobileFilters(false);
  };

const handleLogout = async () => {
  await logout();
  navigate('/login', { replace: true });
};

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const goTo = (path) => {
    setMobileMenuOpen(false);
    setMobileDetailOpen(false);
    navigate(path);
  };

  return (
    <main className="master-messages-page">
      <nav className="mobile-messages-topbar">
        <button
          type="button"
          className={`mobile-burger-btn ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Deschide meniul"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="mobile-top-title">
          <span>Gentleman</span>
          <strong>Mesaje</strong>
        </div>

        <div className="mobile-top-actions">
         <button
  type="button"
  onClick={fetchMessages}
  aria-label="Reîncarcă mesajele"
>
            ↻
          </button>

         <button
  type="button"
  className={`mobile-filter-toggle ${showMobileFilters ? 'active' : ''} ${hasActiveFilters ? 'has-active-filters' : ''}`}
  onClick={() => {
    setShowMobileFilters((prev) => !prev);
    setMobileMenuOpen(false);
  }}
  aria-label="Deschide filtrele"
>
  <span>Filtre</span>
</button>
        </div>
      </nav>

      <button
  type="button"
  className={`mobile-floating-filter-btn ${showMobileFilters ? 'active' : ''} ${hasActiveFilters ? 'has-active-filters' : ''}`}
  onClick={() => {
    setShowMobileFilters((prev) => !prev);
    setMobileMenuOpen(false);
  }}
  aria-label="Deschide filtrele"
>
  <span>Filtre</span>
</button>

{showMobileFilters && (
  <button
    type="button"
    className="mobile-filters-backdrop"
    onClick={() => setShowMobileFilters(false)}
    aria-label="Închide filtrele"
  ></button>
)}

      <div
        className={`mobile-menu-backdrop ${mobileMenuOpen ? 'show' : ''}`}
        onClick={closeMobileMenu}
      ></div>

      <aside className={`mobile-menu-drawer ${mobileMenuOpen ? 'show' : ''}`}>
        <div className="mobile-drawer-head">
          <div>
            <span>Gentleman</span>
            <strong>Admin Menu</strong>
          </div>

          <button type="button" onClick={closeMobileMenu}>
            ✕
          </button>
        </div>

        <div className="mobile-drawer-stats">
          <article>
            <span>Mesaje</span>
            <strong>{stats.total}</strong>
          </article>

          <article>
            <span>Azi</span>
            <strong>{stats.today}</strong>
          </article>
        </div>

        <nav className="mobile-drawer-nav">
          <button type="button" onClick={() => goTo('/master')}>
            <span>🏠</span>
            Dashboard
          </button>

          <button type="button" onClick={() => goTo('/master/mesaje')}>
            <span>💬</span>
            Mesaje
          </button>

          {BARBERS.map((barber) => (
            <button
              key={barber.value}
              type="button"
              onClick={() => goTo(barber.path)}
            >
              <span>{barber.short.slice(0, 2)}</span>
              Agenda {barber.short}
            </button>
          ))}
        </nav>

        <button type="button" className="mobile-drawer-logout" onClick={handleLogout}>
          Deconectare
        </button>
      </aside>

      <div className="messages-bg-glow one"></div>
      <div className="messages-bg-glow two"></div>

      <aside className="messages-sidebar">
        <div className="messages-brand">
          <span>Gentleman</span>
          <strong>Messages</strong>
        </div>

        <nav className="messages-nav">
          <button type="button" onClick={() => navigate('/master')}>
            ← Dashboard
          </button>

          {BARBERS.map((barber) => (
            <button
              key={barber.value}
              type="button"
              onClick={() => navigate(barber.path)}
            >
              Agenda {barber.short}
            </button>
          ))}
        </nav>

        <button type="button" className="messages-logout" onClick={handleLogout}>
          Deconectare
        </button>
      </aside>

      <section className="messages-content">
        <header className="messages-header">
          <div>
            <span className="messages-kicker">Inbox clienți</span>
            <h1>Mesaje primite</h1>
            <p>
              Vezi rapid mesajele, filtrează după perioadă, caută clienți și răspunde direct pe WhatsApp.
            </p>
          </div>

          <div className="messages-header-actions">
            <button
  type="button"
  className="btn-refresh-messages"
  onClick={fetchMessages}
>
              {loading ? 'Se încarcă...' : '↻ Reîncarcă'}
            </button>

            <button
              type="button"
              className="btn-back-master"
              onClick={() => navigate('/master')}
            >
              Dashboard
            </button>
          </div>
        </header>

       <section className="messages-stats-grid messages-stats-grid-bomba">
  <article className="message-stat-card gold">
    <span>Inbox total</span>
    <strong>{stats.total}</strong>
    <small>mesaje primite</small>
  </article>

  <article className="message-stat-card">
    <span>Ultimele 24h</span>
    <strong>{stats.last24h}</strong>
    <small>activitate recentă</small>
  </article>

  <article className="message-stat-card success">
    <span>Răspuns rapid</span>
    <strong>{stats.phoneRate}%</strong>
    <small>{stats.withPhone} mesaje cu telefon</small>
  </article>

  <article className="message-stat-card danger">
    <span>Necesită atenție</span>
    <strong>{stats.urgent}</strong>
    <small>posibil urgente</small>
  </article>
</section>

        <section className="messages-insight-strip messages-insight-strip-bomba">
  <article>
    <span>Ultimul client</span>
    <strong>{stats.latestClient}</strong>
  </article>

  <article>
    <span>Ultimul mesaj</span>
    <strong>{stats.latestTime}</strong>
  </article>

  <article>
    <span>Fără telefon</span>
    <strong>{stats.withoutPhone}</strong>
  </article>

  <article>
    <span>Rezultate filtrate</span>
    <strong>{filteredMessages.length}</strong>
  </article>
</section>

        <section className={`messages-toolbar messages-toolbar-bomba ${showMobileFilters ? 'mobile-open' : ''}`}>
          <div className="messages-filter-field messages-range-filter">
            <label>Perioadă</label>

            <select value={activeRange} onChange={(e) => setActiveRange(e.target.value)}>
              {RANGE_OPTIONS.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div className="messages-filter-field messages-type-filter">
            <label>Tip</label>

            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              {MESSAGE_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="messages-filter-field messages-sort-filter">
            <label>Ordine</label>

            <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
              <option value="newest">Cele mai noi</option>
              <option value="oldest">Cele mai vechi</option>
            </select>
          </div>

          <div className="messages-filter-field messages-search-bomba">
            <label>Caută</label>

            <input
              type="text"
              value={search}
              placeholder="Caută nume, telefon sau mesaj..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {activeRange === 'custom' && (
  <div className="messages-custom-calendar-wrap">
    <MiniRangeCalendar
      startDate={customStartDate}
      endDate={customEndDate}
      onChange={(start, end) => {
        setCustomStartDate(start);
        setCustomEndDate(end);
      }}
    />
  </div>
)}

<div className="messages-filter-actions">
  <button
    type="button"
    className="btn-clear-mobile-filters"
    onClick={clearFilters}
    disabled={!hasActiveFilters}
  >
    Scoate filtrul
  </button>

  <button
    type="button"
    className="btn-apply-mobile-filters"
    onClick={applyMobileFilters}
  >
    Aplică filtrele
  </button>
</div>
</section>

        {error && (
          <div className="messages-error">
            {error}
          </div>
        )}

        <section className="messages-main-grid messages-main-grid-bomba">
          <div className="messages-list-panel">
            <div className="messages-list-head">
              <div>
                <h2>Inbox</h2>
                <p>{filteredMessages.length} rezultate</p>
              </div>

              {(search || filter !== 'all' || sortMode !== 'newest' || activeRange !== 'all') && (
                <button type="button" onClick={clearFilters}>
                  Curăță
                </button>
              )}
            </div>

            <div className="messages-list">
              {loading ? (
                <div className="messages-empty-state">
                  Se încarcă mesajele...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="messages-empty-state">
                  Nu există mesaje pentru filtrul ales.
                </div>
              ) : (
                visibleMessages.map((message) => {
                  const localId = getLocalId(message);
                  const active = selectedId === localId;
                  const name = getName(message);
                  const phone = getPhone(message);
                  const text = getMessageText(message);
                  const urgent = isUrgentMessage(message);

                  return (
                    <button
                      key={localId}
                      type="button"
                      className={`message-list-card message-list-card-bomba ${active ? 'active' : ''} ${urgent ? 'urgent' : ''}`}
                      onClick={() => handleSelect(message)}
                    >
                      <span className={`message-avatar ${urgent ? 'urgent' : ''}`}>
                        {getInitials(name)}
                      </span>

                      <span className="message-card-content">
                        <span className="message-card-top">
                          <strong>{name}</strong>
                          <em>{formatTime(message)}</em>
                        </span>

                        <span className="message-card-meta">
                          {phone || 'Fără telefon'} · {formatDate(message)}
                        </span>

                        <span className="message-card-preview">
                          {text}
                        </span>

                        {urgent && (
                          <span className="message-urgent-pill">
                            Posibil urgent
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {filteredMessages.length > visibleCount && (
              <div className="messages-load-more-wrap">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + INITIAL_VISIBLE_COUNT)}
                >
                  Încarcă încă {Math.min(INITIAL_VISIBLE_COUNT, filteredMessages.length - visibleCount)}
                </button>
              </div>
            )}
          </div>

          <div className="message-detail-panel desktop-detail-panel message-detail-panel-bomba">
            <MessageDetails
              message={selectedMessage}
              copied={copied}
              deletingId={deletingId}
              onCopy={handleCopyMessage}
              onDelete={handleDelete}
            />
          </div>
        </section>
      </section>

      {mobileDetailOpen && selectedMessage && (
        <div className="mobile-message-modal-layer">
          <button
            type="button"
            className="mobile-message-modal-backdrop"
            onClick={() => setMobileDetailOpen(false)}
            aria-label="Închide mesajul"
          ></button>

          <section className="mobile-message-modal">
            <div className="mobile-modal-grabber"></div>

            <div className="mobile-modal-top">
              <div>
                <span>Detalii mesaj</span>
                <strong>{getName(selectedMessage)}</strong>
              </div>

              <button
                type="button"
                onClick={() => setMobileDetailOpen(false)}
                aria-label="Închide popup"
              >
                ✕
              </button>
            </div>

            <MessageDetails
              message={selectedMessage}
              copied={copied}
              deletingId={deletingId}
              onCopy={handleCopyMessage}
              onDelete={handleDelete}
              compact
            />
          </section>
        </div>
      )}
    </main>
  );
}

export default MasterMessages;