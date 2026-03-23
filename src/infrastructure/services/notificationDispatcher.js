function createNotificationDispatcher({ baseUrl }) {
  function normalizeRecipients(recipients) {
    return [...new Set(
      recipients
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    )];
  }

  async function sendNotification({ recipient, subject, message }) {
    const endpoint = `${baseUrl.replace(/\/$/, '')}/notifications`;

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient,
        channel: 'email',
        subject,
        message,
        status: 'queued'
      })
    });
  }

  return {
    async notifyUsers({ recipients, subject, message }) {
      const normalizedRecipients = normalizeRecipients(recipients);

      // Le dispatch est best-effort pour ne pas bloquer le flux métier principal.
      await Promise.allSettled(
        normalizedRecipients.map((recipient) => sendNotification({ recipient, subject, message }))
      );
    }
  };
}

module.exports = {
  createNotificationDispatcher
};
