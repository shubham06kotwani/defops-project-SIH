const Container = require('../models/Container');

exports.processTelemetry = async (payload) => {
  const { containerId, lat, lng, temperature, humidity, battery } = payload;

  let status = 'NORMAL';
  if (temperature > 25.0) {
    status = 'COLD_CHAIN_BREACH';
  }

  const container = await Container.findOneAndUpdate(
    { containerId },
    {
      $set: {
        'location.coordinates': [lng, lat],
        'sensors.temperature': temperature,
        'sensors.humidity': humidity,
        'sensors.battery': battery,
        status: status
      },
      $push: {
        history: {
          coordinates: [lng, lat],
          temperature: temperature,
          timestamp: new Date()
        }
      }
    },
    { new: true, upsert: true }
  );

  return container;
};