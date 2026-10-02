const Container = require('../models/Container');
const Indent = require('../models/Indent');
const aiForecastService = require('../services/aiForecastService');

exports.getDemandForecast = async (req, res) => {
  try {
    const { sector, daysAhead } = req.query;

    const historicalIndents = await Indent.find({ status: 'DELIVERED' });
    const currentStock = await Container.find();

    const forecastData = await aiForecastService.calculatePredictiveDemand(
      historicalIndents,
      currentStock,
      sector || 'NORTHERN_COMMAND',
      parseInt(daysAhead) || 30
    );

    res.status(200).json({
      success: true,
      sector: sector || 'NORTHERN_COMMAND',
      forecastPeriodDays: daysAhead || 30,
      predictions: forecastData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};