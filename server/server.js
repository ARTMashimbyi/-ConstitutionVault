// server/server.js

// 0) Load .env from the project root
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const express           = require('express');
const cors              = require('cors');
const pathModule        = require('path');    // renamed so “path” isn’t shadowed

// 1) New: import the search router
const searchRouter      = require('./routes/search');

const filesRouter       = require('./routes/files');
const directoriesRouter = require('./routes/directories');

const app = express();

// 2) Enable CORS for your front-end origin
app.use(
  cors({
    origin: [
      'http://127.0.0.1:5500',
      'http://localhost:5500'
    ]
  })
);

// 3) Parse JSON request bodies
app.use(express.json());

// 4) Mount your routers
app.use('/api/search',      searchRouter);
app.use('/api/files',       filesRouter);
app.use('/api/directories', directoriesRouter);

// 5) (Optional) Serve static front-end from /public
// app.use('/', express.static(pathModule.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🗄️  API listening on http://localhost:${PORT}`);
});
