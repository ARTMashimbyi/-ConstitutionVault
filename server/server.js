// server/server.js

// 0) Load .env from the project root
const path       = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const express    = require('express');
const cors       = require('cors');
const pathModule = require('path');

// 1) Routers
const searchRouter      = require('./routes/search');
const filesRouter       = require('./routes/files');
const directoriesRouter = require('./routes/directories');
const metadataRouter    = require('./routes/metadata');
const filtersRouter     = require('./routes/filters');
const authRouter        = require('./routes/auth');

const app = express();

// Debugging middleware: log request origins
app.use((req, res, next) => {
  console.log('Request Origin:', req.headers.origin);
  next();
});

// 2) Enable CORS globally (allow all origins)
//    Change `origin: '*'` to a specific URL or whitelist array once verified
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

// Handle preflight OPTIONS for all routes
app.options('*', cors());

// 3) Parse JSON bodies
app.use(express.json());

// 4) Mount your API routers
app.use('/api/search',      searchRouter);
app.use('/api/files',       filesRouter);
app.use('/api/directories', directoriesRouter);
app.use('/api/metadata',    metadataRouter);
app.use('/api/filters',     filtersRouter);
app.use('/api/auth',        authRouter);

// 5) (Optional) Serve your frontend from here in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = pathModule.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  app.get('*', (req, res) => {
    res.sendFile(pathModule.resolve(publicPath, 'index.html'));
  });
}

// 6) Launch!
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🗄️  API listening on http://localhost:${PORT}`);
});
