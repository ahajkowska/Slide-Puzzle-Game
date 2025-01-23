const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const mqtt = require('mqtt');
const mqttClient = mqtt.connect('wss://test.mosquitto.org:8081/mqtt');

const { setupSocket } = require('./socketHandlers.js');
const authRoutes = require('./routes/authRoutes');
const Leaderboard = require('./models/Leaderboard');
const userRoutes = require('./routes/userRoutes');
const mockUser = require('./middleware/mockUser');
const roleMiddleware = require('./middleware/roleMiddleware');
const { rooms } = require('./socketHandlers.js');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(cors()); // umożliwia serwerowi obsługę żądań z innych domen

// mock user middleware globally
app.use(mockUser);

// Serwowanie statycznych plików z folderu frontend
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes); // Obsługa tras rejestracji i logowania
app.use('/api/users', userRoutes);

// checks if the room exists
app.get('/api/rooms/:roomId', (req, res) => {
    const { roomId } = req.params;

    if (rooms[roomId]) {
        res.json({ exists: true });
    } else {
        res.json({ exists: false });
    }
});

// === leaderboard endpoint ===
app.post('/api/leaderboard', async (req, res) => {
    const { playerName, time } = req.body;

    try {
        const newEntry = await Leaderboard.create({ playerName, time });
        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Error creating leaderboard entry:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await Leaderboard.find().sort({ time: 1 }); // top 5 by fastest time
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// === search leaderboard by pattern ===
app.get('/api/leaderboard/search', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const regex = new RegExp(query, 'i'); // 'i' -> case-insensitive
        const results = await Leaderboard.find({ playerName: { $regex: regex } }).sort({ time: 1 });

        res.json(results);
    } catch (error) {
        console.error('Error searching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// === update a leaderboard entry by ID ===
app.patch('/api/leaderboard/:id', roleMiddleware('admin'), async (req, res) => {
    const { id } = req.params;
    const { time, date } = req.body;

    const updateFields = {};
    if (time) updateFields.time = time;
    if (date) updateFields.date = new Date(date);

    try {
        const updatedEntry = await Leaderboard.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        if (!updatedEntry) {
            return res.status(404).json({ error: 'Leaderboard entry not found' });
        }

        res.json(updatedEntry);
    } catch (error) {
        console.error('Error updating leaderboard entry:', error);
        res.status(500).json({ error: 'Error updating leaderboard entry' });
    }
});

// === delete leaderboard entry by ID ===
app.delete('/api/leaderboard/:id', roleMiddleware('admin'), async (req, res) => {
    const { id } = req.params;

    try {
        const deletedEntry = await Leaderboard.findByIdAndDelete(id);

        if (!deletedEntry) {
            return res.status(404).json({ error: 'Leaderboard entry not found' });
        }

        res.json({ message: 'Leaderboard entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting leaderboard entry:', error);
        res.status(500).json({ error: 'Error deleting leaderboard entry' });
    }
});

// === delete all leaderboard entries ===
app.delete('/api/leaderboard', roleMiddleware('admin'), async (req, res) => {
    try {
        const result = await Leaderboard.deleteMany({});
        res.json({ message: 'All leaderboard entries deleted' });
    } catch (error) {
        console.error('Error deleting leaderboard entries:', error);
        res.status(500).json({ error: 'Error deleting leaderboard entries' });
    }
});

// przekierowanie wszystkich innych tras na index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

mongoose
   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
   .then(() => console.log('Connected to MongoDB'))
   .catch((err) => console.error('MongoDB connection error:', err));

setupSocket(io, mqttClient); // pokoje i gracze

// Start serwera
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});