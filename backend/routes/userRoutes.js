const express = require('express');
const router = express.Router();
const User = require('../models/User');
const roleMiddleware = require('../middleware/roleMiddleware');

// Get all users
router.get('/', roleMiddleware('admin'), async (req, res) => {
    try {
        const users = await User.find({}, 'username role');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// update user's login (admin only)
router.patch('/update-login/:id', roleMiddleware('admin'), async (req, res) => {
    const { id } = req.params;
    const { newUsername } = req.body;

    if (!newUsername || typeof newUsername !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing new username' });
    }

    try {
        const existingUser = await User.findOne({ username: newUsername });
        if (existingUser) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { username: newUsername },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Username updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// update user role (admin only)
router.patch('/role/:id', roleMiddleware('admin'), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    // validate the new role
    if (!['guest', 'logged', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User role updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// delete a user (admin only)
router.delete('/:id', roleMiddleware('admin'), async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully', user: deletedUser });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
