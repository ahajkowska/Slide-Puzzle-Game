// login and registration

const User = require('../models/User');
const bcrypt = require("bcrypt");

// Login user
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            console.error('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        console.log("Password entered:", password);
        console.log("Hashed password in DB:", user.password);

        // Compare the entered password with the hashed password in the DB
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match result:", isMatch);

        if (!isMatch) {
            console.error('Invalid password');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Successful login response
        return res.status(200).json({ message: 'Login successful', username: user.username });
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Register user
const registerUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // console.log("Password given during registration:", password);
        // console.log("Hashed password during registration:", hashedPassword);

        // Create and save the new user
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        // Successful registration response
        return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { registerUser, loginUser };
