const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', notificationController.listNotifications);
router.post('/read-all', notificationController.markAllRead);

module.exports = router;
