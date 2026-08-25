const notificationService = require('../services/notificationService');

const listNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.listUserNotifications(req.user.id);
    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (err) {
    next(err);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listNotifications,
  markAllRead,
};
