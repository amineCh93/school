function createNotificationService({ notificationRepository }) {
  return {
    async listNotifications() {
      const notifications = await notificationRepository.list();
      return {
        message: 'Notifications retrieved successfully.',
        count: notifications.length,
        data: notifications
      };
    },
    async createNotification(payload) {
      const notification = await notificationRepository.create(payload);
      return {
        message: 'Notification created successfully.',
        data: notification
      };
    }
  };
}

module.exports = {
  createNotificationService
};
