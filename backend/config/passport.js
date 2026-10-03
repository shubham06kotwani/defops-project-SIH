const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

const opts = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromHeader('x-military-auth-token'),
    ExtractJwt.fromAuthHeaderAsBearerToken()
  ]),
  secretOrKey: process.env.JWT_SECRET || 'supersecretmilitarykey2026'
};

const DEMO_USERS = {
  '660e1d88a1b2c3d4e5f6a701': {
    _id: '660e1d88a1b2c3d4e5f6a701',
    name: 'Major Vikram Singh',
    serviceNumber: 'IC-10293',
    rank: 'MAJOR',
    role: 'OFFICER'
  },
  '660e1d88a1b2c3d4e5f6a702': {
    _id: '660e1d88a1b2c3d4e5f6a702',
    name: 'Havildar Rajesh Kumar',
    serviceNumber: 'OR-88412',
    rank: 'HAVILDAR',
    role: 'OPERATOR'
  }
};

module.exports = (passport) => {
  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        let user = null;
        try {
          user = await User.findById(jwt_payload.id).select('-password');
        } catch (dbErr) {
          // MongoDB offline
        }

        if (user) {
          return done(null, user);
        }

        // Check fallback demo accounts
        if (DEMO_USERS[jwt_payload.id]) {
          return done(null, DEMO_USERS[jwt_payload.id]);
        }

        const matchByService = Object.values(DEMO_USERS).find(u => u.serviceNumber === jwt_payload.serviceNumber);
        if (matchByService) {
          return done(null, matchByService);
        }

        return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    })
  );
};