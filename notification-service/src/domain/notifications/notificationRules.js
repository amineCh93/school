// Règles métier minimales du domaine notification.
const allowedChannels = ['email', 'sms', 'push'];
const allowedStatuses = ['pending', 'queued', 'sent', 'failed'];

module.exports = {
  allowedChannels,
  allowedStatuses
};
