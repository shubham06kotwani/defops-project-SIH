const express = require('express');
const router = express.Router();
const indentController = require('../../controllers/indentController');

router.post('/', indentController.createIndent);
router.get('/', indentController.getAllIndents);
router.patch('/:id/status', indentController.updateIndentStatus);
router.put('/:id/status', indentController.updateIndentStatus);

module.exports = router;