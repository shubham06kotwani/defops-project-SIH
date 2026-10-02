const mqtt = require('mqtt');
const iotIngestionService = require('../services/iotIngestionService');

const initMQTT = (io) => {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
  
  const client = mqtt.connect(brokerUrl, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 3000
  });

  client.on('connect', () => {
    console.log(`MQTT Broker Connected: ${brokerUrl}`);
    client.subscribe('army/convoy/+/telemetry', (err) => {
      if (err) console.error('Failed to subscribe to telemetry topic:', err);
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      const updatedContainer = await iotIngestionService.processTelemetry(payload);
      
      io.emit('CONVOY_TELEMETRY_UPDATE', updatedContainer);
    } catch (err) {
      console.error('Error processing MQTT telemetry message:', err.message);
    }
  });

  client.on('error', (err) => {
    console.error('MQTT Connection Error:', err.message);
  });
};

module.exports = { initMQTT };