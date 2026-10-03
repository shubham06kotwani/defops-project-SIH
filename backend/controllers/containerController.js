const Container = require('../models/Container');
const tacticalStore = require('../services/tacticalStore');

exports.getAllContainers = async (req, res) => {
  try {
    const containers = await Container.find();
    if (containers && containers.length > 0) {
      return res.json(containers);
    }
  } catch (err) {
    // MongoDB offline / fallback mode
  }

  // Instant response from tactical memory store
  res.json(tacticalStore.getContainers());
};

exports.getContainerById = async (req, res) => {
  try {
    const container = await Container.findOne({ containerId: req.params.id });
    if (container) return res.json(container);
  } catch (err) {
    // Fallback mode
  }

  const inMem = tacticalStore.getContainerById(req.params.id);
  if (!inMem) return res.status(404).json({ error: 'Container not found' });
  res.json(inMem);
};