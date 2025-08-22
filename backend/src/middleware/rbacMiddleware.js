const pool = require('../database/db');

module.exports = function(requiredPermissions) {
  return async function(req, res, next) {
    if (!req.user || !req.user.id) {
      return res.status(403).json({ message: 'Forbidden: User ID not found in token' });
    }

    const { id: userId, role } = req.user;

    // Admins have universal access
    if (role === 'Admin') {
      return next();
    }

    // For staff, check their specific permissions from the database
    try {
      const [rows] = await pool.query(
        'SELECT p.name FROM user_permissions up JOIN permissions p ON up.permission_id = p.id WHERE up.user_id = ?',
        [userId]
      );

      const userPermissions = rows.map(row => row.name);

      const hasRequiredPermission = requiredPermissions.some(required => userPermissions.includes(required));

      if (hasRequiredPermission) {
        next();
      } else {
        res.status(403).json({ message: 'Forbidden: You do not have the required permissions' });
      }
    } catch (error) {
      console.error('RBAC middleware error:', error);
      res.status(500).json({ message: 'Internal server error during permission check' });
    }
  };
};
