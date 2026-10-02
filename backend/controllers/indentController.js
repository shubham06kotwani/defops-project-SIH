const Indent = require('../models/Indent');

exports.createIndent = async (req, res) => {
  try {
    const { unitName, category, quantity, priority } = req.body;
    const newIndent = await Indent.create({ unitName, category, quantity, priority });
    res.status(201).json(newIndent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllIndents = async (req, res) => {
  try {
    const indents = await Indent.find().sort({ createdAt: -1 });
    res.json(indents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};