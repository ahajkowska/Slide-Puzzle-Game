const roleMiddleware = (requiredRole) => (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ error: 'Forbidden: No user data available.' });
    }
    
    if (req.user.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
};

module.exports = roleMiddleware;
