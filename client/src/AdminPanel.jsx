import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthGate';
import { apiGet, apiPost, apiPatch, apiDelete, getApiBase } from './api';
import './AdminPanel.css';


const API_BASE = getApiBase();

const ORE_PROGRAM = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00'
];

const BARBERS = [
  { id: 'dani-frizeru', label: 'Dani Frizeru', short: 'Dani' },
  { id: 'flavius-frizeru', label: 'Flavius Frizeru', short: 'Flavius' },
  { id: 'alex-frizeru', label: 'Alex Frizeru', short: 'Alex' },
  { id: 'vali-frizeru', label: 'Vali Frizeru', short: 'Vali' },
  { id: 'pensat-precis', label: 'Pensat Precis', short: 'Pensat' }
];

const BARBER_SERVICES = [
  { id: 'tuns', name: 'Tuns', price: 50 },
  { id: 'tuns-barba', name: 'Tuns + barbă', price: 75 },
  { id: 'barba', name: 'Barbă', price: 30 },
  { id: 'vopsit-barba', name: 'Vopsit barbă', price: 30 },
  { id: 'spalat', name: 'Spălat', price: 25 },
  { id: 'contur-barba', name: 'Contur / aranjat barbă', price: 30 },
  { id: 'styling', name: 'Styling', price: null },
  { id: 'pachet-vip', name: 'Pachet VIP', price: 200 }
];

const BROW_SERVICES = [
  { id: 'pensat', name: 'Pensat', price: 35 },
  { id: 'pensat-vopsit', name: 'Pensat + vopsit', price: 50 },
  { id: 'pensat-par-nas', name: 'Pensat + păr nas', price: 45 },
  { id: 'tratament-facial', name: 'Tratament facial', price: 50 },
  { id: 'pachet-complet', name: 'Pachet complet', price: 100 },
  { id: 'suvite', name: 'Șuvițe', price: 300 },
  { id: 'global-o-culoare', name: 'Global / total — o culoare', price: 300 },
  { id: 'global-model', name: 'Global / total — model', price: 400 }
];

const getLocalDateString = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
};

const formatPrice = (price) => {
  if (price === null || price === undefined || price === '') {
    return 'LA SALON';
  }

  return `${price} LEI`;
};
const getAppointmentPriceLabel = (programare) => {
  if (!programare || isBlockedEntry(programare)) return '';

  if (programare.pret) {
    return programare.pret;
  }

  if (programare.pretValoare !== null && programare.pretValoare !== undefined) {
    return formatPrice(programare.pretValoare);
  }

  return 'Fără preț';
};

const getServiceIdFromAppointment = (programare, services) => {
  const serviciu = normalizeText(programare?.serviciu);

  const found = services.find((service) => {
    return normalizeText(service.name) === serviciu;
  });

  return found?.id || '';
};

const normalizeText = (value) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
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

const normalizeStatus = (status) => {
  if (status === 'finalizata') return 'confirmata';
  return status || 'noua';
};

const getStatusLabel = (status) => {
  const value = normalizeStatus(status);

  const labels = {
    noua: 'Nouă',
    confirmata: 'Confirmată',
    anulata: 'Anulată',
    blocat: 'Blocat'
  };

  return labels[value] || value;
};

const getStatusClass = (status) => {
  return `status-${normalizeStatus(status)}`;
};

const isBlockedEntry = (programare) => {
  if (!programare) return false;

  return (
    programare.tip === 'blocat' ||
    programare.status === 'blocat' ||
    normalizeText(programare.nume_client).includes('blocat') ||
    normalizeText(programare.nume_client).includes('pauza') ||
    normalizeText(programare.nume_client).includes('pauză') ||
    normalizeText(programare.nume_client).includes('concediu') ||
    normalizeText(programare.nume_client).includes('liber')
  );
};

function AdminPanel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const galleryFileInputRef = useRef(null);
  const { user, isAdmin, logout } = useAuth();

  const currentBarber = useMemo(() => {
  const fromUrl = BARBERS.find((barber) => barber.id === id);

  if (fromUrl) return fromUrl;

  const fromUser = BARBERS.find((barber) => barber.id === user?.barberId);

  return fromUser || BARBERS[0];
}, [id, user?.barberId]);

  const serviceOptions = useMemo(() => {
    return currentBarber.id === 'pensat-precis' ? BROW_SERVICES : BARBER_SERVICES;
  }, [currentBarber.id]);

  const [programari, setProgramari] = useState([]);
  const [isBoss, setIsBoss] = useState(false);
  const [loading, setLoading] = useState(false);

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(getLocalDateString());

  const [galerie, setGalerie] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [modalDeschis, setModalDeschis] = useState(false);
  const [oraActiva, setOraActiva] = useState('');

  const [formRezervare, setFormRezervare] = useState({
    nume: '',
    telefon: '',
    serviciuId: '',
    mesaj: ''
  });const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
const [activeAppointment, setActiveAppointment] = useState(null);

const [editAppointmentForm, setEditAppointmentForm] = useState({
  nume: '',
  telefon: '',
  serviciuId: '',
  data: '',
  ora: '',
  mesaj: ''
});


  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: '',
    data: null,
    title: '',
    message: ''
  });

  const sameBarber = useCallback((programare) => {
    if (!programare) return false;

    const appointmentBarberId = programare.barberId;
    const appointmentFrizer = programare.frizer;

    return (
      appointmentBarberId === currentBarber.id ||
      normalizeText(appointmentFrizer) === normalizeText(currentBarber.label)
    );
  }, [currentBarber]);

  const selectedService = useMemo(() => {
    return serviceOptions.find((service) => service.id === formRezervare.serviciuId) || null;
  }, [serviceOptions, formRezervare.serviciuId]);
  const selectedEditService = useMemo(() => {
  return serviceOptions.find((service) => service.id === editAppointmentForm.serviciuId) || null;
}, [serviceOptions, editAppointmentForm.serviciuId]);

  const selectedDayProgramari = useMemo(() => {
    return programari
      .filter((programare) => {
        return (
          programare.data === selectedDay &&
          sameBarber(programare) &&
          programare.status !== 'anulata'
        );
      })
      .sort((a, b) => String(a.ora || '').localeCompare(String(b.ora || '')));
  }, [programari, selectedDay, sameBarber]);

  const areBlocajeActive = useMemo(() => {
    return selectedDayProgramari.some((programare) => isBlockedEntry(programare));
  }, [selectedDayProgramari]);

  useEffect(() => {
  setIsBoss(isAdmin);
}, [isAdmin]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

 const fetchData = useCallback(async () => {
  setLoading(true);

  try {
    const data = await apiGet('/api/programari');

    const programariList = Array.isArray(data)
      ? data
      : Array.isArray(data?.programari)
        ? data.programari
        : Array.isArray(data?.appointments)
          ? data.appointments
          : [];

    setProgramari(programariList);
  } catch (err) {
    console.error('Eroare fetch programari:', err);

    if (err.status === 401 || err.status === 403) {
      await logout();
      navigate('/login', { replace: true });
      return;
    }

    setProgramari([]);
  } finally {
    setLoading(false);
  }
}, [logout, navigate]);

  const fetchGalerie = useCallback(async () => {
  try {
    const data = await apiGet(
      `/api/galerie/${encodeURIComponent(currentBarber.id)}`
    );

    const galleryList = Array.isArray(data)
      ? data
      : Array.isArray(data?.poze)
        ? data.poze
        : Array.isArray(data?.galerie)
          ? data.galerie
          : [];

    setGalerie(galleryList);
  } catch (err) {
    console.error('Eroare fetch galerie:', err);
    setGalerie([]);
  }
}, [currentBarber.id]);

  useEffect(() => {
    fetchData();
    fetchGalerie();
  }, [fetchData, fetchGalerie]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith('image/')
    );

    if (!files.length) return;

    const fisiereLimitate = files.slice(0, 12);

    setSelectedFiles(fisiereLimitate);

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setPreviewUrl(URL.createObjectURL(fisiereLimitate[0]));
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setPreviewUrl(null);

    if (galleryFileInputRef.current) {
      galleryFileInputRef.current.value = '';
    }
  };

const handleAddPhoto = async () => {
  if (!selectedFiles.length) {
    return alert('Alege cel puțin o poză!');
  }

  const formData = new FormData();

  selectedFiles.forEach((file) => {
    formData.append('images', file);
  });

  formData.append('barberId', currentBarber.id);
  formData.append('frizer', currentBarber.label);

  setLoading(true);

  try {
    await apiPost('/api/galerie/upload', formData);

    clearSelectedFiles();
    await fetchGalerie();
  } catch (err) {
    console.error('Eroare upload:', err);
    alert(err.message || 'Eroare server la upload.');
  } finally {
    setLoading(false);
  }
};

const handleDeletePhoto = async (photoId) => {
  try {
    await apiDelete(`/api/galerie/${photoId}`);
    await fetchGalerie();
  } catch (err) {
    console.error('Eroare ștergere poză:', err);
    alert(err.message || 'Eroare la ștergerea imaginii.');
  }
};

  const changeMonth = (offset) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const generateSquareCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      const hasApps = programari.some((p) =>
        p.data === dateStr &&
        sameBarber(p) &&
        p.status !== 'anulata'
      );

      days.push({
        day: d,
        fullDate: dateStr,
        hasApps
      });
    }

    return days;
  };

  const deschideActiune = (ora, app) => {
    if (app) {
      const blocked = isBlockedEntry(app);

      setConfirmModal({
        isOpen: true,
        type: 'delete',
        data: app,
        title: blocked ? 'ȘTERGE BLOCĂRI' : 'ANULEAZĂ PROGRAMARE',
        message: blocked
          ? 'Ești sigur că vrei să ștergi această pauză / blocare?'
          : `Ești sigur că vrei să anulezi programarea lui ${app.nume_client}? Programarea nu va fi ștearsă definitiv, va trece la anulate.`
      });

      return;
    }

    setOraActiva(ora);
    setFormRezervare({
      nume: '',
      telefon: '',
      serviciuId: '',
      mesaj: ''
    });
    setModalDeschis(true);
  };

  const handleBlockDayRequest = () => {
    setConfirmModal({
      isOpen: true,
      type: 'block_day',
      data: null,
      title: 'BLOCHEAZĂ ZIUA',
      message: `Vrei să blochezi toate orele rămase libere pentru ${currentBarber.label} în data de ${selectedDay}?`
    });
  };

  const handleUnblockDayRequest = () => {
    setConfirmModal({
      isOpen: true,
      type: 'unblock_day',
      data: null,
      title: 'DEBLOCHEAZĂ ZIUA',
      message: `Vrei să deblochezi toate orele blocate manual pentru ${currentBarber.label} în data de ${selectedDay}?`
    });
  };

const updateStatus = async (programare, status) => {
  if (!programare?._id) {
    return alert('Programarea nu are ID valid.');
  }

  try {
    const data = await apiPatch(`/api/programari/${programare._id}/status`, {
      status
    });

    setProgramari((prev) =>
      prev.map((item) =>
        item._id === programare._id
          ? data.programare || { ...item, status }
          : item
      )
    );
  } catch (err) {
    console.error('Eroare status:', err);
    alert(err.message || 'Eroare server la status.');
  }
};

 const executeConfirmAction = async () => {
  setLoading(true);

  try {
    if (confirmModal.type === 'delete') {
      const appointment = confirmModal.data;

      if (!appointment?._id) {
        alert('Programarea nu are ID valid.');
        return;
      }

      if (isBlockedEntry(appointment)) {
        await apiDelete(`/api/programari/${appointment._id}`);
      } else {
        await apiPatch(`/api/programari/${appointment._id}/status`, {
          status: 'anulata'
        });
      }
    }

    if (confirmModal.type === 'block_day') {
      const oreLibere = ORE_PROGRAM.filter((ora) => {
        const esteOcupat = programari.some((p) =>
          p.data === selectedDay &&
          p.ora === ora &&
          sameBarber(p) &&
          p.status !== 'anulata'
        );

        return !esteOcupat;
      });

      await Promise.all(
        oreLibere.map((ora) =>
          apiPost('/api/programari', {
            barberId: currentBarber.id,
            frizer: currentBarber.label,
            data: selectedDay,
            ora,
            tip: 'blocat',
            nume_client: 'CONCEDIU / LIBER',
            telefon: 'N/A',
            mesaj: 'Zi blocată din panoul specialistului'
          })
        )
      );
    }

    if (confirmModal.type === 'unblock_day') {
      const programariBlocate = programari.filter((p) =>
        p.data === selectedDay &&
        sameBarber(p) &&
        isBlockedEntry(p)
      );

      await Promise.all(
        programariBlocate.map((p) =>
          apiDelete(`/api/programari/${p._id}`)
        )
      );
    }

    await fetchData();
  } catch (err) {
    console.error('Eroare confirm action:', err);
    alert(err.message || 'Eroare server.');
  } finally {
    setLoading(false);
    setConfirmModal({
      isOpen: false,
      type: '',
      data: null,
      title: '',
      message: ''
    });
  }
};

 const salveazaProgramare = async (tip) => {
  if (tip === 'client' && (!formRezervare.nume || !formRezervare.telefon)) {
    return alert('Completează numele și telefonul!');
  }

  const payload = {
    barberId: currentBarber.id,
    frizer: currentBarber.label,
    data: selectedDay,
    ora: oraActiva,
    tip,
    nume_client: tip === 'blocat' ? 'PAUZĂ / BLOCAT' : formRezervare.nume,
    telefon: tip === 'blocat' ? 'N/A' : formRezervare.telefon,
    mesaj: tip === 'blocat' ? 'Oră blocată manual' : formRezervare.mesaj,
    serviciu: tip === 'client' && selectedService ? selectedService.name : '',
    pret: tip === 'client' && selectedService ? formatPrice(selectedService.price) : '',
    pretValoare: tip === 'client' && selectedService ? selectedService.price : null
  };

  try {
    await apiPost('/api/programari', payload);

    setModalDeschis(false);
    setFormRezervare({
      nume: '',
      telefon: '',
      serviciuId: '',
      mesaj: ''
    });

    await fetchData();
  } catch (err) {
    console.error('Eroare salvare programare:', err);
    alert(err.message || 'Ora este ocupată!');
  }
};

  const makeWhatsAppLink = (programare) => {
    const phone = normalizePhoneForWhatsApp(programare.telefon);

    const text = [
      `Salut, te contactăm de la Gentleman’s Club pentru programarea ta.`,
      `Specialist: ${currentBarber.label}`,
      programare.serviciu ? `Serviciu: ${programare.serviciu}` : '',
      programare.pret ? `Preț: ${programare.pret}` : '',
      `Data: ${programare.data}`,
      `Ora: ${programare.ora}`
    ]
      .filter(Boolean)
      .join('\n');

    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };
const openAppointmentModal = (programare) => {
  if (!programare || isBlockedEntry(programare)) return;

  setActiveAppointment(programare);

  setEditAppointmentForm({
    nume: programare.nume_client || '',
    telefon: programare.telefon || '',
    serviciuId: getServiceIdFromAppointment(programare, serviceOptions),
    data: programare.data || selectedDay,
    ora: programare.ora || '',
    mesaj: programare.mesaj || ''
  });

  setAppointmentModalOpen(true);
};

const closeAppointmentModal = () => {
  setAppointmentModalOpen(false);
  setActiveAppointment(null);
};

const saveAppointmentChanges = async () => {
  if (!activeAppointment?._id) {
    return alert('Programarea nu are ID valid.');
  }

  if (!editAppointmentForm.nume || !editAppointmentForm.telefon) {
    return alert('Completează numele și telefonul.');
  }

  const payload = {
    nume_client: editAppointmentForm.nume,
    telefon: editAppointmentForm.telefon,
    data: editAppointmentForm.data,
    ora: editAppointmentForm.ora,
    mesaj: editAppointmentForm.mesaj,
    serviciu: selectedEditService ? selectedEditService.name : '',
    pret: selectedEditService ? formatPrice(selectedEditService.price) : '',
    pretValoare: selectedEditService ? selectedEditService.price : null
  };

  try {
    setLoading(true);

    const data = await apiPatch(
      `/api/programari/${activeAppointment._id}`,
      payload
    );

    setProgramari((prev) =>
      prev.map((item) =>
        item._id === activeAppointment._id
          ? data.programare || { ...item, ...payload }
          : item
      )
    );

    setActiveAppointment(data.programare || { ...activeAppointment, ...payload });
    setAppointmentModalOpen(false);
  } catch (err) {
    console.error('Eroare editare programare:', err);
    alert(err.message || 'Eroare server la editare.');
  } finally {
    setLoading(false);
  }
};

const changeAppointmentStatusFromModal = async (status) => {
  if (!activeAppointment?._id) return;

  try {
    const data = await apiPatch(
      `/api/programari/${activeAppointment._id}/status`,
      { status }
    );

    const updatedProgramare = data.programare || {
      ...activeAppointment,
      status
    };

    setProgramari((prev) =>
      prev.map((item) =>
        item._id === activeAppointment._id ? updatedProgramare : item
      )
    );

    setActiveAppointment(updatedProgramare);
  } catch (err) {
    console.error('Eroare status modal:', err);
    alert(err.message || 'Eroare server la status.');
  }
};

const requestCancelAppointmentFromModal = () => {
  if (!activeAppointment) return;

  setConfirmModal({
    isOpen: true,
    type: 'delete',
    data: activeAppointment,
    title: 'ANULEAZĂ PROGRAMARE',
    message: `Ești sigur că vrei să anulezi programarea lui ${activeAppointment.nume_client}?`
  });

  setAppointmentModalOpen(false);
};
  return (
    <div className="admin-wrapper">
     <nav className="top-navbar admin-top-stacked">
  <div className="admin-top-actions-row">
    <button
      onClick={() => {
        fetchData();
        fetchGalerie();
      }}
      className="btn-icon refresh"
      title="Reîncarcă"
    >
      ↻
    </button>

    <button
      onClick={async () => {
  await logout();
  navigate('/login', { replace: true });
}}
      className="btn-icon logout"
      title="Ieșire"
    >
      ⏻
    </button>
  </div>

  <div className="admin-top-main-row">
    {isBoss && (
      <button className="btn-back-dash" onClick={() => navigate('/master')}>
        ⬅ Panou
      </button>
    )}

    <div className="nav-brand">
      AGENDA {currentBarber.short.toUpperCase()}
    </div>
  </div>
</nav>

      <div className="dashboard-grid">
        <aside className="sidebar-calendar">
          <div className="calendar-card-premium">
            <div className="month-header">
              <button onClick={() => changeMonth(-1)}>‹</button>

              <div className="month-title">
                {viewDate.toLocaleString('ro-RO', { month: 'long' }).toUpperCase()}
                <span>{viewDate.getFullYear()}</span>
              </div>

              <button onClick={() => changeMonth(1)}>›</button>
            </div>

            <div className="weekdays-grid">
              {['LU', 'MA', 'MI', 'JO', 'VI', 'SÂ', 'DU'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="days-grid">
              {generateSquareCalendar().map((item, idx) => (
                <div
                  key={idx}
                  className={`day-cell ${!item ? 'empty' : ''} ${item?.fullDate === selectedDay ? 'active' : ''}`}
                  onClick={() => item && setSelectedDay(item.fullDate)}
                >
                  {item?.day}

                  {item?.hasApps && <span className="dot"></span>}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="schedule-area">
          <div className="schedule-header">
            <div className="header-left">
              <h2>
                {new Date(selectedDay).toLocaleDateString('ro-RO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </h2>

              <p
                style={{
                  marginTop: '6px',
                  color: '#8e8e93',
                  fontSize: '0.9rem'
                }}
              >
                Specialist: <strong style={{ color: '#d4af37' }}>{currentBarber.label}</strong>
              </p>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
                <button className="btn-block-day" onClick={handleBlockDayRequest}>
                  ⛔ BLOCHEAZĂ ZIUA
                </button>

                {areBlocajeActive && (
                  <button
                    className="btn-block-day"
                    style={{
                      background: 'rgba(48, 209, 88, 0.1)',
                      color: '#30d158',
                      borderColor: '#30d158'
                    }}
                    onClick={handleUnblockDayRequest}
                  >
                    🔓 DEBLOCHEAZĂ ZIUA
                  </button>
                )}
              </div>
            </div>

            <span className="task-count">
              {selectedDayProgramari.length} evenimente
            </span>
          </div>

          <div className="slots-list">
            {ORE_PROGRAM.map((ora) => {
              const app = selectedDayProgramari.find((p) => p.ora === ora);
              const blocked = isBlockedEntry(app);

              return (
                <div
                  key={ora}
                  className={`slot-card ${app ? (blocked ? 'blocked' : 'occupied') : 'free'}`}
                >
                  <div className="slot-time">{ora}</div>

                  <div className="slot-content">
                   {app ? (
  <>
    {blocked ? (
      <div className="admin-compact-blocked">
        <strong>{app.nume_client}</strong>
        <span>Blocare / pauză</span>
      </div>
    ) : (
    <button
  type="button"
  className={`admin-compact-client ${normalizeStatus(app.status)}`}
  onClick={(e) => {
    e.stopPropagation();
    openAppointmentModal(app);
  }}
>
  <span className="compact-client-name">
    {app.nume_client || 'Client'}
  </span>

  <span className="compact-client-price">
    {getAppointmentPriceLabel(app)}
  </span>
</button>
    )}
  </>
) : (
  <span className="status-label">Disponibil</span>
)}
                  </div>

                  <button
                    className={`action-btn ${app ? 'btn-del' : 'btn-add'}`}
                    onClick={() => deschideActiune(ora, app)}
                  >
                    {app ? '✕' : '+'}
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <section className="admin-gallery-manager">
        <h2 className="section-title">MANAGEMENT PORTOFOLIU PERSONAL</h2>

        <div className="gallery-upload-box upload-gallery-modern">
          <div className="upload-zone">
            <input
              ref={galleryFileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              title="Alege poze din telefon sau calculator"
            />

            {previewUrl ? (
              <div className="preview-container">
                <img loading="lazy" src={previewUrl} alt="Preview" className="image-preview" />

                <div className="preview-overlay">
                  {selectedFiles.length} poză/poze selectate · apasă ca să schimbi
                </div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <span className="upload-icon">📸</span>

                <p>
                  Apasă aici și alege poze din galeria telefonului sau din fișiere.
                </p>
              </div>
            )}
          </div>

          <div className="upload-actions-row">
            <button
              onClick={handleAddPhoto}
              className="btn-gold"
              disabled={!selectedFiles.length || loading}
            >
              {loading ? 'SE URCĂ PE SERVER...' : `URCĂ ${selectedFiles.length || ''} POZĂ/POZE`}
            </button>

            {selectedFiles.length > 0 && (
              <button
                onClick={clearSelectedFiles}
                className="btn-dark"
                type="button"
              >
                ANULEAZĂ SELECȚIA
              </button>
            )}
          </div>
        </div>

        <div className="admin-gallery-grid">
          {galerie.map((poza) => (
            <div key={poza._id} className="admin-photo-card">
              <img loading="lazy" src={poza.url} alt="Lucrare" />

              <button
                className="btn-delete-photo"
                onClick={() => handleDeletePhoto(poza._id)}
              >
                ȘTERGE POZA 🗑
              </button>
            </div>
          ))}

          {galerie.length === 0 && (
            <p
              style={{
                gridColumn: '1/-1',
                textAlign: 'center',
                color: '#8e8e93',
                fontStyle: 'italic'
              }}
            >
              Nu ai adăugat nicio poză în portofoliu încă.
            </p>
          )}
        </div>
      </section>

      {modalDeschis && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.className === 'modal-backdrop') {
              setModalDeschis(false);
            }
          }}
        >
          <div className="modal-box">
            <button
              className="btn-close-modal"
              onClick={() => setModalDeschis(false)}
            >
              ✕
            </button>

            <h3>Ora {oraActiva}</h3>

            <div className="input-group">
              <label>Nume client</label>

              <input
                type="text"
                placeholder="ex: Rezervare telefon"
                value={formRezervare.nume}
                onChange={(e) =>
                  setFormRezervare({
                    ...formRezervare,
                    nume: e.target.value
                  })
                }
              />
            </div>

            <div className="input-group">
              <label>Telefon</label>

              <input
                type="tel"
                placeholder="07xxxxxxxx"
                value={formRezervare.telefon}
                onChange={(e) =>
                  setFormRezervare({
                    ...formRezervare,
                    telefon: e.target.value
                  })
                }
              />
            </div>

            <div className="input-group">
              <label>Serviciu</label>

              <select
                value={formRezervare.serviciuId}
                onChange={(e) =>
                  setFormRezervare({
                    ...formRezervare,
                    serviciuId: e.target.value
                  })
                }
              >
                <option value="">Fără serviciu ales</option>

                {serviceOptions.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} — {formatPrice(service.price)}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Mesaj / notițe</label>

              <textarea
                rows="3"
                placeholder="ex: clientul a sunat, vrea fade..."
                value={formRezervare.mesaj}
                onChange={(e) =>
                  setFormRezervare({
                    ...formRezervare,
                    mesaj: e.target.value
                  })
                }
              ></textarea>
            </div>

            {selectedService && (
              <div className="admin-selected-service">
                <span>Serviciu ales</span>
                <strong>
                  {selectedService.name} — {formatPrice(selectedService.price)}
                </strong>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn-gold"
                onClick={() => salveazaProgramare('client')}
              >
                SALVEAZĂ CLIENT
              </button>

              <button
                className="btn-dark"
                onClick={() => salveazaProgramare('blocat')}
              >
                DOAR PAUZĂ
              </button>
            </div>
          </div>
        </div>
      )}
  {appointmentModalOpen && activeAppointment && (
  <div
    className="appointment-detail-backdrop"
    onClick={(e) => {
      if (e.target.classList.contains('appointment-detail-backdrop')) {
        closeAppointmentModal();
      }
    }}
  >
    <div className="appointment-detail-modal">
      <button
        type="button"
        className="appointment-modal-close"
        onClick={closeAppointmentModal}
      >
        ✕
      </button>

      <div className="appointment-modal-head">
        <span>Detalii programare</span>
        <h3>{activeAppointment.nume_client}</h3>

        <p>
          {activeAppointment.data} · {activeAppointment.ora} · {getStatusLabel(activeAppointment.status)}
        </p>
      </div>

      <div className="appointment-modal-grid">
        <div className="input-group">
          <label>Nume client</label>
          <input
            type="text"
            value={editAppointmentForm.nume}
            onChange={(e) =>
              setEditAppointmentForm({
                ...editAppointmentForm,
                nume: e.target.value
              })
            }
          />
        </div>

        <div className="input-group">
          <label>Telefon</label>
          <input
            type="tel"
            value={editAppointmentForm.telefon}
            onChange={(e) =>
              setEditAppointmentForm({
                ...editAppointmentForm,
                telefon: e.target.value
              })
            }
          />
        </div>

        <div className="input-group">
          <label>Data</label>
          <input
            type="date"
            value={editAppointmentForm.data}
            onChange={(e) =>
              setEditAppointmentForm({
                ...editAppointmentForm,
                data: e.target.value
              })
            }
          />
        </div>

        <div className="input-group">
          <label>Ora</label>
          <select
            value={editAppointmentForm.ora}
            onChange={(e) =>
              setEditAppointmentForm({
                ...editAppointmentForm,
                ora: e.target.value
              })
            }
          >
            {ORE_PROGRAM.map((ora) => (
              <option key={ora} value={ora}>
                {ora}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group wide">
          <label>Serviciu</label>
          <select
            value={editAppointmentForm.serviciuId}
            onChange={(e) =>
              setEditAppointmentForm({
                ...editAppointmentForm,
                serviciuId: e.target.value
              })
            }
          >
            <option value="">Fără serviciu ales</option>

            {serviceOptions.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} — {formatPrice(service.price)}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group wide">
          <label>Mesaj / notițe</label>
          <textarea
            rows="3"
            value={editAppointmentForm.mesaj}
            onChange={(e) =>
              setEditAppointmentForm({
                ...editAppointmentForm,
                mesaj: e.target.value
              })
            }
          />
        </div>
      </div>

      <div className="appointment-modal-summary">
        <article>
          <span>Serviciu</span>
          <strong>{selectedEditService?.name || activeAppointment.serviciu || 'Neselectat'}</strong>
        </article>

        <article>
          <span>Sumă</span>
          <strong>
            {selectedEditService
              ? formatPrice(selectedEditService.price)
              : getAppointmentPriceLabel(activeAppointment)}
          </strong>
        </article>

        <article>
          <span>Status</span>
          <strong>{getStatusLabel(activeAppointment.status)}</strong>
        </article>
      </div>

      <div className="appointment-modal-actions">
        <button
          type="button"
          className="btn-gold"
          onClick={saveAppointmentChanges}
          disabled={loading}
        >
          Salvează modificări
        </button>

        {normalizeStatus(activeAppointment.status) === 'confirmata' ? (
          <button
            type="button"
            className="btn-dark"
            onClick={() => changeAppointmentStatusFromModal('noua')}
          >
            Deconfirmă
          </button>
        ) : (
          <button
            type="button"
            className="btn-dark"
            onClick={() => changeAppointmentStatusFromModal('confirmata')}
          >
            Confirmă
          </button>
        )}

        {activeAppointment.telefon && (
          <a
            href={makeWhatsAppLink(activeAppointment)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-modal-whatsapp"
          >
            WhatsApp
          </a>
        )}

        <button
          type="button"
          className="btn-modal-danger"
          onClick={requestCancelAppointmentFromModal}
        >
          Anulează programarea
        </button>
      </div>
    </div>
  </div>
)}
      {confirmModal.isOpen && (
        <div
          className="modal-backdrop confirm-backdrop"
          onClick={(e) => {
            if (e.target.classList.contains('confirm-backdrop')) {
              setConfirmModal({ ...confirmModal, isOpen: false });
            }
          }}
        >
          <div className="modal-box confirm-box">
            <h3 className="confirm-title">{confirmModal.title}</h3>

            <p className="confirm-msg">{confirmModal.message}</p>

            <div className="modal-actions confirm-actions">
              <button
                className="btn-confirm-no"
                onClick={() =>
                  setConfirmModal({ ...confirmModal, isOpen: false })
                }
              >
                NU, ANULEAZĂ
              </button>

              <button
                className="btn-confirm-yes"
                onClick={executeConfirmAction}
              >
                {loading ? 'SE PROCESEAZĂ...' : 'DA, SUNT SIGUR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;