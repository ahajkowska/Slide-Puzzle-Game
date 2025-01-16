const mockUser = (req, res, next) => {
    const role = req.headers['x-user-role'] || 'guest';
    const username = req.headers['x-user-name'] || 'anonymous';

    req.user = { username, role }; // attach user info to request
    next();
};

module.exports = mockUser;
