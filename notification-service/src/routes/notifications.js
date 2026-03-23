const express = require('express');
const { z } = require('zod');
const env = require('../../config/env');
const { validateBody } = require('../middleware/validate');
const { createNotificationService } = require('../application/notifications/notificationService');
const { createNotificationRepository } = require('../infrastructure/repositories/notificationRepository');
const { createPreviewNotificationRepository } = require('../infrastructure/repositories/previewNotificationRepository');
const { allowedChannels, allowedStatuses } = require('../domain/notifications/notificationRules');

const router = express.Router();
const notificationService = createNotificationService({
  notificationRepository: env.shouldSkipDatabase
    ? createPreviewNotificationRepository()
    : createNotificationRepository()
});

const createNotificationSchema = z.object({
  recipient: z.string().trim().min(1).max(255),
  channel: z.enum(allowedChannels),
  subject: z.string().trim().max(150).optional().default(''),
  message: z.string().trim().min(1).max(1000),
  status: z.enum(allowedStatuses).optional().default('pending')
}).strict();

router.get('/', async (_req, res, next) => {
  try {
    const result = await notificationService.listNotifications();
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

router.post('/', validateBody(createNotificationSchema), async (req, res, next) => {
  try {
    const result = await notificationService.createNotification(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
