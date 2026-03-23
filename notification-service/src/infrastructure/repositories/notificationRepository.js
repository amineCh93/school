const Notification = require('../../models/notificationModel');

function createNotificationRepository() {
  return {
    async list() {
      return Notification.find().sort({ createdAt: -1 }).lean();
    },
    async create(payload) {
      return Notification.create(payload);
    }
  };
}

module.exports = {
  createNotificationRepository
};
