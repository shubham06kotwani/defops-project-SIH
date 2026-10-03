const express = require('express');
const http = require('http');
const cors = require('cors');
const passport = require('passport');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { initMQTT } = require('./config/mqtt');
const errorHandler = require('./middleware/errorHandler');

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use(passport.initialize());
require('./config/passport')(passport);

app.use('/api/v1/auth', require('./routes/api/auth'));
app.use('/api/v1/containers', require('./routes/api/containers'));
app.use('/api/v1/indents', require('./routes/api/indents'));
app.use('/api/v1/forecasting', require('./routes/api/forecasting'));
app.use('/api/v1/location', require('./routes/api/location'));

// Production Health Check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    system: 'DEFOPS-C4ISR-BACKEND',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/telemetry', async (req, res, next) => {
  try {
    const iotIngestionService = require('./services/iotIngestionService');
    const updatedContainer = await iotIngestionService.processTelemetry(req.body);
    
    io.emit('CONVOY_TELEMETRY_UPDATE', updatedContainer);
    
    res.status(200).json({ success: true, container: updatedContainer });
  } catch (err) {
    next(err);
  }
});

if (process.env.MQTT_BROKER_URL) {
  initMQTT(io);
}

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const frontendIndex = path.join(__dirname, '../frontend/dist/index.html');
  if (fs.existsSync(frontendIndex)) {
    return res.sendFile(frontendIndex);
  }
  res.status(200).json({
    status: 'ONLINE',
    message: 'DEFOPS Tactical Backend API is active. Access endpoints via /api/v1/... or check /health.'
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`DEFOPS Tactical Backend running on port ${PORT}`);
});