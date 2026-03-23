const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    headmaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Headmaster',
      default: null
    }
  },
  {
    timestamps: true
  }
);

schoolSchema.virtual('students', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'school'
});

schoolSchema.set('toObject', { virtuals: true });
schoolSchema.set('toJSON', { virtuals: true });

const School = mongoose.models.School || mongoose.model('School', schoolSchema);

module.exports = School;
