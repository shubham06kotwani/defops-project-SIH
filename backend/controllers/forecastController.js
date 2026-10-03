const Container = require('../models/Container');
const Indent = require('../models/Indent');
const aiForecastService = require('../services/aiForecastService');

exports.getDemandForecast = async (req, res) => {
  try {
    const { sector, daysAhead } = req.query;

    let historicalIndents = [];
    let currentStock = [];

    try {
      historicalIndents = await Indent.find().sort({ createdAt: -1 });
      currentStock = await Container.find();
    } catch (dbErr) {
      // Graceful fallback if MongoDB is in offline mode
    }

    const forecastResult = await aiForecastService.calculatePredictiveDemand(
      historicalIndents,
      currentStock,
      sector || 'NORTHERN_COMMAND',
      parseInt(daysAhead) || 30
    );

    res.status(200).json({
      success: true,
      sector: sector || 'NORTHERN_COMMAND',
      forecastPeriodDays: parseInt(daysAhead) || 30,
      metadata: forecastResult.metadata,
      predictions: forecastResult.predictions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};