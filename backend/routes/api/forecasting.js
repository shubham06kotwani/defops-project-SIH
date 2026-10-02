const express = require('express');
const router = express.Router();
const forecastController = require('../../controllers/forecastController');
const authMiddleware = require('../../middleware/authMiddleware');

router.get('/', authMiddleware, forecastController.getDemandForecast);

module.exports = router;