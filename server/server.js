// server/server.js
const express           = require('express');
const cors              = require('cors');
const path              = require('path');

const filesRouter       = require('./routes/files');
const directoriesRouter = require('./routes/directories');

const app = express();

// 1) Enable CORS for your front-end
app.use(cors({ origin: 'http://127.0.0.1:5500' }));

// 2) Parse JSON bodies
app.use(express.json());

// 3) Mount your routers
app.use('/api/files',       filesRouter);
app.use('/api/directories', directoriesRouter);

// 4) (Optional) Serve static front-end files
// app.use('/', express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🗄️  API listening on http://localhost:${PORT}`);
});
