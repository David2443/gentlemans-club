const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;
const SECRET_KEY = "GENTLEMAN_SUPER_SECRET_2026"; // Cheia secretă pentru token

// ===================================================
// 1. MIDDLEWARE (Configurări de bază)
// ===================================================
app.use(cors()); // Permite site-ului (React) să vorbească cu serverul
app.use(express.json()); // Permite serverului să înțeleagă datele JSON

// ===================================================
// 2. CONEXIUNE MONGODB ATLAS
// ===================================================
const mongoURI = "mongodb+srv://admin:catasto7777@cluster0.ezby8jx.mongodb.net/barbershop?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoURI)
  .then(() => console.log("✅ [DB] Conectat cu SUCCES la MongoDB Atlas"))
  .catch(err => console.log("❌ [DB] Eroare conexiune:", err));

// ===================================================
// 3. MODELE (Tabelele din Baza de Date)
// ===================================================

// Tabel Utilizatori (Frizeri + Admin)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nume: String,
  isAdmin: { type: Boolean, default: false } // <--- CÂMP NOU
});
const User = mongoose.model('User', userSchema);

// Tabel Programări
const programareSchema = new mongoose.Schema({
  nume_client: String,
  telefon: String,
  frizer: String, // Trebuie să fie identic cu 'nume' din User
  data: String,   // Format: YYYY-MM-DD
  ora: String,    // Format: HH:MM
  mesaj: String,
  tip: { type: String, default: 'client' } // 'client' (site) sau 'blocat' (pauză)
});
const Programare = mongoose.model('Programare', programareSchema);

// Tabel Contact (Mesaje)
const contactSchema = new mongoose.Schema({
  nume: String,
  telefon: String,
  mesaj: String,
  data: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', contactSchema);

// ===================================================
// 4. SECURITATE (PAZNICUL / MIDDLEWARE)
// ===================================================
// Această funcție blochează accesul dacă nu ai Token valid
const verificaToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; // Vine ca: "Bearer tokenul..."
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ succes: false, mesaj: "⛔ Acces interzis! Nu ești logat." });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ succes: false, mesaj: "⛔ Sesiune expirată! Loghează-te iar." });
    }
    req.user = user; // Salvăm userul ca să știm cine a făcut cererea
    next(); // Permitem accesul mai departe
  });
};

// ===================================================
// 5. RUTE API (Comenzile serverului)
// ===================================================

// --- A. LOGIN (Autentificare) ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ succes: false, mesaj: "User inexistent!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ succes: false, mesaj: "Parolă greșită!" });

    const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, { expiresIn: '1d' });
    
    // Trimitem și isAdmin la frontend
    res.json({ succes: true, token, nume: user.nume, isAdmin: user.isAdmin });
  } catch (err) { res.status(500).json({ eroare: err.message }); }
});

// --- B. SETUP ECHIPA (Rulează o dată: http://localhost:5000/api/setup-toti) ---
app.get('/api/setup-toti', async (req, res) => {
  try {
    await User.deleteMany({}); 

    const p1 = await bcrypt.hash("andrei2026", 10);
    const p2 = await bcrypt.hash("alex2026", 10); // Parola lui Alex
    const p3 = await bcrypt.hash("mihai2026", 10);

    const users = [
      { 
        username: "andrei", 
        password: p1, 
        nume: "Andrei Radu",
        isAdmin: false 
      },
      { 
        username: "alex",   
        password: p2, 
        nume: "Alexandru Popescu",
        isAdmin: true // <--- ALEX E BOSSUL ACUM
      },
      { 
        username: "mihai",  
        password: p3, 
        nume: "Mihai Ionescu",
        isAdmin: false
      }
    ];

    await User.insertMany(users);
    res.send("✅ GATA! Alex e Master acum.");
  } catch (err) { res.send("❌ Eroare: " + err.message); }
});

// --- C. PROGRAMĂRI - POST (PUBLIC - Pentru Clienți) ---
// NU punem 'verificaToken' aici, ca să poată rezerva oricine de pe site!
app.post('/api/programari', async (req, res) => {
  console.log("-----------------------------------------");
  console.log("📥 CERERE NOUĂ: Se încearcă o programare...");
  console.log("📦 Date primite:", req.body);

  if (!req.body.nume_client || !req.body.telefon || !req.body.frizer) {
    console.error("⚠️  Date incomplete!");
    return res.status(400).json({ succes: false, mesaj: "Date incomplete!" });
  }

  try {
    const nouaProgramare = new Programare(req.body);
    const rezultat = await nouaProgramare.save();
    
    console.log("✅ SUCCES: Programarea a fost salvată! ID:", rezultat._id);
    res.status(201).json({ succes: true, mesaj: "Programare reușită!" });
  } catch (err) {
    console.error("❌ EROARE MONGO:", err);
    res.status(500).json({ succes: false, eroare: err.message });
  }
  console.log("-----------------------------------------");
});

// --- D. PROGRAMĂRI - GET (PROTEJAT - Doar Adminii văd lista) ---
// Aici avem 'verificaToken'
app.get('/api/programari', verificaToken, async (req, res) => {
  try {
    // Returnăm tot, sortat după dată și oră
    const toate = await Programare.find().sort({ data: 1, ora: 1 });
    res.json(toate);
  } catch (err) { res.status(500).send(err); }
});

// --- E. VERIFICARE ORE OCUPATE (PUBLIC - Pentru Calendarul din Site) ---
app.get('/api/ocupate', async (req, res) => {
  try {
    const { frizer, data } = req.query;
    console.log(`🔎 Verific ore ocupate pentru ${frizer} pe ${data}`);
    
    const ocupate = await Programare.find({ frizer, data });
    const ore = ocupate.map(p => p.ora); // Extragem doar orele (ex: ["10:00", "12:00"])
    
    res.json(ore);
  } catch (err) { res.status(500).send(err); }
});

// --- F. ȘTERGERE PROGRAMARE (PROTEJAT - Doar Adminii pot șterge) ---
app.delete('/api/programari/:id', verificaToken, async (req, res) => {
  try {
    await Programare.findByIdAndDelete(req.params.id);
    console.log(`🗑️  Programare ștearsă: ${req.params.id}`);
    res.json({ mesaj: "Șters cu succes!" });
  } catch (err) { res.status(500).send(err); }
});

// --- G. MESAJE CONTACT (Public la scriere, Protejat la citire) ---
app.post('/api/contact', async (req, res) => {
  try {
    const msg = new Contact(req.body);
    await msg.save();
    console.log("📩 Mesaj nou de contact salvat.");
    res.status(201).json({ succes: true });
  } catch (err) { res.status(500).json({ eroare: err.message }); }
});

app.get('/api/contact', verificaToken, async (req, res) => {
  const mesaje = await Contact.find().sort({ data: -1 });
  res.json(mesaje);
});

app.delete('/api/contact/:id', verificaToken, async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  res.json({ mesaj: "Mesaj șters!" });
});

// ===================================================
// 6. PORNIRE SERVER
// ===================================================
app.listen(PORT, () => {
  console.log(`🚀 Serverul GENTLEMAN rulează pe http://localhost:${PORT}`);
});