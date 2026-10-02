const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../../models/User');

router.post('/login', async (req, res) => {
  const { serviceNumber, password } = req.body;

  try {
    const user = await User.findOne({ serviceNumber });
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