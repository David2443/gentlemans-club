import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './BarberProfile.css';
import { setPageSeo } from './seo';
import { getApiBase } from './api';
const API_BASE = getApiBase();
const CONTACT_WHATSAPP = '40741844684';

const BARBER_SERVICES = [
  {
    id: 'tuns',
    name: 'Tuns',
    price: 65,
    durationMinutes: 40,
    desc: 'Tuns curat, finisat atent și adaptat stilului tău.'
  },
  {
    id: 'tuns-barba',
    name: 'Tuns + barbă',
    price: 95,
    durationMinutes: 60,
    desc: 'Tuns complet plus barbă aranjată și finisată.',
    vip: true
  },
  {
    id: 'barba',
    name: 'Barbă',
    price: 35,
    durationMinutes: 20,
    desc: 'Aranjare barbă pentru un aspect curat și îngrijit.'
  },
  {
    id: 'vopsit-barba',
    name: 'Vopsit barbă',
    price: 35,
    durationMinutes: 15,
    desc: 'Vopsit barbă pentru un aspect uniform și definit.'
  },
  {
    id: 'spalat',
    name: 'Spălat',
    price: 25,
    durationMinutes: 10,
    desc: 'Spălat profesional pentru prospețime și confort.'
  },
  {
    id: 'contur-barba',
    name: 'Contur / aranjat barbă',
    price: 30,
    desc: 'Contur clar, simetrie și finisaj precis.'
  },
  {
    id: 'styling',
    name: 'Styling',
    price: null,
    desc: 'Spălat, aranjat și finisaj cu produse premium.'
  },
  {
    id: 'pachet-vip',
    name: "Pachet Gentleman's Club",
    price: 250,
    durationMinutes: 70,
    desc: 'Tuns + barbă + spălat + finisaj premium.',
    vip: true
  }
];

const BROW_SERVICES = [
  {
    id: 'pensat',
    name: 'Pensat',
    price: 35,
    desc: 'Pensat precis pentru un aspect curat și îngrijit.'
  },
  {
    id: 'pensat-vopsit',
    name: 'Pensat + vopsit',
    price: 50,
    desc: 'Pensat precis plus vopsit pentru definire și stil.',
    vip: true
  },
  {
    id: 'pensat-par-nas',
    name: 'Pensat + păr nas',
    price: 45,
    desc: 'Pensat și îngrijire detalii pentru un look complet.'
  },
  {
    id: 'tratament-facial',
    name: 'Tratament facial',
    price: 50,
    desc: 'Tratament facial pentru prospețime și aspect îngrijit.'
  },
  {
    id: 'pachet-complet',
    name: 'Pachet complet',
    price: 100,
    desc: 'Pensat + vopsit + păr nas + tratament facial.',
    vip: true
  },
  {
    id: 'suvite',
    name: 'Șuvițe',
    price: 300,
    desc: 'Șuvițe lucrate atent pentru un rezultat premium.'
  },
  {
    id: 'global-o-culoare',
    name: 'Global / total — o culoare',
    price: 300,
    desc: 'Vopsit total într-o singură culoare.'
  },
  {
    id: 'global-model',
    name: 'Global / total — model',
    price: 400,
    desc: 'Vopsit total cu model personalizat.',
    vip: true
  }
];

const ALL_SERVICES = [...BARBER_SERVICES, ...BROW_SERVICES];

const barbersDB = {
  'tracy-pensat': {
  barberId: 'tracy-pensat',
  name: 'Tracy',
  role: 'Brow Specialist',
  badge: 'PENSAT PERFECT',
  image: '/tracy-pensat.png',
  isMaster: false,
  description: 'Pensat perfect, încredere totală.',
  services: BROW_SERVICES,
  gallery: []
},
  'dani-frizeru': {
    barberId: 'dani-frizeru',
    name: 'Dani Frizeru',
    role: 'Master Barber',
    badge: 'MASTER',
    image: '/dani-frizeru.png',
    isMaster: true,
    description: 'Nu este doar o tunsoare, este o experiență.',
    services: BARBER_SERVICES,
    gallery: []
  },


  'vali-frizeru': {
    barberId: 'vali-frizeru',
    name: 'Vali Frizeru',
    role: 'Barber Specialist',
    badge: 'SONIC STYLE',
    image: '/vali-frizeru.png',
    isMaster: false,
    description: 'Stilul tău, semnătura noastră.',
    services: BARBER_SERVICES,
    gallery: []
  }
};


const STANDARD_TIME_SLOTS = [
  '08:00',
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
  '19:00',
  '20:00',
  '21:00',
  '22:00'
];

const HALF_HOUR_TIME_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00'
];

const BARBERS_HALF_HOUR = [];
const getTimeSlotsForBarber = (barberId) => {
  return BARBERS_HALF_HOUR.includes(barberId)
    ? HALF_HOUR_TIME_SLOTS
    : STANDARD_TIME_SLOTS;
};

const getNextMonths = (count = 12) => {
  const months = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);

    months.push({
      index: i,
      dateObj: d,
      label: d.toLocaleString('ro-RO', {
        month: 'long',
        year: 'numeric'
      }).toUpperCase()
    });
  }

  return months;
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

const formatPrice = (price) => {
  if (price === null || price === undefined) {
    return 'LA SALON';
  }

  return `${price} LEI`;
};

const formatDateRo = (dateString) => {
  if (!dateString) return '';

  const [year, month, day] = String(dateString).split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const isSelectedDateToday = (dateString) => {
  if (!dateString) return false;

  const [year, month, day] = String(dateString).split('-').map(Number);
  const selected = new Date(year, month - 1, day);
  const today = new Date();

  return (
    selected.getFullYear() === today.getFullYear() &&
    selected.getMonth() === today.getMonth() &&
    selected.getDate() === today.getDate()
  );
};

const isTimeSlotInFuture = (dateString, time) => {
  if (!dateString || !time) return true;

  if (!isSelectedDateToday(dateString)) {
    return true;
  }

  const [hours, minutes] = String(time).split(':').map(Number);
  const slotDate = new Date();

  slotDate.setHours(hours || 0, minutes || 0, 0, 0);

  const now = new Date();

  return slotDate > now;
};

const createWhatsAppLink = ({ name, barber, service, date, time }) => {
  const text = [
    `Salut, am făcut o programare la Gentleman’s Club.`,
    `Nume: ${name}`,
    `Specialist: ${barber}`,
    `Serviciu: ${service}`,
    `Data: ${formatDateRo(date)}`,
    `Ora: ${time}`
  ].join('\n');

  return `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}`;
};

function BarberProfile() {
  const { id } = useParams();
  const barber = barbersDB[id];
  useEffect(() => {
  if (!barber) {
    setPageSeo({
      title: 'Profil frizer',
      description: 'Alege specialistul Gentleman’s Club Pitești și programează-te online pentru tuns, barbă sau pensat.',
      path: `/frizer/${id || ''}`
    });

    return;
  }

  setPageSeo({
    title: `${barber.name} Pitești | Programare online tuns, barbă și servicii premium`,
    description: `${barber.name} la Gentleman’s Club Pitești. Programează-te online pentru ${barber.role.toLowerCase()}, servicii premium, tuns, barbă, styling sau pensat.`,
    path: `/frizer/${barber.barberId}`,
    image: `https://www.gentlemansclub.ro${barber.image}`
  });
}, [barber, id]);

  const [monthsList] = useState(getNextMonths(12));
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [daysInMonth, setDaysInMonth] = useState([]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState(id);
  const [chosenBarberId, setChosenBarberId] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [refreshSlotsKey, setRefreshSlotsKey] = useState(0);
  const [searchingFirst, setSearchingFirst] = useState(false);
  const [firstAvailableMessage, setFirstAvailableMessage] = useState('');
  const [pendingQuickPick, setPendingQuickPick] = useState(null);

  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientMessage, setClientMessage] = useState('');

  const [submitStatus, setSubmitStatus] = useState('');
  const [successDetails, setSuccessDetails] = useState(null);
  const [errors, setErrors] = useState({});

  const selectedService = useMemo(() =>
    ALL_SERVICES.find((service) => service.id === selectedServiceId) || null,
    [selectedServiceId]
  );
  const eligibleSpecialists = useMemo(() =>
    Object.values(barbersDB).filter((item) =>
      selectedService && item.services.some((service) => service.id === selectedService.id)
    ), [selectedService]
  );
  const currentBookBarber = chosenBarberId ? barbersDB[chosenBarberId] :
    (selectedBarberId === 'any' ? null : barbersDB[selectedBarberId]);
  const visibleTimeSlots = useMemo(() =>
    availableSlots.filter((slot) =>
      selectedDate && isTimeSlotInFuture(selectedDate.fullDate, slot.ora)
    ), [availableSlots, selectedDate]
  );

  useEffect(() => {
    setSelectedBarberId(id);
    setChosenBarberId(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSelectedServiceId('');
    setSuccessDetails(null);
    setSubmitStatus('');
    setFirstAvailableMessage('');
    setPendingQuickPick(null);
    setErrors({});
  }, [id]);

  useEffect(() => {
    setAvailableSlots([]);
    setLoadingSlots(false);
    setSlotsError('');
    setSelectedTime(null);
    setChosenBarberId(null);
    if (!selectedDate || !selectedService) return;

    const controller = new AbortController();
    setLoadingSlots(true);
    const params = new URLSearchParams({
      barberId: selectedBarberId,
      data: selectedDate.fullDate,
      serviciu: selectedService.name
    });
    fetch(`${API_BASE}/api/disponibilitate?${params}`, {signal: controller.signal})
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok || body.succes !== true || !Array.isArray(body.slots)) {
          throw new Error(body.mesaj || 'Nu am putut verifica orele disponibile.');
        }
        return body.slots;
      })
      .then((slots) => {
        if (controller.signal.aborted) return;
        setAvailableSlots(slots);
        setLoadingSlots(false);
        if (pendingQuickPick && pendingQuickPick.data === selectedDate.fullDate) {
          const chosen = slots.find((slot) =>
            slot.ora === pendingQuickPick.ora && slot.barberId === pendingQuickPick.barberId
          );
          if (chosen) {
            setSelectedTime(chosen.ora);
            setChosenBarberId(chosen.barberId);
          }
          setPendingQuickPick(null);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setLoadingSlots(false);
        setSlotsError(err.message || 'Eroare de conexiune.');
        setPendingQuickPick(null);
      });
    return () => controller.abort();
  }, [selectedDate, selectedService, selectedBarberId, refreshSlotsKey]);

  const handleFirstAvailable = async () => {
    if (!selectedService || searchingFirst) return;
    setSearchingFirst(true);
    setFirstAvailableMessage('');
    try {
      const params = new URLSearchParams({serviciu: selectedService.name, barberId: 'any'});
      const res = await fetch(`${API_BASE}/api/primul-loc-disponibil?${params}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.succes) throw new Error(body.mesaj || 'Căutarea nu a reușit.');
      if (!body.loc) {
        setFirstAvailableMessage('Nu am găsit loc liber în următoarele 30 de zile.');
        return;
      }
      const {data, ora, barberId} = body.loc;
      const [year, month, day] = data.split('-').map(Number);
      const foundDate = new Date(year, month - 1, day);
      const targetMonth = monthsList.findIndex((m) =>
        m.dateObj.getFullYear() === year && m.dateObj.getMonth() === month - 1
      );
      if (targetMonth >= 0) setSelectedMonthIndex(targetMonth);
      setPendingQuickPick({data, ora, barberId});
      setSelectedBarberId('any');
      setSelectedDate({
        fullDate: data, dayNumber: day,
        dayName: foundDate.toLocaleString('ro-RO', {weekday: 'short'}).toUpperCase()
      });
      setFirstAvailableMessage(`Primul loc liber: ${formatDateRo(data)}, ora ${ora}, la ${barbersDB[barberId]?.name || 'specialist'}.`);
    } catch (err) {
      setFirstAvailableMessage(err.message || 'Eroare de conexiune.');
    } finally {
      setSearchingFirst(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    const targetMonthObj = monthsList[selectedMonthIndex].dateObj;
    const year = targetMonthObj.getFullYear();
    const monthIndex = targetMonthObj.getMonth();
    const days = [];
    const daysInMonthCount = new Date(year, monthIndex + 1, 0).getDate();

    for (let i = 1; i <= daysInMonthCount; i++) {
      const d = new Date(year, monthIndex, i);

      if (selectedMonthIndex === 0 && i < today.getDate()) continue;
      if (d.getDay() === 0) continue;

      const monthStr = String(monthIndex + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');

      days.push({
        fullDate: `${year}-${monthStr}-${dayStr}`,
        dayName: d.toLocaleString('ro-RO', { weekday: 'short' }).toUpperCase(),
        dayNumber: i
      });
    }

    setDaysInMonth(days);
  }, [selectedMonthIndex, monthsList]);

  useEffect(() => {
    let ignore = false;

    const loadGallery = async () => {
      if (!barber) return;

      try {
        const response = await fetch(
          `${API_BASE}/api/galerie/${encodeURIComponent(barber.barberId)}`
        );

        if (!response.ok) {
          throw new Error('Galeria nu s-a putut încărca.');
        }

        const data = await response.json();

        const arr = Array.isArray(data)
          ? data
          : data.poze || data.galerie || data.images || [];

        const urls = arr
          .map((item) =>
  item.thumbnailUrl ||
  item.thumbUrl ||
  item.thumbnail ||
  item.url ||
  item.image ||
  item.src
)
          .filter(Boolean)
          .map(normalizeGalleryUrl);

        if (!ignore) {
          setGalleryImages(urls);
        }
      } catch {
        if (!ignore) {
          setGalleryImages([]);
        }
      }
    };

    loadGallery();

    return () => {
      ignore = true;
    };
  }, [barber]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitStatus('');
    setSuccessDetails(null);

    const newErrors = {};
    let hasError = false;

    if (!selectedDate) {
      newErrors.date = true;
      hasError = true;
    }

    if (!selectedTime) {
      newErrors.time = true;
      hasError = true;
    }

    if (!selectedService) {
      newErrors.service = true;
      hasError = true;
    }
    if (!currentBookBarber || !visibleTimeSlots.some((slot) =>
      slot.ora === selectedTime && slot.barberId === currentBookBarber.barberId
    )) {
      newErrors.time = true;
      hasError = true;
    }

    if (!clientName.trim()) {
      newErrors.name = true;
      hasError = true;
    }

    const cleanPhone = clientPhone.replace(/\s/g, '');
    const phoneRegex = /^(07\d{8}|\+407\d{8})$/;

    if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
      newErrors.phone = true;
      hasError = true;
    }

    setErrors(newErrors);

    if (hasError) {
      setSubmitStatus('❌ Completează câmpurile marcate cu roșu.');
      return;
    }

    if (!isTimeSlotInFuture(selectedDate.fullDate, selectedTime)) {
      setSubmitStatus('❌ Ora selectată a trecut deja. Alege altă oră.');
      setSelectedTime(null);
      return;
    }

    setSubmitStatus('⏳ Trimitem programarea...');

    const appointmentData = {
      nume_client: clientName.trim(),
      telefon: cleanPhone,
      barberId: currentBookBarber.barberId,
      frizer: currentBookBarber.name,
      data: selectedDate.fullDate,
      ora: selectedTime,
      serviciu: selectedService.name,
      pret: formatPrice(selectedService.price),
      pretValoare: selectedService.price,
      mesaj: clientMessage.trim(),
      tip: 'client',
      status: 'noua'
    };

    try {
      const response = await fetch(`${API_BASE}/api/programari`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitStatus(data.mesaj || '❌ Ora a fost ocupată între timp. Alege altă oră.');
        setSelectedTime(null);
        setChosenBarberId(null);
        setRefreshSlotsKey((key) => key + 1);
        return;
      }

      const details = {
        name: clientName.trim(),
        phone: cleanPhone,
        barber: currentBookBarber.name,
        service: selectedService.name,
        price: formatPrice(selectedService.price),
        date: selectedDate.fullDate,
        time: selectedTime,
        whatsappLink: createWhatsAppLink({
          name: clientName.trim(),
          barber: currentBookBarber.name,
          service: selectedService.name,
          date: selectedDate.fullDate,
          time: selectedTime
        })
      };

      setSuccessDetails(details);
      setSubmitStatus('✅ Programarea a fost trimisă!');
      setRefreshSlotsKey((key) => key + 1);

      setClientName('');
      setClientPhone('');
      setClientMessage('');
      setSelectedTime(null);
      setChosenBarberId(null);
      setErrors({});
    } catch {
      setSubmitStatus('❌ Eroare conexiune server.');
    }
  };

  if (!barber) {
    return (
      <div className="loading-screen">
        Profilul nu există.
      </div>
    );
  }

  const galleryToShow = galleryImages.length > 0 ? galleryImages : barber.gallery;

  return (
    <div className="profile-page-supreme">
      <div className="supreme-cover">
        <div className="supreme-cover-overlay"></div>

        <Link to="/" className="btn-back-supreme">
          ← ÎNAPOI
        </Link>
      </div>

      <div className="profile-container-supreme">
        <div className="profile-info-side-supreme">
          <div className="profile-hero-supreme">
            <div className="avatar-wrapper-supreme">
              <img
                src={barber.image}
                alt={`${barber.name} - programare online la Gentleman's Club Pitești`}
                className="avatar-img-supreme"
              />

              <div className="avatar-glow"></div>
              <div className="verified-badge-supreme">✓</div>
            </div>

            <h1 className="profile-name-supreme">{barber.name}</h1>

            <p className="profile-role-supreme">
              {barber.role}
              {barber.isMaster ? ' • MASTER' : ''}
            </p>

            <p
              style={{
                color: '#aaa',
                maxWidth: '420px',
                margin: '12px auto 0',
                lineHeight: 1.6,
                textAlign: 'center'
              }}
            >
              {barber.description}
            </p>

            <div className="profile-stats-supreme">
              <div className="stat-box">
                <span className="stat-number">5.0</span>
                <span className="stat-label">Rating</span>
              </div>

              <div className="stat-box">
                <span className="stat-number">VIP</span>
                <span className="stat-label">{barber.badge}</span>
              </div>

              <div className="stat-box">
                <span className="stat-number">GC</span>
                <span className="stat-label">Premium</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-booking-side-supreme">
          <div className="booking-card-supreme">
            <div className="booking-header-supreme">
              <h2>PROGRAMEAZĂ-TE ACUM</h2>
              <p>Alege serviciul, specialistul, ziua și ora</p>
            </div>

            <form onSubmit={handleSubmit} className="booking-form-supreme">
              <div className="selector-section-supreme">
                <label className={`section-label-supreme ${errors.service ? 'error-pulse' : ''}`}>
                  1. ALEGE SERVICIUL
                </label>
                <div className={`service-dropdown-supreme ${errors.service ? 'border-error-supreme' : ''}`}>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => {
                      const serviceId = e.target.value;
                      setSelectedServiceId(serviceId);
                      setSelectedDate(null);
                      setSelectedTime(null);
                      setChosenBarberId(null);
                      setPendingQuickPick(null);
                      setFirstAvailableMessage('');
                      if (serviceId && !barbersDB[selectedBarberId]?.services.some(
                        (item) => item.id === serviceId
                      )) setSelectedBarberId('any');
                      setErrors((prev) => ({...prev, service: false}));
                    }}
                  >
                    <option value="">Alege serviciul dorit</option>
                    {ALL_SERVICES.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} — {formatPrice(service.price)}
                        {service.durationMinutes ? ` · ${service.durationMinutes} min` : ''}
                      </option>
                    ))}
                  </select>
                  <span className="service-select-arrow">⌄</span>
                </div>
                {selectedService && (
                  <div className={`selected-service-card-supreme ${selectedService.vip ? 'vip' : ''}`}>
                    <div>
                      <span>Serviciu selectat</span>
                      <strong>{selectedService.name}</strong>
                      <p>{selectedService.desc}</p>
                      <p>{selectedService.durationMinutes
                        ? `Durată: ${selectedService.durationMinutes} minute`
                        : 'Durata exactă se confirmă la salon.'}</p>
                    </div>
                    <em>{formatPrice(selectedService.price)}</em>
                  </div>
                )}
              </div>

              <div className="selector-section-supreme">
                <label className="section-label-supreme">2. ALEGE SPECIALISTUL</label>
                {!selectedService ? (
                  <p className="hint-text-supreme">Mai întâi alege serviciul.</p>
                ) : (
                  <>
                    <div className="service-dropdown-supreme">
                      <select value={selectedBarberId} onChange={(e) => {
                        setSelectedBarberId(e.target.value);
                        setSelectedDate(null);
                        setSelectedTime(null);
                        setChosenBarberId(null);
                        setPendingQuickPick(null);
                      }}>
                        <option value="any">Oricare specialist disponibil</option>
                        {eligibleSpecialists.map((item) => (
                          <option key={item.barberId} value={item.barberId}>{item.name}</option>
                        ))}
                      </select>
                      <span className="service-select-arrow">⌄</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFirstAvailable}
                      disabled={searchingFirst}
                      style={{marginTop: 12, width: '100%', cursor: 'pointer', padding: '13px', background: 'rgba(212,175,55,.14)', border: '1px solid #d4af37', borderRadius: 8, color: '#e8cc77', fontWeight: 700}}
                    >
                      {searchingFirst ? 'CĂUTĂM LOCUL LIBER...' : '⚡ GĂSEȘTE PRIMUL LOC DISPONIBIL'}
                    </button>
                    {firstAvailableMessage && (
                      <p className="hint-text-supreme" style={{marginTop: 10}}>{firstAvailableMessage}</p>
                    )}
                  </>
                )}
              </div>

              {selectedService && (
                <>
                  <div className="month-tabs-wrapper-supreme">
                    <div className="month-tabs-scroll-supreme">
                      {monthsList.map((m) => (
                        <button
                          key={m.index}
                          type="button"
                          className={`month-tab-supreme ${selectedMonthIndex === m.index ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedMonthIndex(m.index);
                            setSelectedDate(null);
                            setSelectedTime(null);
                            setChosenBarberId(null);
                            setPendingQuickPick(null);
                            setErrors((prev) => ({...prev, date: false, time: false}));
                          }}
                        >{m.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="selector-section-supreme">
                    <label className={`section-label-supreme ${errors.date ? 'error-pulse' : ''}`}>
                      3. SELECTEAZĂ ZIUA
                    </label>
                    <div className={`dates-scroller-supreme ${errors.date ? 'border-error-supreme' : ''}`}>
                      {daysInMonth.map((date) => (
                        <button
                          key={date.fullDate}
                          type="button"
                          className={`date-card-supreme ${selectedDate?.fullDate === date.fullDate ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedTime(null);
                            setChosenBarberId(null);
                            setPendingQuickPick(null);
                            setErrors((prev) => ({...prev, date: false}));
                          }}
                        >
                          <span className="day-name-supreme">{date.dayName}</span>
                          <span className="day-number-supreme">{date.dayNumber}</span>
                          {selectedDate?.fullDate === date.fullDate && <div className="active-dot"></div>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="selector-section-supreme">
                    <label className={`section-label-supreme ${errors.time ? 'error-pulse' : ''}`}>
                      4. SELECTEAZĂ ORA
                    </label>
                    {!selectedDate ? (
                      <p className="hint-text-supreme">Alege o zi din calendar.</p>
                    ) : loadingSlots ? (
                      <p className="hint-text-supreme">Verificăm orele disponibile...</p>
                    ) : slotsError ? (
                      <p className="hint-text-supreme" role="alert">{slotsError} Încearcă altă zi.</p>
                    ) : visibleTimeSlots.length === 0 ? (
                      <p className="hint-text-supreme">Nu sunt ore disponibile în ziua aleasă.</p>
                    ) : (
                      <div className={`time-grid-supreme ${errors.time ? 'border-error-supreme' : ''}`}>
                        {visibleTimeSlots.map((slot) => (
                          <button
                            key={`${slot.ora}-${slot.barberId}`}
                            type="button"
                            className={`time-btn-supreme ${selectedTime === slot.ora && chosenBarberId === slot.barberId ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedTime(slot.ora);
                              setChosenBarberId(slot.barberId);
                              setErrors((prev) => ({...prev, time: false}));
                            }}
                          >
                            {slot.ora}{selectedBarberId === 'any' ? ` · ${barbersDB[slot.barberId]?.name || slot.frizer}` : ''}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="final-inputs-supreme">
                <label className="section-label-supreme">5. DATE DE CONTACT</label>

                <div className="input-wrapper-supreme">
                  <input
                    type="text"
                    placeholder=" "
                    className={`input-supreme ${errors.name ? 'input-error-supreme' : ''}`}
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);

                      if (e.target.value) {
                        setErrors((prev) => ({ ...prev, name: false }));
                      }
                    }}
                  />

                  <span className="floating-label">
                    Nume complet {errors.name && '*'}
                  </span>
                </div>

                <div className="input-wrapper-supreme">
                  <input
                    type="tel"
                    placeholder=" "
                    className={`input-supreme ${errors.phone ? 'input-error-supreme' : ''}`}
                    value={clientPhone}
                    onChange={(e) => {
                      setClientPhone(e.target.value);

                      if (e.target.value) {
                        setErrors((prev) => ({ ...prev, phone: false }));
                      }
                    }}
                  />

                  <span className="floating-label">
                    Telefon 07xxxxxxxx sau +407xxxxxxxx {errors.phone && '*'}
                  </span>
                </div>

                <div className="input-wrapper-supreme">
                  <textarea
                    placeholder=" "
                    className="input-supreme textarea-supreme"
                    value={clientMessage}
                    onChange={(e) => setClientMessage(e.target.value)}
                    rows="2"
                  ></textarea>

                  <span className="floating-label">
                    Mențiuni speciale opțional
                  </span>
                </div>
              </div>

              <div className="submit-wrapper">
                <button type="submit" className="btn-book-supreme">
                  <span>TRIMITE PROGRAMAREA</span>
                  <div className="btn-glow"></div>
                </button>
              </div>

              {submitStatus && (
                <div className={`status-banner-supreme ${
                  submitStatus.includes('✅') ? 'success' : 'error'
                }`}>
                  {submitStatus}
                </div>
              )}

              {successDetails && (
                <div className="success-summary-supreme">
                  <span className="success-kicker">Programare trimisă</span>

                  <h3>Te vom contacta pentru confirmare.</h3>

                  <div className="success-grid-supreme">
                    <p>
                      <span>Specialist</span>
                      <strong>{successDetails.barber}</strong>
                    </p>

                    <p>
                      <span>Serviciu</span>
                      <strong>{successDetails.service}</strong>
                    </p>

                    <p>
                      <span>Preț</span>
                      <strong>{successDetails.price}</strong>
                    </p>

                    <p>
                      <span>Data</span>
                      <strong>{formatDateRo(successDetails.date)}</strong>
                    </p>

                    <p>
                      <span>Ora</span>
                      <strong>{successDetails.time}</strong>
                    </p>

                    <p>
                      <span>Telefon</span>
                      <strong>{successDetails.phone}</strong>
                    </p>
                  </div>

                  <a
                    href={successDetails.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp-supreme"
                  >
                    Trimite confirmarea pe WhatsApp
                  </a>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="gallery-section-supreme">
        <div className="gallery-header-supreme">
          <h3>PORTOFOLIU {barber.name.split(' ')[0]}</h3>
          <div className="gold-separator"></div>
        </div>

        {galleryToShow.length > 0 ? (
          <div className={`gallery-grid-supreme ${galleryExpanded ? 'expanded' : ''}`}>
            {galleryToShow.map((imgSrc, index) => (
              <div key={`${imgSrc}-${index}`} className="gallery-item-supreme">
                <img
  loading="lazy"
  src={imgSrc}
  alt={`Lucrare ${barber.name} - Gentleman’s Club Pitești ${index + 1}`}
/>
                <div className="img-hover-glow"></div>
              </div>
            ))}

            {!galleryExpanded && <div className="gallery-fade-supreme"></div>}
          </div>
        ) : (
          <div
            style={{
              width: 'min(760px, calc(100% - 32px))',
              margin: '0 auto',
              padding: '38px 22px',
              border: '1px dashed rgba(212, 175, 55, 0.28)',
              color: '#aaa',
              textAlign: 'center'
            }}
          >
            Nu sunt poze încărcate încă pentru acest specialist.
          </div>
        )}

        {galleryToShow.length > 0 && (
          <div className="gallery-action">
            <button
              type="button"
              className={`btn-expand-gallery ${galleryExpanded ? 'active' : ''}`}
              onClick={() => setGalleryExpanded(!galleryExpanded)}
            >
              {galleryExpanded ? 'ASCUNDE GALERIA ↑' : 'DESCOPERĂ ARTA ↓'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BarberProfile;

