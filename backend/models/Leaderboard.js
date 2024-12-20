const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
    playerName: { type: String, required: true },
    time: { type: Number, required: true }, // Time in seconds
    date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Leaderboard', LeaderboardSchema);
