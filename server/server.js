// server/server.js  

// 0) Load .env from the project root
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const express     = require('express');
const cors        = require('cors');
const pathModule  = require('path');

// 1) Routers
const searchRouter      = require('./routes/search');
const filesRouter       = require('./routes/files');
const directoriesRouter = require('./routes/directories');
const metadataRouter    = require('./routes/metadata');
const filtersRouter     = require('./routes/filters');       // <-- New line
const authRouter        = require('./routes/auth');          // <-- Add this line

const app = express();

// 2) Enable CORS for front-end dev origins
app.use(cors({
  origin: [
    'http://127.0.0.1:3002',
    'http://localhost:3002',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
  ]
}));

// 3) Parse JSON
app.use(express.json());

// 4) Mount routers
app.use('/api/search',      searchRouter);
app.use('/api/files',       filesRouter);
app.use('/api/directories', directoriesRouter);
app.use('/api/metadata',    metadataRouter);
app.use('/api/filters',     filtersRouter);        
app.use('/api/auth',        authRouter);            // <-- Add this line

// 5) Optional: Serve frontend
// app.use('/', express.static(pathModule.join(__dirname, '..', 'public')));

// 6) Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🗄️  API listening on http://localhost:${PORT}`);
});
