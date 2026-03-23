const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
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

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

module.exports = Student;
