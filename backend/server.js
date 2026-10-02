const express = require('express');
const http = require('http');
const cors = require('cors');
const passport = require('passport');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initMQTT } = require('./config/mqtt');
const errorHandler = require('./middleware/errorHandler');

require('dotenv').config();

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

app.use(passport.initialize());
require('./config/passport')(passport);

app.use('/api/v1/auth', require('./routes/api/auth'));
app.use('/api/v1/containers', require('./routes/api/containers'));
app.use('/api/v1/indents', require('./routes/api/indents'));
app.use('/api/v1/forecasting', require('./routes/api/forecasting'));

if (process.env.MQTT_BROKER_URL) {
  initMQTT(io);
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});