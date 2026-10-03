const Container = require('../models/Container');
const tacticalStore = require('./tacticalStore');

/**
 * Evaluates IoT sensory thresholds against tactical logistics rules
 */
function evaluateContainerStatus({ temperature, humidity, battery, tamper }) {
  if (tamper === true || tamper === 'true' || tamper === 'TAMPERED') {
    return 'TAMPERED';
  }
  if (typeof temperature === 'number') {
    if (temperature > 25.0) {
      return 'COLD_CHAIN_BREACH'; // Heat threshold exceeded (>25°C)
    }
    if (temperature < -10.0) {
      return 'FREEZING_BREACH'; // Critical freeze threshold for sensitive cargo (<-10°C)
    }
  }
  if (typeof battery === 'number' && battery <= 20) {
    return 'BATTERY_CRITICAL'; // Telemetry unit battery low (<20%)
  }
  if (typeof humidity === 'number' && humidity >= 75) {
    return 'HUMIDITY_EXCESS'; // High moisture / condensation threat (>75%)
  }
  return 'NORMAL';
}

exports.processTelemetry = async (payload) => {
  const { containerId, lat, lng, temperature, humidity, battery, tamper, baseName } = payload;

  const tempNum = Number(temperature);
  const humNum = Number(humidity);
  const battNum = Number(battery);
  const isTamper = Boolean(tamper === true || tamper === 'true');

  const status = evaluateContainerStatus({
    temperature: tempNum,
    humidity: humNum,
    battery: battNum,
    tamper: isTamper
  });

  try {
    const container = await Container.findOneAndUpdate(
      { containerId },
      {
        $set: {
          baseName: baseName || undefined,
          'location.coordinates': [lng, lat],
          'sensors.temperature': tempNum,
          'sensors.humidity': humNum,
          'sensors.battery': battNum,
          'sensors.tamper': isTamper,
          status: status
        },
        $push: {
          history: {
            coordinates: [lng, lat],
            temperature: tempNum,
            timestamp: new Date()
          }
        }
      },
      { new: true, upsert: true }
    );

    tacticalStore.updateContainer({
      containerId,
      baseName: baseName || undefined,
      location: { type: 'Point', coordinates: [lng, lat] },
      sensors: { temperature: tempNum, humidity: humNum, battery: battNum, tamper: isTamper },
      status
    });

    return container;
  } catch (dbErr) {
    // Graceful fallback for offline database or demo mode
    return tacticalStore.updateContainer({
      containerId,
      baseName: baseName || 'Forward Convoy In Transit',
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      sensors: {
        temperature: tempNum,
        humidity: humNum,
        battery: battNum,
        tamper: isTamper
      },
      status: status
    });
  }
};