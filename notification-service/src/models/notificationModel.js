const mongoose = require('mongoose');

// Modèle principal représentant une notification à envoyer ou à tracer.
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    channel: {
      type: String,
      required: true,
      enum: ['email', 'sms', 'push']
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 150,
      default: ''
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['pending', 'queued', 'sent', 'failed'],
      default: 'pending'
    }
  },
  {
    timestamps: true,
    collection: 'notification'
  }
);

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

module.exports = Notification;
