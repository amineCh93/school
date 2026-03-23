function createPreviewNotificationRepository() {
  const previewNotifications = [];

  return {
    async list() {
      return [...previewNotifications].reverse();
    },
    async create(payload) {
      const now = new Date().toISOString();
      const notification = {
        id: previewNotifications.length + 1,
        ...payload,
        createdAt: now,
        updatedAt: now
      };

      previewNotifications.push(notification);
      return notification;
    }
  };
}

module.exports = {
  createPreviewNotificationRepository
};
