const express = require('express');
const router = express.Router();
const indentController = require('../../controllers/indentController');

router.post('/', indentController.createIndent);
router.get('/', indentController.getAllIndents);

module.exports = router;