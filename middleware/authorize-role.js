const User = require('../models/user');

const authorizeRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (user.role !== requiredRole) {
        return res.status(403).json({ message: `Access denied. ${requiredRole} role required.` });
      }

      // Role is valid
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error in authentication' });
    }
  };
};

module.exports = authorizeRole;