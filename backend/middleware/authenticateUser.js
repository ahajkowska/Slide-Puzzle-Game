const authenticateUser = (req, res, next) => {
    const username = req.headers["username"];
    if (!username) {
        return res.status(401).json({ message: "Unauthorized. Please log in." });
    }
    req.user = { username };
    next();
};

module.exports = authenticateUser;
