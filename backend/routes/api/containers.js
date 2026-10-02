const express = require('express');
const router = express.Router();
const containerController = require('../../controllers/containerController');

router.get('/', containerController.getAllContainers);
router.get('/:id', containerController.getContainerById);

module.exports = router;