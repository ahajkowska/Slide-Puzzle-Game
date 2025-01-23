const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['guest', 'logged', 'admin'],
        default: 'logged',
    },
});

module.exports = mongoose.model('User', UserSchema);
