// server/index.js
require('dotenv').config();

const dns = require('dns');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { v2: cloudinary } = require('cloudinary');
const app = express();

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'GENTLEMANS_CLUB_SUPER_SECRET_2026_CHANGE_ME';
const SETUP_KEY = process.env.SETUP_KEY;const mongoURI = process.env.MONGO_URI;
const IS_PRODUCTION = NODE_ENV === 'production';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

const CLOUDINARY_ENABLED = Boolean(
  CLOUDINARY_CLOUD_NAME &&
  CLOUDINARY_API_KEY &&
  CLOUDINARY_API_SECRET
);

if (!CLOUDINARY_ENABLED) {
  console.warn('⚠️ Cloudinary nu este configurat. Upload-ul în galerie nu va merge pe cloud.');
} else {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true
  });

  console.log('☁️ Cloudinary activ pentru galerie.');
}
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'gc_session';
const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const COOKIE_SAME_SITE = process.env.COOKIE_SAMESITE || (IS_PRODUCTION ? 'none' : 'lax');
const COOKIE_SECURE =
  process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : IS_PRODUCTION;

if (!mongoURI) {
  console.error('❌ Lipsește MONGO_URI din fișierul .env');
  process.exit(1);
}

if (IS_PRODUCTION && SECRET_KEY.includes('CHANGE_ME')) {
  console.error('❌ În producție trebuie să schimbi SECRET_KEY în .env');
  process.exit(1);
}

if (SECRET_KEY.length < 32) {
  console.warn('⚠️ SECRET_KEY este cam scurt. Recomand minim 32 caractere.');
}
const requireStrongEnv = (name, minLength = 12) => {
  const value = process.env[name];

  if (!value || String(value).trim().length < minLength) {
    console.error(`❌ ${name} lipsește din .env sau este prea scurt. Minim ${minLength} caractere.`);
    process.exit(1);
  }

  return String(value).trim();
};

if (!SETUP_KEY || SETUP_KEY.length < 24) {
  console.error('❌ SETUP_KEY trebuie setat în .env și să aibă minim 24 caractere.');
  process.exit(1);
}
if (process.env.TRUST_PROXY === 'true' || IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

/* =====================================================
   SECURITY CONFIG
===================================================== */

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.disable('x-powered-by');

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false
  })
);

app.use(compression());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (!IS_PRODUCTION) {
        return callback(null, true);
      }

      const allowed = allowedOrigins.length ? allowedOrigins : defaultDevOrigins;

      if (allowed.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS blocat pentru acest origin.'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: COOKIE_SAME_SITE,
  path: '/',
  maxAge: SESSION_MAX_AGE_MS
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: COOKIE_SAME_SITE,
  path: '/'
});

const parseCookies = (cookieHeader = '') => {
  return String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf('=');

      if (index === -1) return acc;

      const key = part.slice(0, index).trim();
      const rawValue = part.slice(index + 1).trim();

      try {
        acc[key] = decodeURIComponent(rawValue);
      } catch {
        acc[key] = rawValue;
      }

      return acc;
    }, {});
};

const getTokenFromCookie = (req) => {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[AUTH_COOKIE_NAME] || '';
};

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());
};

/*
  Sanitizare MongoDB safe pentru Express 5.
  NU atingem req.query, fiindcă în Express 5 poate fi getter-only.
  Query-urile sunt curățate în rute cu sanitizeText().
*/
const sanitizeMongoObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    obj.forEach((item) => sanitizeMongoObject(item));
    return obj;
  }

  Object.keys(obj).forEach((key) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      delete obj[key];
      return;
    }

    const value = obj[key];

    const cleanKey = key
      .replace(/\$/g, '')
      .replace(/\./g, '_');

    if (cleanKey !== key) {
      obj[cleanKey] = value;
      delete obj[key];
    }

    if (obj[cleanKey] && typeof obj[cleanKey] === 'object') {
      sanitizeMongoObject(obj[cleanKey]);
    }
  });

  return obj;
};

const mongoSanitizeSafe = (req, res, next) => {
  try {
    if (req.body) sanitizeMongoObject(req.body);
    if (req.params) sanitizeMongoObject(req.params);

    next();
  } catch (err) {
    next(err);
  }
};

app.use(mongoSanitizeSafe);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PRODUCTION ? 650 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    succes: false,
    mesaj: 'Prea multe cereri. Încearcă din nou mai târziu.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PRODUCTION ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    succes: false,
    mesaj: 'Prea multe încercări. Încearcă mai târziu.'
  }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PRODUCTION ? 35 : 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    succes: false,
    mesaj: 'Prea multe upload-uri. Încearcă mai târziu.'
  }
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PRODUCTION ? 12 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    succes: false,
    mesaj: 'Ai trimis prea multe mesaje. Încearcă mai târziu.'
  }
});

app.use('/api', globalLimiter);

/* =====================================================
   UPLOADS STATIC
===================================================== */

const uploadsRoot = path.join(__dirname, 'uploads');
const galerieUploadDir = path.join(uploadsRoot, 'galerie');

fs.mkdirSync(galerieUploadDir, { recursive: true });

app.use(
  '/uploads',
  express.static(uploadsRoot, {
    dotfiles: 'deny',
    index: false,
    maxAge: '7d',
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=604800');
    }
  })
);

/* =====================================================
   MONGODB
===================================================== */

console.log('⏳ Se conectează la MongoDB Atlas...');

mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 15000
  })
  .then(() => console.log('✅ Conectat cu succes la MongoDB Atlas!'))
  .catch((err) => {
    console.error('❌ Eroare DB:', err.message);
    process.exit(1);
  });

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB runtime error:', err.message);
});

/* =====================================================
   ECHIPA OFICIALĂ
===================================================== */

const BARBER_SERVICES = [
  'Tuns',
  'Tuns + barbă',
  'Barbă',
  'Vopsit barbă',
  'Spălat',
  'Contur / aranjat barbă',
  'Styling',
  'Pachet VIP'
];

const BROW_SERVICES = [
  'Pensat',
  'Pensat + vopsit',
  'Pensat + păr nas',
  'Tratament facial',
  'Pachet complet',
  'Șuvițe',
  'Global / total — o culoare',
  'Global / total — model'
];

const TEAM_BARBERS = [
  {
    barberId: 'dani-frizeru',
    username: 'dani',
    password: requireStrongEnv('PASS_DANI', 12),   
    nume: 'Dani Frizeru',
    displayName: 'Dani Frizeru',
    role: 'Master Barber',
    specialty: 'Stil. Încredere. Distincție.',
    description: 'Nu este doar o tunsoare, este o experiență.',
    image: '/dani-frizeru.png',
    isMaster: true,
    isAdmin: true,
    order: 1,
    services: BARBER_SERVICES
  },
  {
    barberId: 'flavius-frizeru',
    username: 'flavius',
    password: requireStrongEnv('PASS_FLAVIUS', 12),
    nume: 'Flavius Frizeru',
    displayName: 'Flavius Frizeru',
    role: 'Barber Specialist',
    specialty: 'Tunsori moderne, fade-uri curate și barbă aranjată impecabil.',
    description: 'Mai mult decât o tunsoare, e despre stilul tău.',
    image: '/flavius-frizeru.png',
    isMaster: false,
    isAdmin: false,
    order: 2,
    services: BARBER_SERVICES
  },
  {
    barberId: 'alex-frizeru',
    username: 'alex',
    password: requireStrongEnv('PASS_ALEX', 12),
    nume: 'Alex Frizeru',
    displayName: 'Alex Frizeru',
    role: 'Premium Barber',
    specialty: 'Tunsori premium, bărbi perfecte, stil și eleganță.',
    description: 'Stil premium, detalii curate și finisaj elegant.',
    image: '/alex-frizeru.png',
    isMaster: false,
    isAdmin: false,
    order: 3,
    services: BARBER_SERVICES
  },
  {
    barberId: 'vali-frizeru',
    username: 'vali',
    password: requireStrongEnv('PASS_VALI', 12),
    nume: 'Vali Frizeru',
    displayName: 'Vali Frizeru',
    role: 'Barber Specialist',
    specialty: 'Tuns bărbați, barbă & contur, styling profesional.',
    description: 'Stilul tău, semnătura noastră.',
    image: '/vali-frizeru.png',
    isMaster: false,
    isAdmin: false,
    order: 4,
    services: BARBER_SERVICES
  },
  {
    barberId: 'pensat-precis',
    username: 'pensat',
    password: requireStrongEnv('PASS_PENSAT', 12),
    nume: 'Pensat Precis',
    displayName: 'Pensat Precis',
    role: 'Brow Specialist',
    specialty: 'Pensat precis, formă curată și detaliu premium.',
    description: 'Detaliul face diferența.',
    image: '/pensat-precis.png',
    isMaster: false,
    isAdmin: false,
    order: 5,
    services: BROW_SERVICES
  }
];

const ORE_PROGRAM_STANDARD = [
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

const ORE_PROGRAM_EXTINS_HALF_HOUR = [
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

const BARBERI_PROGRAM_EXTINS = ['alex-frizeru', 'vali-frizeru'];

const getOreProgramPentruBarber = (barberId) => {
  return BARBERI_PROGRAM_EXTINS.includes(barberId)
    ? ORE_PROGRAM_EXTINS_HALF_HOUR
    : ORE_PROGRAM_STANDARD;
};

const isOraValidaPentruBarber = (barberId, ora) => {
  return getOreProgramPentruBarber(barberId).includes(ora);
};

const STATUS_PROGRAMARE = ['noua', 'confirmata', 'anulata', 'finalizata', 'blocat'];
const TIP_PROGRAMARE = ['client', 'blocat'];

/* =====================================================
   HELPERS
===================================================== */

const sanitizeText = (value, maxLength = 400) => {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
};

const normalizeText = (value) => {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const normalizeUsername = (value) => {
  return sanitizeText(value, 40).toLowerCase();
};

const isValidDateString = (value) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
};

const isValidPhone = (value) => {
  const clean = String(value || '').replace(/\s+/g, '');
  return /^(07\d{8}|\+407\d{8})$/.test(clean);
};

const cleanPhone = (value) => {
  return String(value || '').replace(/\s+/g, '').trim();
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

const getBaseUrl = (req) => {
  return `${req.protocol}://${req.get('host')}`;
};

const normalizeBarberId = (value) => {
  if (!value) return '';

  const raw = String(value).trim();

  const known = TEAM_BARBERS.find((barber) => {
    const values = [
      barber.barberId,
      barber.username,
      barber.nume,
      barber.displayName
    ];

    return values.some((item) => normalizeText(item) === normalizeText(raw));
  });

  return known ? known.barberId : raw;
};

const getTeamBarberById = (barberId) => {
  return TEAM_BARBERS.find((barber) => barber.barberId === barberId) || null;
};

const publicBarberFields = '-__v -createdAt -updatedAt';

const safeUserResponse = (user) => {
  return {
    id: user._id,
    username: user.username,
    nume: user.nume,
    barberId: user.barberId,
    role: user.role,
    image: user.image,
    isAdmin: user.isAdmin,
    isMaster: user.isMaster,
    activ: user.activ
  };
};

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return null;

  return numberValue;
};

const parseBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;

  if (typeof value === 'boolean') return value;

  const normalized = String(value).toLowerCase().trim();

  if (['true', '1', 'yes', 'da'].includes(normalized)) return true;
  if (['false', '0', 'no', 'nu'].includes(normalized)) return false;

  return fallback;
};

const canAccessBarberResource = (user, barberId) => {
  if (!user) return false;
  if (user.isAdmin || user.isMaster) return true;

  return user.barberId === barberId;
};

/* =====================================================
   SCHEME MONGODB
===================================================== */

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 40
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    nume: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    barberId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 80
    },
    role: {
      type: String,
      default: 'Barber',
      maxlength: 80
    },
    image: {
      type: String,
      default: '',
      maxlength: 500
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    isMaster: {
      type: Boolean,
      default: false
    },
    activ: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

const barberSchema = new mongoose.Schema(
  {
    barberId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 80
    },
    nume: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    displayName: {
      type: String,
      maxlength: 120
    },
    role: {
      type: String,
      maxlength: 80
    },
    specialty: {
      type: String,
      maxlength: 250
    },
    description: {
      type: String,
      maxlength: 500
    },
    image: {
      type: String,
      maxlength: 500
    },
    isMaster: {
      type: Boolean,
      default: false
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    activ: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 99
    },
    services: [
      {
        type: String,
        maxlength: 120
      }
    ],
    program: {
      luni: { type: String, default: '09:00 - 20:00' },
      marti: { type: String, default: '09:00 - 20:00' },
      miercuri: { type: String, default: '09:00 - 20:00' },
      joi: { type: String, default: '09:00 - 20:00' },
      vineri: { type: String, default: '09:00 - 20:00' },
      sambata: { type: String, default: '09:00 - 16:00' },
      duminica: { type: String, default: 'Închis' }
    }
  },
  { timestamps: true }
);

barberSchema.index({ barberId: 1 });
barberSchema.index({ order: 1 });

const Barber = mongoose.model('Barber', barberSchema);

const programareSchema = new mongoose.Schema(
  {
    nume_client: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    telefon: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40
    },
    barberId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    frizer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    data: {
      type: String,
      required: true,
      trim: true
    },
    ora: {
      type: String,
      required: true,
      trim: true
    },
    mesaj: {
      type: String,
      default: '',
      maxlength: 700
    },
    serviciu: {
      type: String,
      default: '',
      maxlength: 180
    },
    pret: {
      type: String,
      default: '',
      maxlength: 60
    },
    pretValoare: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: STATUS_PROGRAMARE,
      default: 'noua'
    },
    tip: {
      type: String,
      enum: TIP_PROGRAMARE,
      default: 'client'
    }
  },
  { timestamps: true }
);

programareSchema.index({ barberId: 1, data: 1 });
programareSchema.index({ barberId: 1, data: 1, ora: 1 });
programareSchema.index({ data: -1 });
programareSchema.index({ status: 1, data: -1 });


const Programare = mongoose.model('Programare', programareSchema);

const contactSchema = new mongoose.Schema(
  {
    nume: {
      type: String,
      trim: true,
      maxlength: 120
    },
    telefon: {
      type: String,
      trim: true,
      maxlength: 40
    },
    mesaj: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    data: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

contactSchema.index({ data: -1 });

const Contact = mongoose.model('Contact', contactSchema);

const galerieSchema = new mongoose.Schema(
  {
    barberId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    frizer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    url: {
      type: String,
      required: true,
      maxlength: 1000
    },
    thumbnailUrl: {
      type: String,
      default: '',
      maxlength: 1000
    },
    filename: {
      type: String,
      default: '',
      maxlength: 500
    },
    publicId: {
      type: String,
      default: '',
      maxlength: 500
    },
    originalName: {
      type: String,
      maxlength: 300
    },
    mimeType: {
      type: String,
      maxlength: 80
    },
    size: {
      type: Number,
      default: 0
    },
    width: {
      type: Number,
      default: null
    },
    height: {
      type: Number,
      default: null
    },
    format: {
      type: String,
      default: '',
      maxlength: 40
    },
    storage: {
      type: String,
      enum: ['local', 'url', 'cloudinary'],
      default: 'local'
    },
    data: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

galerieSchema.index({ barberId: 1, data: -1 });
galerieSchema.index({ data: -1 });

const Galerie = mongoose.model('Galerie', galerieSchema);

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 700
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5
    },
    avatar: {
      type: String,
      default: '',
      maxlength: 500
    },
    dateLabel: {
      type: String,
      default: 'Recent',
      maxlength: 80
    },
    active: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 99
    }
  },
  { timestamps: true }
);

reviewSchema.index({ active: 1, order: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

/* =====================================================
   AUTH MIDDLEWARE
===================================================== */

const verificaToken = async (req, res, next) => {
  try {
    const token = getTokenFromCookie(req);

    if (!token) {
      return res.status(401).json({
        succes: false,
        mesaj: 'Acces interzis. Sesiune lipsă.'
      });
    }

    const decoded = jwt.verify(token, SECRET_KEY);

    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.activ) {
      clearAuthCookie(res);

      return res.status(403).json({
        succes: false,
        mesaj: 'User inactiv sau inexistent.'
      });
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      nume: user.nume,
      barberId: user.barberId,
      role: user.role,
      image: user.image,
      isAdmin: user.isAdmin,
      isMaster: user.isMaster
    };

    next();
  } catch {
    clearAuthCookie(res);

    return res.status(403).json({
      succes: false,
      mesaj: 'Sesiune expirată sau invalidă.'
    });
  }
};

const optionalToken = async (req, res, next) => {
  try {
    const token = getTokenFromCookie(req);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.activ) {
      req.user = null;
      return next();
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      nume: user.nume,
      barberId: user.barberId,
      role: user.role,
      image: user.image,
      isAdmin: user.isAdmin,
      isMaster: user.isMaster
    };

    next();
  } catch {
    req.user = null;
    next();
  }
};

const verificaAdmin = (req, res, next) => {
  if (!req.user || (!req.user.isAdmin && !req.user.isMaster)) {
    return res.status(403).json({
      succes: false,
      mesaj: 'Ai nevoie de drepturi de master/admin.'
    });
  }

  next();
};

/* =====================================================
   MULTER GALERIE
===================================================== */

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

const storageGalerie = multer.memoryStorage();

const fileFilterGalerie = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
    return cb(new Error('Sunt permise doar imagini JPG, PNG sau WEBP.'));
  }

  cb(null, true);
};

const uploadGalerie = multer({
  storage: storageGalerie,
  fileFilter: fileFilterGalerie,
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 12
  }
}).fields([
  { name: 'images', maxCount: 12 },
  { name: 'image', maxCount: 1 }
]);

const uploadBufferToCloudinary = (file, barberId) => {
  return new Promise((resolve, reject) => {
    const randomName = `${Date.now()}-${crypto.randomBytes(10).toString('hex')}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `gentlemans-club/galerie/${barberId}`,
        public_id: randomName,
        resource_type: 'image',
        overwrite: false
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

const getOptimizedCloudinaryUrl = (publicId) => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: 1600,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto'
      }
    ]
  });
};
const getThumbnailCloudinaryUrl = (publicId) => {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: 600,
        height: 800,
        crop: 'fill',
        gravity: 'auto',
        quality: 'auto',
        fetch_format: 'auto'
      }
    ]
  });
};
/* =====================================================
   SETUP
===================================================== */

const runSetup = async () => {
  const rezultate = [];

  for (const barber of TEAM_BARBERS) {
    const hashedPassword = await bcrypt.hash(barber.password, 12);

    const user = await User.findOneAndUpdate(
      { username: barber.username },
      {
        username: barber.username,
        password: hashedPassword,
        nume: barber.nume,
        barberId: barber.barberId,
        role: barber.role,
        image: barber.image,
        isAdmin: barber.isAdmin,
        isMaster: barber.isMaster,
        activ: true
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    const barberProfile = await Barber.findOneAndUpdate(
      { barberId: barber.barberId },
      {
        barberId: barber.barberId,
        nume: barber.nume,
        displayName: barber.displayName,
        role: barber.role,
        specialty: barber.specialty,
        description: barber.description,
        image: barber.image,
        isAdmin: barber.isAdmin,
        isMaster: barber.isMaster,
        activ: true,
        order: barber.order,
        services: barber.services
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    rezultate.push({
      username: user.username,
      nume: barberProfile.nume,
      barberId: barberProfile.barberId,
      isAdmin: user.isAdmin,
      isMaster: user.isMaster
    });
  }

  return rezultate;
};

app.get('/api/setup-gentleman', authLimiter, async (req, res) => {
  try {
    if (IS_PRODUCTION && process.env.ENABLE_SETUP !== 'true') {
      return res.status(404).json({
        succes: false,
        mesaj: 'Setup este dezactivat în producție.'
      });
    }

    const key = String(req.query.key || '');

    if (key !== SETUP_KEY) {
      return res.status(403).json({
        succes: false,
        mesaj: 'Setup key greșit.'
      });
    }

    const conturi = await runSetup();

    res.json({
      succes: true,
      mesaj: 'Setup complet. Userii și frizerii au fost creați/actualizați fără să se șteargă galeria/programările.',
      conturi
    });
  } catch (err) {
    console.error('EROARE SETUP:', err);

    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la setup.',
      eroare: IS_PRODUCTION ? undefined : err.message
    });
  }
});

app.get('/api/setup-toti', authLimiter, async (req, res) => {
  try {
    const key = String(req.query.key || '');

    if (key !== SETUP_KEY) {
      return res.status(403).send('Setup key greșit.');
    }

    const conturi = await runSetup();

    res.json({
      succes: true,
      mesaj: 'Setup compatibil complet.',
      conturi
    });
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare setup compatibil.',
      eroare: IS_PRODUCTION ? undefined : err.message
    });
  }
});

/* =====================================================
   AUTH
===================================================== */

app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || '');

    if (!username || !password) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Username și parolă sunt obligatorii.'
      });
    }

    const user = await User.findOne({
      username,
      activ: true
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        succes: false,
        mesaj: 'Username sau parolă greșită.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        succes: false,
        mesaj: 'Username sau parolă greșită.'
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString()
      },
      SECRET_KEY,
      {
        expiresIn: '12h'
      }
    );

    setAuthCookie(res, token);

    const safeUser = safeUserResponse(user);

    res.json({
      succes: true,
      mesaj: 'Login reușit.',
      user: safeUser,
      ...safeUser
    });
  } catch (err) {
    console.error('EROARE LOGIN:', err);

    res.status(500).json({
      succes: false,
      mesaj: 'Eroare server la login.'
    });
  }
});

app.get('/api/me', verificaToken, async (req, res) => {
  res.json({
    succes: true,
    user: req.user
  });
});

app.post('/api/logout', async (req, res) => {
  clearAuthCookie(res);

  res.json({
    succes: true,
    mesaj: 'Deconectare reușită.'
  });
});

/* =====================================================
   BARBERI
===================================================== */

app.get('/api/barberi', async (req, res) => {
  try {
    const barberi = await Barber.find({ activ: true })
      .select(publicBarberFields)
      .sort({ order: 1, nume: 1 });

    res.json({
      succes: true,
      barberi
    });
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la citirea frizerilor.'
    });
  }
});

app.get('/api/barberi/:barberId', async (req, res) => {
  try {
    const barberId = normalizeBarberId(req.params.barberId);

    const barber = await Barber.findOne({
      barberId,
      activ: true
    }).select(publicBarberFields);

    if (!barber) {
      return res.status(404).json({
        succes: false,
        mesaj: 'Frizerul nu există.'
      });
    }

    res.json({
      succes: true,
      barber
    });
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la citirea frizerului.'
    });
  }
});

app.patch('/api/barberi/:barberId', verificaToken, verificaAdmin, async (req, res) => {
  try {
    const barberId = normalizeBarberId(req.params.barberId);

    const allowed = [
      'nume',
      'displayName',
      'role',
      'specialty',
      'description',
      'image',
      'isMaster',
      'activ',
      'order',
      'services',
      'program'
    ];

    const update = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[key] = req.body[key];
      }
    }

    if (update.nume) update.nume = sanitizeText(update.nume, 120);
    if (update.displayName) update.displayName = sanitizeText(update.displayName, 120);
    if (update.role) update.role = sanitizeText(update.role, 80);
    if (update.specialty) update.specialty = sanitizeText(update.specialty, 250);
    if (update.description) update.description = sanitizeText(update.description, 500);

    const barber = await Barber.findOneAndUpdate(
      { barberId },
      update,
      { new: true }
    ).select(publicBarberFields);

    if (!barber) {
      return res.status(404).json({
        succes: false,
        mesaj: 'Frizerul nu există.'
      });
    }

    await User.findOneAndUpdate(
      { barberId },
      {
        nume: barber.nume,
        role: barber.role,
        image: barber.image,
        isMaster: barber.isMaster
      }
    );

    res.json({
      succes: true,
      mesaj: 'Profil actualizat.',
      barber
    });
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la actualizarea profilului.'
    });
  }
});

/* =====================================================
   PROGRAMĂRI
===================================================== */

app.post('/api/programari', optionalToken, async (req, res) => {
  try {
    const finalBarberId = normalizeBarberId(req.body.barberId || req.body.frizer);
    const data = sanitizeText(req.body.data, 20);
    const ora = sanitizeText(req.body.ora, 20);

    const requestedTip = sanitizeText(req.body.tip, 30);
    const tip = req.user && requestedTip === 'blocat' ? 'blocat' : 'client';

    if (!finalBarberId || !data || !ora) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Date incomplete.'
      });
    }

    if (!isValidDateString(data)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Data este invalidă.'
      });
    }

    if (!isOraValidaPentruBarber(finalBarberId, ora)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Ora este invalidă.'
      });
    }

    const barber = await Barber.findOne({
      barberId: finalBarberId,
      activ: true
    });

    if (!barber) {
      return res.status(404).json({
        succes: false,
        mesaj: 'Specialistul ales nu există.'
      });
    }

    if (tip === 'blocat') {
      if (!req.user) {
        return res.status(401).json({
          succes: false,
          mesaj: 'Trebuie să fii autentificat pentru blocări.'
        });
      }

      if (!canAccessBarberResource(req.user, finalBarberId)) {
        return res.status(403).json({
          succes: false,
          mesaj: 'Nu poți bloca programul altui specialist.'
        });
      }
    }

    if (tip === 'client' && req.user && !canAccessBarberResource(req.user, finalBarberId)) {
      return res.status(403).json({
        succes: false,
        mesaj: 'Nu poți adăuga programări pentru alt specialist.'
      });
    }

    const numeClient = tip === 'blocat'
      ? sanitizeText(req.body.nume_client || 'PAUZĂ / BLOCAT', 120)
      : sanitizeText(req.body.nume_client, 120);

    const telefon = tip === 'blocat'
      ? 'N/A'
      : cleanPhone(req.body.telefon);

    if (!numeClient || !telefon) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Numele și telefonul sunt obligatorii.'
      });
    }

    if (tip === 'client' && !isValidPhone(telefon)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Telefon invalid. Folosește 07xxxxxxxx sau +407xxxxxxxx.'
      });
    }

    const dejaExista = await Programare.findOne({
      barberId: finalBarberId,
      data,
      ora,
      status: { $ne: 'anulata' }
    });

    if (dejaExista) {
      return res.status(409).json({
        succes: false,
        mesaj: 'Ora este deja ocupată.'
      });
    }

    const pret = sanitizeText(req.body.pret, 60);
    const pretValoare = parseOptionalNumber(req.body.pretValoare);

    const nouaProgramare = await Programare.create({
      nume_client: numeClient,
      telefon,
      barberId: finalBarberId,
      frizer: barber.nume,
      data,
      ora,
      mesaj: sanitizeText(req.body.mesaj, 700),
      serviciu: sanitizeText(req.body.serviciu, 180),
      pret,
      pretValoare,
      tip,
      status: tip === 'blocat' ? 'blocat' : 'noua'
    });

    res.status(201).json({
      succes: true,
      mesaj: tip === 'blocat' ? 'Ora a fost blocată.' : 'Programare reușită!',
      programare: nouaProgramare
    });
  } catch (err) {
    console.error('EROARE PROGRAMARE:', err);

    res.status(500).json({
      succes: false,
      mesaj: 'Eroare server la programare.'
    });
  }
});

app.get('/api/programari', verificaToken, async (req, res) => {
  try {
    const {
      from,
      to,
      barberId,
      status,
      limit = '300',
      page = '1'
    } = req.query;

    const query = {};

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 300, 1), 500);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    if (req.user?.isAdmin || req.user?.isMaster) {
      if (barberId && barberId !== 'all') {
        const finalBarberId = normalizeBarberId(barberId);

        if (!getTeamBarberById(finalBarberId)) {
          return res.status(400).json({
            succes: false,
            mesaj: 'Specialist invalid.'
          });
        }

        query.barberId = finalBarberId;
      }
    } else {
      query.barberId = req.user.barberId;
    }

    if (from || to) {
      query.data = {};

      if (from) {
        if (!isValidDateString(from)) {
          return res.status(400).json({
            succes: false,
            mesaj: 'Data de început este invalidă.'
          });
        }

        query.data.$gte = from;
      }

      if (to) {
        if (!isValidDateString(to)) {
          return res.status(400).json({
            succes: false,
            mesaj: 'Data de final este invalidă.'
          });
        }

        query.data.$lte = to;
      }
    }

    if (status && status !== 'all') {
      if (!STATUS_PROGRAMARE.includes(status)) {
        return res.status(400).json({
          succes: false,
          mesaj: 'Status invalid.'
        });
      }

      query.status = status;
    }

    const [programari, total] = await Promise.all([
      Programare.find(query)
        .sort({ data: -1, ora: -1, createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),

      Programare.countDocuments(query)
    ]);

    res.json({
      succes: true,
      programari,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: skip + programari.length < total
    });
  } catch (err) {
    console.error('Eroare GET /api/programari:', err);

    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la încărcarea programărilor.'
    });
  }
});

app.get('/api/ocupate', async (req, res) => {
  try {
    const finalBarberId = normalizeBarberId(req.query.barberId || req.query.frizer);
    const data = sanitizeText(req.query.data, 20);

    if (!finalBarberId || !data || !isValidDateString(data)) {
      return res.json([]);
    }

    const ocupate = await Programare.find({
      barberId: finalBarberId,
      data,
      status: { $ne: 'anulata' }
    }).select('ora');

    res.json(ocupate.map((p) => p.ora));
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la citirea orelor ocupate.'
    });
  }
});

app.patch('/api/programari/:id/status', verificaToken, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'ID invalid.'
      });
    }

    const status = sanitizeText(req.body.status, 30);

    if (!STATUS_PROGRAMARE.includes(status)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Status invalid.'
      });
    }

    const programare = await Programare.findById(req.params.id);

    if (!programare) {
      return res.status(404).json({
        succes: false,
        mesaj: 'Programarea nu există.'
      });
    }

    if (!canAccessBarberResource(req.user, programare.barberId)) {
      return res.status(403).json({
        succes: false,
        mesaj: 'Nu ai voie să modifici această programare.'
      });
    }

    programare.status = status;
    await programare.save();

    res.json({
      succes: true,
      mesaj: 'Status actualizat.',
      programare
    });
  } catch (err) {
    console.error('Eroare status programare:', err);

    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la actualizarea statusului.'
    });
  }
});

app.patch('/api/programari/:id', verificaToken, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'ID invalid.'
      });
    }

    const programare = await Programare.findById(req.params.id);

    if (!programare) {
      return res.status(404).json({
        succes: false,
        mesaj: 'Programarea nu există.'
      });
    }

    if (!canAccessBarberResource(req.user, programare.barberId)) {
      return res.status(403).json({
        succes: false,
        mesaj: 'Nu ai voie să modifici această programare.'
      });
    }

    const nextData = req.body.data !== undefined
      ? sanitizeText(req.body.data, 20)
      : programare.data;

    const nextOra = req.body.ora !== undefined
      ? sanitizeText(req.body.ora, 20)
      : programare.ora;

    if (!isValidDateString(nextData)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Data este invalidă.'
      });
    }

    if (!isOraValidaPentruBarber(programare.barberId, nextOra)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Ora este invalidă.'
      });
    }

    if (nextData !== programare.data || nextOra !== programare.ora) {
      const exista = await Programare.findOne({
        _id: { $ne: programare._id },
        barberId: programare.barberId,
        data: nextData,
        ora: nextOra,
        status: { $ne: 'anulata' }
      });

      if (exista) {
        return res.status(409).json({
          succes: false,
          mesaj: 'Ora aleasă este deja ocupată.'
        });
      }
    }

    if (req.body.nume_client !== undefined) {
      const numeClient = sanitizeText(req.body.nume_client, 120);

      if (!numeClient) {
        return res.status(400).json({
          succes: false,
          mesaj: 'Numele clientului este obligatoriu.'
        });
      }

      programare.nume_client = numeClient;
    }

    if (req.body.telefon !== undefined) {
      const telefon = programare.tip === 'blocat'
        ? 'N/A'
        : cleanPhone(req.body.telefon);

      if (programare.tip !== 'blocat' && !isValidPhone(telefon)) {
        return res.status(400).json({
          succes: false,
          mesaj: 'Telefon invalid. Folosește 07xxxxxxxx sau +407xxxxxxxx.'
        });
      }

      programare.telefon = telefon;
    }

    programare.data = nextData;
    programare.ora = nextOra;

    if (req.body.mesaj !== undefined) {
      programare.mesaj = sanitizeText(req.body.mesaj, 700);
    }

    if (req.body.serviciu !== undefined) {
      programare.serviciu = sanitizeText(req.body.serviciu, 180);
    }

    if (req.body.pret !== undefined) {
      programare.pret = sanitizeText(req.body.pret, 60);
    }

    if (req.body.pretValoare !== undefined) {
      programare.pretValoare = parseOptionalNumber(req.body.pretValoare);
    }

    await programare.save();

    res.json({
      succes: true,
      mesaj: 'Programare actualizată.',
      programare
    });
  } catch (err) {
    console.error('Eroare editare programare:', err);

    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la editarea programării.'
    });
  }
});

app.delete('/api/programari/:id', verificaToken, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'ID invalid.'
      });
    }

    const programare = await Programare.findById(req.params.id);

    if (!programare) {
      return res.status(404).json({
        succes: false,
        mesaj: 'Programarea nu există.'
      });
    }

    if (!canAccessBarberResource(req.user, programare.barberId)) {
      return res.status(403).json({
        succes: false,
        mesaj: 'Nu ai voie să ștergi această programare.'
      });
    }

    await Programare.findByIdAndDelete(req.params.id);

    res.json({
      succes: true,
      mesaj: 'Șters cu succes.'
    });
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la ștergerea programării.'
    });
  }
});

/* =====================================================
   GALERIE
===================================================== */

app.get('/api/galerie', async (req, res) => {
  try {
    const {
      barberId,
      limit = '30',
      page = '1'
    } = req.query;

    const query = {};

    if (barberId && barberId !== 'all') {
      const finalBarberId = normalizeBarberId(barberId);

      if (!getTeamBarberById(finalBarberId)) {
        return res.status(400).json({
          succes: false,
          mesaj: 'Specialist invalid.'
        });
      }

      query.barberId = finalBarberId;
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 60);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [poze, total] = await Promise.all([
      Galerie.find(query)
        .sort({
          data: -1,
          createdAt: -1
        })
        .skip(skip)
        .limit(safeLimit)
        .lean(),

      Galerie.countDocuments(query)
    ]);

    res.json({
      succes: true,
      poze,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: skip + poze.length < total
    });
  } catch (err) {
    console.error('Eroare GET /api/galerie:', err);

    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la citirea galeriei.'
    });
  }
});

app.get('/api/galerie/:frizer', async (req, res) => {
  try {
    const frizerParam = sanitizeText(decodeURIComponent(req.params.frizer), 120);
    const finalBarberId = normalizeBarberId(frizerParam);

    const teamBarber = getTeamBarberById(finalBarberId);

    const barber = await Barber.findOne({
      $or: [
        { barberId: finalBarberId },
        { nume: frizerParam },
        { displayName: frizerParam }
      ]
    });

    const barberName = barber?.nume || teamBarber?.nume || frizerParam;
    const displayName = barber?.displayName || teamBarber?.displayName || barberName;

    const {
      limit = '30',
      page = '1'
    } = req.query;

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 60);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const query = {
      $or: [
        { barberId: finalBarberId },
        { frizer: barberName },
        { frizer: displayName },
        { frizer: frizerParam }
      ]
    };

    const [poze, total] = await Promise.all([
      Galerie.find(query)
        .sort({
          data: -1,
          createdAt: -1
        })
        .skip(skip)
        .limit(safeLimit)
        .lean(),

      Galerie.countDocuments(query)
    ]);

    res.json({
      succes: true,
      poze,
      total,
      page: safePage,
      limit: safeLimit,
      hasMore: skip + poze.length < total
    });
  } catch (err) {
    console.error('Eroare GET /api/galerie/:frizer:', err);

    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la citirea galeriei frizerului.'
    });
  }
});

app.post('/api/galerie/upload', verificaToken, uploadLimiter, (req, res) => {
  uploadGalerie(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        succes: false,
        mesaj: err.message || 'Eroare la upload.'
      });
    }

    try {
      if (!CLOUDINARY_ENABLED) {
        return res.status(500).json({
          succes: false,
          mesaj: 'Cloudinary nu este configurat pe server.'
        });
      }

      const requestedBarberId = normalizeBarberId(
        req.body.barberId || req.body.frizer || req.user.barberId
      );

      const finalBarberId = req.user.isAdmin ? requestedBarberId : req.user.barberId;

      if (!finalBarberId) {
        return res.status(400).json({
          succes: false,
          mesaj: 'Lipsește frizerul.'
        });
      }

      const barber = await Barber.findOne({
        barberId: finalBarberId,
        activ: true
      });

      if (!barber) {
        return res.status(404).json({
          succes: false,
          mesaj: 'Frizerul nu există.'
        });
      }

      if (!req.user.isAdmin && finalBarberId !== req.user.barberId) {
        return res.status(403).json({
          succes: false,
          mesaj: 'Nu poți încărca poze pentru alt specialist.'
        });
      }

      const files = [
        ...((req.files && req.files.images) || []),
        ...((req.files && req.files.image) || [])
      ];

      if (!files.length) {
        return res.status(400).json({
          succes: false,
          mesaj: 'Nu ai trimis nicio poză.'
        });
      }

     const uploaded = await Promise.all(
  files.map(async (file) => {
    const result = await uploadBufferToCloudinary(file, barber.barberId);

    return {
      file,
      result
    };
  })
);

      const pozeCreate = uploaded.map(({ file, result }) => ({
  barberId: barber.barberId,
  frizer: barber.nume,
  url: getOptimizedCloudinaryUrl(result.public_id),
  thumbnailUrl: getThumbnailCloudinaryUrl(result.public_id),
  filename: result.public_id,
  publicId: result.public_id,
  originalName: sanitizeText(file.originalname, 300),
  mimeType: file.mimetype,
  size: result.bytes || file.size,
  width: result.width,
  height: result.height,
  format: result.format,
  storage: 'cloudinary'
}));

      const pozeSalvate = await Galerie.insertMany(pozeCreate);

      res.status(201).json({
        succes: true,
        mesaj: 'Pozele au fost încărcate în cloud cu succes.',
        count: pozeSalvate.length,
        poze: pozeSalvate
      });
    } catch (errUpload) {
     console.error('EROARE CLOUDINARY GALERIE:', {
  message: errUpload.message,
  name: errUpload.name,
  http_code: errUpload.http_code,
  stack: errUpload.stack
});

res.status(500).json({
  succes: false,
  mesaj: 'Eroare server la încărcarea pozelor în cloud.',
  eroare: IS_PRODUCTION ? undefined : errUpload.message
});
    }
  });
});

app.post('/api/galerie', verificaToken, async (req, res) => {
  try {
    const requestedBarberId = normalizeBarberId(
      req.body.barberId || req.body.frizer || req.user.barberId
    );

    const finalBarberId = req.user.isAdmin || req.user.isMaster
      ? requestedBarberId
      : req.user.barberId;

    const url = sanitizeText(req.body.url, 1000);

    if (!finalBarberId || !url) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Frizer și URL sunt obligatorii.'
      });
    }

    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/uploads/')) {
      return res.status(400).json({
        succes: false,
        mesaj: 'URL invalid.'
      });
    }

    const barber = await Barber.findOne({
      barberId: finalBarberId,
      activ: true
    });

    if (!barber) {
      return res.status(404).json({
        succes: false,
        mesaj: 'Frizerul nu există.'
      });
    }

    if (!canAccessBarberResource(req.user, finalBarberId)) {
      return res.status(403).json({
        succes: false,
        mesaj: 'Nu poți adăuga poza altui specialist.'
      });
    }

    const poza = await Galerie.create({
  barberId: barber.barberId,
  frizer: barber.nume,
  url,
  thumbnailUrl: url,
  storage: 'url'
});

    res.status(201).json({
      succes: true,
      mesaj: 'Imagine adăugată în galerie.',
      poza
    });
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la adăugarea imaginii.'
    });
  }
});

app.delete('/api/galerie/:id', verificaToken, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'ID invalid.'
      });
    }

    const poza = await Galerie.findById(req.params.id);

    if (!poza) {
      return res.status(404).json({
        succes: false,
        mesaj: 'Poza nu există.'
      });
    }

    if (!canAccessBarberResource(req.user, poza.barberId)) {
      return res.status(403).json({
        succes: false,
        mesaj: 'Nu poți șterge poza altui specialist.'
      });
    }

    await Galerie.findByIdAndDelete(req.params.id);

    if (poza.storage === 'cloudinary' && poza.publicId && CLOUDINARY_ENABLED) {
      try {
        await cloudinary.uploader.destroy(poza.publicId, {
          resource_type: 'image'
        });
      } catch (cloudErr) {
        console.error('Nu am putut șterge poza din Cloudinary:', cloudErr.message);
      }
    }

    if (poza.storage === 'local' && poza.filename) {
      const safeFilename = path.basename(poza.filename);
      const filePath = path.resolve(galerieUploadDir, safeFilename);
      const safeDir = path.resolve(galerieUploadDir);

      if (filePath.startsWith(safeDir)) {
        fs.unlink(filePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Nu am putut șterge fișierul fizic:', err.message);
          }
        });
      }
    }

    res.json({
      succes: true,
      mesaj: 'Poza a fost ștearsă.'
    });
  } catch (err) {
    console.error('Eroare DELETE /api/galerie/:id:', err);

    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la ștergerea imaginii.'
    });
  }
});

/* =====================================================
   CONTACT
===================================================== */

app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const nume = sanitizeText(req.body.nume, 120);
    const telefon = cleanPhone(req.body.telefon);
    const mesaj = sanitizeText(req.body.mesaj, 1000);

    if (!nume || !telefon || !mesaj) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Completează toate câmpurile.'
      });
    }

    if (!isValidPhone(telefon)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Telefon invalid.'
      });
    }

    const msg = await Contact.create({
      nume,
      telefon,
      mesaj
    });

    res.status(201).json({
      succes: true,
      mesaj: 'Mesaj trimis.',
      contact: msg
    });
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la trimiterea mesajului.'
    });
  }
});

app.get('/api/contact', verificaToken, verificaAdmin, async (req, res) => {
  try {
    const mesaje = await Contact.find().sort({
      data: -1
    });

    res.json(mesaje);
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la citirea mesajelor.'
    });
  }
});

app.delete('/api/contact/:id', verificaToken, verificaAdmin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'ID invalid.'
      });
    }

    const deleted = await Contact.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        succes: false,
        mesaj: 'Mesajul nu există.'
      });
    }

    res.json({
      succes: true,
      mesaj: 'Mesaj șters.'
    });
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la ștergerea mesajului.'
    });
  }
});

/* =====================================================
   REVIEW-URI
===================================================== */

app.get('/api/reviews', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    const reviews = await Review.find({ active: true })
      .sort({
        order: 1,
        createdAt: -1
      })
      .limit(limit);

    res.json(reviews);
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la citirea recenziilor.'
    });
  }
});

app.get('/api/reviews/admin', verificaToken, verificaAdmin, async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({
        order: 1,
        createdAt: -1
      });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la citirea recenziilor pentru admin.'
    });
  }
});

app.post('/api/reviews', verificaToken, verificaAdmin, async (req, res) => {
  try {
    const name = sanitizeText(req.body.name, 120);
    const text = sanitizeText(req.body.text, 700);
    const avatar = sanitizeText(req.body.avatar, 500);
    const dateLabel = sanitizeText(req.body.dateLabel, 80) || 'Recent';

    const rating = Math.max(1, Math.min(5, Number(req.body.rating) || 5));
    const order = Number(req.body.order) || 99;
    const active = parseBoolean(req.body.active, true);

    if (!name || !text) {
      return res.status(400).json({
        succes: false,
        mesaj: 'Numele și textul recenziei sunt obligatorii.'
      });
    }

    const review = await Review.create({
      name,
      text,
      rating,
      avatar,
      dateLabel,
      active,
      order
    });

    res.status(201).json({
      succes: true,
      mesaj: 'Recenzie adăugată.',
      review
    });
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la adăugarea recenziei.'
    });
  }
});

app.patch('/api/reviews/:id', verificaToken, verificaAdmin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'ID invalid.'
      });
    }

    const update = {};

    if (req.body.name !== undefined) {
      update.name = sanitizeText(req.body.name, 120);
    }

    if (req.body.text !== undefined) {
      update.text = sanitizeText(req.body.text, 700);
    }

    if (req.body.avatar !== undefined) {
      update.avatar = sanitizeText(req.body.avatar, 500);
    }

    if (req.body.dateLabel !== undefined) {
      update.dateLabel = sanitizeText(req.body.dateLabel, 80);
    }

    if (req.body.rating !== undefined) {
      update.rating = Math.max(1, Math.min(5, Number(req.body.rating) || 5));
    }

    if (req.body.order !== undefined) {
      update.order = Number(req.body.order) || 99;
    }

    if (req.body.active !== undefined) {
      update.active = parseBoolean(req.body.active, true);
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        succes: false,
        mesaj: 'Recenzia nu există.'
      });
    }

    res.json({
      succes: true,
      mesaj: 'Recenzie actualizată.',
      review
    });
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la actualizarea recenziei.'
    });
  }
});

app.delete('/api/reviews/:id', verificaToken, verificaAdmin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        succes: false,
        mesaj: 'ID invalid.'
      });
    }

    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        succes: false,
        mesaj: 'Recenzia nu există.'
      });
    }

    res.json({
      succes: true,
      mesaj: 'Recenzie ștearsă.'
    });
  } catch (err) {
    res.status(500).json({
      succes: false,
      mesaj: 'Eroare la ștergerea recenziei.'
    });
  }
});

/* =====================================================
   HEALTH
===================================================== */

app.get('/api/health', (req, res) => {
  res.json({
    succes: true,
    mesaj: 'Gentleman’s Club API rulează.',
    brand: 'Gentleman’s Club',
    env: NODE_ENV,
    cookie: {
      name: AUTH_COOKIE_NAME,
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE
    },
    time: new Date().toISOString()
  });
});

/* =====================================================
   404 + ERROR HANDLER
===================================================== */

app.use((req, res) => {
  res.status(404).json({
    succes: false,
    mesaj: 'Ruta nu există.'
  });
});

app.use((err, req, res, next) => {
  console.error('EROARE GLOBALĂ:', err);

  res.status(500).json({
    succes: false,
    mesaj: 'Eroare server.',
    eroare: IS_PRODUCTION ? undefined : err.message
  });
});

/* =====================================================
   PORNIRE SERVER
===================================================== */

app.listen(PORT, () => {
  console.log(`🚀 Gentleman’s Club API rulează pe http://localhost:${PORT}`);
  console.log(`📁 Galerie statică: http://localhost:${PORT}/uploads/galerie`);
  console.log(`🛠 Setup: http://localhost:${PORT}/api/setup-gentleman?key=${SETUP_KEY}`);
  console.log(`🍪 Cookie auth: ${AUTH_COOKIE_NAME} | SameSite=${COOKIE_SAME_SITE} | Secure=${COOKIE_SECURE}`);
});