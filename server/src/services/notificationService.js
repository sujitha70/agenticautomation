const Notification = require('../models/Notification');
const { emitUserEvent } = require('../config/socket');

class NotificationService {
  async createNotification({ owner, workflowId = null, executionId = null, type = 'system', title, message }) {
    const notif = await Notification.create({
      owner,
      workflowId,
      executionId,
      type,
      title,
      message,
    });

    emitUserEvent(owner, 'notification:new', notif);
    return notif;
  }

  async listUserNotifications(owner) {
    return await Notification.find({ owner });
  }

  async markAllAsRead(owner) {
    return await Notification.updateMany({ owner, read: false }, { $set: { read: true } });
  }
}

module.exports = new NotificationService();
