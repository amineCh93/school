const Student = require('../../../models/studentModel');

function createStudentMongoRepository() {
  return {
    create(payload) {
      return Student.create(payload);
    },
    list() {
      return Student.find().sort({ createdAt: -1 }).lean();
    },
    getById(id) {
      return Student.findById(id).lean();
    },
    getByIdDocument(id) {
      return Student.findById(id);
    },
    updateById(id, payload) {
      return Student.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).lean();
    },
    deleteById(id) {
      return Student.findByIdAndDelete(id).lean();
    },
    assignToSchool(id, schoolId, headmasterId = null) {
      return Student.findByIdAndUpdate(
        id,
        {
          school: schoolId,
          headmaster: headmasterId
        },
        { new: true, runValidators: true }
      ).lean();
    },
    clearBySchoolId(schoolId) {
      return Student.updateMany(
        { school: schoolId },
        { school: null, headmaster: null }
      );
    },
    clearHeadmasterByHeadmasterId(headmasterId) {
      return Student.updateMany(
        { headmaster: headmasterId },
        { headmaster: null }
      );
    },
    listBySchoolId(schoolId) {
      return Student.find({ school: schoolId }).sort({ createdAt: -1 }).lean();
    }
  };
}

module.exports = {
  createStudentMongoRepository
};
