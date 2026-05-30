import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './BarberProfile.css';

// --- BAZA DE DATE ---
const barbersDB = {
  alex: { 
    name: "Alexandru Popescu", 
    role: "Master Barber", 
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800", 
    gallery: [
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600", 
      "https://images.unsplash.com/photo-1593702295094-aea8cdd39d68?w=600",
      "https://images.unsplash.com/photo-1503951914875-befca74f4e90?w=600",
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600",
      "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600",
      "https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=600"
    ] 
  },
  mihai: { 
    name: "Mihai Ionescu", 
    role: "Senior Stylist", 
    image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800", 
    gallery: [
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600", 
      "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600",
      "https://images.unsplash.com/photo-1503951914875-befca74f4e90?w=600",
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600",
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600",
      "https://images.unsplash.com/photo-1593702295094-aea8cdd39d68?w=600"
    ] 
  },
  andrei: { 
    name: "Andrei Radu", 
    role: "Barber", 
    image: "https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?w=800", 
    gallery: [
      "https://images.unsplash.com/photo-1517832207067-4db24a2ae47b?w=600", 
      "https://images.unsplash.com/photo-1520338661084-680395057c93?w=600",
      "https://images.unsplash.com/photo-1503951914875-befca74f4e90?w=600",
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600",
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600",
      "https://images.unsplash.com/photo-1593702295094-aea8cdd39d68?w=600"
    ] 
  }
};

const allTimeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

const getNextMonths = (count = 12) => {
  const months = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push({
      index: i,
      dateObj: d,
      label: d.toLocaleString('ro-RO', { month: 'long', year: 'numeric' }).toUpperCase()
    });
  }
  return months;
};

function BarberProfile() {
  const { id } = useParams();
  const barber = barbersDB[id];

  const [monthsList] = useState(getNextMonths(12)); 
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0); 
  const [daysInMonth, setDaysInMonth] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [galleryExpanded, setGalleryExpanded] = useState(false);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

  // --- STARE NOUĂ PENTRU ERORI (Ce câmpuri înroșim) ---
  const [errors, setErrors] = useState({}); 

  // 1. Fetch Ore
  useEffect(() => {
    setOccupiedSlots([]); 
    setSelectedTime(null);
    if (selectedDate && barber) {
      const url = `http://localhost:5000/api/ocupate?frizer=${encodeURIComponent(barber.name)}&data=${selectedDate.fullDate}`;
      fetch(url)
        .then(res => res.ok ? res.json() : [])
        .then(data => setOccupiedSlots(data))
        .catch(err => setOccupiedSlots([]));
    }
  }, [selectedDate, barber]);

  // 2. Calcul Calendar
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
      const monthStr = (monthIndex + 1).toString().padStart(2, '0');
      const dayStr = i.toString().padStart(2, '0');
      days.push({
        fullDate: `${year}-${monthStr}-${dayStr}`,
        dayName: d.toLocaleString('ro-RO', { weekday: 'short' }).toUpperCase(),
        dayNumber: i
      });
    }
    setDaysInMonth(days);
  }, [selectedMonthIndex, monthsList]);

  // 3. SUBMIT CU EVIDENȚIERE ERORI
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('');
    
    // --- VALIDARE STRICTĂ ---
    let newErrors = {};
    let hasError = false;

    if (!selectedDate) {
      newErrors.date = true;
      hasError = true;
    }
    if (!selectedTime) {
      newErrors.time = true;
      hasError = true;
    }
    if (!clientName.trim()) {
      newErrors.name = true;
      hasError = true;
    }
    
    // Validare Telefon (Regex RO)
    const phoneRegex = /^07\d{8}$/;
    if (!clientPhone.trim() || !phoneRegex.test(clientPhone)) {
      newErrors.phone = true;
      hasError = true;
    }

    setErrors(newErrors); // Actualizăm state-ul cu erori

    if (hasError) {
      setSubmitStatus('❌ Verifică câmpurile marcate cu roșu!');
      return;
    }

    // Dacă ajungem aici, totul e OK
    setSubmitStatus('⏳ Se trimite...');

    const appointmentData = {
      nume_client: clientName,
      telefon: clientPhone,
      frizer: barber.name,
      data: selectedDate.fullDate,
      ora: selectedTime,
      mesaj: clientMessage,
      tip: 'client'
    };

    try {
      const response = await fetch('http://localhost:5000/api/programari', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });
      
      if (response.ok) {
        setSubmitStatus('✅ Rezervare Confirmată!');
        setOccupiedSlots(prev => [...prev, selectedTime]); 
        setClientName(''); setClientPhone(''); setClientMessage('');
        setSelectedTime(null);
        setErrors({}); // Curățăm erorile
        setTimeout(() => setSubmitStatus(''), 5000);
      } else {
        setSubmitStatus('❌ Ora a fost ocupată între timp.');
      }
    } catch (err) {
      setSubmitStatus('❌ Eroare conexiune server.');
    }
  };

  if (!barber) return <div className="loading-screen">Frizer necunoscut.</div>;

  return (
    <div className="profile-page">
      <div className="profile-nav">
        <Link to="/" className="btn-back-main">← PAGINA PRINCIPALĂ</Link>
      </div>

      <div className="profile-container">
        
        {/* PARTEA STÂNGĂ - INFO */}
        <div className="profile-info-side">
          <div className="profile-hero">
            <div className="profile-img-box">
              <img src={barber.image} alt={barber.name} />
            </div>
            <h1 className="profile-name">{barber.name}</h1>
            <p className="profile-role">{barber.role}</p>
            <div className="profile-badges">
                <span>✂️ Expert Tuns</span>
                <span>⭐ 4.9 Rating</span>
            </div>
          </div>
        </div>

        {/* PARTEA DREAPTĂ - CALENDAR & FORMULAR */}
        <div className="profile-booking-side">
          <div className="booking-card-modern">
            <h2 className="booking-title">REZERVARE ONLINE</h2>
            
            <form onSubmit={handleSubmit}>
              
              <div className="month-tabs-container">
                 <div className="month-tabs-scroll">
                    {monthsList.map((m) => (
                      <button 
                        key={m.index} 
                        type="button" 
                        className={`month-tab ${selectedMonthIndex === m.index ? 'active' : ''}`} 
                        onClick={() => {
                            setSelectedMonthIndex(m.index);
                            setSelectedDate(null);
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                 </div>
              </div>

              {/* 1. SELECTOR ZI */}
              <div className="selector-section">
                <label className={`section-label ${errors.date ? 'text-error' : ''}`}>
                  1. ALEGE ZIUA {errors.date && '(Obligatoriu!)'}
                </label>
                
                <div className={`dates-scroller ${errors.date ? 'border-error-container' : ''}`}>
                  {daysInMonth.map((date, idx) => (
                    <div 
                        key={idx} 
                        // Adăugăm clasa 'error-border' dacă nu e selectată data
                        className={`date-card 
                          ${selectedDate?.fullDate === date.fullDate ? 'active' : ''} 
                          ${errors.date && !selectedDate ? 'error-border' : ''}
                        `} 
                        onClick={() => {
                          setSelectedDate(date);
                          setErrors(prev => ({...prev, date: false})); // Șterge eroarea când dă click
                        }}
                    >
                      <span className="day-name">{date.dayName}</span>
                      <span className="day-number">{date.dayNumber}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. SELECTOR ORĂ */}
              <div className="selector-section">
                <label className={`section-label ${errors.time ? 'text-error' : ''}`}>
                   2. ALEGE ORA {errors.time && '(Obligatoriu!)'}
                </label>
                {!selectedDate ? (
                    <p className="hint-text">Alege o dată din calendar.</p>
                ) : (
                    <div className="time-grid">
                    {allTimeSlots.map(t => {
                        const isTaken = occupiedSlots.includes(t);
                        return (
                        <button 
                            key={t} 
                            type="button" 
                            disabled={isTaken} 
                            className={`time-btn 
                              ${selectedTime === t ? 'active' : ''} 
                              ${isTaken ? 'occupied' : ''}
                              ${errors.time && !selectedTime ? 'error-border' : ''}
                            `} 
                            onClick={() => {
                              setSelectedTime(t);
                              setErrors(prev => ({...prev, time: false}));
                            }}
                        >
                            {t}
                        </button>
                        );
                    })}
                    </div>
                )}
              </div>

              {/* 3. INPUTS & SUBMIT */}
              <div className="final-inputs">
                
                {/* Input Nume */}
                <input 
                  type="text" 
                  placeholder={errors.name ? "⚠️ Introdu Numele!" : "Nume Complet"} 
                  className={`clean-input ${errors.name ? 'input-error' : ''}`} 
                  value={clientName} 
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if(e.target.value) setErrors(prev => ({...prev, name: false}));
                  }} 
                />
                
                {/* Input Telefon */}
                <input 
                  type="tel" 
                  placeholder={errors.phone ? "⚠️ Telefon Invalid!" : "Telefon (07xxxxxxxx)"} 
                  className={`clean-input ${errors.phone ? 'input-error' : ''}`} 
                  value={clientPhone} 
                  onChange={(e) => {
                    setClientPhone(e.target.value);
                    if(e.target.value) setErrors(prev => ({...prev, phone: false}));
                  }} 
                />
                
                <textarea 
                  placeholder="Mesaj (opțional)" 
                  className="clean-input" 
                  value={clientMessage} 
                  onChange={(e) => setClientMessage(e.target.value)} 
                  rows="2"
                ></textarea>
              </div>

              <button type="submit" className="btn-book-final">
                CONFIRMĂ PROGRAMAREA
              </button>
              
              {submitStatus && (
                <p className={`status-msg ${submitStatus.includes('✅') ? 'success' : 'error'}`}>
                    {submitStatus}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* GALERIA JOS */}
      <div className="full-width-gallery">
         <div className="gallery-header">
            <h3>Portofoliu {barber.name}</h3>
            <p>Cele mai recente tunsori realizate</p>
         </div>

         <div className={`gallery-grid-wrapper ${galleryExpanded ? 'expanded' : ''}`}>
             {barber.gallery.map((imgSrc, index) => (
               <div key={index} className="gallery-card">
                 <img src={imgSrc} alt="Lucrare" />
               </div>
             ))}
             {!galleryExpanded && <div className="gallery-fade-overlay"></div>}
         </div>

         {!galleryExpanded ? (
            <button className="btn-show-more" onClick={() => setGalleryExpanded(true)}>
              VEZI MAI MULTE LUCRĂRI ↓
            </button>
         ) : (
            <button className="btn-show-more" onClick={() => setGalleryExpanded(false)}>
              STRÂNGE GALERIA ↑
            </button>
         )}
      </div>
    </div>
  );
}

export default BarberProfile;