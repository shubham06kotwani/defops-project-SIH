const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../../models/User');

router.post('/login', async (req, res) => {
  const { serviceNumber, password } = req.body;

  try {
    const cleanNum = serviceNumber?.trim()?.toUpperCase();
    let user = null;

    try {
      user = await User.findOne({ serviceNumber: cleanNum });
    } catch (dbErr) {
      // Graceful fallback if MongoDB is not reachable
    }

    const DEMO_ACCOUNTS = {
      'IC-00101': {
        _id: '660e1d88a1b2c3d4e5f6a700',
        name: 'Brigadier Amitav Sen',
        serviceNumber: 'IC-00101',
        password: 'password123',
        rank: 'BRIGADIER',
        role: 'COMMANDER'
      },
      'IC-10293': {
        _id: '660e1d88a1b2c3d4e5f6a701',
        name: 'Major Vikram Singh',
        serviceNumber: 'IC-10293',
        password: 'password123',
        rank: 'MAJOR',
        role: 'OFFICER'
      },
      'OR-88412': {
        _id: '660e1d88a1b2c3d4e5f6a702',
        name: 'Havildar Rajesh Kumar',
        serviceNumber: 'OR-88412',
        password: 'password123',
        rank: 'HAVILDAR',
        role: 'OPERATOR'
      }
    };

    if (!user && DEMO_ACCOUNTS[cleanNum] && DEMO_ACCOUNTS[cleanNum].password === password) {
      user = DEMO_ACCOUNTS[cleanNum];
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid Service Number or Credentials' });
    }

    const payload = {
      id: user._id,
      serviceNumber: user.serviceNumber,
      rank: user.rank,
      role: user.role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'supersecretmilitarykey2026',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token: `Bearer ${token}`,
      user: {
        id: user._id,
        name: user.name,
        rank: user.rank,
        role: user.role,
        serviceNumber: user.serviceNumber
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get(
  '/me',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json(req.user);
  }
);

module.exports = router;