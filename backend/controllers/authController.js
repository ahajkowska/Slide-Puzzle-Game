// login and registration

const User = require('../models/User');
const bcrypt = require("bcrypt");

// register user
const registerUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        // check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // hash the password; salt
        const hashedPassword = await bcrypt.hash(password, 10);

        // create and save the new user
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        // successful registration response
        return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// === login user ===
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        // check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            console.error('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        // compare entered password with the hashed password in the DB
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.error('Invalid password');
            return res.status(401).json({ message: 'Invalid password' });
        }

        // successful login response
        return res.status(200).json({ message: 'Login successful', username: user.username, role: user.role });
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { registerUser, loginUser };
