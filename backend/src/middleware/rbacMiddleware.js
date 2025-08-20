module.exports = function(allowedRoles) {
  return function(req, res, next) {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Forbidden: No role specified' });
    }

    const { role } = req.user;

    if (allowedRoles.includes(role)) {
      next(); // Role is allowed, proceed to the next middleware/controller
    } else {
      res.status(403).json({ message: 'Forbidden: You do not have the required permissions' });
    }
  };
};
