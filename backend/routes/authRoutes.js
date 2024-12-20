const express = require('express');
const { loginUser, registerUser } = require('../controllers/authController');
const router = express.Router();
const authenticateUser = require('../middleware/authenticateUser');

// Endpointy autoryzacji
router.post('/login', loginUser);
router.post('/register', registerUser);

// Endpoint to fetch the logged-in user's nickname
router.get('/nickname', authenticateUser, (req, res) => {
    const username = req.headers['username'];
    if (!username) {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    res.status(200).json({ nickname: username });
});

module.exports = router;
