// API do logowania

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        // minlength: 3,
        // maxlength: 30
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['guest', 'logged user'],
        default: 'guest',
    },
});

UserSchema.pre('save', async function (next) {
    next();
});

UserSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
