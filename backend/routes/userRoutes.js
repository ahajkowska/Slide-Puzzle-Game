const express = require('express');
const bcrypt = require("bcrypt");
const router = express.Router();
const User = require('../models/User');
const roleMiddleware = require('../middleware/roleMiddleware');

// get all users
router.get('/', roleMiddleware('admin'), async (req, res) => {
    try {
        const users = await User.find({}, 'username role');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// add a new user (admin only)
router.post('/', roleMiddleware('admin'), async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    // validate role
    if (!['guest', 'logged', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    try {
        // check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // create and save the new user
        const newUser = new User({ username, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Error creating user' });
    }
});

router.patch('/change-password/:username', async (req, res) => {
    const { username } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old and new passwords are required.' });
    }

    try {
        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Compare the old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Old password is incorrect.' });
        }

        // Hash and update the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Error updating password' });
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
            { new: true },
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Username updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating username:', error);
        res.status(500).json({ error: 'Error updating username' });
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
            { new: true },
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User role updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Error updating user role' });
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
        res.status(500).json({ error: 'Error deleting user' });
    }
});

module.exports = router;
