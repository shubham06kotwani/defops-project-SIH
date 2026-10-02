const passport = require('passport');

const authenticateJWT = passport.authenticate('jwt', { session: false });

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient military rank/permission for this action'
      });
    }
    next();
  };
};

module.exports = authenticateJWT;
module.exports.authenticateJWT = authenticateJWT;
module.exports.authorizeRoles = authorizeRoles;