const Container = require('../models/Container');

exports.getAllContainers = async (req, res) => {
  try {
    const containers = await Container.find();
    res.json(containers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getContainerById = async (req, res) => {
  try {
    const container = await Container.findOne({ containerId: req.params.id });
    if (!container) return res.status(404).json({ error: 'Container not found' });
    res.json(container);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};