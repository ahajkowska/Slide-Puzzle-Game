const roleMiddleware = (requiredRole) => (req, res, next) => {
    if (!req.user) {
        return res.status(403).json({ error: 'No user data available :(' });
    }
    
    if (req.user.role !== requiredRole) {
        return res.status(403).json({ error: 'You do not have permissions for that! :(' });
    }

    next();
};

module.exports = roleMiddleware;
