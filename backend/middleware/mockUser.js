const mockUser = (req, res, next) => {
    const role = req.headers['x-user-role'] || 'guest';
    const username = req.headers['x-user-name'] || 'anonymous';

    req.user = { username, role }; // Attach user info to request
    // console.log(`Mock user:`, req.user); // Dodaj logowanie dla debugowania
    next();
};

module.exports = mockUser;
