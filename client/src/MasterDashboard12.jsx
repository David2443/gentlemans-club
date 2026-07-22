import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './MasterDashboard.css';
  
const API_BASE = 'http://localhost:5000';
const PAGE_LIMIT = 300;
const INITIAL_VISIBLE_COUNT = 80;

const BARBERS = [
  { value: 'all', label: 'Toți specialiștii', short: 'Toți' },
  { value: 'dani-frizeru', label: 'Dani Frizeru', short: 'Dani' },
  { value: 'flavius-frizeru', label: 'Flavius Frizeru', short: 'Flavius' },
  { value: 'alex-frizeru', label: 'Alex Frizeru', short: 'Alex' },
  { value: 'vali-frizeru', label: 'Vali Frizeru', short: 'Vali' },
  { value: 'pensat-precis', label: 'Pensat Precis', short: 'Pensat' }
];

const RANGE_OPTIONS = [
  { value: 'today', label: 'Azi' },
  { value: '7days', label: '7 zile' },
  { value: 'month', label: 'Luna asta' },
  { value: 'custom', label: 'Custom' },
  { value: 'all', label: 'Toate' }
];

const BLOCK_KEYWORDS = [
  'blocat',
  'pauza',
  'pauză',
  'concediu',
  'liber',
  'indisponibil',
  'vacanta',
  'vacanță'
];

const STATUS_LABELS = {
  noua: 'Nouă',
  confirmata: 'Confirmată',
  anulata: 'Anulată',
  finalizata: 'Finalizată',
  blocat: 'Blocat'
};

const getLocalDateString = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
};

const addDays = (date, days) => {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + days);
  return clone;
};

const getDateOnly = (dateString) => {
  if (!dateString) return new Date(0);

  const [y, m, d] = String(dateString).split('-').map(Number);
  const date = new Date(y || 1970, (m || 1) - 1, d || 1);

  date.setHours(0, 0, 0, 0);

  return date;
};

const parseAppointmentDate = (programare) => {
  const [y, m, d] = String(programare.data || '1970-01-01').split('-').map(Number);
  const [hh, mm] = String(programare.ora || '00:00').split(':').map(Number);

  return new Date(
    y || 1970,
    (m || 1) - 1,
    d || 1,
    hh || 0,
    mm || 0
  );
};

const formatDateRo = (dateString) => {
  if (!dateString) return 'Fără dată';

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

const formatMoney = (value) => {
  const numberValue = Number(value) || 0;
  return `${numberValue.toLocaleString('ro-RO')} LEI`;
};

const normalizeText = (value) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const findBarberByAppointment = (programare) => {
  if (!programare) return null;

  const barberId = String(programare.barberId || '').trim();
  const frizer = normalizeText(programare.frizer);

  return BARBERS.find((barber) => {
    if (barber.value === 'all') return false;

    return (
      barber.value === barberId ||
      normalizeText(barber.label) === frizer ||
      normalizeText(barber.short) === frizer
    );
  }) || null;
};

const getBarberDisplayName = (programare) => {
  const barber = findBarberByAppointment(programare);

  return barber ? barber.label : programare.frizer || 'N/A';
};

const getBarberShortName = (programare) => {
  const barber = findBarberByAppointment(programare);

  return barber ? barber.short : String(programare.frizer || 'N/A').split(' ')[0];
};

const getAgendaPath = (programareOrBarberId) => {
  if (typeof programareOrBarberId === 'string') {
    return `/admin/${programareOrBarberId}`;
  }

  const barber = findBarberByAppointment(programareOrBarberId);

  return barber ? `/admin/${barber.value}` : '/master';
};

const isBlockedEntry = (programare) => {
  if (!programare) return false;

  const tip = normalizeText(programare.tip);
  const status = normalizeText(programare.status);
  const type = normalizeText(programare.type);
  const category = normalizeText(programare.category);
  const serviciu = normalizeText(programare.serviciu);
  const numeClient = normalizeText(programare.nume_client);
  const mesaj = normalizeText(programare.mesaj);

  const fields = [tip, status, type, category, serviciu, numeClient, mesaj];

  return fields.some((field) =>
    BLOCK_KEYWORDS.some((keyword) => field.includes(normalizeText(keyword)))
  );
};

const getAppointmentAmount = (programare) => {
  if (!programare || isBlockedEntry(programare)) return 0;

  const numericValue = Number(programare.pretValoare);

  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue;
  }

  const match = String(programare.pret || '').match(/\d+/);

  return match ? Number(match[0]) : 0;
};

const appointmentMatchesRange = ({
  programare,
  activeRange,
  todayString,
  customStartDate,
  customEndDate
}) => {
  const today = getDateOnly(todayString);

  const sevenDaysEnd = new Date(today);
  sevenDaysEnd.setDate(sevenDaysEnd.getDate() + 7);

  const now = new Date();
  const lunaCurenta = now.getMonth();
  const anulCurent = now.getFullYear();

  let customStart = getDateOnly(customStartDate);
  let customEnd = getDateOnly(customEndDate);

  if (customStart > customEnd) {
    const temp = customStart;
    customStart = customEnd;
    customEnd = temp;
  }

  customEnd.setHours(23, 59, 59, 999);

  const date = getDateOnly(programare.data);

  if (activeRange === 'today') return programare.data === todayString;
  if (activeRange === '7days') return date >= today && date < sevenDaysEnd;

  if (activeRange === 'month') {
    return date.getMonth() === lunaCurenta && date.getFullYear() === anulCurent;
  }

  if (activeRange === 'custom') {
    return date >= customStart && date <= customEnd;
  }

  return true;
};

const getQueryDateRange = ({ activeRange, todayString, customStartDate, customEndDate }) => {
  const today = getDateOnly(todayString);

  if (activeRange === 'today') {
    return { from: todayString, to: todayString };
  }

  if (activeRange === '7days') {
    return {
      from: todayString,
      to: getLocalDateString(addDays(today, 6))
    };
  }

  if (activeRange === 'month') {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      from: getLocalDateString(first),
      to: getLocalDateString(last)
    };
  }

  if (activeRange === 'custom') {
    const start = getDateOnly(customStartDate);
    const end = getDateOnly(customEndDate);

    return start <= end
      ? { from: customStartDate, to: customEndDate }
      : { from: customEndDate, to: customStartDate };
  }

  return { from: '', to: '' };
};

const getStatusLabel = (status) => {
  return STATUS_LABELS[status || 'noua'] || status || 'Nouă';
};

const getStatusClass = (status) => {
  return `master-status-${status || 'noua'}`;
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

const hasValidClientPhone = (phone) => {
  const clean = String(phone || '').trim();

  return clean && clean !== 'N/A';
};

const makeWhatsAppLink = (programare) => {
  const phone = normalizePhoneForWhatsApp(programare.telefon);

  const text = [
    'Salut, te contactăm de la Gentleman’s Club pentru programarea ta.',
    `Specialist: ${getBarberDisplayName(programare)}`,
    programare.serviciu ? `Serviciu: ${programare.serviciu}` : '',
    programare.pret ? `Preț: ${programare.pret}` : '',
    `Data: ${programare.data}`,
    `Ora: ${programare.ora}`
  ]
    .filter(Boolean)
    .join('\n');

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
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
    <div className="mini-range-calendar">
      <div className="mini-calendar-top">
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

      <div className="mini-calendar-weekdays">
        {['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="mini-calendar-days">
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

      <div className="mini-calendar-footer">
        <span>{formatDateRo(startDate)} → {formatDateRo(endDate)}</span>
        <button type="button" onClick={resetToToday}>Azi</button>
      </div>
    </div>
  );
}

function MasterDashboard() {
  const navigate = useNavigate();

  const [allProgramari, setAllProgramari] = useState([]);
  const [messageCount, setMessageCount] = useState(0);
  const [totalFromServer, setTotalFromServer] = useState(0);
  const [serverHasMore, setServerHasMore] = useState(false);

  const [activeRange, setActiveRange] = useState('today');
  const [activeBarber, setActiveBarber] = useState('all');
  const [customStartDate, setCustomStartDate] = useState(getLocalDateString());
  const [customEndDate, setCustomEndDate] = useState(getLocalDateString());
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [visibleCanceledCount, setVisibleCanceledCount] = useState(40);

  const todayString = useMemo(() => getLocalDateString(), []);

  const verificaAcces = useCallback(() => {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (!token || !isAdmin) {
      navigate('/login');
      return null;
    }

    return token;
  }, [navigate]);

  const fetchMessageCount = useCallback(async (token) => {
    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      const data = await res.json();

      setMessageCount(Array.isArray(data) ? data.length : 0);
    } catch (err) {
      console.error('Eroare mesaje:', err);
      setMessageCount(0);
    }
  }, [navigate]);

  const fetchDashboard = useCallback(async () => {
    const token = verificaAcces();

    if (!token) return;

    setLoading(true);

    try {
      const { from, to } = getQueryDateRange({
        activeRange,
        todayString,
        customStartDate,
        customEndDate
      });

      const params = new URLSearchParams();
      params.set('limit', String(PAGE_LIMIT));

      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (activeBarber !== 'all') params.set('barberId', activeBarber);

      const res = await fetch(`${API_BASE}/api/programari?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        navigate('/login');
        return;
      }

      const data = await res.json();

      const programari = Array.isArray(data)
        ? data
        : data.programari || data.appointments || [];

      setAllProgramari(programari);
      setTotalFromServer(Array.isArray(data) ? programari.length : Number(data.total) || programari.length);
      setServerHasMore(Boolean(!Array.isArray(data) && data.hasMore));
      setVisibleCount(INITIAL_VISIBLE_COUNT);
      setVisibleCanceledCount(40);

      await fetchMessageCount(token);
    } catch (err) {
      console.error('Eroare dashboard:', err);
      setAllProgramari([]);
      setTotalFromServer(0);
      setServerHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [
    verificaAcces,
    navigate,
    fetchMessageCount,
    activeRange,
    activeBarber,
    todayString,
    customStartDate,
    customEndDate
  ]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const baseFilteredByRangeAndBarber = useCallback((list) => {
    let result = list.filter((programare) => {
      return appointmentMatchesRange({
        programare,
        activeRange,
        todayString,
        customStartDate,
        customEndDate
      });
    });

    if (activeBarber !== 'all') {
      result = result.filter((programare) => {
        const barber = findBarberByAppointment(programare);
        return barber?.value === activeBarber;
      });
    }

    const normalizedSearch = normalizeText(searchTerm);

    if (normalizedSearch) {
      result = result.filter((programare) => {
        const haystack = normalizeText([
          programare.nume_client,
          programare.telefon,
          programare.serviciu,
          programare.pret,
          programare.mesaj,
          getBarberDisplayName(programare),
          programare.status
        ].filter(Boolean).join(' '));

        return haystack.includes(normalizedSearch);
      });
    }

    return result;
  }, [activeRange, activeBarber, todayString, customStartDate, customEndDate, searchTerm]);

  const programariReale = useMemo(() => {
    return allProgramari.filter((programare) => {
      return !isBlockedEntry(programare) && programare.status !== 'anulata';
    });
  }, [allProgramari]);

  const programariAnulate = useMemo(() => {
    return allProgramari.filter((programare) => {
      return !isBlockedEntry(programare) && programare.status === 'anulata';
    });
  }, [allProgramari]);

  const blocariAscunse = useMemo(() => {
    return allProgramari.filter((programare) => isBlockedEntry(programare));
  }, [allProgramari]);

  const programariFiltrate = useMemo(() => {
    return baseFilteredByRangeAndBarber(programariReale)
      .sort((a, b) => parseAppointmentDate(a) - parseAppointmentDate(b));
  }, [programariReale, baseFilteredByRangeAndBarber]);

  const anulateFiltrate = useMemo(() => {
    return baseFilteredByRangeAndBarber(programariAnulate)
      .sort((a, b) => parseAppointmentDate(b) - parseAppointmentDate(a));
  }, [programariAnulate, baseFilteredByRangeAndBarber]);

  const blocariAscunseFiltrate = useMemo(() => {
    return baseFilteredByRangeAndBarber(blocariAscunse);
  }, [blocariAscunse, baseFilteredByRangeAndBarber]);

  const programariAfisate = useMemo(() => {
    return programariFiltrate.slice(0, visibleCount);
  }, [programariFiltrate, visibleCount]);

  const anulateAfisate = useMemo(() => {
    return anulateFiltrate.slice(0, visibleCanceledCount);
  }, [anulateFiltrate, visibleCanceledCount]);

  const stats = useMemo(() => {
    const frizeriCount = {};
    const finalizate = programariFiltrate.filter((programare) => programare.status === 'finalizata');
    const incasariFinalizate = finalizate.reduce((sum, programare) => sum + getAppointmentAmount(programare), 0);
    const valoareProgramariActive = programariFiltrate.reduce((sum, programare) => sum + getAppointmentAmount(programare), 0);

    programariFiltrate.forEach((programare) => {
      const frizerName = getBarberDisplayName(programare);
      frizeriCount[frizerName] = (frizeriCount[frizerName] || 0) + 1;
    });

    const top = Object.entries(frizeriCount).sort((a, b) => b[1] - a[1]);

    return {
      total: programariFiltrate.length,
      topFrizer: top.length ? top[0][0] : 'N/A',
      blocari: blocariAscunseFiltrate.length,
      anulate: anulateFiltrate.length,
      finalizate: finalizate.length,
      incasariFinalizate,
      valoareProgramariActive
    };
  }, [programariFiltrate, blocariAscunseFiltrate, anulateFiltrate]);

  const rangeLabel = useMemo(() => {
    if (activeRange === 'custom') {
      return `${formatDateRo(customStartDate)} - ${formatDateRo(customEndDate)}`;
    }

    return RANGE_OPTIONS.find((range) => range.value === activeRange)?.label || 'Programări';
  }, [activeRange, customStartDate, customEndDate]);

  const activeBarberLabel = useMemo(() => {
    return BARBERS.find((barber) => barber.value === activeBarber)?.label || 'Toți specialiștii';
  }, [activeBarber]);

  const handleStatusProgramare = async (programare, status) => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    if (!programare?._id) {
      alert('Programarea nu are ID valid.');
      return;
    }

    if (status === 'anulata') {
      const sigur = window.confirm('Anulezi programarea? Ea NU va fi ștearsă, o găsești jos la „Programări anulate” și o poți pune înapoi.');
      if (!sigur) return;
    }

    setStatusLoadingId(programare._id);

    try {
      const res = await fetch(`${API_BASE}/api/programari/${programare._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.mesaj || 'Nu am putut actualiza statusul.');
        return;
      }

      setAllProgramari((prev) =>
        prev.map((item) => item._id === programare._id ? data.programare : item)
      );
    } catch (err) {
      console.error('Eroare status:', err);
      alert('Eroare server la actualizare status.');
    } finally {
      setStatusLoadingId('');
    }
  };

  const handleDeleteProgramare = async (programare) => {
    const sigur = window.confirm('Ștergere definitivă? Folosește asta doar pentru curățenie, nu pentru anulare normală.');

    if (!sigur) return;

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${API_BASE}/api/programari/${programare._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        alert('Nu am putut șterge programarea.');
        return;
      }

      setAllProgramari((prev) => prev.filter((p) => p._id !== programare._id));
    } catch (err) {
      console.error('Eroare ștergere:', err);
      alert('Eroare server la ștergere.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const renderAppointmentActions = (programare, { canceled = false } = {}) => {
    if (canceled) {
      return (
        <>
          <button
            disabled={statusLoadingId === programare._id}
            onClick={() => handleStatusProgramare(programare, 'noua')}
          >
            Pune înapoi
          </button>

          <button
            disabled={statusLoadingId === programare._id}
            onClick={() => navigate(getAgendaPath(programare))}
          >
            Agenda
          </button>

          <button
            className="hard-delete"
            disabled={statusLoadingId === programare._id}
            onClick={() => handleDeleteProgramare(programare)}
          >
            Șterge definitiv
          </button>
        </>
      );
    }

    return (
      <>
        {hasValidClientPhone(programare.telefon) && (
          <>
            <a href={`tel:${programare.telefon}`} className="call">
              Sună
            </a>

            <a
              href={makeWhatsAppLink(programare)}
              target="_blank"
              rel="noopener noreferrer"
              className="whatsapp"
            >
              WhatsApp
            </a>
          </>
        )}

        <button onClick={() => navigate(getAgendaPath(programare))}>
          Agenda
        </button>

        {programare.status !== 'confirmata' && (
          <button
            disabled={statusLoadingId === programare._id}
            onClick={() => handleStatusProgramare(programare, 'confirmata')}
          >
            Confirmă
          </button>
        )}

        {programare.status !== 'finalizata' && (
          <button
            disabled={statusLoadingId === programare._id}
            onClick={() => handleStatusProgramare(programare, 'finalizata')}
          >
            Finalizează
          </button>
        )}

        <button
          className="delete"
          disabled={statusLoadingId === programare._id}
          onClick={() => handleStatusProgramare(programare, 'anulata')}
        >
          Anulează
        </button>
      </>
    );
  };

  const renderDesktopTable = ({ items, canceled = false }) => {
    return (
      <table className={`custom-table master-programari-table ${canceled ? 'canceled-table' : ''}`}>
        <thead>
          <tr>
            <th>Client</th>
            <th>Specialist</th>
            <th>Serviciu</th>
            <th>Data & ora</th>
            <th>Telefon</th>
            <th>Status</th>
            <th>Bani</th>
            <th>Mesaj</th>
            <th>Acțiuni</th>
          </tr>
        </thead>

        <tbody>
          {items.map((programare, idx) => (
            <tr key={programare._id || idx}>
              <td className="fw-bold">
                {programare.nume_client || 'Fără nume'}
              </td>

              <td>
                <span className="barber-pill">
                  {getBarberShortName(programare)}
                </span>
              </td>

              <td>
                <div className="master-service-cell">
                  <strong>{programare.serviciu || 'Neselectat'}</strong>
                  <span>{programare.pret || 'Fără preț'}</span>
                </div>
              </td>

              <td>
                {formatDateRo(programare.data)} / {programare.ora || 'N/A'}
              </td>

              <td>
                {hasValidClientPhone(programare.telefon) ? (
                  <a href={`tel:${programare.telefon}`}>{programare.telefon}</a>
                ) : (
                  'N/A'
                )}
              </td>

              <td>
                <span className={`master-status-pill ${getStatusClass(programare.status)}`}>
                  {getStatusLabel(programare.status)}
                </span>
              </td>

              <td className="money-cell">
                {formatMoney(getAppointmentAmount(programare))}
              </td>

              <td>
                {programare.mesaj?.trim() || 'Fără mesaj'}
              </td>

              <td>
                <div className="table-actions master-actions">
                  {renderAppointmentActions(programare, { canceled })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderMobileCards = ({ items, canceled = false }) => {
    return items.map((programare, idx) => (
      <article
        key={programare._id || idx}
        className={`appointment-mobile master-mobile-card ${canceled ? 'canceled-card' : ''}`}
      >
        <div className="appointment-top">
          <div>
            <span>{formatDateRo(programare.data)} · {programare.ora || 'N/A'}</span>
            <h3>{programare.nume_client || 'Fără nume'}</h3>
          </div>

          <strong>{getBarberShortName(programare)}</strong>
        </div>

        <div className="master-mobile-service">
          <span>Serviciu</span>
          <strong>{programare.serviciu || 'Neselectat'}</strong>
          <em>{programare.pret || 'Fără preț'} · {formatMoney(getAppointmentAmount(programare))}</em>
        </div>

        <span className={`master-status-pill ${getStatusClass(programare.status)}`}>
          {getStatusLabel(programare.status)}
        </span>

        {hasValidClientPhone(programare.telefon) && (
          <a href={`tel:${programare.telefon}`} className="mobile-phone">
            📞 {programare.telefon}
          </a>
        )}

        <p>{programare.mesaj?.trim() || 'Fără mesaj de la client.'}</p>

        <div className="mobile-actions master-mobile-actions">
          {renderAppointmentActions(programare, { canceled })}
        </div>
      </article>
    ));
  };

  return (
    <div className="master-wrapper">
      <button
        className="floating-messages-btn"
        onClick={() => navigate('/master/mesaje')}
      >
        {messageCount > 0 && (
          <span className="floating-message-badge">
            {messageCount > 99 ? '99+' : messageCount}
          </span>
        )}

        <span>💬</span>
      </button>

      <aside className={`master-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>
            GENTLEMAN <span>MASTER</span>
          </h2>

          <button
            type="button"
            className="btn-close-sidebar"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">📊 Dashboard</button>

          {BARBERS.filter((barber) => barber.value !== 'all').map((barber) => (
            <button
              key={barber.value}
              className="nav-item"
              onClick={() => navigate(getAgendaPath(barber.value))}
            >
              ✂️ Agenda {barber.short}
            </button>
          ))}

          <button className="nav-item" onClick={() => navigate('/master/mesaje')}>
            💬 Mesaje{messageCount > 0 ? ` (${messageCount})` : ''}
          </button>

          <div className="divider"></div>

          <button className="nav-item logout" onClick={handleLogout}>
            ⏻ Deconectare
          </button>
        </nav>
      </aside>

      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>}

      <main className="master-content">
        <header className="content-header">
          <div className="header-left">
            {!menuOpen && (
              <button className="burger-btn" onClick={() => setMenuOpen(true)}>
                ☰
              </button>
            )}

            <div>
              <h1>Panou Master</h1>

              <p className="master-subtitle">
                {rangeLabel} · {activeBarberLabel}
              </p>
            </div>
          </div>

          <div className="user-info">
            <button
              type="button"
              className="master-refresh-btn"
              onClick={fetchDashboard}
              disabled={loading}
            >
              {loading ? 'Se încarcă...' : 'Reîncarcă'}
            </button>

            <span>👋 Salut, Master Admin</span>
          </div>
        </header>

        <section className="master-filters smart-filters">
          <div className="range-buttons">
            {RANGE_OPTIONS.map((range) => (
              <button
                key={range.value}
                type="button"
                className={activeRange === range.value ? 'active' : ''}
                onClick={() => setActiveRange(range.value)}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="barber-filter">
            <select value={activeBarber} onChange={(e) => setActiveBarber(e.target.value)}>
              {BARBERS.map((barber) => (
                <option key={barber.value} value={barber.value}>
                  {barber.label}
                </option>
              ))}
            </select>
          </div>

          <div className="master-search-filter">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Caută client, telefon, serviciu..."
            />
          </div>

          {activeRange === 'custom' && (
            <div className="custom-date-filter custom-date-smart">
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
        </section>

        {serverHasMore && (
          <div className="server-limit-warning">
            Se afișează primele {PAGE_LIMIT} din {totalFromServer} programări pentru filtrul ales. Folosește o perioadă mai mică sau un specialist anume ca să se încarce rapid.
          </div>
        )}

        <section className="stats-grid smart-stats-grid">
          <div className="stat-card gold">
            <h3>Încasați</h3>
            <p className="stat-value money-stat">{formatMoney(stats.incasariFinalizate)}</p>
            <span className="stat-note">doar programări finalizate</span>
          </div>

          <div className="stat-card">
            <h3>Programări active</h3>
            <p className="stat-value">{stats.total}</p>
            <span className="stat-note">valoare: {formatMoney(stats.valoareProgramariActive)}</span>
          </div>

          <div className="stat-card">
            <h3>Finalizate</h3>
            <p className="stat-value">{stats.finalizate}</p>
            <span className="stat-note">contează la bani făcuți</span>
          </div>

          <div className="stat-card">
            <h3>Anulate</h3>
            <p className="stat-value">{stats.anulate}</p>
            <span className="stat-note">se pot pune înapoi</span>
          </div>
        </section>

        <section className="recent-section">
          <div className="section-header">
            <div>
              <h3>Programări active</h3>

              <p className="section-subtitle">
                Anularea NU șterge programarea. O mută jos la „Programări anulate”.
              </p>
            </div>

            <span className="task-count">
              {programariFiltrate.length} rezultate
            </span>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="empty-state">Se încarcă programările...</div>
            ) : programariFiltrate.length === 0 ? (
              <div className="empty-state">Nu există programări reale pentru filtrul ales.</div>
            ) : (
              renderDesktopTable({ items: programariAfisate })
            )}
          </div>

          <div className="mobile-list">
            {loading ? (
              <div className="empty-state">Se încarcă programările...</div>
            ) : programariFiltrate.length === 0 ? (
              <div className="empty-state">Nu există programări reale pentru filtrul ales.</div>
            ) : (
              renderMobileCards({ items: programariAfisate })
            )}
          </div>

          {programariFiltrate.length > visibleCount && (
            <div className="load-more-wrap">
              <button
                type="button"
                className="load-more-btn"
                onClick={() => setVisibleCount((prev) => prev + INITIAL_VISIBLE_COUNT)}
              >
                Încarcă încă {Math.min(INITIAL_VISIBLE_COUNT, programariFiltrate.length - visibleCount)}
              </button>
            </div>
          )}
        </section>

        <section className="recent-section canceled-section">
          <div className="section-header">
            <div>
              <h3>Programări anulate</h3>

              <p className="section-subtitle">
                Aici vezi ce ai anulat și poți apăsa „Pune înapoi” dacă a fost greșeală.
              </p>
            </div>

            <span className="task-count canceled-count">
              {anulateFiltrate.length} anulate
            </span>
          </div>

          <div className="table-container">
            {loading ? (
              <div className="empty-state">Se încarcă programările anulate...</div>
            ) : anulateFiltrate.length === 0 ? (
              <div className="empty-state">Nu ai programări anulate pentru filtrul ales.</div>
            ) : (
              renderDesktopTable({ items: anulateAfisate, canceled: true })
            )}
          </div>

          <div className="mobile-list">
            {loading ? (
              <div className="empty-state">Se încarcă programările anulate...</div>
            ) : anulateFiltrate.length === 0 ? (
              <div className="empty-state">Nu ai programări anulate pentru filtrul ales.</div>
            ) : (
              renderMobileCards({ items: anulateAfisate, canceled: true })
            )}
          </div>

          {anulateFiltrate.length > visibleCanceledCount && (
            <div className="load-more-wrap">
              <button
                type="button"
                className="load-more-btn"
                onClick={() => setVisibleCanceledCount((prev) => prev + 40)}
              >
                Încarcă anulatele următoare
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default MasterDashboard;
