const mongoose = require('mongoose');

const headmasterSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      maxlength: 254
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Headmaster = mongoose.models.Headmaster || mongoose.model('Headmaster', headmasterSchema);

module.exports = Headmaster;
