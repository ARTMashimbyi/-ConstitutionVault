// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// Serve uploads folder as static, and force inline streaming for video files.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: function (res, filePath) {
    // Check file extension for mp4 (adjust if you support other video formats)
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

// Routes
const booksRoute = require('./routes/books');
const uploadRoute = require('./routes/upload');
const constitutionalDocsRoute = require('./routes/constitutionalDocuments');
const signupRoute = require('./routes/signup');


app.use('/signup', signupcRoute);

app.use('/books', booksRoute);
app.use('/upload', uploadRoute);
app.use('/constitutionalDocuments', constitutionalDocsRoute);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
