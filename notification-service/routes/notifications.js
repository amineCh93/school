const express = require('express');
const { z } = require('zod');
const Notification = require('../models/notificationModel');
const { validateBody } = require('../middleware/validate');

const router = express.Router();
const previewNotifications = [];

const createNotificationSchema = z.object({
  recipient: z.string().trim().min(1).max(255),
  channel: z.enum(['email', 'sms', 'push']),
  subject: z.string().trim().max(150).optional().default(''),
  message: z.string().trim().min(1).max(1000),
  status: z.enum(['pending', 'queued', 'sent', 'failed']).optional().default('pending')
}).strict();

function isPreviewMode() {
  return process.env.SKIP_DB === 'true';
}

router.get('/', async (_req, res, next) => {
  try {
    if (isPreviewMode()) {
      // En mode aperçu, renvoie les notifications conservées en mémoire.
      return res.json({
        message: 'Notifications retrieved successfully.',
        count: previewNotifications.length,
        data: [...previewNotifications].reverse()
      });
    }

    // Retourne les notifications les plus récentes en premier.
    const notifications = await Notification.find().sort({ createdAt: -1 }).lean();

    return res.json({
      message: 'Notifications retrieved successfully.',
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/', validateBody(createNotificationSchema), async (req, res, next) => {
  try {
    if (isPreviewMode()) {
      // En mode aperçu, simule la persistance avec un stockage mémoire local.
      const notification = {
        id: previewNotifications.length + 1,
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      previewNotifications.push(notification);

      return res.status(201).json({
        message: 'Notification created successfully.',
        data: notification
      });
    }

    // Crée une nouvelle notification persistée en base MongoDB.
    const notification = await Notification.create(req.body);

    return res.status(201).json({
      message: 'Notification created successfully.',
      data: notification
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
