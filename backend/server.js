const express = require('express');
const http = require('http');
// const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
// const io = new Server(server);

app.use(express.json());
app.use(cors()); // umożliwia serwerowi obsługę żądań z innych domen

// Serwowanie statycznych plików z folderu frontend
app.use(express.static(path.join(__dirname, '../frontend'))); // Ensure static files are served from the frontend directory

app.use('/api/auth', authRoutes); // Obsługa tras rejestracji i logowania

// === nickname endpoint ===
app.get('/api/auth/nickname', (req, res) => {
    const username = req.headers['username'];
    if (username) {
        return res.status(200).json({ nickname: username });
    }
    return res.status(401).json({ message: 'Not logged in' });
});

// Przekierowanie wszystkich innych tras na index.html (dla SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

mongoose
   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
   .then(() => console.log('Connected to MongoDB'))
   .catch((err) => console.error('MongoDB connection error:', err));

// Start serwera
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
